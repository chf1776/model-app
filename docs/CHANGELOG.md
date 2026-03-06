# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.2] — 2026-03-06 — Phase 3C: Step Panel & Completion Flow

### Added
- **BuildingStepPanel**: Read-only 280px right panel in building mode showing all step context — header with track dot/name, completion button, quantity tracker with pips, sub-step checklist, relations (blocked by, blocks, blocks access to, access blocked by), replaces link, details (adhesive, drying time, source, pre-paint pill, tags), notes, and reference images in masonry grid
- **Step completion flow**: Complete button toggles completion state; on completion, auto-advances to next incomplete step in flat walk order (wrapping around)
- **`completeActiveStep` store action**: Centralized completion + auto-advance logic shared by panel button and keyboard shortcut
- **Space/Enter keyboard shortcut**: Completes the active step in building mode
- **Keyboard shortcuts dialog**: Added "Building Mode" section with Space/Enter and arrow key shortcuts
- **`parseStepRelations` utility**: Shared relation filtering helper in tree-utils, used by both BuildingStepPanel and StepEditorPanel

## [0.3.1] — 2026-03-06 — Phase 3B: Building Rail & Crop Canvas

### Added
- **BuildingRail**: Single-track step list (200px) with Popover track selector dropdown showing project-wide progress, per-track done/total counts, and completed track checkmarks
- **Step thumbnails**: Canvas-rendered crop thumbnails (36px height) in building rail step rows with shared image cache, opacity states (45% for completed, full + accent glow for active)
- **Building rail step rows**: Completion marker, thumbnail, title with "Step N of M" secondary line on active step, pre-paint amber dot indicator
- **Sub-step expansion**: Sub-steps visible beneath parent when parent step is active
- **Join point indicators**: Incoming (source track color bar + arrow + name) and outgoing (arrow + destination color bar + name) inline markers, clickable to navigate across tracks
- **CropCanvas**: Dedicated canvas showing only the active step's crop region, fit-to-view by default with zoom/pan support; pan uses CSS transform (no redraw), zoom triggers canvas redraw
- **Show Full Page modal**: Expand button on crop canvas opens full-screen instruction page with crop region highlighted and surrounding area dimmed
- **NavigationBar**: Flat step traversal with hierarchical labels ("Step 2.1 of 8 steps"); track color dot and name alongside counter
- **Shared utilities in tree-utils.ts**: `getEffectiveDimensions()` (rotation math), `buildChildrenMap()` (parent→children map), `getOrderedTrackSteps()`, `flattenTrackSteps()`, `getStepLabel()`

## [0.3.0] — 2026-03-06 — Phase 3A: Mode Toggle & Building Layout

### Added
- **Setup/Building mode toggle**: SegmentedPill in the build toolbar switches between Setup and Building modes, persisted per-project in `project_ui_state`
- **Active track persistence**: `active_track_id` saved to DB via new V5 migration, restored on project load
- **Building mode layout**: TrackRail and StepEditorPanel hidden in building mode; canvas expands to fill available space
- **NavigationBar**: Slim 30px bar below canvas in building mode with prev/next buttons and "Step N of M" counter
- **Setup-only tool hiding**: View/Crop toggle, Full Page button, Source Manager, and Upload PDF hidden when in building mode
- **Keyboard guards**: C (crop) and F (full page) keys disabled in building mode; arrow keys navigate between steps in building mode
- **Auto-select on enter**: Switching to building mode with no active step auto-selects the first incomplete step
- **Canvas mode guard**: Crop mode blocked in building mode (both from keyboard and store)

## [0.2.8] — 2026-03-05 — Phase 2H: Step Relations, Progress Ring & Quantity Counter

