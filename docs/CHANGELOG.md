# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Project proposal document defining the three-zone UX architecture (Collection, Build, Overview)
- EXPORT_FEATURE.md: Full export feature specification (curation dialog, PDF page design, Typst templates, HTML/ZIP formats)
- export-mockup.jsx: Interactive React mockup of the export dialog

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
