# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Project proposal document defining the three-zone UX architecture (Collection, Build, Overview)
- EXPORT_FEATURE.md: Full export feature specification (curation dialog, PDF page design, Typst templates, HTML/ZIP formats)
- export-mockup.jsx: Interactive React mockup of the export dialog

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