### Added
- **Step relations**: "Blocked by" and "Blocks access to" relation types between steps, with step picker UI in the editor panel grouped by track with search filtering
- **Bidirectional relation display**: Relations shown from both sides with semantic labels — "Blocked by" ↔ "Blocks", "Blocks access to" ↔ "Access blocked by" — editable and removable from either end
- **Relation chip navigation**: Click a relation chip to navigate to the linked step; click X to remove the relation
- **Replaces step**: Set a single step that this step replaces via `replaces_step_id`; target step shows "Replaced by" with removable chip
- **Step relation persistence**: Full Rust backend (queries, commands) for the `step_relations` table that already existed in the schema
- **Sub-step progress ring**: Parent steps show a circular progress arc in the completion marker — perimeter fills proportionally as sub-steps are completed, turns green when all done
- **Quantity counter**: Steps with quantity > 1 show +/− buttons in the editor panel and a "3/5" fraction label on the rail; completion marker ring fills proportionally to quantity progress
- **Quantity current persistence**: `quantity_current` field added to `UpdateStepInput` (Rust + TypeScript) for increment/decrement support
- **Nullable field clearing**: `replaces_step_id` uses `Option<Option<String>>` pattern to distinguish "not provided" from "explicitly set to null"

## [0.2.7] — 2026-03-05 — Phase 2G: Join Point Indicators & Crop-to-Step

### Added
- **Incoming join point markers**: Target tracks now show an inline divider at the join point step with the source track's color bar and name, making both ends of a join visible
- **Outgoing join point markers**: Source tracks show a directional marker at the end of their step list with an arrow and the target track's color bar
- **Directional join point icons**: Replaced ambiguous GitMerge icons with arrow + colored bar indicators — bar position (left vs right of arrow) distinguishes incoming from outgoing
- **Collapsed join point label**: Track headers show the join target with arrow + color bar when collapsed; hidden when expanded (markers take over)
- **Menu wording**: "Set Join Point" renamed to "Joins Into…" with ArrowRight icon for clearer directionality
- **Crop empty steps**: Clicking the empty crop preview in the step editor switches to crop mode; drawing a crop updates the existing step instead of creating a new one
- **Crop tool root steps**: Crop tool now always creates root-level steps (Step 1, 2, 3…) instead of auto-nesting under the active step

### Fixed
- Crop tool creating sub-steps (Step 1.1, 2.1) instead of sequential root steps

## [0.2.6] — 2026-03-04 — Phase 2F: Tags, Reference Images & Drag-to-Nest

### Added
- **Drag-to-nest**: Drag a step horizontally in the track rail to change its nesting depth — drag right to nest under the item above, drag left to un-nest to root level. Uses dnd-kit SortableTree-style projection from horizontal offset
- **Drop indicator line**: Accent-colored line with circle marker shows at the projected depth during drag, giving real-time visual feedback for nest/un-nest operations
- **Auto-rename on nest/un-nest**: Steps with auto-generated titles (e.g. "Step 3", "Step 2.1") are automatically renamed to match their new context when nesting changes
- **Position-aware un-nesting**: Un-nesting a sub-step places it after the drop target when dropped on a root step, or after the former parent when dropped in place
- **Parent collapse during drag**: Dragging a root step that has children collapses them into the parent — children travel with the drag and reappear at the new position
- **Drag projection performance**: O(1) step lookup for projection guard, eliminated redundant linear scan in `getProjection`, skip unnecessary track reload on nest/un-nest
- **Backend**: `set_step_parent` command for explicit parent set/clear, `reorder_children_steps` command for scoped child reordering
- **Step tags**: Predefined tag library (Dry Fit, Paint First, Filler Needed, Masking, Decals, Clear Coat, Weathering, Rigging, Fragile, Optional) with tag picker popover in step editor panel
- **Tag persistence**: Full backend CRUD — `tags` and `step_tags` tables with ensure-or-create semantics, Tauri commands, TypeScript API wrappers, and Zustand store integration
- **Reference image attachments**: Per-step reference images (photos, screenshots, diagrams) with native file picker (png/jpg/jpeg/webp), file copy to stash directory, and database tracking
- **Reference image thumbnails**: 2-column grid of 50px-tall thumbnails in the step editor panel with click-to-expand larger view
- **Reference image captions**: Click-to-edit inline captions under each thumbnail, saved on blur or Enter
- **Reference image deletion**: Hover-to-reveal X button removes image from database and stash
- **Reference images backend**: Full Rust data layer — queries, commands with file stash integration, TypeScript types, API wrappers, and Zustand store with targeted add/update/remove actions

