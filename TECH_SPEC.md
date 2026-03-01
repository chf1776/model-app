# Model Builder's Assistant — Technical Specification

---

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Platform | Tauri v2 | Rust backend + webview frontend |
| Build tool | Vite | Standard Vite with @tauri-apps/cli |
| Language | TypeScript (frontend) + Rust (backend) | Shared types via tauri::command |
| UI framework | React 19 | Webview process |
| Styling | Tailwind CSS v4 | |
| Component library | shadcn/ui | Radix primitives, copy-paste into `src/components/ui/` |
| State | Zustand | Frontend only; slices per domain |
| Routing | React Router v7 | Three top-level routes + settings |
| Canvas | Konva + react-konva | Instruction image viewer and annotation layer |
| PDF rendering | Rust-side (pdf-rs or pdfium) | Rasterization in backend, results sent to frontend |
| Database | SQLite via rusqlite | Backend process only |
| Package manager | npm (frontend) + cargo (backend) | |

---

## Project Structure

```
model-app/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs               # Tauri entry point
│   │   ├── lib.rs                # Command registration
│   │   ├── commands/             # Tauri commands grouped by domain
│   │   │   ├── collection.rs     # kits, accessories, paints
│   │   │   ├── projects.rs       # project CRUD, active project
│   │   │   ├── build.rs          # tracks, steps, step completion
│   │   │   ├── media.rs          # photos, reference images, PDF import
│   │   │   ├── log.rs            # build log entries
│   │   │   └── settings.rs       # app settings
│   │   ├── db/
│   │   │   ├── mod.rs            # DB connection, migration runner
│   │   │   ├── schema.sql        # Full schema (applied once on first run)
│   │   │   └── queries/          # Typed query functions per domain
│   │   │       ├── kits.rs
│   │   │       ├── projects.rs
│   │   │       ├── steps.rs
│   │   │       └── ...
│   │   └── services/
│   │       ├── files.rs          # File management, path helpers, thumbnails
│   │       ├── scalemates.rs    # Scalemates URL scraping (paste-only, no search)
│   │       ├── pdf.rs            # PDF rasterization (pdfium or pdf-rs)
│   │       ├── paint_catalog.rs # Load and search bundled paint catalogue JSON
│   │       └── export.rs         # Build log export (HTML / PDF / ZIP)
│   ├── catalogue/               # Bundled paint catalogue data (generated from Arcturus5404 repo)
│   │   ├── tamiya.json
│   │   ├── vallejo.json
│   │   ├── mr_hobby.json
│   │   ├── ak.json
│   │   └── ammo.json
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── capabilities/
│       └── default.json          # Tauri v2 permission capabilities
│
├── src/
│   ├── main.tsx              # React entry
│   ├── App.tsx               # Router setup, zone nav bar
│   ├── routes/
│   │   ├── collection.tsx
│   │   ├── build.tsx
│   │   ├── overview.tsx
│   │   └── settings.tsx
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (auto-generated)
│   │   ├── collection/       # Collection zone components
│   │   │   ├── EntitySwitcher/
│   │   │   ├── KitsTab/
│   │   │   ├── AccessoriesTab/
│   │   │   └── PaintsTab/
│   │   ├── build/            # Build zone components
│   │   │   ├── SetupMode/
│   │   │   └── BuildingMode/
│   │   ├── overview/         # Overview zone components
│   │   │   ├── AssemblyMap/
│   │   │   ├── GalleryCard/
│   │   │   ├── BuildLogCard/
│   │   │   ├── MaterialsCard/
│   │   │   └── ProjectInfoCard/
│   │   └── shared/           # Cross-zone components
│   │       ├── WishlistBadge/
│   │       ├── AddKitDialog/    # Reusable kit creation with Scalemates import
│   │       ├── AddPaintDialog/  # Catalogue lookup + manual entry
│   │       ├── CreateProjectDialog/
│   │       └── Lightbox/
│   ├── store/
│   │   ├── index.ts          # Combined Zustand store
│   │   ├── collection-slice.ts
│   │   ├── build-slice.ts
│   │   ├── overview-slice.ts
│   │   └── ui-slice.ts
│   ├── api/
│   │   └── index.ts          # Typed wrappers around Tauri invoke calls
│   └── lib/
│       └── utils.ts          # cn() and other shadcn utilities
│
├── shared/
│   └── types.ts              # Types shared between frontend components
│
├── scripts/
│   └── convert-paint-catalogue.ts  # One-time MD→JSON converter for Arcturus5404 data
│
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## IPC Pattern

All database access and file operations happen in the Rust backend. The frontend communicates through Tauri's `invoke` command system.

**Backend** registers Tauri commands:

```rust
// src-tauri/src/commands/collection.rs
#[tauri::command]
pub fn list_kits(state: State<'_, DbState>) -> Result<Vec<Kit>, String> {
    state.db.list_kits().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_kit(state: State<'_, DbState>, input: CreateKitInput) -> Result<Kit, String> {
    state.db.create_kit(input).map_err(|e| e.to_string())
}
```

**Frontend** calls through typed wrappers:

```typescript
// src/api/index.ts
import { invoke } from '@tauri-apps/api/core'

export const api = {
  listKits: () => invoke<Kit[]>('list_kits'),
  createKit: (input: CreateKitInput) => invoke<Kit>('create_kit', { input }),
  // ... one entry per command
}
```

**Data flow**: `invoke` call → Tauri command → rusqlite query → return result → frontend updates Zustand store directly. No re-fetching after mutations.

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
-- active_project_id, data_dir, pdf_dpi (default 150), theme (system)

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
  category         TEXT
                   CHECK(category IN ('ship','aircraft','armor','vehicle','figure','sci_fi','other')),
  scalemates_url   TEXT,
  retailer_url     TEXT,
  price            REAL,
  currency         TEXT DEFAULT 'USD',  -- ISO 4217
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
  price          REAL,
  currency       TEXT DEFAULT 'USD',  -- ISO 4217
  buy_url        TEXT,
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
  finish         TEXT
                 CHECK(finish IN ('flat','semi_gloss','gloss','metallic','clear','satin')),
  color          TEXT,              -- hex value, e.g. '#4E7282'
  color_family   TEXT,              -- auto-assigned via HSL, user-overridable
  status         TEXT NOT NULL DEFAULT 'owned'
                 CHECK(status IN ('owned','wishlist')),
  price          REAL,
  currency       TEXT DEFAULT 'USD',  -- ISO 4217
  buy_url        TEXT,
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
                              CHECK(status IN ('active','paused','completed','archived')),
  category                    TEXT
                              CHECK(category IN ('ship','aircraft','armor','vehicle','figure','sci_fi','other')),
  scalemates_url              TEXT,
  product_code                TEXT,
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

CREATE TABLE IF NOT EXISTS gallery_photos (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path       TEXT NOT NULL,       -- relative to project dir
  caption         TEXT,
  source          TEXT NOT NULL DEFAULT 'gallery'
                  CHECK(source IN ('gallery','log')),
  log_entry_id    TEXT REFERENCES build_log_entries(id) ON DELETE SET NULL,
  is_milestone    INTEGER NOT NULL DEFAULT 0,
  track_id        TEXT REFERENCES tracks(id) ON DELETE SET NULL,
  created_at      INTEGER NOT NULL
);

-- ── Build log ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS build_log_entries (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entry_type   TEXT NOT NULL
               CHECK(entry_type IN
                 ('step_complete','note','photo','milestone',
                  'build_complete')),
  body         TEXT,            -- note text, milestone title, or closing remarks
  photo_path   TEXT,            -- photo entry image path
  caption      TEXT,            -- photo caption
  step_id      TEXT REFERENCES steps(id) ON DELETE SET NULL,
  track_id     TEXT REFERENCES tracks(id) ON DELETE SET NULL,
  step_number  INTEGER,         -- step number for display in timeline dot
  is_track_completion INTEGER NOT NULL DEFAULT 0,  -- milestone: was this a track completion?
  track_step_count   INTEGER,   -- milestone: how many steps in completed track
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
  started_at   INTEGER NOT NULL    -- unix timestamp
);
-- Timer bubble position stored in app_settings: timer_bubble_x, timer_bubble_y

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
CREATE INDEX IF NOT EXISTS idx_gallery_project ON gallery_photos(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_log_project    ON build_log_entries(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_palette_proj   ON palette_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_tracks_project ON tracks(project_id, display_order);
CREATE INDEX IF NOT EXISTS idx_kit_files      ON kit_files(kit_id);
CREATE INDEX IF NOT EXISTS idx_export_project ON export_history(project_id, created_at);

-- ── Full-text search (deferred to v2) ─────────────────────────────────────────

-- Global search is deferred. Each zone has scoped navigation (entity switcher,
-- paint shelf search, build zone track/step nav). When implemented, a command
-- palette (Cmd+K) pattern with FTS5 is recommended.
--
-- CREATE VIRTUAL TABLE IF NOT EXISTS fts_index USING fts5(
--   entity_type UNINDEXED,   -- 'kit' | 'project' | 'step'
--   entity_id   UNINDEXED,
--   title,
--   body,
--   tokenize = 'porter ascii'
-- );
```

---

## State Management

Zustand store with four slices. All slices combined in `store/index.ts`.

```typescript
// store/collection-slice.ts
interface CollectionSlice {
  kits: Kit[]
  accessories: Accessory[]
  paints: Paint[]
  activeEntityTab: 'kits' | 'accessories' | 'paints'
  paintGroupBy: 'color_family' | 'brand' | 'project'
  paintViewMode: 'list' | 'grid'
  selectedPaintId: string | null
  loadCollection: () => Promise<void>
  addKit: (kit: Kit) => void
  updateKit: (kit: Kit) => void
  removeKit: (id: string) => void
  markAcquired: (entityType: string, id: string) => void
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

// store/overview-slice.ts
interface OverviewSlice {
  expandedCard: 'gallery' | 'buildLog' | 'materials' | 'projectInfo' | null
  galleryFilter: 'all' | 'gallery' | 'log' | 'milestones'
  buildLogFilter: 'all' | 'step' | 'note' | 'photo' | 'milestone'
  materialsFilter: 'all' | 'owned' | 'needed'
  lightboxPhotoId: string | null
  setExpandedCard: (card: string | null) => void
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
  theme: 'light' | 'dark' | 'system'
  // ...
}
```

**Mutation pattern**: call Tauri command → on success, update store directly. Never re-fetch the full list after a single item changes.

```typescript
async function createKit(input: CreateKitInput) {
  const kit = await api.createKit(input)   // invoke → Rust → SQLite → return
  useStore.getState().addKit(kit)          // update frontend store
}
```

---

## File Paths

All paths stored in the database are **relative to the project data directory**. Resolved to absolute paths only when reading/writing files.

```
userData/                            ← platform app data dir (configurable in settings)
└── model-builder/
    ├── db.sqlite
    ├── backups/
    │   └── backup-<YYYYMMDD-HHMMSS>.sqlite
    ├── stash/                       ← Collection-level files (not project-specific)
    │   └── <item-id>/
    │       ├── cover.jpg            ← Kit box art (from Scalemates or manual)
    │       └── instructions/
    │           └── <file-id>.<ext>  ← Pre-project instruction PDFs and images
    └── projects/
        └── <project-id>/
            ├── instructions/<source-id>/page-001.png
            ├── steps/<step-id>.png
            ├── masks/<step-id>.mask.png
            ├── thumbnails/<step-id>.thumb.jpg
            ├── photos/
            │   ├── progress/<step-id>_<timestamp>.jpg
            │   ├── milestones/<track-name>_<timestamp>.jpg
            │   ├── gallery/<timestamp>.jpg
            │   ├── references/<ref-id>.jpg
            │   └── hero/cover.jpg
            ├── annotations/          ← rendered exports only
            └── exports/<YYYYMMDD>[-N]/
                ├── build-log.html
                └── images/
```

---

## Key Dependencies

**Frontend (package.json)**:

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.0.0",
    "zustand": "^5.0.0",
    "konva": "^10.0.0",
    "react-konva": "^19.0.0",
    "@tauri-apps/api": "^2.0.0",
    "use-image": "^1.1.0",
    "tailwindcss": "^4.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "date-fns": "^4.0.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "typescript": "^5.0.0",
    "@types/react": "^19.0.0",
    "vite": "^6.0.0"
  }
}
```

**Backend (Cargo.toml)** — key crates:

```toml
[dependencies]
tauri = { version = "2", features = ["all"] }
rusqlite = { version = "0.32", features = ["bundled"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
uuid = { version = "1", features = ["v4"] }
reqwest = { version = "0.12", features = ["json"] }  # Scalemates fetching
scraper = "0.22"                                       # HTML parsing for Scalemates
```

> **Note**: `uuid` is used in Rust for ID generation. Frontend uses `crypto.randomUUID()` where needed. Tailwind v4 uses CSS-first configuration via `@import "tailwindcss"` and `@theme { ... }` in the root CSS file.

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

- **Where**: Rust backend, `src-tauri/src/services/pdf.rs`
- **Flow**: user selects PDF → frontend sends path via invoke → Rust reads file → renders each page to PNG via pdfium or pdf-rs → writes `instructions/<source-id>/page-NNN.png` → returns page metadata to frontend
- **Format**: PNG — lossless, universal tool support, no quality decisions
- **DPI**: 150 (default, user-configurable in Settings: 72 / 150 / 300). At 300 DPI, an A4 page = 2480×3508 px — sharp when zoomed
- **Step crops**: stored as normalized coordinates (0–1); full-resolution crop rendered on first display from the stored page PNG

### Build photos and reference images

- **Formats accepted**: JPEG, PNG, WebP, HEIC (iPhone)
- **HEIC handling**: convert to JPEG on import using platform-specific tools. macOS: `sips` system command. Other platforms: filter HEIC out of file picker.
- **Storage format**: JPEG for all stored photos (progress, milestone, gallery, reference, hero)
- **Thumbnails**: JPEG, generated in Rust backend at reduced size

### Build log PDF export

- **Method**: Rust backend generates HTML from template, converts to PDF using a Rust HTML-to-PDF library (e.g. headless-chrome or weasyprint via subprocess)
- **HTML export**: same rendered HTML saved directly as a self-contained file with images base64-embedded
- **ZIP export**: all photos copied into an `images/` directory alongside a narrative Markdown file; bundled using Rust's `zip` crate

---

## Scalemates Integration

Scalemates.com is the hobby's de facto kit database. Integration is paste-URL-only (no keyword search) — individual kit pages have a stable structure suitable for scraping. No public API exists.

### Import flow

1. User pastes a Scalemates URL into the Add Kit dialog (or into the Scalemates URL field in Project Info)
2. Frontend sends URL to Rust backend via `import_from_scalemates` command
3. Backend fetches the page via `reqwest`, parses HTML via `scraper` crate
4. Returns a `ScalematesKitData` struct with extracted fields
5. Frontend pre-fills the kit form; user reviews and confirms

### Extracted fields

| Field | Selector strategy | Required |
| --- | --- | --- |
| Kit name | Page title / main heading | Yes |
| Manufacturer | Brand link in kit header | Yes |
| Scale | Scale badge in kit metadata | Yes |
| Product code / kit number | Metadata table row | No |
| Category | Inferred from Scalemates category path (see Category mapping table below) | No |
| Box art image URL | Primary product image | No |
| Scalemates URL | The input URL itself (canonical form) | Yes |

Box art is downloaded and stored locally as the kit's cover image (`stash/<item-id>/cover.jpg`).

### Error handling

- **Network failure / timeout**: Error dialog with retry button. "Could not reach Scalemates. Check your connection and try again."
- **Invalid URL** (not a Scalemates kit page): Inline validation error on the URL field. "This doesn't look like a Scalemates kit page."
- **Partial data** (page loads but some fields missing): Partial import proceeds. Missing fields left blank with inline yellow warning badges: "Not found on Scalemates — fill in manually." The user can still save the kit.
- **Scraper breakage** (Scalemates changes their HTML structure): Treated as partial data — extract what still parses, warn on the rest. The manual entry fallback always works.

### Re-sync

Kits with a `scalemates_url` set show a "Sync from Scalemates" button in the kit detail view and in the Project Info card. User-triggered only, never automatic.

On re-sync, if local data differs from Scalemates data:

- A diff dialog appears: "These fields changed on Scalemates" with the current local value and the new Scalemates value side by side
- Per-field accept/reject toggles (checkboxes, all checked by default)
- "Apply changes" button updates only the accepted fields
- Fields the user has left blank locally are auto-accepted without prompting

### Backend service

```rust
// src-tauri/src/services/scalemates.rs

pub struct ScalematesKitData {
    pub name: String,
    pub manufacturer: Option<String>,
    pub scale: Option<String>,
    pub product_code: Option<String>,
    pub category: Option<String>,
    pub box_art_url: Option<String>,
    pub scalemates_url: String,
}

pub async fn fetch_kit_data(url: &str) -> Result<ScalematesKitData, ScalematesError>;

pub enum ScalematesError {
    NetworkError(String),
    InvalidUrl,
    ParseError(String),  // page loaded but scraper couldn't extract required fields
}
```

### Category mapping

Scalemates category strings are normalized to the DB enum on import:

| Scalemates path | DB value |
| --- | --- |
| Ships, Submarines | `ship` |
| Aircraft | `aircraft` |
| Military Vehicles, Tanks | `armor` |
| Cars, Trucks, Motorcycles | `vehicle` |
| Figures | `figure` |
| Science Fiction, Space | `sci_fi` |
| Everything else | `other` |

### Where the UI lives

The Scalemates import is accessed from:

- **Add Kit dialog** (reusable component): URL paste field at the top, above manual entry fields. Pasting a URL triggers fetch; results pre-fill the form below. The dialog is used from both Collection ("+ Add Kit" button) and the Create Project flow (step 1, "Add new kit" option).
- **Project Info card**: Scalemates URL field with "Sync" button (re-sync only, for existing kits).
- **Kit detail view** in Collection: Scalemates URL display with "Open" external link and "Sync" button.

---

## Paint Catalogue

The app bundles a static paint catalogue derived from the [Arcturus5404/miniature-paints](https://github.com/Arcturus5404/miniature-paints) open-source dataset (MIT license). This provides pre-populated paint data for the catalogue lookup flow when adding paints.

### Data source and pipeline

The upstream repo contains one Markdown file per brand with tables of: paint name, reference code, product line/range, R, G, B values, and hex color.

**One-time conversion pipeline** (run manually, output committed to repo):

1. Clone or download the `miniature-paints` repo
2. Run a conversion script (`scripts/convert-paint-catalogue.ts`) that parses the Markdown tables
3. Outputs one JSON file per brand in `src-tauri/catalogue/`
4. Spot-check against Scalemates color pages for the five launch brands

The resulting JSON ships as static app resources. No runtime network access needed.

### Bundled data format

```json
// src-tauri/catalogue/tamiya.json
{
  "brand": "Tamiya",
  "ranges": [
    {
      "name": "Acrylic (Flat)",
      "paints": [
        {
          "code": "XF-1",
          "name": "Flat Black",
          "hex": "#1b1b1b",
          "r": 27, "g": 27, "b": 27,
          "type": "acrylic",
          "finish": "flat"
        }
      ]
    }
  ]
}
```

### Supported brands at v1

Tamiya, Vallejo (Model Color, Model Air, Game Color), Mr. Hobby (Mr. Color, Aqueous), AK Interactive, Ammo by Mig Jimenez.

Additional brands from the upstream repo (Citadel, Humbrol, Revell, Scale75, etc.) can be enabled in future updates by running the same conversion script on their data files.

### Catalogue updates

Ship with app updates only. Hobby paint lines change infrequently (5–10 new colors per year per brand). The manual entry fallback covers any paint not in the catalogue. No in-app update mechanism in v1.

### Lookup flow

1. User opens "Add Paint" dialog (from Collection paint shelf or from a step's paint reference picker)
2. **Search box** with **brand filter dropdown** beside it. Dropdown defaults to the user's default brand (from Settings), or "All brands" if unset.
3. Filter-as-you-type against all loaded catalogue JSON. Search matches against code (exact prefix match prioritized), name (fuzzy substring), and brand.
4. Results list: each row shows a color swatch circle (hex fill), reference code (monospace), paint name, brand + range label, and finish type.
5. Clicking a result pre-fills all fields in the Add Paint form: brand, name, code, hex, paint type, finish. User can override before saving.
6. "Not in catalogue? Add manually" link below results switches to the manual entry form.

### Color family auto-assignment

When a paint is saved (from catalogue or manual entry), `color_family` is computed from the hex color via HSL analysis:

| Hue range | Family |
| --- | --- |
| 0°–30°, 330°–360° (saturation ≥ 30%) | Reds & Oranges |
| 20°–40° (saturation 15–30%, lightness 20–60%) | Browns & Tans |
| 30°–60° | Yellows |
| 60°–165° | Greens |
| 165°–255° | Blues |
| 255°–330° | Purples & Violets |
| Saturation < 15% | Greys & Neutrals |
| Lightness > 90% | Whites |
| Lightness < 10% | Blacks |

Evaluation order: Blacks → Whites → Greys & Neutrals → Browns & Tans → hue-based families. User can override the assigned family. Custom family definitions deferred to v2.

Note: Metallics cannot be detected from hex alone (it's a finish property, not a hue). If the `finish` column is set to `metallic`, the paint is tagged as metallic separately; color family still reflects the underlying hue.

### Settings integration

- **Default brand**: Pre-selects the brand filter dropdown in catalogue search
- **Visible catalogue brands**: Multi-checkbox list in Settings → Paint & Catalogue. Unchecked brands are excluded from search results (data still bundled, just filtered out). All five launch brands enabled by default.
- **Auto-add paints from project**: When enabled (default: on), paints assigned to build steps via the step editor are automatically added to the global paint shelf if not already present.

---

## Backup & Restore

### Backup

Triggered manually via Settings → Data & Storage → "Back up now." Copies `db.sqlite` to `backups/backup-<YYYYMMDD-HHMMSS>.sqlite` within the app data directory. Last backup timestamp displayed in Settings.

### Restore

"Import backup" button in Settings. Opens file picker filtered to `.sqlite` files. Confirmation dialog: "This will replace all current data with the backup. This cannot be undone. Continue?" On confirm: current DB closed, backup file copied over `db.sqlite`, app restarts.

### Auto-save

All data changes auto-save on mutation (Zustand → Tauri invoke → SQLite write). The "auto-save interval" setting controls how frequently the UI state (zoom, pan, active step) is persisted to `project_ui_state`, not data writes. Data writes are always immediate.
