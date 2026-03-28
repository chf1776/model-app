-- Sprue reference library (project-level sprue diagram crops)
CREATE TABLE IF NOT EXISTS sprue_refs (
    id              TEXT PRIMARY KEY,
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_page_id  TEXT REFERENCES instruction_pages(id) ON DELETE SET NULL,
    crop_x          REAL,
    crop_y          REAL,
    crop_w          REAL,
    crop_h          REAL,
    polygon_points  TEXT,
    label           TEXT NOT NULL,
    color           TEXT NOT NULL,
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sprue_refs_project ON sprue_refs(project_id);

-- Step-to-sprue-part junction
CREATE TABLE IF NOT EXISTS step_sprue_parts (
    id           TEXT PRIMARY KEY,
    step_id      TEXT NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
    sprue_label  TEXT NOT NULL,
    part_number  TEXT,
    ai_detected  INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_step_sprue_parts_step ON step_sprue_parts(step_id);
CREATE INDEX IF NOT EXISTS idx_step_sprue_parts_sprue ON step_sprue_parts(sprue_label);
CREATE UNIQUE INDEX IF NOT EXISTS idx_step_sprue_parts_unique
    ON step_sprue_parts(step_id, sprue_label, COALESCE(part_number, ''));

-- Flag to prevent redundant LLM detection calls
ALTER TABLE steps ADD COLUMN sprues_detected INTEGER NOT NULL DEFAULT 0;
