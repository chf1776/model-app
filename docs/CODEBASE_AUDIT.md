# Model Builder's Assistant — Complete Technical Audit

**Version:** 0.5.1
**Generated:** 2026-03-16
**Stack:** Tauri v2 (Rust backend) + React 19 + Zustand + Tailwind v4 + shadcn/ui

---

## 1. FULL FILE TREE

```
./.claude/commands/audit.md
./.claude/settings.local.json
./components.json
./docs/CHANGELOG.md
./docs/EXPORT_FEATURE.md
./docs/PROJECT_PROPOSAL.md
./docs/ROADMAP.md
./docs/SCALE_MODELLING_REFERENCE.md
./docs/TECH_SPEC.md
./docs/UI_DESIGN.md
./docs/WISHLIST_FEATURE.md
./index.html
./package.json
./package-lock.json
./src-tauri/build.rs
./src-tauri/capabilities/default.json
./src-tauri/Cargo.lock
./src-tauri/Cargo.toml
./src-tauri/gen/schemas/acl-manifests.json
./src-tauri/gen/schemas/capabilities.json
./src-tauri/gen/schemas/desktop-schema.json
./src-tauri/gen/schemas/macOS-schema.json
./src-tauri/migrations/V1__initial.sql
./src-tauri/migrations/V2__instruction_source_file_path.sql
./src-tauri/migrations/V3__accessory_image_path.sql
./src-tauri/migrations/V4__page_rotation.sql
./src-tauri/migrations/V5__active_track_id.sql
./src-tauri/migrations/V6__photo_starring.sql
./src-tauri/migrations/V7__replaces_step_index.sql
./src-tauri/src/commands/accessories.rs
./src-tauri/src/commands/annotations.rs
./src-tauri/src/commands/build_log.rs
./src-tauri/src/commands/collection.rs
./src-tauri/src/commands/drying_timers.rs
./src-tauri/src/commands/gallery_photos.rs
./src-tauri/src/commands/instructions.rs
./src-tauri/src/commands/media.rs
./src-tauri/src/commands/milestone_photos.rs
./src-tauri/src/commands/mod.rs
./src-tauri/src/commands/paints.rs
./src-tauri/src/commands/palette_entries.rs
./src-tauri/src/commands/progress_photos.rs
./src-tauri/src/commands/projects.rs
./src-tauri/src/commands/reference_images.rs
./src-tauri/src/commands/settings.rs
./src-tauri/src/commands/step_paint_refs.rs
./src-tauri/src/commands/step_relations.rs
./src-tauri/src/commands/steps.rs
./src-tauri/src/commands/tags.rs
./src-tauri/src/commands/tracks.rs
./src-tauri/src/db/mod.rs
./src-tauri/src/db/queries/accessories.rs
./src-tauri/src/db/queries/annotations.rs
./src-tauri/src/db/queries/build_log_entries.rs
./src-tauri/src/db/queries/drying_timers.rs
./src-tauri/src/db/queries/gallery_photos.rs
./src-tauri/src/db/queries/instruction_pages.rs
./src-tauri/src/db/queries/instruction_sources.rs
./src-tauri/src/db/queries/kit_files.rs
./src-tauri/src/db/queries/kits.rs
./src-tauri/src/db/queries/milestone_photos.rs
./src-tauri/src/db/queries/mod.rs
./src-tauri/src/db/queries/paints.rs
./src-tauri/src/db/queries/palette_entries.rs
./src-tauri/src/db/queries/progress_photos.rs
./src-tauri/src/db/queries/project_ui_state.rs
./src-tauri/src/db/queries/projects.rs
./src-tauri/src/db/queries/reference_images.rs
./src-tauri/src/db/queries/settings.rs
./src-tauri/src/db/queries/step_paint_refs.rs
./src-tauri/src/db/queries/step_relations.rs
./src-tauri/src/db/queries/steps.rs
./src-tauri/src/db/queries/tags.rs
./src-tauri/src/db/queries/tracks.rs
./src-tauri/src/lib.rs
./src-tauri/src/main.rs
./src-tauri/src/models.rs
./src-tauri/src/services/file_stash.rs
./src-tauri/src/services/mod.rs
./src-tauri/src/services/pdf.rs
./src-tauri/src/util.rs
./src-tauri/tauri.conf.json
./src/api/index.ts
./src/App.tsx
./src/components/build/annotation-draw.ts
./src/components/build/AnnotationLayer.tsx
./src/components/build/AnnotationToolbar.tsx
./src/components/build/BuildingRail.tsx
./src/components/build/BuildingStepPanel.tsx
./src/components/build/BuildToolbar.tsx
./src/components/build/CompletionWarningDialog.tsx
./src/components/build/CropCanvas.tsx
./src/components/build/CropLayer.tsx
./src/components/build/CropPreview.tsx
./src/components/build/CropRegion.tsx
./src/components/build/dnd-constants.ts
./src/components/build/DropIndicatorLine.tsx
./src/components/build/EmptyInstructionsState.tsx
./src/components/build/InstructionCanvas.tsx
./src/components/build/KeyboardShortcutsDialog.tsx
./src/components/build/MilestoneDialog.tsx
./src/components/build/NavigationBar.tsx
./src/components/build/PageCanvas.tsx
./src/components/build/PageNavigator.tsx
./src/components/build/PageRail.tsx
./src/components/build/PaintRefChips.tsx
./src/components/build/ProcessingOverlay.tsx
./src/components/build/RelationPill.tsx
./src/components/build/SourceManagerPanel.tsx
./src/components/build/SourceSelector.tsx
./src/components/build/StepCompletionMarker.tsx
./src/components/build/StepEditorPanel.tsx
./src/components/build/StepItem.tsx
./src/components/build/StepThumbnail.tsx
./src/components/build/TimerBubble.tsx
./src/components/build/TrackDialogs.tsx
./src/components/build/TrackItem.tsx
./src/components/build/TrackRail.tsx
./src/components/build/tree-utils.ts
./src/components/build/useUploadPdf.ts
./src/components/build/zoom-utils.ts
./src/components/collection/AccessoriesTab.tsx
./src/components/collection/AccessoryRow.tsx
./src/components/collection/AccessoryToolbar.tsx
./src/components/collection/EntitySwitcher.tsx
./src/components/collection/KitCard.tsx
./src/components/collection/KitsTab.tsx
./src/components/collection/KitToolbar.tsx
./src/components/collection/PaintDetailPanel.tsx
./src/components/collection/PaintGroupSection.tsx
./src/components/collection/PaintRow.tsx
./src/components/collection/PaintsTab.tsx
./src/components/collection/PaintsToolbar.tsx
./src/components/collection/PaintSwatchCard.tsx
./src/components/collection/WelcomeCard.tsx
./src/components/overview/AssemblyMap.tsx
./src/components/overview/BuildLogCard.tsx
./src/components/overview/GalleryCard.tsx
./src/components/overview/MaterialsCard.tsx
./src/components/overview/OverviewCard.tsx
./src/components/overview/PaletteSection.tsx
./src/components/overview/ProjectInfoCard.tsx
./src/components/shared/AddAccessoryDialog.tsx
./src/components/shared/AddKitDialog.tsx
./src/components/shared/AddPaintDialog.tsx
./src/components/shared/AppShell.tsx
./src/components/shared/CreateProjectDialog.tsx
./src/components/shared/EditAccessoryDialog.tsx
./src/components/shared/EditKitDialog.tsx
./src/components/shared/EditPaintDialog.tsx
./src/components/shared/FilterPills.tsx
./src/components/shared/ImageLightbox.tsx
./src/components/shared/SegmentedPill.tsx
./src/components/ui/alert-dialog.tsx
./src/components/ui/badge.tsx
./src/components/ui/button.tsx
./src/components/ui/card.tsx
./src/components/ui/collapsible.tsx
./src/components/ui/dialog.tsx
./src/components/ui/dropdown-menu.tsx
./src/components/ui/input.tsx
./src/components/ui/label.tsx
./src/components/ui/popover.tsx
./src/components/ui/scroll-area.tsx
./src/components/ui/select.tsx
./src/components/ui/separator.tsx
./src/components/ui/skeleton.tsx
./src/components/ui/sonner.tsx
./src/components/ui/switch.tsx
./src/components/ui/textarea.tsx
./src/components/ui/tooltip.tsx
./src/data/paint-catalogue.ts
./src/hooks/useCropDrawing.ts
./src/hooks/useNavigateToStep.ts
./src/hooks/useTheme.ts
./src/hooks/useTimerTick.ts
./src/index.css
./src/lib/color-family.ts
./src/lib/utils.ts
./src/main.tsx
./src/routes/build.tsx
./src/routes/collection.tsx
./src/routes/overview.tsx
./src/routes/settings.tsx
./src/shared/format.ts
./src/shared/theme-engine.ts
./src/shared/themes.ts
./src/shared/types.ts
./src/store/build-slice.ts
./src/store/collection-slice.ts
./src/store/index.ts
./src/store/overview-slice.ts
./src/store/settings-slice.ts
./src/store/timer-slice.ts
./src/store/ui-slice.ts
./src/vite-env.d.ts
./tsconfig.json
./vite.config.ts
```