## [0.2.5] — 2026-03-03 — Phase 2E: Cross-Track Drag-and-Drop & Track Expansion

### Added
- **Cross-track drag-and-drop**: Drag steps between tracks directly in the rail — single steps or multi-selected groups. Steps insert at the drop position in the target track with automatic reordering of both source and target tracks
- **Multi-track expansion**: Multiple tracks can now show their step lists simultaneously. Click a track header to toggle its expansion; Cmd+click to expand exclusively (collapsing all others)
- **Expand/collapse all buttons**: Two state-aware icon buttons in the track rail header — expand all (highlighted when all tracks open) and collapse all (highlighted when all tracks closed)
- **Unified DndContext**: Single drag-and-drop context hoisted to TrackRail level, enabling within-track reorder and cross-track moves in one gesture
- **Drop zones on expanded tracks**: Empty expanded tracks show a "Drop steps here" placeholder; collapsed tracks have no drop zone

### Removed
- **Move to Track menu**: Removed the dropdown submenu for moving steps between tracks — superseded by direct drag-and-drop

## [0.2.4] — 2026-03-03 — Phase 2D-remaining: Selection, Editing & Polish

### Added
- **Track reassignment**: Change a step's track via the editor dropdown — step moves to end of destination track, step counts refresh on both tracks, destination track auto-expands in the rail
- **Bidirectional rail↔canvas sync**: Clicking a step in the rail navigates the canvas to its page and highlights the crop region; clicking a crop region on the canvas expands the step's track and selects it
- **Crop preview**: Canvas-rendered thumbnail of the step's cropped+rotated region in the editor panel, with skeleton loading state, "Page N" badge, and click-to-navigate
- **Page number badges**: Steps with crop regions show a subtle "P3" badge in the rail indicating which instruction page they reference
- **Step editor panel**: Widened from 220px to 260px for better readability; canvas container fixed with `min-w-0` to prevent editor panel clipping

## [0.2.3] — 2026-03-03 — Phase 2D: Crop Region Resize & Reposition

### Added
- **Resize handles**: Selected crop regions show 8 Konva Transformer handles (corners + edges) for precise resizing
- **Drag to reposition**: Selected crop regions are draggable to adjust position on the instruction page
- **Inverse coordinate conversion**: `effectiveToImage` converts effective-space (post-rotation) coordinates back to image-space for database storage
- **Zoom-independent handles**: Anchor size, stroke width, and corner radius scale inversely with zoom to maintain constant visual size
- **Minimum crop size**: Enforced 5px minimum in both dimensions via Transformer `boundBoxFunc`

## [0.2.2] — 2026-03-02 — Phase 2C: Canvas Crop Tool & Step Creation

### Added
- **Selection-first step creation**: Draw a rectangle on the instruction PDF canvas to instantly create a step on the active track — the primary way to create steps
- **Canvas mode toggle**: View mode (pan/zoom) and Crop mode (draw crops) with toolbar buttons and keyboard shortcuts (V/C)
- **Crop regions on canvas**: All crop regions visible on the current page with track-colored borders, semi-transparent fills, and corner labels showing track abbreviation + step number
- **Full-page step shortcut**: Create a step covering the entire page via toolbar button or F key
- **Keyboard shortcuts**: C (crop mode), V (view mode), F (full-page step), Escape (deselect step or exit crop mode)
- **CropLayer component**: Konva Layer rendering all crop regions for the current page with in-progress drawing rectangle
- **CropRegion component**: Konva Group with inverse-zoom-scaled labels and borders that stay readable at any zoom level
- **useCropDrawing hook**: State machine for crop drawing with stage-to-image coordinate conversion supporting all rotation angles (0/90/180/270)
- **Canvas mode state**: `canvasMode` in build-slice with guard preventing crop mode without an active track

