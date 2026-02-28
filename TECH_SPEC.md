# Model Builder's Assistant — Technical Specification

---

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Platform | Electron (latest) | Main + renderer process split |
| Build tool | electron-vite | Handles main / preload / renderer in one config |
| Language | TypeScript throughout | Shared types between main and renderer |
| UI framework | React 19 | Renderer process |
| Styling | Tailwind CSS v4 | |
| Component library | shadcn/ui | Radix primitives, copy-paste into `src/components/ui/` |
| State | Zustand | Renderer process only; slices per domain |
| Routing | React Router v7 | Three top-level routes |
| Canvas | Konva + react-konva | Instruction image viewer and annotation layer |
| PDF rendering | pdfjs-dist | Runs in renderer process (requires browser Canvas API) |
| Database | better-sqlite3 | SQLite, synchronous, main process only |
| Package manager | npm | |

---

## Project Structure

```
model-app/
├── electron/
│   ├── main.ts               # Main process entry point
│   ├── preload.ts            # Context bridge — exposes typed API to renderer
│   ├── ipc/                  # IPC handlers grouped by domain
│   │   ├── collection.ts     # kits, accessories, paints
│   │   ├── projects.ts       # project CRUD, active project
│   │   ├── build.ts          # tracks, steps, step completion
│   │   ├── media.ts          # photos, reference images, PDF import
│   │   ├── log.ts            # build log entries
│   │   └── settings.ts       # app settings, tag library
│   ├── db/
│   │   ├── index.ts          # DB connection, migration runner
│   │   ├── schema.sql        # Full schema (applied once on first run)
│   │   └── queries/          # Typed query functions per domain
│   │       ├── kits.ts
│   │       ├── projects.ts
│   │       ├── steps.ts
│   │       └── ...
│   └── services/
│       ├── files.ts          # File management, path helpers, thumbnails
│       ├── scalemates.ts     # Scalemates HTTP scraping
│       └── export.ts         # Build log export (HTML / PDF / ZIP)
│
├── src/
│   ├── main.tsx              # React entry
│   ├── App.tsx               # Router setup, zone nav bar
│   ├── routes/
│   │   ├── collection.tsx
│   │   ├── build.tsx
│   │   └── overview.tsx
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (auto-generated)
│   │   ├── collection/       # Collection zone components
│   │   ├── build/            # Build zone components
│   │   │   ├── SetupMode/
│   │   │   └── BuildingMode/
│   │   └── overview/         # Overview zone components
│   ├── store/
│   │   ├── index.ts          # Combined Zustand store
│   │   ├── collection-slice.ts
│   │   ├── build-slice.ts
│   │   └── ui-slice.ts
│   ├── api/
│   │   └── index.ts          # Typed wrappers around window.api IPC calls
│   └── lib/
│       ├── pdf.ts            # PDF rasterization via pdfjs-dist (renderer)
│       └── utils.ts          # cn() and other shadcn utilities
│
├── shared/
│   └── types.ts              # Types shared between main and renderer
│
├── electron-vite.config.ts
├── tsconfig.json
└── package.json
```

---

## IPC Pattern

All database access and file operations happen in the main process. The renderer communicates through a typed context bridge.