---

## 2. DATA MODEL — Complete SQLite Schema

### Migrations Applied: V1 through V7

---

### Table: `app_settings`
| Column | Type | Constraints |
|--------|------|-------------|
| key | TEXT | PRIMARY KEY |
| value | TEXT | NOT NULL |

Default rows: `('theme', 'light')`, `('active_project_id', '')`

---

### Table: `tags`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| name | TEXT | NOT NULL UNIQUE |
| created_at | INTEGER | NOT NULL |

---

### Table: `kits`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| name | TEXT | NOT NULL |
| manufacturer | TEXT | nullable |
| scale | TEXT | nullable |
| kit_number | TEXT | nullable |
| box_art_path | TEXT | nullable |
| status | TEXT | NOT NULL DEFAULT 'shelf', CHECK IN ('wishlist','shelf','building','paused','completed') |
| category | TEXT | nullable, CHECK IN ('ship','aircraft','armor','vehicle','figure','sci_fi','other') |
| scalemates_url | TEXT | nullable |
| retailer_url | TEXT | nullable |
| price | REAL | nullable |
| currency | TEXT | DEFAULT 'USD' |
| price_updated_at | INTEGER | nullable |
| notes | TEXT | nullable |
| created_at | INTEGER | NOT NULL |
| updated_at | INTEGER | NOT NULL |

Trigger: `trg_kits_updated_at` auto-updates `updated_at` on UPDATE.

---

### Table: `accessories`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| name | TEXT | NOT NULL |
| type | TEXT | NOT NULL, CHECK IN ('pe','resin_3d','decal','other') |
| manufacturer | TEXT | nullable |
| brand | TEXT | nullable |
| reference_code | TEXT | nullable |
| parent_kit_id | TEXT | FK → kits(id) ON DELETE SET NULL |
| status | TEXT | NOT NULL DEFAULT 'shelf', CHECK IN ('wishlist','shelf') |
| price | REAL | nullable |
| currency | TEXT | DEFAULT 'USD' |
| buy_url | TEXT | nullable |
| price_updated_at | INTEGER | nullable |
| notes | TEXT | nullable |
| image_path | TEXT | nullable (V3 migration) |
| created_at | INTEGER | NOT NULL |
| updated_at | INTEGER | NOT NULL |

Trigger: `trg_accessories_updated_at`

---

### Table: `paints`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| brand | TEXT | NOT NULL |
| name | TEXT | NOT NULL |
| reference_code | TEXT | nullable |
| paint_type | TEXT | NOT NULL, CHECK IN ('acrylic','enamel','lacquer','oil') |
| finish | TEXT | nullable, CHECK IN ('flat','semi_gloss','gloss','metallic','clear','satin') |
| color | TEXT | nullable (hex string) |
| color_family | TEXT | nullable |
| status | TEXT | NOT NULL DEFAULT 'owned', CHECK IN ('owned','wishlist') |
| price | REAL | nullable |
| currency | TEXT | DEFAULT 'USD' |
| buy_url | TEXT | nullable |
| price_updated_at | INTEGER | nullable |
| notes | TEXT | nullable |
| created_at | INTEGER | NOT NULL |
| updated_at | INTEGER | NOT NULL |

Trigger: `trg_paints_updated_at`

---

### Table: `projects`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| name | TEXT | NOT NULL |
| kit_id | TEXT | FK → kits(id) ON DELETE SET NULL |
| status | TEXT | NOT NULL DEFAULT 'active', CHECK IN ('active','paused','completed','archived') |
| category | TEXT | nullable, CHECK IN ('ship','aircraft','armor','vehicle','figure','sci_fi','other') |
| scalemates_url | TEXT | nullable |
| product_code | TEXT | nullable |
| markings_scheme | TEXT | nullable |
| markings_scheme_image_path | TEXT | nullable |
| hero_photo_path | TEXT | nullable |
| start_date | INTEGER | nullable |
| completion_date | INTEGER | nullable |
| notes | TEXT | nullable |
| created_at | INTEGER | NOT NULL |
| updated_at | INTEGER | NOT NULL |

Trigger: `trg_projects_updated_at`

---

### Table: `project_accessories`
| Column | Type | Constraints |
|--------|------|-------------|
| project_id | TEXT | NOT NULL, FK → projects(id) ON DELETE CASCADE |
| accessory_id | TEXT | NOT NULL, FK → accessories(id) ON DELETE CASCADE |
| PRIMARY KEY | | (project_id, accessory_id) |

---

### Table: `project_ui_state`
| Column | Type | Constraints |
|--------|------|-------------|
| project_id | TEXT | PRIMARY KEY, FK → projects(id) ON DELETE CASCADE |
| active_step_id | TEXT | nullable |
| active_track_id | TEXT | nullable (V5 migration) |
| build_mode | TEXT | NOT NULL DEFAULT 'building', CHECK IN ('setup','building') |
| nav_mode | TEXT | NOT NULL DEFAULT 'track', CHECK IN ('track','page') |
| image_zoom | REAL | NOT NULL DEFAULT 1.0 |
| image_pan_x | REAL | NOT NULL DEFAULT 0.0 |
| image_pan_y | REAL | NOT NULL DEFAULT 0.0 |
| updated_at | INTEGER | NOT NULL |

---

### Table: `instruction_sources`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| project_id | TEXT | NOT NULL, FK → projects(id) ON DELETE CASCADE |
| name | TEXT | NOT NULL |
| original_filename | TEXT | NOT NULL |
| file_path | TEXT | NOT NULL DEFAULT '' (V2 migration) |
| page_count | INTEGER | NOT NULL DEFAULT 0 |
| display_order | INTEGER | NOT NULL DEFAULT 0 |
| created_at | INTEGER | NOT NULL |