## [0.2.1] — 2026-03-02 — Phase 2B: Track & Step Foundation

### Added
- **Track & step backend**: Full Rust data layer for tracks and steps — CRUD queries, Tauri commands, TypeScript types, API wrappers, and Zustand store integration
- **Three-panel build layout**: Build zone now has TrackRail (left) | Canvas (center) | StepEditorPanel (right) layout
- **Track rail UI**: 200px left panel with track list, add/rename/change-color/delete dialogs, progress bars, and empty state
- **Track auto-color**: New tracks auto-assign from an 8-color rotating palette (Terracotta, Steel Blue, Olive, Gold, Purple, Burnt Orange, Teal, Mauve)
- **Active track toolbar**: Selected track shown with color dot + name in the build toolbar
- **Step editor panel**: 220px right sidebar with title, track, adhesive, source type, pre-paint toggle, notes, and advanced fields (quantity, drying time)
- **Step UI components**: StepItem, StepCompletionMarker for track rail display
- **Paint group expand/collapse all**: Toolbar buttons to expand or collapse all paint group sections at once
- **Persistent paint group state**: Expanded/collapsed state for paint groups survives tab switches; uses a base+overrides model so expand/collapse all sets the default for new groups too
- **Lazy image loading**: Kit box art and accessory thumbnails now use `loading="lazy"`

### Changed
- **Paint group default**: All paint groups now default to expanded (previously only the two largest)
- **Paint group swatches**: Collapsed mini swatches now appear next to the group count instead of far right
- **Paint toolbar**: Removed redundant "Group:" label
- **Rust backend cleanup**: Extracted shared `util.rs` module with `now()`, `get_pdf_dpi()`, `project_dir()`, and `instructions_dir()` helpers — deduplicated 8 `now()` functions across query files and consolidated ~25 mutex lock patterns into `AppDb::conn()`
- **Build slice cleanup**: Extracted `DEFAULT_PAGE_STATE` and `DEFAULT_VIEWER_STATE` constants, renamed `fitToViewCounter` to `fitToViewTrigger`
- **AppShell init**: Parallelized data loads with `Promise.all`
- **PaintRow selector**: Fixed unstable Zustand selector reference (`?? []` inside selector → stable `EMPTY_PROJECTS` constant)

### Removed
- Dead code: `set_build_mode()` in project_ui_state queries, `delete_by_source()` in instruction_pages queries
- Unused `compact` prop from AccessoryRow

## [0.2.0] — 2026-03-02 — Phase 2A: PDF Import, Page Viewer & Build Zone Shell

### Added
- **PDF import via MuPDF**: Rust-side PDF rasterization using `mupdf` crate (builds MuPDF from C source via cargo). Pages rendered as PNGs at configurable DPI (72/150/300)
- **Instruction source management**: Upload, list, delete, and process instruction PDFs per project. Files stored in `{appData}/model-builder/projects/{id}/instructions/`
- **Konva page viewer**: Full canvas-based page viewer using react-konva with scroll-wheel zoom (centered on cursor), click-drag pan, fit-to-view, and white page backing for transparent PDFs
- **Page rotation**: Rotate pages 90 degrees at a time (toolbar button or `R` key), persisted to database across sessions
- **Page navigator**: Frosted glass overlay at bottom-center with source name, page counter, prev/next controls, and multi-source dropdown
- **Source manager panel**: Slide-out panel listing all instruction sources with delete (confirmation dialog) and process actions
- **Build toolbar**: Context toolbar with Setup mode label, project name, zoom controls (in/out/fit/rotate), source manager toggle, and Upload PDF button
- **Empty instructions state**: Upload CTA shown when no PDFs exist for the active project
- **Processing overlay**: Full-screen loading indicator during PDF rasterization (project creation and additional uploads)
- **Project UI state persistence**: Zoom and pan state saved to database per project
- **Keyboard shortcuts**: Tab/Shift+Tab (next/prev page), +/- (zoom), 0 (fit to view), R (rotate)
- **DPI setting**: New "PDF Import" section in Settings with 72/150/300 DPI toggle
- **Project overflow menu**: Three-dot menu next to project dropdown with Rename, Delete (with confirmation), and Archive (greyed out, coming soon)
- **Rename project**: Inline rename dialog from the project overflow menu
- **Delete project**: Removes project, all instruction sources/pages, and files on disk
- **V4 migration**: `ALTER TABLE instruction_pages ADD COLUMN rotation`