**preload.ts** exposes a typed `window.api` object:

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Collection
  listKits: () => ipcRenderer.invoke('kits:list'),
  createKit: (input: CreateKitInput) => ipcRenderer.invoke('kits:create', input),
  // ... one entry per IPC channel
})
```

**renderer** calls through `window.api`:

```typescript
// src/api/index.ts
export const api = window.api as AppApi  // typed via shared/types.ts
```

**main** registers handlers:

```typescript
// electron/ipc/collection.ts
ipcMain.handle('kits:list', () => db.listKits())
ipcMain.handle('kits:create', (_e, input) => db.createKit(input))
```

**Data flow**: IPC call → main handler → better-sqlite3 query → return result → renderer updates Zustand store directly. No re-fetching after mutations.

---

## Database Schema

Single migration applied at startup. Schema version tracked in `app_settings`.

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ── Settings ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Seed defaults on first run:
-- active_project_id, data_dir, pdf_dpi (default 300), theme (system)

-- ── Tag library ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tags (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);

-- ── Collection ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kits (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  manufacturer     TEXT,
  scale            TEXT,           -- e.g. '1:35'
  kit_number       TEXT,
  box_art_path     TEXT,           -- relative to data dir
  status           TEXT NOT NULL DEFAULT 'shelf'
                   CHECK(status IN ('wishlist','shelf','building','completed')),
  scalemates_url   TEXT,
  retailer_url     TEXT,
  price            REAL,
  notes            TEXT,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS accessories (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  type           TEXT NOT NULL
                 CHECK(type IN ('pe','resin_3d','decal','other')),
  manufacturer   TEXT,
  reference_code TEXT,
  parent_kit_id  TEXT REFERENCES kits(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'shelf'
                 CHECK(status IN ('wishlist','shelf')),
  notes          TEXT,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS paints (
  id             TEXT PRIMARY KEY,
  brand          TEXT NOT NULL,
  name           TEXT NOT NULL,
  reference_code TEXT,
  paint_type     TEXT NOT NULL
                 CHECK(paint_type IN ('acrylic','enamel','lacquer','oil')),
  status         TEXT NOT NULL DEFAULT 'owned'
                 CHECK(status IN ('owned','wishlist')),
  notes          TEXT,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);

-- ── Projects ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id                          TEXT PRIMARY KEY,
  name                        TEXT NOT NULL,
  kit_id                      TEXT REFERENCES kits(id) ON DELETE SET NULL,
  status                      TEXT NOT NULL DEFAULT 'active'
                              CHECK(status IN ('active','completed')),
  markings_scheme             TEXT,
  markings_scheme_image_path  TEXT,
  hero_photo_path             TEXT,
  start_date                  INTEGER,
  completion_date             INTEGER,
  notes                       TEXT,
  created_at                  INTEGER NOT NULL,
  updated_at                  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS project_accessories (
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  accessory_id TEXT NOT NULL REFERENCES accessories(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, accessory_id)
);

-- Persisted UI state — restored when the user clicks Resume
CREATE TABLE IF NOT EXISTS project_ui_state (
  project_id     TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  active_step_id TEXT REFERENCES steps(id) ON DELETE SET NULL,
  build_mode     TEXT NOT NULL DEFAULT 'building'
                 CHECK(build_mode IN ('setup','building')),
  nav_mode       TEXT NOT NULL DEFAULT 'track'
                 CHECK(nav_mode IN ('track','page')),
  image_zoom     REAL NOT NULL DEFAULT 1.0,
  image_pan_x    REAL NOT NULL DEFAULT 0.0,
  image_pan_y    REAL NOT NULL DEFAULT 0.0,
  updated_at     INTEGER NOT NULL
);

-- ── Instruction sources (uploaded PDFs) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS instruction_sources (
  id                TEXT PRIMARY KEY,
  project_id        TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,       -- user label: 'Base kit', 'PE sheet'
  original_filename TEXT NOT NULL,
  page_count        INTEGER NOT NULL DEFAULT 0,
  display_order     INTEGER NOT NULL DEFAULT 0,
  created_at        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS instruction_pages (
  id          TEXT PRIMARY KEY,
  source_id   TEXT NOT NULL REFERENCES instruction_sources(id) ON DELETE CASCADE,
  page_index  INTEGER NOT NULL,          -- 0-based
  file_path   TEXT NOT NULL,            -- relative: instructions/<source_id>/page-NNN.png
  width       INTEGER NOT NULL,
  height      INTEGER NOT NULL,
  UNIQUE(source_id, page_index)
);

-- ── Tracks and steps ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tracks (
  id                  TEXT PRIMARY KEY,
  project_id          TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  color               TEXT NOT NULL DEFAULT '#6b7280',
  display_order       INTEGER NOT NULL DEFAULT 0,
  is_standalone       INTEGER NOT NULL DEFAULT 0,  -- 1 = no join point expected
  join_point_step_id  TEXT REFERENCES steps(id) ON DELETE SET NULL,  -- step on another track
  join_point_notes    TEXT,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS steps (
  id               TEXT PRIMARY KEY,
  track_id         TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  parent_step_id   TEXT REFERENCES steps(id) ON DELETE CASCADE,  -- NULL = top-level
  title            TEXT NOT NULL,
  display_order    INTEGER NOT NULL DEFAULT 0,

  -- Instruction image
  source_page_id   TEXT REFERENCES instruction_pages(id) ON DELETE SET NULL,
  crop_x           REAL,    -- normalized 0–1
  crop_y           REAL,
  crop_w           REAL,
  crop_h           REAL,
  is_full_page     INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  source_type      TEXT NOT NULL DEFAULT 'base_kit'
                   CHECK(source_type IN
                     ('base_kit','photo_etch','resin_3d','aftermarket','custom_scratch')),
  source_name      TEXT,
  adhesive_type    TEXT
                   CHECK(adhesive_type IN
                     ('none','liquid_cement','tube_cement','ca_thin',
                      'ca_medium_thick','epoxy','pva','custom')),
  drying_time_min  INTEGER,   -- NULL = use adhesive type default
  pre_paint        INTEGER NOT NULL DEFAULT 0,
  quantity         INTEGER,   -- NULL = no counter

  -- Completion
  is_completed     INTEGER NOT NULL DEFAULT 0,
  completed_at     INTEGER,
  quantity_current INTEGER NOT NULL DEFAULT 0,

  -- Replacement
  replaces_step_id TEXT REFERENCES steps(id) ON DELETE SET NULL,

  notes            TEXT,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS step_tags (
  step_id TEXT NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  tag_id  TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (step_id, tag_id)
);

CREATE TABLE IF NOT EXISTS step_relations (
  id            TEXT PRIMARY KEY,
  from_step_id  TEXT NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  to_step_id    TEXT NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL
                CHECK(relation_type IN ('blocked_by','blocks_access_to')),
  UNIQUE(from_step_id, to_step_id, relation_type)
);

-- ── Paint tracking ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS palette_entries (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  purpose       TEXT,          -- 'base coat', 'enamel wash', etc.
  is_formula    INTEGER NOT NULL DEFAULT 0,
  paint_id      TEXT REFERENCES paints(id) ON DELETE SET NULL,  -- for direct paints
  mixing_notes  TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS palette_components (
  id               TEXT PRIMARY KEY,
  palette_entry_id TEXT NOT NULL REFERENCES palette_entries(id) ON DELETE CASCADE,
  paint_id         TEXT NOT NULL REFERENCES paints(id) ON DELETE CASCADE,
  ratio_parts      INTEGER,   -- e.g. 2 in '2:1'
  percentage       REAL,      -- alternative representation
  display_order    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS step_paint_refs (
  step_id          TEXT NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  palette_entry_id TEXT NOT NULL REFERENCES palette_entries(id) ON DELETE CASCADE,
  PRIMARY KEY (step_id, palette_entry_id)
);

-- ── Media ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reference_images (
  id            TEXT PRIMARY KEY,
  step_id       TEXT NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  file_path     TEXT NOT NULL,    -- relative: photos/references/<id>.jpg
  caption       TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS annotations (
  step_id    TEXT PRIMARY KEY REFERENCES steps(id) ON DELETE CASCADE,
  data       TEXT NOT NULL DEFAULT '[]',  -- JSON array of annotation objects
  updated_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS masks (
  step_id    TEXT PRIMARY KEY REFERENCES steps(id) ON DELETE CASCADE,
  file_path  TEXT NOT NULL,    -- relative: masks/<step_id>.mask.png
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS progress_photos (
  id          TEXT PRIMARY KEY,
  step_id     TEXT NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,    -- relative: photos/progress/<step_id>_<ts>.jpg
  captured_at INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS milestone_photos (
  id          TEXT PRIMARY KEY,
  track_id    TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,    -- relative: photos/milestones/<track_name>_<ts>.jpg
  captured_at INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);

-- ── Build log ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS build_log_entries (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entry_type   TEXT NOT NULL
               CHECK(entry_type IN
                 ('manual','step_complete','milestone',
                  'timer_complete','photo_added','build_complete')),
  body         TEXT,            -- manual entry text
  photo_path   TEXT,            -- manual entry photo
  step_id      TEXT REFERENCES steps(id) ON DELETE SET NULL,
  track_id     TEXT REFERENCES tracks(id) ON DELETE SET NULL,
  timer_label  TEXT,
  elapsed_min  INTEGER,
  created_at   INTEGER NOT NULL
);

-- ── Kit files (pre-project instruction attachments) ──────────────────────

CREATE TABLE IF NOT EXISTS kit_files (
  id           TEXT PRIMARY KEY,
  kit_id       TEXT NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  file_path    TEXT NOT NULL,       -- relative to data dir
  file_type    TEXT NOT NULL
               CHECK(file_type IN ('pdf','image')),
  label        TEXT,                -- user label: 'Instructions', 'PE sheet'
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL
);

-- ── Drying timers ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS drying_timers (
  id           TEXT PRIMARY KEY,
  step_id      TEXT REFERENCES steps(id) ON DELETE SET NULL,
  label        TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  started_at   INTEGER NOT NULL,    -- unix timestamp
  position_x   REAL NOT NULL DEFAULT 0.0,  -- bubble position (shared across timers)
  position_y   REAL NOT NULL DEFAULT 0.0
);

-- ── Export history ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS export_history (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  format       TEXT NOT NULL
               CHECK(format IN ('html','pdf','zip')),
  file_path    TEXT NOT NULL,       -- relative to project dir
  created_at   INTEGER NOT NULL
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_steps_track    ON steps(track_id, display_order);
CREATE INDEX IF NOT EXISTS idx_steps_parent   ON steps(parent_step_id);
CREATE INDEX IF NOT EXISTS idx_pages_source   ON instruction_pages(source_id, page_index);
CREATE INDEX IF NOT EXISTS idx_photos_step    ON progress_photos(step_id);
CREATE INDEX IF NOT EXISTS idx_log_project    ON build_log_entries(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_palette_proj   ON palette_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_tracks_project ON tracks(project_id, display_order);
CREATE INDEX IF NOT EXISTS idx_kit_files      ON kit_files(kit_id);
CREATE INDEX IF NOT EXISTS idx_export_project ON export_history(project_id, created_at);

-- ── Full-text search (Phase 7) ────────────────────────────────────────────────

-- Contentless FTS5 table; populated/updated on kit, project, and step writes.
-- Sync strategy: on every INSERT/UPDATE/DELETE to kits, projects, or steps,
-- the corresponding IPC handler must DELETE the old FTS row (by entity_type + entity_id)
-- and INSERT a new one with the current title/body text. This is application-level,
-- not trigger-based, because contentless FTS5 tables do not support triggers.
-- Searched via: SELECT entity_type, entity_id FROM fts_index WHERE fts_index MATCH ?
CREATE VIRTUAL TABLE IF NOT EXISTS fts_index USING fts5(
  entity_type UNINDEXED,   -- 'kit' | 'project' | 'step'
  entity_id   UNINDEXED,
  title,
  body,
  tokenize = 'porter ascii'
);
```