---

### Table: `instruction_pages`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| source_id | TEXT | NOT NULL, FK → instruction_sources(id) ON DELETE CASCADE |
| page_index | INTEGER | NOT NULL |
| file_path | TEXT | NOT NULL |
| width | INTEGER | NOT NULL |
| height | INTEGER | NOT NULL |
| rotation | INTEGER | NOT NULL DEFAULT 0 (V4 migration) |
| UNIQUE | | (source_id, page_index) |

---

### Table: `tracks`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| project_id | TEXT | NOT NULL, FK → projects(id) ON DELETE CASCADE |
| name | TEXT | NOT NULL |
| color | TEXT | NOT NULL DEFAULT '#6b7280' |
| display_order | INTEGER | NOT NULL DEFAULT 0 |
| is_standalone | INTEGER | NOT NULL DEFAULT 0 |
| join_point_step_id | TEXT | nullable |
| join_point_notes | TEXT | nullable |
| created_at | INTEGER | NOT NULL |
| updated_at | INTEGER | NOT NULL |

Trigger: `trg_tracks_updated_at`
Note: `step_count` and `completed_count` are computed via subquery at read time, not stored.

---

### Table: `steps`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| track_id | TEXT | NOT NULL, FK → tracks(id) ON DELETE CASCADE |
| parent_step_id | TEXT | nullable, FK → steps(id) ON DELETE CASCADE |
| title | TEXT | NOT NULL |
| display_order | INTEGER | NOT NULL DEFAULT 0 |
| source_page_id | TEXT | nullable, FK → instruction_pages(id) ON DELETE SET NULL |
| crop_x | REAL | nullable |
| crop_y | REAL | nullable |
| crop_w | REAL | nullable |
| crop_h | REAL | nullable |
| is_full_page | INTEGER | NOT NULL DEFAULT 0 |
| source_type | TEXT | NOT NULL DEFAULT 'base_kit', CHECK IN ('base_kit','photo_etch','resin_3d','aftermarket','custom_scratch') |
| source_name | TEXT | nullable |
| adhesive_type | TEXT | nullable, CHECK IN ('none','liquid_cement','tube_cement','ca_thin','ca_medium_thick','epoxy','pva','custom') |
| drying_time_min | INTEGER | nullable |
| pre_paint | INTEGER | NOT NULL DEFAULT 0 |
| quantity | INTEGER | nullable |
| is_completed | INTEGER | NOT NULL DEFAULT 0 |
| completed_at | INTEGER | nullable |
| quantity_current | INTEGER | NOT NULL DEFAULT 0 |
| replaces_step_id | TEXT | nullable, FK → steps(id) ON DELETE SET NULL |
| notes | TEXT | nullable |
| created_at | INTEGER | NOT NULL |
| updated_at | INTEGER | NOT NULL |

Trigger: `trg_steps_updated_at`
Index: `idx_steps_track ON steps(track_id, display_order)`, `idx_steps_parent ON steps(parent_step_id)`, `idx_steps_replaces ON steps(replaces_step_id)` (V7)

---

### Table: `step_tags`
| Column | Type | Constraints |
|--------|------|-------------|
| step_id | TEXT | NOT NULL, FK → steps(id) ON DELETE CASCADE |
| tag_id | TEXT | NOT NULL, FK → tags(id) ON DELETE CASCADE |
| PRIMARY KEY | | (step_id, tag_id) |

---

### Table: `step_relations`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| from_step_id | TEXT | NOT NULL, FK → steps(id) ON DELETE CASCADE |
| to_step_id | TEXT | NOT NULL, FK → steps(id) ON DELETE CASCADE |
| relation_type | TEXT | NOT NULL, CHECK IN ('blocked_by','blocks_access_to') |
| UNIQUE | | (from_step_id, to_step_id, relation_type) |

Note: "replaces" is handled via `steps.replaces_step_id`, NOT via step_relations.

---

### Table: `palette_entries`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| project_id | TEXT | NOT NULL, FK → projects(id) ON DELETE CASCADE |
| name | TEXT | NOT NULL |
| purpose | TEXT | nullable |
| is_formula | INTEGER | NOT NULL DEFAULT 0 |
| paint_id | TEXT | nullable, FK → paints(id) ON DELETE SET NULL |
| mixing_notes | TEXT | nullable |
| display_order | INTEGER | NOT NULL DEFAULT 0 |
| created_at | INTEGER | NOT NULL |
| updated_at | INTEGER | NOT NULL |

Trigger: `trg_palette_entries_updated_at`
Index: `idx_palette_proj ON palette_entries(project_id)`

---

### Table: `palette_components`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| palette_entry_id | TEXT | NOT NULL, FK → palette_entries(id) ON DELETE CASCADE |
| paint_id | TEXT | NOT NULL, FK → paints(id) ON DELETE CASCADE |
| ratio_parts | INTEGER | nullable |
| percentage | REAL | nullable |
| display_order | INTEGER | NOT NULL DEFAULT 0 |

---

### Table: `step_paint_refs`
| Column | Type | Constraints |
|--------|------|-------------|
| step_id | TEXT | NOT NULL, FK → steps(id) ON DELETE CASCADE |
| palette_entry_id | TEXT | NOT NULL, FK → palette_entries(id) ON DELETE CASCADE |
| PRIMARY KEY | | (step_id, palette_entry_id) |

---

### Table: `reference_images`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| step_id | TEXT | NOT NULL, FK → steps(id) ON DELETE CASCADE |
| file_path | TEXT | NOT NULL |
| caption | TEXT | nullable |
| display_order | INTEGER | NOT NULL DEFAULT 0 |
| created_at | INTEGER | NOT NULL |

---

### Table: `annotations`
| Column | Type | Constraints |
|--------|------|-------------|
| step_id | TEXT | PRIMARY KEY, FK → steps(id) ON DELETE CASCADE |
| data | TEXT | NOT NULL DEFAULT '[]' (JSON array of annotation objects) |
| updated_at | INTEGER | NOT NULL |
| created_at | INTEGER | NOT NULL |

---

### Table: `masks`
| Column | Type | Constraints |
|--------|------|-------------|
| step_id | TEXT | PRIMARY KEY, FK → steps(id) ON DELETE CASCADE |
| file_path | TEXT | NOT NULL |
| updated_at | INTEGER | NOT NULL |

**STATUS: Schema only. No queries, commands, or UI reference this table.**

---

### Table: `progress_photos`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| step_id | TEXT | NOT NULL, FK → steps(id) ON DELETE CASCADE |
| file_path | TEXT | NOT NULL |
| captured_at | INTEGER | NOT NULL |
| created_at | INTEGER | NOT NULL |
| is_starred | INTEGER | NOT NULL DEFAULT 0 (V6 migration) |

Index: `idx_photos_step ON progress_photos(step_id)`

---

### Table: `milestone_photos`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| track_id | TEXT | NOT NULL, FK → tracks(id) ON DELETE CASCADE |
| file_path | TEXT | NOT NULL |
| captured_at | INTEGER | NOT NULL |
| created_at | INTEGER | NOT NULL |
| is_starred | INTEGER | NOT NULL DEFAULT 0 (V6 migration) |

---

