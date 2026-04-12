ALTER TABLE project_ui_state ADD COLUMN build_view TEXT;

UPDATE project_ui_state
SET build_view = CASE
  WHEN build_mode = 'building' AND nav_mode = 'page' THEN '{"kind":"building-page"}'
  WHEN build_mode = 'building' THEN '{"kind":"building-track","annotationMode":null}'
  ELSE '{"kind":"setup-tracks","canvasMode":"view"}'
END;
