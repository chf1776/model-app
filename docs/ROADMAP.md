# Model Builder's Assistant — Implementation Roadmap

Phases are ordered so each one produces something testable and useful on its own. The critical path to a working build experience is Phases 1–3.

---

## Phase 1A: Foundation

**Goal**: A working app shell with basic kit management and project creation. Get to the Build zone as fast as possible.

### Database
- Full schema established via refinery migration system (initial migration creates all tables). Later phases add new migrations only if schema changes are needed.
- Core tables: `projects`, `tracks`, `steps`, `step_relations`, `step_tags`
- Collection tables: `kits`, `accessories`, `paints`, `project_accessories`, `kit_files`
- Media tables: `instruction_sources`, `instruction_pages`, `progress_photos`, `milestone_photos`, `gallery_photos`, `reference_images`, `annotations`, `masks`
- Build tables: `build_log_entries`, `tags`, `drying_timers`, `export_history`
- Paint tables: `palette_entries`, `palette_components`, `step_paint_refs`
- Settings: `app_settings`, `project_ui_state`

### App scaffold
- Tauri v2 project with React 19 + TypeScript + Vite
- Three-zone navigation bar (Collection / Build / Overview), always visible, plus gear icon for Settings and "+ New Project" button
- Active project state: last-resumed project ID stored in `app_settings`; Build and Overview show empty state when none active
- Basic routing: `/collection`, `/build`, `/overview`, `/settings`

### Collection zone (Kits only)
- **Entity switcher**: three tabs (Kits | Accessories | Paints) at the top of Collection. Accessories and Paints tabs show placeholder empty states in this phase.
- **Kits tab**: sections for Building, On the Shelf, Wishlist, Completed — each with kit cards showing status badges
- Add kit: manual entry form (name, manufacturer, scale, kit number, box art)
- Edit and delete kit
- **Kit file attachment**: Edit Kit dialog includes a file section for attaching PDFs and images (stored via `kit_files` table). Users can attach instruction manuals before starting a project.
- **"Start Project" card action**: shelf kit cards show a direct "Start Project" button that opens the Create Project dialog pre-filled with that kit
- Basic status transitions (shelf → building, building → completed)

### Project creation
- **First-run empty state**: welcome card with "Create First Project" CTA and Getting Started tips
- **Create Project dialog**: required fields (project name, kit from shelf or new via manual entry, scale), optional fields (category, product code). No Scalemates import yet.
- On creation: shelf kit auto-moves to "Building" status (configurable in Settings). Post-creation landing with suggested next steps.
- **Auto-import kit files**: on project creation, any files attached to the kit via `kit_files` are automatically imported as `instruction_sources` for the new project. PDF page counting (pdfium rasterization) is deferred to Phase 2 setup mode; `page_count` is set to 0 at import time.

### Deliverable
You can add kits, create projects, and navigate between zones. The app has a persistent shell to build everything else on.

---

## Phase 1B: Collection Completeness

**Goal**: Full collection management with all three entity types, wishlist system, paint shelf, and Scalemates integration.

### Scalemates integration
- Paste-URL import in Add Kit dialog (fetches name, manufacturer, scale, product code, category, box art)
- Partial imports flagged with inline warnings
- Re-sync on demand for existing kits

### Accessories tab
- Aftermarket items with parent kit links, type badges, owned/wishlist status
- Price, currency, buy URL on wishlisted items

### Paints tab
- Global paint shelf with group by (Color Family | Brand | Project), search, list/grid views, detail panel
- Catalogue lookup (bundled data from Arcturus5404/miniature-paints repo, search box + brand filter dropdown)
- Manual paint entry fallback

### Wishlist system
- Consistent owned/wishlist badges across all three entity types
- Price, currency, buy URL on all wishlisted items
- "Mark as acquired" transitions
- Batch operations for multi-select acquire

### Kit-to-project pipeline
- Accessories linked to kits via `parent_kit_id` can have their own file attachments (manuals, PE instructions, decal placement guides)
- On project creation from a kit: auto-link all accessories with matching `parent_kit_id` via `project_accessories`, and auto-import their file attachments as additional `instruction_sources`
- Kit card accessory tray (UI_DESIGN.md section 27.2) shows linked aftermarket parts; these flow into the project automatically on creation