### Table: `build_log_entries`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| project_id | TEXT | NOT NULL, FK → projects(id) ON DELETE CASCADE |
| entry_type | TEXT | NOT NULL, CHECK IN ('step_complete','note','photo','milestone','build_complete') |
| body | TEXT | nullable |
| photo_path | TEXT | nullable |
| caption | TEXT | nullable |
| step_id | TEXT | nullable, FK → steps(id) ON DELETE SET NULL |
| track_id | TEXT | nullable, FK → tracks(id) ON DELETE SET NULL |
| step_number | INTEGER | nullable |
| is_track_completion | INTEGER | NOT NULL DEFAULT 0 |
| track_step_count | INTEGER | nullable |
| created_at | INTEGER | NOT NULL |

Index: `idx_log_project ON build_log_entries(project_id, created_at)`

---

### Table: `gallery_photos`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| project_id | TEXT | NOT NULL, FK → projects(id) ON DELETE CASCADE |
| file_path | TEXT | NOT NULL |
| caption | TEXT | nullable |
| source | TEXT | NOT NULL DEFAULT 'gallery', CHECK IN ('gallery','log') |
| log_entry_id | TEXT | nullable, FK → build_log_entries(id) ON DELETE SET NULL |
| is_milestone | INTEGER | NOT NULL DEFAULT 0 |
| track_id | TEXT | nullable, FK → tracks(id) ON DELETE SET NULL |
| is_starred | INTEGER | NOT NULL DEFAULT 0 (V6 migration) |
| created_at | INTEGER | NOT NULL |

Index: `idx_gallery_project ON gallery_photos(project_id, created_at)`

---

### Table: `kit_files`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| kit_id | TEXT | NOT NULL, FK → kits(id) ON DELETE CASCADE |
| file_path | TEXT | NOT NULL |
| file_type | TEXT | NOT NULL, CHECK IN ('pdf','image') |
| label | TEXT | nullable |
| display_order | INTEGER | NOT NULL DEFAULT 0 |
| created_at | INTEGER | NOT NULL |

Index: `idx_kit_files ON kit_files(kit_id)`

---

### Table: `drying_timers`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| step_id | TEXT | nullable, FK → steps(id) ON DELETE SET NULL |
| label | TEXT | NOT NULL |
| duration_min | INTEGER | NOT NULL |
| started_at | INTEGER | NOT NULL |

---

### Table: `export_history`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| project_id | TEXT | NOT NULL, FK → projects(id) ON DELETE CASCADE |
| format | TEXT | NOT NULL, CHECK IN ('html','pdf','zip') |
| file_path | TEXT | NOT NULL |
| created_at | INTEGER | NOT NULL |

Index: `idx_export_project ON export_history(project_id, created_at)`

**STATUS: Schema only. No queries, commands, or UI reference this table.**

---

## 3. CURRENT FEATURES — Route-by-Route

### Collection Zone (`/collection`)

**EntitySwitcher** — Three-tab switcher showing counts: Kits (N), Accessories (N), Paints (N).

**Kits Tab:**
- KitCard renders expandable cards with: name, status badge (building/shelf/wishlist/completed), manufacturer, scale, kit number, price (if wishlist), box art thumbnail (click for lightbox)
- Expand card to see: nested accessories list (with status toggle owned/wishlist), attached kit files (click to open via Tauri opener, can attach new files via file picker)
- Actions: Edit kit (opens EditKitDialog), Add accessory (opens AddAccessoryDialog preselected), Start Project (opens CreateProjectDialog preselected)
- KitToolbar: status filter pills (all/building/shelf/wishlist/done with counts), group-by toggle (status/category/manufacturer), search input
- Grouped by sections with expand/collapse

**Accessories Tab:**
- AccessoryRow renders: name, type badge (PE/Resin/Decal/Other with color coding), brand, parent kit reference, image thumbnail, price
- Expand to see: all fields, status toggle, edit button, buy URL link
- AccessoryToolbar: status filter (all/owned/wishlist), type filter (all/PE/Resin/Decal/Other), group-by (type/parent kit), search
- Grouped sections with expand/collapse

**Paints Tab:**
- Dual view modes: list (PaintRow) and grid (PaintSwatchCard)
- PaintRow: color swatch, name, brand, reference code, type, finish, price, project tags (up to 2 shown), status toggle
- PaintSwatchCard: square swatch with name overlay, reference code, project count badge, wishlist indicator
- PaintDetailPanel: slides in on right when paint selected — shows all paint fields, editable notes (blur-save), project tag display, edit/status toggle
- PaintsToolbar: group-by (color family/brand/project), expand/collapse all, search, view toggle (list/grid)
- Groups: collapsible sections with mini swatches when collapsed

**Shared Dialogs:**
- AddKitDialog: status toggle (shelf/wishlist), name (required), manufacturer, scale pills, kit number, category pills, box art picker, conditional wishlist fields (price, currency, retailer URL)
- EditKitDialog: all kit fields editable, file attachment, file list with open/delete, delete kit with confirmation
- AddAccessoryDialog: status toggle, name (required), type pills, image picker, manufacturer, brand, reference code, parent kit dropdown (searchable), conditional wishlist fields
- EditAccessoryDialog: all fields editable, image picker, parent kit search, delete with confirmation
- AddPaintDialog: two modes — Catalogue (search ~4000 paints from Tamiya/Vallejo/etc, brand filter pills) or Manual (brand, name, type pills, reference code, finish pills, color hex with preview), conditional wishlist fields
- EditPaintDialog: all fields editable, color family override, project selection pills (multi-select), notes, delete with confirmation
- CreateProjectDialog: project name (required), kit selection (From Shelf dropdown or Add New Kit inline), optional fields (category, scalemates URL, product code), navigates to build zone on success

---

### Build Zone (`/build`)

**Two Modes: Setup and Building**

**Setup Mode:**
- Three-panel layout: TrackRail (left) | InstructionCanvas (center) | StepEditorPanel (right, when step active)
- TrackRail: expandable track list with drag-drop reorder for steps (dnd-kit), step multi-select (Shift/Ctrl), cross-track drag, nesting (horizontal offset during drag), track CRUD (add/rename/change color/delete/set join point), step CRUD
- InstructionCanvas: Konva canvas showing full PDF page with crop rectangles colored by track, crop mode (draw rectangle to create step), view mode (pan/zoom), fit-to-view, page rotation, crop region resize/reposition with transformer handles
- StepEditorPanel: title input, quantity, track dropdown, adhesive dropdown, pre-paint toggle, tags popover (from settings.step_tags), paint ref chips (from project palette), relations editor (4 types with searchable popovers grouped by track), replaces selector, reference images grid with lightbox, source type dropdown, notes, advanced section (quantity/drying time), crop preview (click to edit)
- BuildToolbar: mode toggle (Setup/Building), zoom controls, view/crop mode toggle, full page step, source manager, upload PDF, shortcuts dialog
- SourceManagerPanel: floating panel listing instruction sources with process/delete/upload actions
- PageNavigator: source selector (if multiple), prev/next page, page counter

**Building Mode:**
- Three-panel layout: BuildingRail or PageRail (left) | CropCanvas or PageCanvas (center) | BuildingStepPanel (right, when step active)
- Two nav modes: Track (step-focused) and Page (page-focused)

**Track Nav Mode (Building):**
- BuildingRail: single-track view, step tree with hierarchy, progress bar, completion markers, join point indicators, pre-paint dots, strikethrough for replaced steps
- CropCanvas: Konva canvas showing active step's crop region zoomed in, annotation tools (7 types: checkmark/circle/arrow/cross/highlight/freehand/text), undo/redo, text input overlay, full-page modal
- AnnotationToolbar: tool buttons (1-7 keys), color swatches (6 colors), stroke width presets, undo/redo, clear
- NavigationBar: "Step X of Y", track color/name, prev/next

