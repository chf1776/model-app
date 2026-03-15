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
| PDF rendering | MuPDF (via mupdf crate) | Rasterization in backend, results sent to frontend. MuPDF chosen over pdf-rs for broad real-world PDF compatibility (scanned manuals, Japanese manufacturer formats, password-protected files). Builds from C source via cargo (requires CMake). |
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
│   │   │   ├── mod.rs            # DB connection, migration runner (refinery)
│   │   │   ├── migrations/       # Refinery migration SQL files
│   │   │   │   └── V1__initial.sql
│   │   │   └── queries/          # Typed query functions per domain
│   │   │       ├── kits.rs
│   │   │       ├── projects.rs
│   │   │       ├── steps.rs
│   │   │       └── ...
│   │   └── services/
│   │       ├── files.rs          # File management, path helpers, thumbnails
│   │       ├── scalemates.rs    # Scalemates URL scraping (paste-only, no search)
│   │       ├── pdf.rs            # PDF rasterization (MuPDF)
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
│   │       ├── AddKitDialog/    # Reusable kit creation
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

**Data flow**: `invoke` call → Tauri command → rusqlite query → return result → frontend updates Zustand store directly. For cross-domain mutations, targeted re-fetching keeps other slices in sync (see §State Management for details).

---

## Database Schema

Migrations managed via the `refinery` crate. Each migration is a numbered SQL file in `src-tauri/migrations/`. The initial migration (`V1__initial.sql`) establishes the full schema. Subsequent migrations add columns, tables, or alter constraints as needed. Refinery tracks applied migrations in a `refinery_schema_history` table automatically.