### Changed
- **Build zone**: Replaced Phase 2 placeholder with full instruction viewer layout
- **Build slice**: Expanded with instruction sources, page navigation, viewer state, rotation, and processing state
- **Project creation**: Kit PDF files are now auto-rasterized during project creation with a processing overlay instead of requiring manual processing
- **Code cleanup**: Extracted `useUploadPdf` hook (deduplicated 3 copies), `rasterize_and_persist` Rust helper (deduplicated 3 copies), transaction-wrapped page batch inserts, fixed stale closures in canvas viewer

## [0.1.5] — 2026-03-01 — Phase 1B-4: Collection Toolbars & Accessory Images

### Added
- **Accessory thumbnail images**: Accessories now support an optional image, displayed as a 32×42px thumbnail in AccessoryRow with gradient placeholder fallback
- **Accessory image picker**: "Choose image" button in both Add and Edit Accessory dialogs (png/jpg/jpeg/webp), matching the kit box art picker pattern
- **save_accessory_image command**: Rust backend command copies image to stash directory and updates the `image_path` column
- **V3 migration**: `ALTER TABLE accessories ADD COLUMN image_path TEXT`
- **Unified context bar**: All three Collection tabs (Kits, Accessories, Paints) now render tab-specific toolbars in the shared context bar after EntitySwitcher
- **KitToolbar**: Status filter (segmented pill), group-by toggle (Status / Category / Manufacturer), search input, and grid view placeholder
- **AccessoryToolbar**: Status filter (All / Owned / Wishlist), type filter (All / PE / Resin / Decal / Other with per-type colors), group-by toggle (Type / Parent Kit), search input, and grid view placeholder
- **Kit search**: Filters kits by name, manufacturer, scale, and kit number
- **Kit group-by**: Group kits by Status (default sections), Category (Ship/Aircraft/Armor/etc), or Manufacturer (alphabetical)
- **Accessory filtering**: Filter by status (owned/wishlist) and type (PE/resin/decal/other), with search by name, brand, and reference code
- **Accessory grouping**: Collapsible sections grouped by Type or Parent Kit (with "Unlinked" group for unlinked accessories)
- **Paint search in store**: Paint search state moved from local component state to Zustand store for context bar integration

### Changed
- **PaintsToolbar**: Moved from inline toolbar inside PaintsTab to the shared context bar
- **StatusFilterChips**: Absorbed into KitToolbar; standalone component deleted
- **Toolbar styling**: All filter/group selectors use consistent segmented pill style with text labels (Status:, Type:, Group:)

### Removed
- `StatusFilterChips.tsx` (replaced by KitToolbar)

---

- Project proposal document defining the three-zone UX architecture (Collection, Build, Overview)
- EXPORT_FEATURE.md: Full export feature specification (curation dialog, PDF page design, Typst templates, HTML/ZIP formats)
- export-mockup.jsx: Interactive React mockup of the export dialog

## [0.1.4] — 2026-03-01 — Phase 1B-3: Wishlist Polish & Kit-to-Project Pipeline

### Fixed
- **create_project bug**: Removed premature `active_project_id` set that wrote the kit ID instead of the project ID
- **create_project bug**: Removed `file_path` column from `instruction_sources` INSERT (column is auto-populated by default value from V2 migration)