**Page Nav Mode (Building):**
- PageRail: page list with step breakdowns per page, source selector
- PageCanvas: full page with crop overlays (colored by track, with completion checkmarks)
- NavigationBar: "Page X of Y", completed/total counts

**BuildingStepPanel:**
- Complete/Un-complete button (blue→green)
- Start Timer button (preset from adhesive drying time or custom)
- Quantity counter (+/- with progress ring)
- Sub-steps list with completion toggles
- Relations pills (blocked by, blocks, blocks access to, access blocked by) — clickable to navigate
- Paint ref chips (from palette)
- Replaces step link
- Details: adhesive, drying time, pre-paint, tags
- Notes
- Reference images (2-col, lightbox)
- Progress photo drag-drop zone

**Completion Flow:**
1. User clicks Complete or presses Space/Enter
2. `requestStepCompletion()` checks for blocking relations
3. If blocked → CompletionWarningDialog (blocker list, "Complete Anyway" button)
4. If clear → `completeActiveStep()`:
   - Marks step complete with timestamp
   - Auto-logs to build log (if `auto_log_step_complete` setting)
   - Auto-starts drying timer (if `auto_start_timers` setting and adhesive has preset time)
   - Checks for track milestone (all steps complete)
   - If milestone → MilestoneDialog (photo upload + note)
   - Auto-advances to next incomplete step

**Annotation System:**
- 7 tool types: checkmark, cross, circle, arrow, highlight, freehand, text
- Per-step annotation storage (JSON in `annotations.data`)
- Undo/redo stacks (up to 50 snapshots per step)
- Drag to reposition, Delete/Backspace to remove
- Colors: red, blue, green, yellow, black, white
- Stroke widths: thin (2), medium (4), thick (6)
- Composited on StepThumbnail via canvas 2D API

**Timer System:**
- TimerBubble: draggable floating widget, shows active timers with countdown, add timer form
- Timers created: manually via TimerBubble form, or auto on step completion (if adhesive has drying time)
- 1-second tick interval when timers active (useTimerTick hook)
- OS notifications on expiry (tauri-plugin-notification)
- Crash recovery: on app load, checks for already-expired timers
- Auto-log timer expiry (if `auto_log_timer_expiry` setting)

**Keyboard Shortcuts:**
- Canvas: +/- (zoom), 0 (fit), R (rotate), C (crop mode), V (view mode), F (full page step)
- Navigation: Tab/Shift+Tab (page), Arrow keys (step in building), Esc (deselect)
- Building: Space/Enter (complete), T (timer)
- Annotations: 1-7 (tools), Cmd+Z/Shift+Cmd+Z (undo/redo), Delete/Backspace (remove)

---

### Overview Zone (`/overview`)

**Layout:** AssemblyMap (top) + 2x2 card grid (ProjectInfoCard, GalleryCard, BuildLogCard, MaterialsCard). Cards expand to fill grid, Escape to collapse.

**AssemblyMap:**
- SVG canvas with step nodes as circles, colored by track, sized by sub-step count
- Strikethrough for replaced steps, checkmark for completed
- Join point lines between tracks
- Optional dependency arrows (toggle button)
- Zoom in/out, fit-to-screen
- Click node to navigate to step in Build zone
- Collapsed: per-track progress bars

**ProjectInfoCard:**
- Compact: kit art, name, scale/category/status badges, progress bar, per-track rows
- Expanded: hero section, 5-column stats grid, per-track progress, timeline (started/duration/last activity/log count), notes, status actions (Mark Complete/Pause/Resume), edit details (name, category, scalemates URL, product code, notes, delete)
- Mark Complete: confirmation dialog, auto-logs `build_complete`, sets completion_date, syncs kit status
- Scalemates link: opens external URL via Tauri opener

**GalleryCard:**
- Merges progress_photos + milestone_photos + gallery_photos
- Compact: mini masonry grid with star buttons
- Expanded: add photo (file picker), sort toggle, filter pills (all/starred/gallery/progress/milestones), 3-column masonry, lightbox with star/cover/delete/caption actions
- Set as Cover: updates `project.hero_photo_path`

**BuildLogCard:**
- Compact: recent entries (max 8) grouped by day
- Expanded: text/photo composer (text input + photo picker with caption), filter pills (all/steps/notes/photos/milestones), entry list grouped by day, photo lightbox
- Entry types: step_complete (auto), note (manual text), photo (manual image+caption), milestone (auto on track complete), build_complete (auto on project complete)

**MaterialsCard:**
- Compact: accessories (type chips), paints (color+name), palette (swatch grid)
- Expanded: filter pills (all/owned/needed), "Copy Shopping List" button (clipboard), BOM list (accessories + paints with status badges), PaletteSection (always visible)
- PaletteSection: CRUD for palette entries (direct paint or formula), component management, step usage display, swatch rendering

---

### Settings Zone (`/settings`)

**Sections:**
1. **Appearance:** Theme cards (7 themes with swatch previews), dark mode support via `.dark` class toggle
2. **Building:** auto-start timers toggle, completion photo prompt toggle
3. **Track Colors:** editable color+label pairs
4. **Step Tags:** badge list with add/remove
5. **Defaults:** drying time presets (6 adhesive types), annotation color+stroke width
6. **Wishlist:** acquire-clear-price toggle, default currency dropdown (11 currencies)
7. **PDF Import:** DPI selector (72/150/300)
8. **Auto-Log:** toggles for step complete, milestone, timer expiry
9. **Data & Storage:** storage stats (DB size, stash size, photo count), backup export/import with diff preview, reveal in Finder, settings reset (safe), app data reset (destructive with "RESET" confirmation)
10. **About:** app version, credits

**7 Built-in Themes:**
1. Default (light) — neutral beige/blue
2. Claude Light (light) — terracotta accent
3. Claude Dark (dark) — terracotta accent
4. Blueprint (dark) — tech-blue
5. US Army (dark) — olive/khaki military
6. Quarterdeck (dark) — naval blue
7. Instruction Sheet (light) — red accent, paper-like

---

## 4. RUST BACKEND — Complete Command Reference

### Tauri Plugins
- `tauri-plugin-dialog` — file open/save dialogs
- `tauri-plugin-fs` — filesystem access (scoped to $APPDATA)
- `tauri-plugin-opener` — open files/URLs, reveal in Finder
- `tauri-plugin-notification` — OS-level notifications (timer expiry)

### Crate Dependencies
```toml
tauri = "2" (features: ["protocol-asset"])
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
tauri-plugin-opener = "2.5.3"
tauri-plugin-notification = "2"
serde = "1" (features: ["derive"])
serde_json = "1"
rusqlite = "0.32" (features: ["bundled"])
refinery = "0.8" (features: ["rusqlite"])
uuid = "1" (features: ["v4"])
mupdf = "0.6" (features: js, xps, svg, cbz, img, html, epub, system-fonts)
zip = "2"
cocoa = "0.26" (macOS only)
objc = "0.2" (macOS only)
```

### HTTP/Networking
**There is NO HTTP client crate.** The app has zero network capability on the Rust side. No reqwest, no hyper, no curl binding. No outbound HTTP calls. The Tauri capability config does NOT include `http:default` or any HTTP permissions. The `opener` plugin can open URLs in the system browser but makes no HTTP requests itself.