```
src-tauri/migrations/
├── V1__initial.sql          # Full initial schema
├── V2__instruction_source_file_path.sql
├── V3__accessory_image_path.sql
├── V4__page_rotation.sql
├── V5__active_track_id.sql
├── V6__photo_starring.sql
└── V7__replaces_step_index.sql
```

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
                   CHECK(status IN ('wishlist','shelf','building','paused','completed')),
  category         TEXT
                   CHECK(category IN ('ship','aircraft','armor','vehicle','figure','sci_fi','other')),
  scalemates_url   TEXT,
  retailer_url     TEXT,
  price            REAL,
  currency         TEXT DEFAULT 'USD',  -- ISO 4217
  price_updated_at INTEGER,             -- when price was last set
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
  brand          TEXT,                -- e.g. 'Flyhawk', 'Eduard', 'Voyager'
  reference_code TEXT,
  parent_kit_id  TEXT REFERENCES kits(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'shelf'
                 CHECK(status IN ('wishlist','shelf')),
  price          REAL,
  currency       TEXT DEFAULT 'USD',  -- ISO 4217
  buy_url        TEXT,
  price_updated_at INTEGER,           -- when price was last set
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
  price_updated_at INTEGER,           -- when price was last set
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

-- ── Gallery ──────────────────────────────────────────────────────────────────

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

-- ── updated_at triggers ──────────────────────────────────────────────────────

-- Automatically set updated_at on UPDATE for all tables that have the column.
-- Uses unixepoch() for consistency with application-layer timestamps.

CREATE TRIGGER IF NOT EXISTS trg_kits_updated_at
  AFTER UPDATE ON kits FOR EACH ROW
  BEGIN UPDATE kits SET updated_at = unixepoch() WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_accessories_updated_at
  AFTER UPDATE ON accessories FOR EACH ROW
  BEGIN UPDATE accessories SET updated_at = unixepoch() WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_paints_updated_at
  AFTER UPDATE ON paints FOR EACH ROW
  BEGIN UPDATE paints SET updated_at = unixepoch() WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_projects_updated_at
  AFTER UPDATE ON projects FOR EACH ROW
  BEGIN UPDATE projects SET updated_at = unixepoch() WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_tracks_updated_at
  AFTER UPDATE ON tracks FOR EACH ROW
  BEGIN UPDATE tracks SET updated_at = unixepoch() WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_steps_updated_at
  AFTER UPDATE ON steps FOR EACH ROW
  BEGIN UPDATE steps SET updated_at = unixepoch() WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_palette_entries_updated_at
  AFTER UPDATE ON palette_entries FOR EACH ROW
  BEGIN UPDATE palette_entries SET updated_at = unixepoch() WHERE id = NEW.id; END;

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
  focusedCard: 'gallery' | 'buildLog' | 'materials' | 'projectInfo' | null
  overviewGalleryItems: UnifiedGalleryItem[]
  overviewGalleryLoading: boolean
  overviewBuildLog: BuildLogEntry[]
  overviewAccessories: Accessory[]
  overviewPaints: Paint[]
  overviewLoading: boolean
  setFocusedCard: (card: string | null) => void
  loadOverviewData: (projectId: string) => Promise<void>
  loadGalleryItems: (projectId: string) => Promise<void>
  addGalleryPhoto: (projectId: string, sourcePath: string, caption?: string, trackId?: string) => Promise<void>
  togglePhotoStar: (photoType: GalleryPhotoType, id: string, isStarred: boolean) => Promise<void>
  setProjectCoverPhoto: (projectId: string, photoPath: string | null) => Promise<void>
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

**Mutation pattern**: call Tauri command → on success, update the originating store slice directly. For mutations that cross domain boundaries (e.g. acquiring an accessory affects both collection and overview slices), re-fetch the affected data for the other slices from the backend. This targeted re-fetching is simple and performant at the expected data volumes (5–15 projects, 50–100 paints).

**Cross-slice mutations to handle**:
- Kit acquire (wishlist → shelf): re-fetch overview materials if the kit is linked to the active project
- Accessory/paint acquire: re-fetch overview materials
- Step completion: re-fetch overview build log + assembly map progress
- Track completion (milestone): re-fetch overview build log + gallery items
- Project status change: re-fetch collection kits list

```typescript
async function createKit(input: CreateKitInput) {
  const kit = await api.createKit(input)   // invoke → Rust → SQLite → return
  useStore.getState().addKit(kit)          // update frontend store
}

async function markAccessoryAcquired(id: string) {
  const accessory = await api.markAcquired('accessory', id)
  useStore.getState().updateAccessory(accessory)       // update collection slice
  useStore.getState().refreshOverviewMaterials()        // re-fetch for overview slice
}
```

---

## Kit-to-Project Pipeline

The kit-to-project pipeline connects collection data to project data automatically, reducing manual re-entry when starting a build.

### Kit file attachment (Phase 1A)
Users attach PDFs and images (instruction manuals, reference sheets) to kits via the Edit Kit dialog. Files are copied to the stash directory and recorded in the `kit_files` table. This can happen at any time — when the kit is on the shelf, wishlisted, or even already building.

### Project creation auto-import (Phase 1A)
When `create_project` is called with a `kit_id`:
1. Query `kit_files WHERE kit_id = ?` to get all attached files
2. For each file, create an `instruction_sources` row linked to the new project (file path carried over, `page_count = 0`)
3. PDF page rasterization is performed at project creation time with a processing overlay. MuPDF renders each page to PNG at the configured DPI.

### "Start Project" card action (Phase 1A)
Shelf kit cards expose a direct "Start Project" button. Clicking it opens the Create Project dialog with that kit pre-selected, so the user doesn't need to search for it. The kit's attached files are auto-imported as described above.

### Accessory auto-link (Phase 1B)
When `create_project` is called with a `kit_id`:
1. Query `accessories WHERE parent_kit_id = kit_id` to find linked aftermarket parts
2. Create `project_accessories` entries to link them to the project
3. Import any file attachments from those accessories as additional `instruction_sources` (e.g., PE instructions, decal placement guides)

This means a well-prepared kit — with manual attached, aftermarket parts linked, and their instructions uploaded — can become a fully-scaffolded project in a single click.

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
refinery = { version = "0.8", features = ["rusqlite"] }  # DB migrations
serde = { version = "1", features = ["derive"] }
serde_json = "1"
uuid = { version = "1", features = ["v4"] }
mupdf = "0.6"                                          # PDF rasterization (instruction manuals, builds from C source)
libheif-rs = "1"                                       # HEIC → JPEG conversion (iPhone photos)
typst = "0.12"                                         # Build log PDF export (template-based typesetting)

[target.'cfg(target_os = "macos")'.dependencies]
cocoa = "0.26"                                         # macOS dock icon in dev mode
objc = "0.2"                                           # Objective-C message passing for NSImage
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
- **Library**: MuPDF (via `mupdf` crate v0.6). Chosen over `pdf-rs` for broad compatibility with real-world instruction PDFs: scanned manuals, Japanese manufacturer formats, vector art, image-only wrappers, and password-protected files. Builds MuPDF from C source via cargo (requires CMake).
- **Flow**: user selects PDF → frontend sends path via invoke → Rust reads file → renders each page to PNG via MuPDF → writes `instructions/<source-id>/page-NNN.png` → returns page metadata to frontend
- **Format**: PNG — lossless, universal tool support, no quality decisions
- **DPI**: 150 (default, user-configurable in Settings: 72 / 150 / 300). At 300 DPI, an A4 page = 2480×3508 px — sharp when zoomed
- **Step crops**: stored as pixel coordinates in image-space (pre-rotation). Converted to effective-space (post-rotation) for canvas rendering via `imageToEffective`, and back via `effectiveToImage` for resize/reposition persistence.

### Build photos and reference images

- **Formats accepted**: JPEG, PNG, WebP, HEIC (iPhone)
- **HEIC handling**: Convert to JPEG on import via `libheif-rs` in the Rust backend. Works cross-platform (macOS, Windows, Linux) without requiring external tools.
- **Storage format**: JPEG for all stored photos (progress, milestone, gallery, reference, hero)
- **Thumbnails**: JPEG, generated in Rust backend at reduced size

### Build log PDF export

> **Full specification**: See EXPORT_FEATURE.md for the complete export dialog UX, PDF page design, section customization, and photo curation flow. This section covers the technical implementation.

- **Method**: Rust backend generates PDF using the `typst` crate. A `.typ` template defines the document layout (cover page, track sections, photo grids, paint palette). The backend populates the template with structured data from the build log, then renders to PDF. Typst is a Rust-native typesetting engine, so no external subprocess or dependency is needed.
- **Template features**: Proper cover page with hero photo, track-colored section headers, photo grids with consistent sizing and captions, paint palette with color swatches and formulas, running headers/footers with project name and page numbers, intelligent page break handling.
- **HTML export**: Separate code path. Self-contained single-page HTML with images base64-embedded. Serves a different purpose (web viewing, hosting) from the typeset PDF.
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

**Note on overlapping ranges**: The hue ranges above overlap intentionally (e.g. 0°–30° for Reds & Oranges and 20°–40° for Browns & Tans). The evaluation order resolves all conflicts: lightness extremes are checked first (Blacks, Whites), then low saturation (Greys), then the saturation+lightness criteria for Browns & Tans, and only then do the hue ranges apply. A paint is never evaluated against hue ranges if it was already matched by an earlier rule.

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

---

## Testing Strategy

Three layers, ordered by priority and effort.

### Rust unit tests (high priority, low effort)

Test query functions in `db/queries/` and service logic in `services/`. These are pure functions operating on a SQLite database; test with an in-memory DB seeded with fixture data.

Coverage targets:
- All query functions (CRUD operations, status transitions, cross-entity joins)
- PDF rasterization: test against a small corpus of representative instruction PDFs
- Scalemates HTML parsing: test against saved page snapshots (avoids network dependency)
- Color family auto-assignment: test edge cases in HSL classification
- Export generation: verify Typst template renders with sample data

### Tauri command integration tests (medium priority, medium effort)

Test the IPC boundary: invoke a Tauri command and verify the response. Catches serialization bugs, permission issues, and command registration errors. Use `tauri::test` utilities.

Coverage targets:
- Each command returns correctly typed data
- Error cases return meaningful error strings
- File operations create/read expected paths
- Cross-domain mutations (e.g. `mark_acquired`) update all affected tables

### E2E tests (lower priority, higher effort)

A small set of Playwright or WebDriver tests covering critical user flows. Not comprehensive UI testing, just smoke tests for flows that cross multiple zones and touch the backend.

Coverage targets:
- Create project → upload PDF → crop step → complete step → verify build log entry
- Add kit from Scalemates URL → mark acquired → link to project
- Full step completion cycle with photo capture

---

## File System Error Recovery

The app stores images, PDFs, and exports on disk with paths referenced in the database. Files can go missing due to manual deletion, cloud sync conflicts, or storage location changes.

### Missing file handling

When the app attempts to load a file referenced in the database:
- **Step instruction images**: Show a placeholder with warning badge ("Image not found") and a "Re-crop from source" action if the source page PNG still exists.
- **Source page PNGs**: Show warning on the instruction source in Setup mode. Offer "Re-import PDF" if the original PDF path is still valid.
- **Progress/milestone/gallery photos**: Show a broken-image placeholder. Photo remains in the database (preserving build log continuity) but displays the placeholder until resolved.
- **Box art / cover images**: Fall back to the gradient placeholder used for kits without box art.
- **Mask files**: Treat as "no mask" (show uncleaned step image). Log a warning.

### Storage location changes

When the user changes the project storage location in Settings, the app offers to move existing project folders. If files fail to move (permissions, disk full), the operation is rolled back and an error dialog explains which files couldn't be transferred.

### File health check

A "Check file integrity" utility accessible from Settings → Data & Storage. Scans all database file references and reports:
- Missing files (with path and entity type)
- Orphaned files (files on disk not referenced by the database)
- Size: total storage used, broken down by photos, instructions, exports

Results displayed in a simple report dialog. Missing files offer per-item "Locate" (manual re-link) or batch "Clean up references" (remove DB entries pointing to missing files, with confirmation).

---

## Large Project Considerations

Complex builds (e.g. 1/350 warship with full PE sets) can generate 150–250+ steps across 8–10 tracks. The app should handle this without performance degradation.

### Target scale

- Up to 300 steps per project
- Up to 12 tracks per project
- Up to 500 paints on the global shelf
- Up to 50 progress photos per project

### Components requiring attention at scale

- **Assembly Map**: At 200+ steps with 22px node spacing, the map is ~4400px wide. Horizontal scrolling and fit-to-screen zoom are specified. Current implementation uses SVG (performant for expected scale). Phase 5 adds zoom controls (CSS transform scale 0.5x–2x) and fit-to-screen button.
- **Step rail (Build zone)**: 200+ steps in a single track would overflow the rail. The multi-track expansion pattern (multiple tracks expandable, Cmd+click for exclusive mode) mitigates this. Within expanded tracks, the step list should use virtualized scrolling if it exceeds ~50 items.
- **Materials card**: A project with 30+ accessories and 50+ paints needs efficient list rendering. Consider virtualizing the BOM list in expanded view.
- **Build Log**: Months of daily entries. Day-group collapsing (default: today + 2 days expanded) handles this. Older entries load on scroll.
- **Overview card grid**: No scaling concern (always 4 cards).
