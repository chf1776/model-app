-- ── Settings ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

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
  scale            TEXT,
  kit_number       TEXT,
  box_art_path     TEXT,
  status           TEXT NOT NULL DEFAULT 'shelf'
                   CHECK(status IN ('wishlist','shelf','building','paused','completed')),
  category         TEXT
                   CHECK(category IN ('ship','aircraft','armor','vehicle','figure','sci_fi','other')),
  scalemates_url   TEXT,
  retailer_url     TEXT,
  price            REAL,
  currency         TEXT DEFAULT 'USD',
  price_updated_at INTEGER,
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
  brand          TEXT,
  reference_code TEXT,
  parent_kit_id  TEXT REFERENCES kits(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'shelf'
                 CHECK(status IN ('wishlist','shelf')),
  price          REAL,
  currency       TEXT DEFAULT 'USD',
  buy_url        TEXT,
  price_updated_at INTEGER,
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
  color          TEXT,
  color_family   TEXT,
  status         TEXT NOT NULL DEFAULT 'owned'
                 CHECK(status IN ('owned','wishlist')),
  price          REAL,
  currency       TEXT DEFAULT 'USD',
  buy_url        TEXT,
  price_updated_at INTEGER,
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

CREATE TABLE IF NOT EXISTS project_ui_state (
  project_id     TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  active_step_id TEXT,
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
  name              TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  page_count        INTEGER NOT NULL DEFAULT 0,
  display_order     INTEGER NOT NULL DEFAULT 0,
  created_at        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS instruction_pages (
  id          TEXT PRIMARY KEY,
  source_id   TEXT NOT NULL REFERENCES instruction_sources(id) ON DELETE CASCADE,
  page_index  INTEGER NOT NULL,
  file_path   TEXT NOT NULL,
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
  is_standalone       INTEGER NOT NULL DEFAULT 0,
  join_point_step_id  TEXT,
  join_point_notes    TEXT,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS steps (
  id               TEXT PRIMARY KEY,
  track_id         TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  parent_step_id   TEXT REFERENCES steps(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  display_order    INTEGER NOT NULL DEFAULT 0,
  source_page_id   TEXT REFERENCES instruction_pages(id) ON DELETE SET NULL,
  crop_x           REAL,
  crop_y           REAL,
  crop_w           REAL,
  crop_h           REAL,
  is_full_page     INTEGER NOT NULL DEFAULT 0,
  source_type      TEXT NOT NULL DEFAULT 'base_kit'
                   CHECK(source_type IN
                     ('base_kit','photo_etch','resin_3d','aftermarket','custom_scratch')),
  source_name      TEXT,
  adhesive_type    TEXT
                   CHECK(adhesive_type IN
                     ('none','liquid_cement','tube_cement','ca_thin',
                      'ca_medium_thick','epoxy','pva','custom')),
  drying_time_min  INTEGER,
  pre_paint        INTEGER NOT NULL DEFAULT 0,
  quantity         INTEGER,
  is_completed     INTEGER NOT NULL DEFAULT 0,
  completed_at     INTEGER,
  quantity_current INTEGER NOT NULL DEFAULT 0,
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
  purpose       TEXT,
  is_formula    INTEGER NOT NULL DEFAULT 0,
  paint_id      TEXT REFERENCES paints(id) ON DELETE SET NULL,
  mixing_notes  TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS palette_components (
  id               TEXT PRIMARY KEY,
  palette_entry_id TEXT NOT NULL REFERENCES palette_entries(id) ON DELETE CASCADE,
  paint_id         TEXT NOT NULL REFERENCES paints(id) ON DELETE CASCADE,
  ratio_parts      INTEGER,
  percentage       REAL,
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
  file_path     TEXT NOT NULL,
  caption       TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS annotations (
  step_id    TEXT PRIMARY KEY REFERENCES steps(id) ON DELETE CASCADE,
  data       TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS masks (
  step_id    TEXT PRIMARY KEY REFERENCES steps(id) ON DELETE CASCADE,
  file_path  TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS progress_photos (
  id          TEXT PRIMARY KEY,
  step_id     TEXT NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,
  captured_at INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS milestone_photos (
  id          TEXT PRIMARY KEY,
  track_id    TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,
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
  body         TEXT,
  photo_path   TEXT,
  caption      TEXT,
  step_id      TEXT REFERENCES steps(id) ON DELETE SET NULL,
  track_id     TEXT REFERENCES tracks(id) ON DELETE SET NULL,
  step_number  INTEGER,
  is_track_completion INTEGER NOT NULL DEFAULT 0,
  track_step_count   INTEGER,
  created_at   INTEGER NOT NULL
);

-- ── Gallery ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery_photos (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path       TEXT NOT NULL,
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
  file_path    TEXT NOT NULL,
  file_type    TEXT NOT NULL
               CHECK(file_type IN ('pdf','image')),
  label        TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL
);

-- ── Drying timers ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drying_timers (
  id           TEXT PRIMARY KEY,
  step_id      TEXT REFERENCES steps(id) ON DELETE SET NULL,
  label        TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  started_at   INTEGER NOT NULL
);

-- ── Export history ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS export_history (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  format       TEXT NOT NULL
               CHECK(format IN ('html','pdf','zip')),
  file_path    TEXT NOT NULL,
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

-- ── Default settings ─────────────────────────────────────────────────────────
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('theme', 'light');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('active_project_id', '');
