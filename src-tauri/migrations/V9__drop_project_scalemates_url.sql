-- Copy project scalemates_url to kit if kit currently lacks one
UPDATE kits SET scalemates_url = (
    SELECT p.scalemates_url FROM projects p
    WHERE p.kit_id = kits.id
      AND p.scalemates_url IS NOT NULL
      AND p.scalemates_url != ''
)
WHERE scalemates_url IS NULL
  AND EXISTS (
    SELECT 1 FROM projects p
    WHERE p.kit_id = kits.id
      AND p.scalemates_url IS NOT NULL
      AND p.scalemates_url != ''
  );

ALTER TABLE projects DROP COLUMN scalemates_url;