### All Tauri Commands (100 total)

**Collection (7):**
- `list_kits(db) -> Vec<Kit>`
- `create_kit(db, input: CreateKitInput) -> Kit`
- `update_kit(db, input: UpdateKitInput) -> Kit`
- `delete_kit(db, id: String) -> ()`
- `list_kit_files(db, kit_id: String) -> Vec<KitFile>`
- `attach_kit_file(app, db, kit_id, source_path, label?) -> KitFile`
- `delete_kit_file(db, file_id: String) -> ()`

**Accessories (6):**
- `list_accessories(db) -> Vec<Accessory>`
- `create_accessory(db, input: CreateAccessoryInput) -> Accessory`
- `update_accessory(db, input: UpdateAccessoryInput) -> Accessory`
- `delete_accessory(db, id: String) -> ()`
- `list_accessories_for_project(db, project_id) -> Vec<Accessory>`
- `list_accessories_for_kit(db, kit_id) -> Vec<Accessory>`

**Paints (4):**
- `list_paints(db) -> Vec<Paint>`
- `create_paint(db, input: CreatePaintInput) -> Paint`
- `update_paint(db, input: UpdatePaintInput) -> Paint`
- `delete_paint(db, id: String) -> ()`

**Palette Entries (8):**
- `list_palette_entries(db, project_id) -> Vec<PaletteEntry>`
- `create_palette_entry(db, input: CreatePaletteEntryInput) -> PaletteEntry`
- `update_palette_entry(db, input: UpdatePaletteEntryInput) -> PaletteEntry`
- `delete_palette_entry(db, id: String) -> ()`
- `set_palette_components(db, palette_entry_id, components: Vec<PaletteComponentInput>) -> Vec<PaletteComponent>`
- `list_paint_project_mappings(db) -> Vec<PaletteMapping>`
- `list_paints_for_project(db, project_id) -> Vec<Paint>`
- `set_paint_projects(db, paint_id, paint_name, project_ids: Vec<String>) -> ()`

**Projects (8):**
- `list_projects(db) -> Vec<Project>`
- `get_project(db, id) -> Project`
- `create_project(app, db, input: CreateProjectInput) -> Project` — complex: creates kit if inline, links accessories, copies kit files, creates instruction sources, rasterizes PDFs, auto-links project accessories
- `update_project(db, input: UpdateProjectInput) -> Project` — syncs kit status on status change, auto-sets completion_date
- `rename_project(db, id, name) -> ()`
- `delete_project(app, db, id) -> ()` — clears active_project_id, removes instruction files from disk
- `set_active_project(db, id) -> ()`
- `get_active_project(db) -> Option<Project>`

**Settings (8):**
- `get_setting(db, key) -> String`
- `set_setting(db, key, value) -> ()`
- `get_all_settings(db) -> Vec<(String, String)>`
- `get_storage_stats(app) -> StorageStats` — computes DB size, stash size, photo count
- `export_backup(app, dest_path) -> ()` — WAL checkpoint, zip db.sqlite + stash/
- `preview_backup(source_path) -> BackupDiff` — extracts temp DB, queries counts
- `apply_backup(app, source_path) -> ()` — extracts zip, replaces db.sqlite, removes WAL, reopens connection
- `reset_app_data(app) -> ()` — truncates all tables, deletes stash directory

**Media (2):**
- `save_box_art(app, db, kit_id, source_path) -> String` — copies to stash, updates kit
- `save_accessory_image(app, db, accessory_id, source_path) -> String` — copies to stash, updates accessory

**Instructions (11):**
- `list_instruction_sources(db, project_id) -> Vec<InstructionSource>`
- `list_instruction_pages(db, source_id) -> Vec<InstructionPage>`
- `upload_instruction_pdf(app, db, project_id, source_path, name?) -> InstructionSource` — copies PDF, rasterizes pages, inserts records
- `process_instruction_source(app, db, source_id) -> InstructionSource` — re-rasterize if needed
- `delete_instruction_source(app, db, source_id) -> ()` — deletes record + files
- `set_page_rotation(db, page_id, rotation: i32) -> ()`
- `get_project_ui_state(db, project_id) -> ProjectUiState`
- `save_view_state(db, project_id, zoom, pan_x, pan_y) -> ()`
- `save_build_mode(db, project_id, build_mode) -> ()`
- `save_nav_mode(db, project_id, nav_mode) -> ()`
- `save_active_track(db, project_id, active_track_id?) -> ()`

**Tracks (6):**
- `list_tracks(db, project_id) -> Vec<Track>`
- `create_track(db, input: CreateTrackInput) -> Track`
- `update_track(db, input: UpdateTrackInput) -> Track`
- `delete_track(db, id) -> ()`
- `set_track_join_point(db, id, join_point_step_id?, join_point_notes?) -> Track`
- `reorder_tracks(db, project_id, ordered_ids: Vec<String>) -> ()`

**Steps (9):**
- `list_steps(db, track_id) -> Vec<Step>`
- `list_project_steps(db, project_id) -> Vec<Step>`
- `create_step(db, input: CreateStepInput) -> Step`
- `update_step(db, input: UpdateStepInput) -> Step`
- `delete_step(db, id) -> ()`
- `delete_step_and_reorder(db, id) -> ()`
- `reorder_steps(db, track_id, ordered_ids) -> ()`
- `set_step_parent(db, id, parent_step_id?) -> Step`
- `reorder_children_steps(db, track_id, parent_step_id, ordered_ids) -> ()`

**Tags (3):**
- `list_tags(db) -> Vec<Tag>`
- `list_step_tags(db, step_id) -> Vec<Tag>`
- `set_step_tags(db, step_id, tag_names: Vec<String>) -> Vec<Tag>`

**Reference Images (4):**
- `list_reference_images(db, step_id) -> Vec<ReferenceImage>`
- `add_reference_image(app, db, step_id, source_path, caption?) -> ReferenceImage`
- `update_reference_image_caption(db, id, caption?) -> ReferenceImage`
- `delete_reference_image(db, id) -> ()`

**Step Relations (3):**
- `list_project_step_relations(db, project_id) -> Vec<StepRelation>`
- `list_step_relations(db, step_id) -> Vec<StepRelation>`
- `set_step_relations(db, step_id, relations: Vec<RelationInput>) -> Vec<StepRelation>`

**Step Paint Refs (3):**
- `list_step_paint_refs(db, step_id) -> Vec<String>`
- `set_step_paint_refs(db, step_id, entry_ids: Vec<String>) -> Vec<String>`
- `list_project_step_paint_refs(db, project_id) -> Vec<StepPaintRefInfo>`

**Progress Photos (3):**
- `list_project_progress_photos(db, project_id) -> Vec<ProgressPhoto>`
- `list_progress_photos(db, step_id) -> Vec<ProgressPhoto>`
- `add_progress_photo(app, db, step_id, source_path) -> ProgressPhoto`

**Milestone Photos (2):**
- `list_project_milestone_photos(db, project_id) -> Vec<MilestonePhoto>`
- `add_milestone_photo(app, db, track_id, source_path) -> MilestonePhoto`

**Build Log (3):**
- `list_build_log_entries(db, project_id) -> Vec<BuildLogEntry>`
- `add_build_log_entry(db, input: CreateBuildLogEntryInput) -> BuildLogEntry`
- `add_build_log_photo(app, db, project_id, source_path, caption?) -> BuildLogEntry`