---

## State Management

Zustand store with three slices. All slices combined in `store/index.ts`.

```typescript
// store/collection-slice.ts
interface CollectionSlice {
  kits: Kit[]
  accessories: Accessory[]
  paints: Paint[]
  loadCollection: () => Promise<void>
  addKit: (kit: Kit) => void
  updateKit: (kit: Kit) => void
  removeKit: (id: string) => void
  // ...
}

// store/build-slice.ts
interface BuildSlice {
  activeProjectId: string | null
  project: Project | null
  tracks: Track[]
  steps: Step[]
  setActiveProject: (id: string) => Promise<void>
  completeStep: (stepId: string) => void
  // ...
}

// store/ui-slice.ts
interface UiSlice {
  buildMode: 'setup' | 'building'
  navMode: 'track' | 'page'
  activeStepId: string | null
  activeTrackId: string | null
  activeSourceId: string | null   // selected PDF source in page mode
  imageZoom: number
  imagePan: { x: number; y: number }
  // ...
}
```

**Mutation pattern**: call IPC → on success, update store directly. Never re-fetch the full list after a single item changes.

```typescript
async function createKit(input: CreateKitInput) {
  const kit = await api.createKit(input)   // IPC → main → SQLite → return
  useStore.getState().addKit(kit)          // update renderer store
}
```