### Deliverable
Full collection management. All three entity types, wishlists with pricing, paint shelf with catalogue lookup, Scalemates import, and kit-to-project pipeline with automatic accessory and manual import.

---

## Phase 2: Setup Mode

**Goal**: Import your instruction manual, define tracks, and crop every step. The project is ready to build.

### PDF handling (Rust backend)
- Upload one or more instruction PDFs per project; each becomes a named source
- Rasterize PDF pages to PNG at configured DPI; stored in `instructions/<pdf-id>/page-NNN.png`
- Page browser: navigate pages, switch between sources

### Crop tool
- Draw rectangular regions on instruction pages; assign each to a track
- Regions stored as normalized coordinates; full-resolution crop deferred to first display/export
- "Full page" option for steps spanning an entire page
- Image cleanup: paint-over mask per step stored as a layer; source image never modified
- Undo/redo: crop region draw, step create/delete/reorder, track create/delete/reorder, step metadata edits

### Track management
- Create, rename, reorder (drag), delete tracks; each track has a name and color
- Track join point: set the step on another track where this subassembly merges; one per track max
- Standalone option: tracks that never formally merge; no "?" prompt in Assembly Map
- Join point notes

### Step management
- Create steps manually or from crop regions; reorder via drag-and-drop
- Bulk creation: select multiple regions → "Create steps" → assign all to a track at once
- Sub-steps: created via "Add sub-step" in step editor or right-click in step list
- Step editor:
  - Title, source type + source name
  - Adhesive type (predefined dropdown with default drying times, overridable)
  - Pre-paint required flag
  - Quantity (for repeated-action steps)
  - Notes, tags (from predefined tag library)
  - Paint references (populated in Phase 6)
  - Relations: "Blocked by" / "Blocks access to"
  - Replaces step
  - Reference image attachments

### Deliverable
You can import a full instruction manual, crop every step, and organize the build into tracks. The project is structured and ready for Building mode.

---

## Phase 3: Building Mode — Core Loop

**Goal**: Actually build from the app. Work through steps, mark them complete, capture photos. The core loop is end-to-end.

### Layout and navigation
- Zone toolbar: active project dropdown (switch without going to Collection), Setup/Building toggle, Track/Page toggle, camera, help
- Left rail: all tracks listed; active track expanded (step thumbnails + numbers), others collapsed (name + completion fraction); click to switch
- Center: instruction image (zoom/pan with mouse wheel and drag)
- Info bar: step title, adhesive type, pre-paint flag, notes preview (tappable to edit), complete button
- `← / →` to navigate steps within active track; `Space` / `Enter` to complete

### Step completion
- Mark complete → slim non-blocking "Capture your progress?" prompt (auto-dismisses after 4 seconds)
- Un-complete: click completed indicator → confirmation dialog
- Progress photo capture: file picker → stored in `photos/progress/<step-id>_<timestamp>.jpg`; thumbnail generated

### Milestone card
- Fires when all steps in a track are complete
- Options: Capture Photo, Add Note, Continue; stays until dismissed
- Milestone photo stored in `photos/milestones/`; note appended to build log

### State persistence
- Resume restores exact state: active step, zoom level and pan position, Track/Page mode, Setup/Building mode

### Deliverable
The app is useful for a real build. Work through steps, mark them complete, capture photos.

---

## Phase 3.5: Basic Overview

**Goal**: See build progress at a glance. A read-only overview that makes the core build loop more compelling.

### Assembly Map (read-only)
- Horizontal track lines with step nodes: `●` complete, `○` pending, `◆` join event
- Nodes colored by track; join point arrows visible
- Hover: step title tooltip; click: jump to step in Build zone
- Overall completion count + percentage
- No dependency arrows toggle, no zoom controls yet (those come in Phase 5)

### Simplified card grid
- 2×2 grid below Assembly Map: **Gallery**, **Build Log**, **Materials**, **Project Info**
- All cards in compact view only (no expand/collapse yet)
- Gallery: recent photo thumbnails
- Build Log: recent entries with timeline dots (auto-logged step completions only, no composer)
- Materials: accessory and paint counts, needed count
- Project Info: kit name, scale, status badge

### Deliverable
You can see the build structure, track progress visually, and get a quick summary of photos and materials. The Assembly Map gives real feedback during builds.

---

## Phase 4: Building Mode — Enrichment

**Goal**: The full building experience — annotations, references, timers, and all workflow tools.