**Drying Timers (3):**
- `list_drying_timers(db) -> Vec<DryingTimer>`
- `create_drying_timer(db, input: CreateDryingTimerInput) -> DryingTimer`
- `delete_drying_timer(db, id) -> ()`

**Annotations (2):**
- `get_annotations(db, step_id) -> Option<StepAnnotations>`
- `save_annotations(db, step_id, data: String) -> StepAnnotations`

**Gallery Photos (5):**
- `list_gallery_photos(db, project_id) -> Vec<GalleryPhoto>`
- `add_gallery_photo(app, db, project_id, source_path, caption?) -> GalleryPhoto`
- `update_gallery_photo_caption(db, id, caption?) -> GalleryPhoto`
- `delete_gallery_photo(db, id) -> ()`
- `toggle_photo_star(db, photo_type: String, id: String) -> bool`

### Services

**PDF Service (`services/pdf.rs`):**
- `rasterize_pdf(pdf_path, output_dir, dpi) -> Vec<RasterizedPage>` — uses mupdf to render each page to PNG
- `rasterize_and_persist(conn, source_id, pdf_path, pages_dir, dpi) -> i32` — rasterize + insert page records
- DPI default: 150 (configurable via `pdf_dpi` setting, options: 72/150/300)

**File Stash (`services/file_stash.rs`):**
- `save_to_stash(app_data, source_path, prefix, entity_id) -> String` — copies file with naming `{prefix}_{entity_id}_{uuid}.{ext}`
- Prefixes used: `prog_` (progress photos), `mile_` (milestone photos), `ref_` (reference images), `blog_` (build log photos), `gal_` (gallery photos), `acc_` (accessory images), `kit_` (kit files)

**Utilities (`util.rs`):**
- `now() -> i64` — Unix timestamp seconds
- `get_pdf_dpi(conn) -> u32` — reads from settings, default 150
- `project_dir(app_data, project_id) -> PathBuf`
- `instructions_dir(app_data, project_id, source_id) -> PathBuf`
- `toggle_star(conn, table, id) -> bool` — generic star toggle for any photo table

---

## 5. KIT WORKFLOW — Full Lifecycle

### Stage 1: Add Kit to Collection
**Data created:** `kits` row (id, name, manufacturer, scale, kit_number, status='shelf', category, scalemates_url, retailer_url, price, currency, notes, created_at, updated_at)
**Optional:** `box_art_path` via `save_box_art` (copies image to stash)
**Optional:** Kit files via `attach_kit_file` (PDFs or images copied to stash, `kit_files` rows created)
**UI:** AddKitDialog → KitCard in KitsTab (status='shelf')

### Stage 2: Add Accessories (Optional)
**Data created:** `accessories` rows linked via `parent_kit_id`
**UI:** AddAccessoryDialog from KitCard context or AccessoryToolbar

### Stage 3: Start Project
**Trigger:** "Start Project" button on KitCard or "Create Project" from zone bar
**Data created:**
1. Kit: `status` updated to `'building'`
2. Project: `projects` row (kit_id, status='active', start_date=now())
3. UI State: `project_ui_state` row (build_mode='building', nav_mode='track')
4. Auto-linked: `project_accessories` rows for all accessories with matching `parent_kit_id`
5. Kit files → instruction sources: For each `kit_files` row with `file_type='pdf'`, creates `instruction_sources` row + rasterizes PDF → `instruction_pages` rows + PNG files
6. Settings: `active_project_id` set to new project
**UI:** CreateProjectDialog → navigates to Build zone

### Stage 4: Setup Mode (Build Zone)
**Data created:**
1. Tracks: `tracks` rows (name, color, display_order)
2. Steps: `steps` rows via crop tool (crop_x/y/w/h, source_page_id, track_id) or full-page creation
3. Step metadata: `step_tags`, `step_relations`, `step_paint_refs`, `reference_images`, `annotations`
4. Palette: `palette_entries` rows (direct paint or formula), `palette_components` for formulas
**UI:** TrackRail + InstructionCanvas + StepEditorPanel

### Stage 5: Building Mode (Build Zone)
**Data modified:**
1. Steps: `is_completed=1`, `completed_at=timestamp`, `quantity_current` increments
2. Auto-created: `build_log_entries` (type='step_complete'), `drying_timers`
3. Photos: `progress_photos` (attached to steps), `milestone_photos` (on track completion)
4. Annotations: `annotations.data` JSON updates
**UI:** BuildingRail + CropCanvas + BuildingStepPanel + AnnotationToolbar + TimerBubble

### Stage 6: Track Milestone
**Trigger:** All steps in a track completed
**Data created:** Optional `milestone_photos` row, `build_log_entries` (type='milestone')
**UI:** MilestoneDialog

### Stage 7: Project Completion
**Trigger:** "Mark Complete" in ProjectInfoCard
**Data modified:** `projects.status='completed'`, `projects.completion_date=timestamp`, `kits.status='completed'`
**Data created:** `build_log_entries` (type='build_complete')
**UI:** ProjectInfoCard confirmation dialog

### Stage 8: Gallery & Overview (Ongoing)
**Data created:** `gallery_photos`, `build_log_entries` (manual notes/photos), photo starring
**UI:** Overview zone cards

---

## 6. EXTERNAL LINKS — URL Reference Points

### Fields that store external URLs:

| Table | Column | Purpose | Where Displayed | Where Set |
|-------|--------|---------|-----------------|-----------|
| kits | scalemates_url | Scalemates product page | Not directly displayed on kit (inherited by project) | AddKitDialog, EditKitDialog |
| kits | retailer_url | Retailer purchase link | EditKitDialog wishlist section | AddKitDialog, EditKitDialog |
| accessories | buy_url | Purchase link | AccessoryRow expanded view (as "Buy link" anchor tag) | AddAccessoryDialog, EditAccessoryDialog |
| paints | buy_url | Purchase link | Not currently displayed (only set via dialogs) | AddPaintDialog, EditPaintDialog |
| projects | scalemates_url | Scalemates product page | ProjectInfoCard expanded (as clickable link via `openPath()`) | CreateProjectDialog, ProjectInfoCard edit section |

### URL Behavior:
- **Scalemates URL on ProjectInfoCard:** Opened via `@tauri-apps/plugin-opener.openPath()` which launches the system default browser. NOT an in-app fetch.
- **Accessory buy_url:** Rendered as `<a href={...} target="_blank">` HTML link. Opens in external browser.
- **Kit retailer_url:** Stored but only editable in kit dialogs. NOT displayed on KitCard or anywhere else in the main UI.
- **Paint buy_url:** Stored but NOT displayed anywhere in the UI. Only settable via AddPaintDialog/EditPaintDialog.
- **No URL is ever fetched programmatically.** All URLs are display/open-in-browser only.

### External Data Source:
- `src/data/paint-catalogue.ts` — Credits `https://github.com/Arcturus5404/miniature-paints` (MIT license). Static ~4000 paint entries baked into the frontend. No runtime fetch.

---

## 7. FILE STORAGE — Filesystem Layout

### Base Path: `{appDataDir}/model-builder/`