---

## File Paths

All paths stored in the database are **relative to the project data directory**. Resolved to absolute paths only when reading/writing files.

```
userData/                            ← app.getPath('userData')
└── model-builder/
    ├── db.sqlite
    └── projects/
        └── <project-id>/
            ├── instructions/<source-id>/page-001.png
            ├── steps/<step-id>.png
            ├── masks/<step-id>.mask.png
            ├── thumbnails/<step-id>.thumb.jpg
            ├── photos/
            │   ├── progress/<step-id>_<timestamp>.jpg
            │   ├── milestones/<track-name>_<timestamp>.jpg
            │   ├── references/<ref-id>.jpg
            │   └── hero/cover.jpg
            ├── annotations/          ← rendered exports only
            └── exports/<YYYYMMDD>[-N]/
                ├── build-log.html
                └── images/
```

---

## Key Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.0.0",
    "zustand": "^5.0.0",
    "konva": "^10.0.0",
    "react-konva": "^19.0.0",
    "pdfjs-dist": "^4.0.0",
    "better-sqlite3": "^11.0.0",
    "use-image": "^1.1.0",
    "tailwindcss": "^4.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "date-fns": "^4.0.0"
  },
  "devDependencies": {
    "electron": "^33.0.0",
    "electron-vite": "^3.0.0",
    "electron-builder": "^25.0.0",
    "@electron/rebuild": "^3.0.0",
    "typescript": "^5.0.0",
    "@types/better-sqlite3": "latest",
    "@types/react": "^19.0.0"
  },
  "scripts": {
    "postinstall": "electron-rebuild -f -w better-sqlite3"
  }
}
```

> **Note**: `uuid` is not needed — use `crypto.randomUUID()` which is available natively in both Node.js 16+ and modern browsers. `electron` is a devDependency because it's a build-time tool; the packaged app bundles it. `@electron/rebuild` is required to recompile `better-sqlite3` (a native addon) against the Electron version after each `npm install`.
>
> **Tailwind v4**: Configuration is CSS-first — no `tailwind.config.ts`. Use `@import "tailwindcss"` and `@theme { ... }` in your root CSS file to customise tokens. Plugin/content config goes in the same CSS file via `@source` directives.

---

## Annotation Data Format

Annotations are stored as a JSON array in the `annotations` table. Each object describes one mark:

```typescript
interface AnnotationBase {
  id: string
  color: string        // hex, e.g. '#ef4444'
  strokeWidth: number  // in normalized units (relative to image width)
  opacity: number      // 0–1
}

