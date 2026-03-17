ALTER TABLE kits ADD COLUMN scalemates_id TEXT;

ALTER TABLE kit_files ADD COLUMN source_kit_name TEXT;
ALTER TABLE kit_files ADD COLUMN source_kit_year TEXT;

ALTER TABLE instruction_sources ADD COLUMN source_kit_name TEXT;
ALTER TABLE instruction_sources ADD COLUMN source_kit_year TEXT;