```
{appDataDir}/model-builder/
├── db.sqlite                          # Main database
├── db.sqlite-wal                      # WAL file (if active)
├── db.sqlite-shm                      # Shared memory file (if active)
├── stash/                             # All user-uploaded images
│   ├── {kit_id}_{uuid}.{ext}         # Box art (via save_box_art)
│   ├── acc_{accessory_id}_{uuid}.{ext}  # Accessory images
│   ├── prog_{step_id}_{uuid}.{ext}   # Progress photos
│   ├── mile_{track_id}_{uuid}.{ext}  # Milestone photos
│   ├── ref_{step_id}_{uuid}.{ext}    # Reference images
│   ├── blog_{project_id}_{uuid}.{ext} # Build log photos
│   ├── gal_{project_id}_{uuid}.{ext} # Gallery photos
│   └── kitf_{kit_id}_{uuid}.{ext}    # Kit files (PDF/image)
└── projects/
    └── {project_id}/
        └── instructions/
            └── {source_id}/
                ├── source.pdf         # Original PDF copy
                └── pages/
                    ├── page_0.png     # Rasterized page 0
                    ├── page_1.png     # Rasterized page 1
                    └── ...
```

### Image Serving to Frontend:
- All file paths stored as absolute OS paths in the database
- Frontend converts to Tauri asset URLs using `convertFileSrc(path)` from `@tauri-apps/api/core`
- Tauri config enables asset protocol scoped to `$APPDATA/**`

### File Naming Convention:
- `{prefix}_{entity_id}_{uuid}.{ext}` where:
  - prefix identifies the file type
  - entity_id links to the owning record
  - uuid ensures uniqueness
  - ext preserves original file extension

### Backup Format:
- ZIP file containing `db.sqlite` + entire `stash/` directory
- WAL checkpoint performed before backup (ensures all data in main DB file)
- On restore: extracts all files, replaces db.sqlite, removes WAL/SHM files, reopens DB connection

---

## 8. DEPENDENCIES

### Rust (Cargo.toml)
```toml
[dependencies]
tauri = { version = "2", features = ["protocol-asset"] }
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
tauri-plugin-opener = "2.5.3"
tauri-plugin-notification = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.32", features = ["bundled"] }
refinery = { version = "0.8", features = ["rusqlite"] }
uuid = { version = "1", features = ["v4"] }
mupdf = { version = "0.6", default-features = false, features = ["js", "xps", "svg", "cbz", "img", "html", "epub", "system-fonts"] }
zip = "2"

[target.'cfg(target_os = "macos")'.dependencies]
cocoa = "0.26"
objc = "0.2"

[build-dependencies]
tauri-build = { version = "2" }
```

**HTTP/fetch capability: NONE.** No reqwest, hyper, or any HTTP client crate.

### Frontend (package.json)
```json
"dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@fontsource-variable/dm-sans": "^5.2.8",
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-dialog": "^2",
    "@tauri-apps/plugin-notification": "^2",
    "@tauri-apps/plugin-fs": "^2",
    "@tauri-apps/plugin-opener": "^2.5.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "konva": "^10.2.0",
    "lucide-react": "^0.474.0",
    "next-themes": "^0.4.6",
    "radix-ui": "^1.4.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-konva": "^19.2.3",
    "react-router": "^7.2.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.0.0",
    "use-image": "^1.1.4",
    "zustand": "^5.0.0"
},
"devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@tauri-apps/cli": "^2",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "typescript": "~5.7.0",
    "vite": "^6.0.0"
}
```

**HTTP/fetch capability on frontend: NOT USED.** The Tauri opener plugin can open URLs in the system browser. The `@tauri-apps/api` includes `fetch()` capability but it is NOT configured in the Tauri capabilities (no `http:default` permission). The frontend uses `window.fetch` nowhere.

### Tauri Capabilities (default.json)
```json
"permissions": [
    "core:default",
    "dialog:default", "dialog:allow-open", "dialog:allow-save",
    "fs:default",
    "fs:allow-read" (scoped: $APPDATA/**, $RESOURCE/**),
    "fs:allow-write" (scoped: $APPDATA/**),
    "notification:default",
    "opener:default",
    "opener:allow-open-path" (scoped: $APPDATA/**),
    "opener:allow-reveal-item-in-dir" (scoped: $APPDATA/**)
]
```

**Missing from capabilities:** `http:default`, `shell:default`. The app cannot make HTTP requests or execute shell commands from the frontend.

---

## 9. GAPS AND STUBS

### Schema-Only Tables (No Backend/Frontend Code)

1. **`masks` table** — Has `step_id` (PK), `file_path`, `updated_at`. No query module, no command, no UI. Appears to be reserved for future masking feature.

2. **`export_history` table** — Has `id`, `project_id`, `format` (html/pdf/zip), `file_path`, `created_at`. No query module, no command, no UI. Design doc exists at `docs/EXPORT_FEATURE.md`. Schema is ready but feature not implemented.

### Schema Fields Not Surfaced in UI

3. **`projects.markings_scheme`** — TEXT column, nullable. Not read or written by any query or command. Not displayed anywhere. No TypeScript type.

4. **`projects.markings_scheme_image_path`** — TEXT column, nullable. Same as above — completely unused.

5. **`kits.price_updated_at`** — INTEGER column. Written to DB schema but never read/written by queries or UI. The column exists but is always NULL.

6. **`accessories.price_updated_at`** — Same situation. Exists in schema, never used.

7. **`paints.price_updated_at`** — Referenced in Rust model (`Paint` struct) and query module (read from DB), but never written to or displayed in UI. Always returns the value from DB which defaults to NULL since no code ever sets it.

8. **`gallery_photos.source`** — Column exists with CHECK IN ('gallery','log') but the query module always inserts with default 'gallery'. The `log_entry_id`, `is_milestone`, `track_id` columns exist but are never set via the `add_gallery_photo` command.

9. **`steps.source_name`** — Column exists, is in the model, can be set via UpdateStepInput, but there's no dedicated UI field for entering it. The StepEditorPanel has a `source_type` dropdown but `source_name` is not exposed.

### Feature Stubs / Design Docs Without Implementation

10. **Export Feature** — `docs/EXPORT_FEATURE.md` exists. `export_history` table in schema. No commands, no queries, no UI.

11. **`project_accessories` junction table** — Table exists, rows are auto-created when starting a project (linking kit accessories), but the junction is never queried independently. Accessories are queried for project display via `list_accessories_for_project` which JOINs through this table.

12. **`palette_components`** — Fully implemented in backend and frontend (formula mixing). Functioning feature.

### UI Elements Marked "Coming Soon"

13. **Grid view for Kits** — KitToolbar has a disabled "Grid" button (only "List" is active)
14. **Grid view for Accessories** — AccessoryToolbar has a disabled "Grid" button

### No TODO/FIXME/HACK Comments Found
A grep for TODO, FIXME, HACK, XXX, STUB, unimplemented, placeholder, and todo! across all .rs, .ts, and .tsx files returned **zero results** (only false positives from HTML placeholder attributes on form inputs).

### Other Observations

15. **`next-themes` dependency** — Listed in package.json but the Sonner docs note it was "removed" as a dependency from the Sonner customization. The theme system uses a custom `theme-engine.ts` + `useTheme.ts` hook, not next-themes. This dependency may be vestigial.

16. **No tests** — Zero test files in either Rust or TypeScript. No test runner configured.

17. **No CI/CD** — No GitHub Actions, no build pipeline configuration files.

18. **Tauri CSP is null** — `"csp": null` in tauri.conf.json means no Content Security Policy is enforced. This is common in dev but worth noting for production.

19. **Window dimensions** — Fixed: 1470x900 default, 960x600 minimum. Single window, no multi-window support.

20. **App identifier** — `com.model-builder.app` in tauri.conf.json.