type Annotation =
  | AnnotationBase & { type: 'checkmark'; x: number; y: number }
  | AnnotationBase & { type: 'circle';    x: number; y: number; rx: number; ry: number }
  | AnnotationBase & { type: 'arrow';     x1: number; y1: number; x2: number; y2: number }
  | AnnotationBase & { type: 'cross';     x: number; y: number; size: number }
  | AnnotationBase & { type: 'highlight'; x: number; y: number; w: number; h: number }
  | AnnotationBase & { type: 'freehand';  points: number[] }
  | AnnotationBase & { type: 'text';      x: number; y: number; text: string; fontSize: number }
```

Coordinates are normalized (0–1 relative to the step image dimensions) so they remain valid if the image is displayed at different sizes.

---

## Media Handling

### Instruction images (PDF rasterization)

- **Where**: renderer process, `src/lib/pdf.ts`, using `pdfjs-dist`
- **Flow**: user selects PDF → renderer reads file → pdfjs renders each page to an offscreen canvas → canvas exported as PNG → PNG `ArrayBuffer` sent via IPC to main → main writes `instructions/<source-id>/page-NNN.png`
- **Format**: PNG — lossless, universal tool support, no quality decisions
- **DPI**: 300 (default, user-configurable in App Settings). At 300 DPI, an A4 page = 2480×3508 px — sharp when zoomed
- **Step crops**: stored as normalized coordinates (0–1); full-resolution crop rendered on first display from the stored page PNG

### Build photos and reference images

- **Formats accepted**: JPEG, PNG, WebP (Chromium supports all natively), HEIC (iPhone)
- **HEIC handling**: convert to JPEG on import using the macOS `sips` system command — no extra dependencies

  ```bash
  sips -s format jpeg input.heic --out output.jpg
  ```

  Called from main process via Node.js `child_process.execFile`. HEIC import is macOS-only; on other platforms, the file picker filters HEIC out.

- **Storage format**: JPEG for all stored photos (progress, milestone, reference, hero) — smaller files, sufficient quality for model photography
- **Thumbnails**: JPEG, generated in main process by drawing the source image to an offscreen canvas at reduced size via `nativeImage`

### Build log PDF export

- **Method**: Electron's built-in `webContents.printToPDF()` — no extra dependencies
- **Flow**: main process creates a hidden `BrowserWindow`, loads the HTML build log template with project data injected, calls `printToPDF({ pageSize: 'A4', printBackground: true })`, writes the resulting buffer to `exports/<YYYYMMDD>[-N]/build-log.pdf`, then closes the window
- **HTML export**: the same rendered HTML is saved directly as a self-contained file with images base64-embedded
- **ZIP export**: all photos copied into an `images/` directory alongside a narrative Markdown file; bundled using Node.js `archiver` package