### Added
- **Kit-to-project pipeline**: Creating a project from a kit now auto-links all accessories with matching `parent_kit_id` via `project_accessories`
- **Kit wishlist fields in AddKitDialog**: Price, currency, and retailer URL fields appear when adding a kit with "Wishlist" status
- **Kit wishlist fields in EditKitDialog**: Price, currency, and retailer URL fields appear when status is "Wishlist"; fixed dialog scroll for long content
- **Price display on wishlisted kits**: KitCard info line shows price after status label (e.g., "Wishlist · $29.99 · Tamiya · 1/350")
- **Price display on wishlisted accessories**: AccessoryRow info line shows price after brand
- **Price display on wishlisted paints**: PaintRow shows price after type; PaintDetailPanel shows price/currency below status toggle

## [0.1.3] — 2026-03-01 — Phase 1B-2: Project Tags on Paints

### Added
- **Project tags on paints**: Link paints to projects via `palette_entries` table — lightweight tagging that evolves into rich palette slots in Phase 6
- **Project tag pills on PaintRow**: Shows up to 2 project names with "+N" overflow
- **Project count badge on PaintSwatchCard**: Small accent badge on grid view cards
- **Projects section in PaintDetailPanel**: Lists linked project names or "None"
- **Project multi-select in EditPaintDialog**: Toggle pills to assign/unassign projects
- **Group by Project**: Paint shelf can now group paints by project, with "Unassigned" group for unlinked paints; paints in multiple projects appear in each group
- **Palette entries backend**: `list_paint_project_mappings` and `set_paint_projects` Tauri commands with deduplication and sync logic

## [0.1.2] — 2026-03-01 — Phase 1B-2: Paints & Catalogue

### Added
- **Paint CRUD**: Full create, read, update, delete for paints with brand, name, type, finish, hex color, color family, and status (owned/wishlist)
- **Paint queries & commands**: Rust backend with `list_all`, `get_by_id`, `insert`, `update`, `delete`
- **Paint catalogue**: Bundled reference data (2,598 paints) from Arcturus5404/miniature-paints (MIT) — Tamiya, Vallejo (Model Color, Model Air, Game Color), Mr. Hobby (Mr. Color, Aqueous Hobby Color), AK Interactive, Ammo by Mig Jimenez
- **Color family utility**: Auto-assignment from hex via HSL analysis (reds & oranges, yellows, greens, blues, purples, browns, greys, whites, blacks)
- **PaintsTab**: Main container with grouped sections, search filter, and conditional detail panel
- **PaintRow**: List view with 18px swatch, name, code (monospace), brand, type, and inline owned/wishlist status toggle
- **PaintSwatchCard**: Grid view with 64px swatch cards (36px color block + name + code)
- **PaintGroupSection**: Collapsible groups with chevron toggle, count, mini swatch previews when collapsed
- **PaintDetailPanel**: 200px right sidebar with large swatch, full info, auto-save notes, and edit button
- **PaintsToolbar**: Group by (Color Family / Brand / Project-disabled), search input, list/grid view toggle
- **AddPaintDialog**: Catalogue search mode (autoFocus, brand filter pills, quick-add from results) + manual entry mode (brand, name, type, code, finish, hex + live preview, notes, wishlist fields)
- **EditPaintDialog**: Pre-populated edit form with color family override dropdown and AlertDialog delete confirmation
- **Paint count in EntitySwitcher**: Live count from store
- **loadPaints in AppShell**: Paint data initialized on app mount

## [0.1.1] — 2026-03-01 — Phase 1B-1: Accessories