### Page mode
- Left rail switches to numbered page list; completion indicator per page (✓ = all done, · = partial)
- Source selector at bottom of rail (switch between PDFs)
- Instruction page shown with colored interactive regions per step (track color)
- Click a region to select a step and load info bar; camera disabled until a step is selected
- `◀ / ▶` arrows + page counter (`pg 4/18`) navigate pages; `Tab / Shift+Tab` as shortcuts

### Annotation tools
- **Checkmarks**: click anywhere on instruction image to place a checkmark (no toolbar); persists on step
- **Annotation toolbar** (`A`): circle, arrow, cross-out, highlight, freehand, text; auto-dismisses on step advance

### Reference images (`R`)
- References strip opens alongside instruction image; tap thumbnail for split-screen view
- `+ Add reference` imports a new reference image for the current step on the fly
- Auto-dismisses on step advance

### Info bar (complete)
- Reference count badge (tappable)
- Tags picker (predefined set)
- Paint references (tappable; editable in Building mode — populated in Phase 6)
- Quantity counter `4 / 12` with `+` / `−`; auto-completes at target

### Sub-steps in Building mode
- Center shows parent overview; sub-step rail below image
- Each sub-step has its own instruction image and complete button
- Parent auto-completes when all sub-steps done

### Drying timers
- Floating draggable bubble; position persists across sessions
- Start from step info bar (uses configured adhesive drying time) or from bubble (custom label + duration)
- Collapsed: most urgent timer; Expanded: all active timers + dismiss buttons + "+ Add timer"
- OS notification on completion; bubble pulses
- Completions auto-logged in build log (`T` shortcut to start from current step)

### Deliverable
The complete building experience. Annotations, references, timers, sub-steps, page mode — all workflow tools live.

---

## Phase 5: Overview Zone — Full

**Goal**: The complete Overview experience — expand/collapse cards, full gallery, build log composer, materials management, and project lifecycle actions. Builds on the basic read-only Overview from Phase 3.5.

### Assembly Map (enhanced)
- Adds to Phase 3.5: replaced steps shown with strikethrough; dependency arrows togglable
- Horizontal scroll; fit-to-screen and zoom controls; overall completion count + percentage
- Sub-step indicators on nodes

### Four-card layout (full)
- Adds to Phase 3.5 compact views: expand/collapse interaction (any card expands to fill area, others collapse to thin bars, Escape returns to mosaic)
- Assembly Map always visible

### Gallery card
- **Masonry layout** (expanded): three-column variable-height grid with caption/date overlays
- Photos are a superset: all Build Log photos (tagged "Log") + gallery-only uploads for showcase/reference
- Lightbox: click any photo for full-size with arrow nav, caption, source/milestone badges
- Filters: All | Gallery-only | From Log | Milestones
- Compact: single row of 50px thumbnails with "+N" overflow

### Build Log card
- **Day-grouped journal** (expanded): entries grouped by day with collapsible date headers
- Five entry types with distinct timeline dots:
  - Step completed (auto): track-colored circle with step number in white
  - Note (manual): accent dot, editable text card. Timer completions auto-logged as notes.
  - Photo (manual): accent dot, thumbnail with caption
  - Milestone (auto/manual): track-colored square with flag icon, step count if track completion
  - Build complete (auto): accent star, logged when project marked complete
- Composer at top: Note / Photo / Milestone tabs with type-specific input
- Filters: All | Steps | Notes | Photos | Milestones
- Compact: day headers and timeline at smaller scale, no composer

### Materials card
- BOM with filters: All | Owned | Needed
- Urgency grouping (All and Needed): Building items (accent border), On Shelf items (tertiary), Unlinked items
- In-card acquire interactions: wishlist pills and owned checks clickable
- Shopping list export (Needed filter only): split button with "Copy list" primary + CSV/Markdown dropdown
- Paint palette section: per-build colours, formulas, step references (fully populated in Phase 6)

### Project Info card
- Editable project metadata: name, kit, scale, category, Scalemates URL, product code, notes/build goals
- Project actions: Mark Complete (with hero photo selection), Pause Build, Resume Build
- Danger zone: Archive Project (reversible), Delete Project (confirmation with name typed)
- Compact: kit name, scale badge, category badge, status badge

### Deliverable
Full project visibility. See the build structure, browse all photos, read the complete build history, manage materials, and control the project lifecycle.

