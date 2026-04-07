CREATE TABLE page_sprue_parts (
  id            TEXT PRIMARY KEY,
  page_id       TEXT NOT NULL REFERENCES instruction_pages(id) ON DELETE CASCADE,
  sprue_label   TEXT NOT NULL,
  part_number   TEXT,
  ai_detected   BOOLEAN NOT NULL DEFAULT 0,
  ticked_count  INTEGER NOT NULL DEFAULT 0,
  quantity      INTEGER NOT NULL DEFAULT 1,
  created_at    INTEGER NOT NULL,
  UNIQUE(page_id, sprue_label, part_number)
);