### Added
- **Accessory CRUD**: Full create, read, update, delete for accessories (PE, Resin/3D, Decals, Other)
- **Accessory queries & commands**: Rust backend with `list_all`, `list_by_kit`, `get_by_id`, `insert`, `update`, `delete`; LEFT JOIN for parent kit name
- **AccessoryRow component**: Color-coded type bar, type label, linked parent kit name, brand, and popover-based owned/wishlist status toggle
- **AccessoriesTab**: Flat list view with empty-state CTA
- **AddAccessoryDialog**: Name, type pill selector, status toggle, manufacturer, brand, reference code, searchable parent kit picker, notes, and conditional wishlist fields (price, currency, buy URL)
- **EditAccessoryDialog**: Pre-populated edit form with AlertDialog delete confirmation
- **Expandable kit cards**: Click-to-expand tray replacing click-to-edit; tray shows kit details, "Edit Kit" button, linked accessories with inline status toggles, and "Add Accessory" button with kit pre-linked
- **Entity-aware Add button**: AppShell "Add" button dispatches correct dialog based on active entity tab (Kits / Accessories / Paints)
- **Accessory count in EntitySwitcher**: Live count from store

### Changed
- **KitCard**: Outer element changed from `<button>` to `<div>` with clickable header; expand/collapse replaces direct edit-dialog open
- **KitsTab**: Props updated from `onKitClick` to `onEditKit` + `onAddAccessoryForKit`
- **AppShell**: Loads accessories on init; Add button is entity-tab-aware
- **Collection route**: Wired AccessoriesTab, AddAccessoryDialog, EditAccessoryDialog, and kit-tray callbacks

## 2026-03-01 — Design Review: Architecture, Schema, Phasing, and Coverage

### Architecture decisions
- **Migration system**: Switched from single upfront schema to `refinery` crate migration system
- **PDF rendering**: Committed to `pdfium` (via `pdfium-render` crate) for instruction manual rasterization
- **PDF export**: Switched from headless-chrome/weasyprint to `typst` crate for build log PDF export
- **HEIC handling**: Switched from filtering HEIC on non-macOS to `libheif-rs` for cross-platform conversion
- **Cross-slice state**: Documented targeted re-fetching pattern for cross-domain mutations
- **Image mask tool**: Kept full paint-over mask tool as designed

### Schema fixes (TECH_SPEC.md)
- Added `price_updated_at INTEGER` to `kits`, `accessories`, and `paints` tables
- Added `brand TEXT` column to `accessories` table
- Added `'paused'` to `kits.status` CHECK constraint
- Added `updated_at` triggers for all major tables
- Reordered `build_log_entries` before `gallery_photos` for FK declaration clarity
- Added `refinery`, `pdfium-render`, `libheif-rs`, and `typst` to Cargo.toml dependencies

### Phasing changes (ROADMAP.md)
- Split Phase 1 into Phase 1A (app shell, kit CRUD, project creation) and Phase 1B (paint shelf, accessories, Scalemates, wishlist)
- Added Phase 3.5: Basic Overview (read-only assembly map, compact summary cards)
- Phase 5 renamed to "Overview Zone — Full", scoped as enhancements over Phase 3.5

### Document fixes
- Fixed "Electron" → "Tauri v2" in UI_DESIGN.md
- Fixed "Export + Settings" → "Project Info" in UI_DESIGN.md sections 27.3 and 35.4
- Removed zone-switching keyboard shortcuts (conflict with Build zone Track/Page mode)
- Clarified color family hue range overlap evaluation order in TECH_SPEC.md

### Edge cases documented
- Replaces-step: chained replacements, relation transfer policy, circular replacement prevention (PROJECT_PROPOSAL.md)

### New sections
- Testing Strategy (TECH_SPEC.md): Rust unit tests, Tauri integration tests, targeted E2E
- File System Error Recovery (TECH_SPEC.md): missing file handling, storage migration, health check utility
- Large Project Considerations (TECH_SPEC.md): target scale, virtualization requirements
- Instruction Manual Formats & Quirks (SCALE_MODELLING_REFERENCE.md): manufacturer quirks, PDF format variations

### New document
- EXPORT_FEATURE.md: Complete build log export specification — three-panel dialog, PDF page design (Typst), HTML/ZIP formats, photo curation, section customization, Quick Export. Cross-references added to PROJECT_PROPOSAL.md, TECH_SPEC.md, UI_DESIGN.md, and ROADMAP.md.