---

## Phase 6: Paint Tracking

**Goal**: Know exactly what paint you used, when, and how you mixed it.

### Per-build paint palette
- Direct paints: pull in any paint from global shelf
- Formulas: named custom colour with:
  - Colour name + purpose/stage (e.g. "Winter Dunkelgelb — base coat")
  - Component paints with percentage or ratio
  - Mixing notes (freeform)
- Add colours from global shelf or create new inline
- Managed from Overview → Materials

### Step paint references
- Tag any step with palette entries (in step editor or info bar during Building mode)
- Palette card shows which steps used each colour

### Build log export integration
- Paint palette summary included in exported document

### Deliverable
Complete paint tracking — global shelf, per-build formulas, step-level references. Every colour decision is on record.

---

## Phase 7: Export and Polish

**Goal**: A complete, shareable build document, plus all the finishing details.

### Build log export
- Full export dialog with three-panel layout: section list, section editor, PDF preview (see EXPORT_FEATURE.md for complete specification)
- **PDF**: Typst-rendered, A4, cover page + track sections + gallery + appendix. Full customization: section toggles, photo curation, narrative editing, gallery layout options.
- **HTML**: self-contained single-page with all images base64-embedded; suitable for browser or self-hosted site
- **ZIP**: all photos + narrative Markdown file
- **Quick Export**: one-click export with smart defaults (hero photo as cover, all photos, tracks in display order)
- Export history with "Show in Finder"; same-day exports get `-2`, `-3` suffix

### Advanced step relations
- "Blocked by" / "Blocks access to" soft warnings in Building mode
- Pre-paint + access-seal detection: warn when sealing step would trap an unpainted pre-paint step
- "Replaces step": replaced step gets strikethrough, excluded from count, auto-completes

### Keyboard shortcuts — complete
- All shortcuts wired; `?` overlay shows full table

### First-use onboarding
- Welcome card on first run with Getting Started tips
- Tooltips on first visit to each zone
- Contextual empty states with actionable guidance

### Settings page — complete
- Dedicated full-width page accessible via gear icon in nav bar
- **Appearance**: Theme (Light / Dark / System)
- **Building Defaults**: default scale, auto-status change toggle, drying times (plastic cement 30min, CA 5min, epoxy 60min, white/PVA 45min), PDF DPI (72/150/300, default 150), PDF crop behavior
- **Paint & Catalogue**: default brand, visible catalogue brands (multi-checkbox), auto-add paints from project toggle
- **Currency & Pricing**: default currency (USD/EUR/GBP/JPY/CAD/AUD + freeform ISO 4217), acquire behavior (keep vs clear price)
- **Data & Storage**: project storage location (path + change), auto-save interval (30s/1min/2min/5min), backup ("Back up now" + timestamp), restore ("Import backup" with confirmation)
- **Keyboard Shortcuts**: expandable reference section, two-column table grouped by zone
- All settings auto-save with toast confirmation. Per-section "Reset to defaults" links. "Reset all" at bottom with confirmation.

### Deliverable
A fully polished, complete app. Finish a build, export a shareable document, every edge case handled.

---

## Deferred to v2

| Feature | Notes |
| --- | --- |
| Global search | Command palette (Cmd+K) pattern. Each zone has scoped nav for v1. |
| Multi-kit projects / dioramas | One project = one kit in v1. |
| Custom color family definitions | Settings placeholder exists; full management UI deferred. |
| Notification preferences | No notification system in v1 desktop app beyond OS timer alerts. |
| Keyboard shortcut remapping | Display-only reference table in v1. |

---

## Summary

| Phase | Name | Unlocks |
| --- | --- | --- |
| 1A | Foundation | App shell, basic kit management, project creation |
| 1B | Collection Completeness | Paint shelf, accessories, Scalemates, wishlist system |
| 2 | Setup Mode | PDF import, crop tool, track/step organization |
| **3** | **Building — Core** | **Working build loop (critical path)** |
| 3.5 | Basic Overview | Read-only assembly map, compact summary cards |
| 4 | Building — Enrichment | Annotations, references, timers, page mode |
| 5 | Overview — Full | Expand/collapse cards, gallery, build log composer, materials management |
| 6 | Paint Tracking | Global shelf integration, formulas, step references |
| 7 | Export + Polish | Shareable documents, relations, settings page, onboarding |
