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
- **Create Project dialog**: required fields (project name, kit from shelf or new via manual entry, scale), optional fields (category, product code).
- On creation: shelf kit auto-moves to "Building" status (configurable in Settings). Post-creation landing with suggested next steps.
- **Auto-import kit files**: on project creation, any files attached to the kit via `kit_files` are automatically imported as `instruction_sources` for the new project. PDF page counting (pdfium rasterization) is deferred to Phase 2 setup mode; `page_count` is set to 0 at import time.

### Deliverable
You can add kits, create projects, and navigate between zones. The app has a persistent shell to build everything else on.

---

## Phase 1B: Collection Completeness

**Goal**: Full collection management with all three entity types, wishlist system, and paint shelf.

### Accessories tab
- Aftermarket items with parent kit links, type badges, owned/wishlist status
- Price, currency, buy URL on wishlisted items

### Paints tab
- Global paint shelf with group by (Color Family | Brand | Project), search, list/grid views, detail panel
- Group by Project now implemented: uses `palette_entries` for lightweight project-paint tagging; project tag pills on paint rows/cards, project multi-select in edit dialog
- Catalogue lookup (bundled data from Arcturus5404/miniature-paints repo, search box + brand filter dropdown)
- Manual paint entry fallback

### Wishlist system
- Consistent owned/wishlist badges across all three entity types
- Price, currency, buy/retailer URL on all wishlisted items (kits, accessories, paints) — **done (v0.1.1–v0.1.4)**
- "Mark as acquired" transitions — **done (v0.1.1–v0.1.2)**
- Batch operations for multi-select acquire — **deferred**

### Kit-to-project pipeline
- Accessories linked to kits via `parent_kit_id` auto-linked via `project_accessories` on project creation — **done (v0.1.4)**
- Accessory file attachment import as `instruction_sources` — **deferred to Phase 2**
- Kit card accessory tray (UI_DESIGN.md section 27.2) shows linked aftermarket parts — **done (v0.1.1)**

### Deliverable
Full collection management. All three entity types, wishlists with pricing, paint shelf with catalogue lookup, and kit-to-project pipeline with automatic accessory linking.

---

## Phase 2: Setup Mode

**Goal**: Import your instruction manual, define tracks, and crop every step. The project is ready to build.

### Phase 2A (COMPLETE): PDF Import & Page Viewer — v0.2.0
- MuPDF PDF rasterization, Konva canvas with zoom/pan/rotate
- Page navigator, source manager, build toolbar
- Keyboard shortcuts (Tab, +/-, 0, R)

### Phase 2B (COMPLETE): Track & Step Foundation
- Track/step Rust backend (CRUD queries, commands, types, API wrappers)
- Track rail UI (200px panel, add/rename/color/delete dialogs, progress bars)
- Step store integration (steps[], activeStepId, CRUD actions in build-slice)
- Step UI components: StepItem, StepCompletionMarker, StepEditorPanel
- Step display in track rail (expanded under active track, "+ Add step" as secondary method)

### Phase 2C (COMPLETE): Canvas Crop Tool & Step Creation
- **Selection-first workflow**: Canvas crop tool is the primary way to create steps — draw a rectangle on the instruction PDF, step is created instantly on the active track
- View/Crop mode toggle (toolbar buttons + C/V keyboard shortcuts)
- Crop regions rendered on canvas with track-colored borders and labels (visible in both modes)
- Full-page step shortcut (toolbar button + F key)
- Coordinate system: crop data stored in image-space, rendered in effective-space with rotation support
- Escape key to deselect step or exit crop mode
- CropLayer (Konva Layer) and CropRegion (Konva Group) components with inverse-zoom-scaled labels

### Phase 2D (COMPLETE): Crop Region Resize & Reposition
- Resize handles on selected crop regions via Konva Transformer (8 handles, no rotation)
- Drag to reposition selected crop regions
- Inverse coordinate conversion (effective-space → image-space) for all rotation angles
- Zoom-independent handle sizing

### Phase 2D-remaining (COMPLETE): Selection, Editing & Polish
- Track reassignment via editor dropdown (step moves to end of destination track, counts refresh)
- Bidirectional rail↔canvas sync (step selection navigates to page + expands track)
- Crop preview in step editor panel (canvas-rendered thumbnail, skeleton, page badge, click-to-navigate)
- Page number badges on steps in rail (P1, P3, etc.)
- Navigate-to-page from rail

### Phase 2E (COMPLETE): Bulk Operations, Reorder & Cross-Track Drag
- Multi-select steps (Cmd+click, Shift+click), bulk delete
- Drag-reorder steps within tracks, cross-track drag-and-drop (single or multi-select)
- Multi-track expansion (click to toggle, Cmd+click for exclusive), expand/collapse all buttons
- Undo last crop (Cmd+Z)
- Keyboard shortcut help dialog (?)

### Phase 2F (COMPLETE): Tags, Reference Images & Drag-to-Nest — v0.2.5–v0.2.6
- Tags: predefined tag library, tag picker in step editor, step_tags persistence
- Reference image attachments: per-step reference images, file picker, thumbnails, captions, display in editor panel
- Sub-steps: "Add sub-step" in step editor, nested indentation in rail, drag-to-nest/un-nest with drop indicator, drag/reorder within parent

### Phase 2G (COMPLETE): Join Point Indicators & Crop-to-Step — v0.2.7
- Track join points: incoming/outgoing directional markers with color bars, collapsed label
- Crop-to-existing-step: click empty crop preview to assign crop to existing step
- Crop tool always creates root-level steps

### Phase 2H (COMPLETE): Step Relations, Progress Ring & Quantity Counter — v0.2.8
- Step relations: "Blocked by" / "Blocks access to", replaces step — bidirectional display with semantic labels, editable from both ends, chip navigation
- Sub-step progress ring: circular progress arc on parent completion marker fills as sub-steps complete (informational, no auto-completion)
- Quantity counter: +/− buttons in step editor, fraction label on rail, progress ring fills proportionally

### Deferred to Phase 4+
- Image cleanup: paint-over mask per step stored as a layer; source image never modified (full UX in Phase 4 Building mode)

### Deliverable
You can import a full instruction manual, crop every step, organize into tracks with sub-steps, define relationships, and attach references. The project is structured and ready for Building mode.

---

## Phase 3: Building Mode — Core Loop (COMPLETE — v0.3.0–v0.3.3)

**Goal**: Actually build from the app. Work through steps, mark them complete, capture photos. The core loop is end-to-end.

### 3A (COMPLETE): Mode Toggle + Layout + Navigation — v0.3.0
- Setup/Building toggle: SegmentedPill in toolbar with Settings2/Hammer icons
- `build_mode` persisted in `project_ui_state` (DB), hydrated on project load
- Building mode hides setup-only tools (crop, full page, sources, upload PDF)
- Canvas guard: crop mode blocked in building mode; C/F keys no-op
- Layout switch: setup shows TrackRail + Canvas + StepEditorPanel; building shows BuildingRail + CropCanvas + StepPanel
- Navigation bar (bottom of canvas column, ~30px): prev/next buttons + "Step N of M" + track dot/name
- Keyboard navigation: `↓`/`↑` next/prev step, `Shift+↓`/`Shift+↑` next/prev incomplete, `←`/`→` switch track, `Space`/`Enter` complete, `+`/`-` quantity, `Cmd+`/`Cmd-` zoom, `0` fit-to-view, `?` shortcuts
- Rail auto-scrolls to keep active step visible
- Empty states: "Add steps in Setup mode to start building" when no steps; single track hides dropdown
- State persistence: resume restores active step, active track, zoom, pan, build mode (add `active_track_id` to `project_ui_state`)

### 3B (COMPLETE): Building Rail + Canvas — v0.3.1–v0.3.2
- **Building rail (single-track view)** with Popover dropdown selector in header
- Track selector: 8px color dot + bold name + done/total count; completed tracks show checkmark in success green
- Dropdown shows project-wide total at top (e.g. "8/24 overall")
- **Step rows**: fixed height, 6px vertical padding. Thumbnail left (36px height, width varies by aspect ratio: 54×36 wide, 36×36 square, 27×36 tall), title right
- **Thumbnails as CSS-clipped images** (crop from source page PNG). Annotation compositing deferred to Phase 4
- Thumbnail states: done (45% opacity), active (full opacity + 1.5px accent border + glow), pending (full opacity + standard border)
- Title states: done (text-tertiary, 400), active (accent, 600 + "Step N of M" secondary line, top-level only), pending (text-primary, 400)
- Pre-paint: 5px amber dot, right-aligned, tooltip on hover
- Sub-steps: indented rows visible, expand/collapse when parent is active
- **Join indicators**: minimal inline rows, clickable (switches track + selects join step). Inbound: 3×18px bar in source color + down-arrow + track name (success green + checkmark if source complete). Outbound: right-arrow + 3×18px bar in destination color + track name. 2px vertical margin
- No editing controls (no add/delete/drag/context menu)
- **Canvas** shows **crop region for the active step**, fit-to-view by default, zoom/pan enabled
- **Floating relation pill**: amber pill overlaid top-center of crop, auto-dismisses, re-shows on return. Clickable to navigate to blocking step
- **"Show Full Page" button**: opens full-screen modal showing entire instruction page with crop region highlighted
- Steps without crops: placeholder with step title centered
- Step transitions: subtle crossfade between steps

### 3C (COMPLETE): Step Panel + Completion Flow — v0.3.2–v0.3.3
- **Step Panel (right, 280px)**: all step context + completion action. Only sections with data are rendered:
  - Step header + Complete button (Start Timer button hidden until Phase 4)
  - Quantity tracker (pips + count + +/-)
  - Sub-step checklist (collapsible, expanded when parent active)
  - Relations (clickable chips, amber for blocked_by, accent for blocks_access_to)
  - Before/after comparison (for steps with replaces_step_id)
  - Details (adhesive, drying time, source, pre-paint pill, tags)
  - Notes (full text)
  - Reference images (masonry two-column grid)
- **Step completion flow**:
  - Complete → auto-advance to next incomplete step
  - Slim non-blocking "Capture your progress?" toast (auto-dismisses after 4s)
  - Progress photo capture: file picker → copy to stash (reuses reference image infrastructure) → `progress_photos` table
  - Un-complete: click completed marker → confirmation dialog
- **Milestone card**: fires when all steps in a track are complete
  - Options: Capture Photo, Add Note, Continue; stays until dismissed
  - Milestone photo stored in stash → `milestone_photos` table; note appended to build log

### Deliverable
The app is useful for a real build. Work through steps, mark them complete, capture photos.

### Deferred to Phase 4
- Drying timer service + floating bubble + Start Timer button
- Annotation compositing on thumbnails (upgrade CSS-clip to Konva-render)
- Annotation hint overlay on canvas

---

## ~~Phase 3.5: Basic Overview~~ COMPLETE (v0.4.4)

**Goal**: See build progress at a glance. A read-only overview that makes the core build loop more compelling.

### ~~Assembly Map (read-only)~~
- ~~Horizontal track lines with step nodes: `●` complete, `○` pending, `◆` join event~~
- ~~Nodes colored by track; join point arrows visible~~
- ~~Hover: step title tooltip; click: jump to step in Build zone~~
- ~~Overall completion count + percentage~~
- ~~No dependency arrows toggle, no zoom controls yet (those come in Phase 5)~~

### ~~Simplified card grid~~
- ~~2×2 grid below Assembly Map: **Gallery**, **Build Log**, **Materials**, **Project Info**~~
- ~~All cards in compact view only (no expand/collapse yet)~~
- ~~Gallery: recent photo thumbnails~~
- ~~Build Log: recent entries with timeline dots (auto-logged step completions only, no composer)~~
- ~~Materials: accessory and paint counts, needed count~~
- ~~Project Info: kit name, scale, status badge~~

### Deliverable
~~You can see the build structure, track progress visually, and get a quick summary of photos and materials. The Assembly Map gives real feedback during builds.~~

---

## Phase 4: Building Mode — Enrichment

**Goal**: The full building experience — annotations, timers, page mode, and all workflow tools. Builds on the core loop from Phase 3.

### ~~Drying timers~~ DONE (Phase 4A — v0.4.0)
- ~~Global timer service: Zustand slice with setInterval tick, OS notifications, build log integration~~
- ~~Auto-start on step completion with adhesive-based defaults; Start Timer button; T shortcut~~
- ~~Floating draggable bubble with cancel-on-hover, track colors, adhesive labels, click-to-navigate~~
- ~~Focus-on-crop: clicking a step in setup mode centers canvas on crop region~~

### ~~Annotation tools~~ DONE (Phase 4B — v0.4.1)
- ~~**Checkmarks**: click anywhere on instruction image to place a checkmark; persists on step~~
- ~~**Annotation toolbar**: circle, arrow, cross-out, highlight, freehand, text; always visible with tool/color/stroke pickers~~
- ~~**Thumbnail compositing**: upgrade CSS-clipped thumbnails in building rail to Konva-rendered (includes annotation marks)~~
- ~~Drag to reposition, undo/redo stacks, stroke width presets, pinch-to-zoom~~

### ~~Page mode~~ DONE (Phase 4C — v0.4.2)
- ~~Left rail switches to numbered page list; completion indicator per page (checkmark = all done, dot = partial)~~
- ~~Source selector at bottom of rail (switch between PDFs)~~
- ~~Instruction page shown with colored interactive regions per step (track color)~~
- ~~Click a region to select a step and load step panel~~
- ~~Arrow/page counter navigate pages; `Tab / Shift+Tab` as shortcuts~~

### Step panel enhancements
- Paint references (tappable; editable in Building mode — populated in Phase 6)
- ~~Quantity counter~~ DONE (Phase 2H setup + Phase 3C step panel)
- ~~Reference images~~ DONE (Phase 3C step panel)
- ~~Sub-step checklist~~ DONE (Phase 3C step panel)

### Deliverable
The complete building experience. Annotations, timers, page mode — all workflow tools live.

---

## Phase 5: Overview Zone — Full

**Goal**: The complete Overview experience — focus mode for cards, full photo gallery with masonry layout, build log composer, materials BOM, and project lifecycle actions. Builds on the basic read-only Overview from Phase 3.5.

### Phase 5A: Focus Mode + `update_project` Backend — v0.5.0
- **Focus mode**: clicking a card expands it to fill the full grid area; other cards hide entirely; back button (←) + Escape returns to 2×2 mosaic
- Assembly Map stays visible above the focused card
- `focusedCard` state in overview-slice (null for mosaic, card name for focused)
- **`update_project` Rust backend**: UpdateProjectInput model, update query (fetch-merge-UPDATE), command, API wrapper, store action
- No new migration needed — all project columns already exist

### Phase 5B: Project Info Card (Expanded) — v0.5.1
- **Expanded view**: inline-editable fields (name, notes/goals, category select, Scalemates URL, product code)
- **Status actions**: Mark Complete (sets completion_date, syncs kit to "completed"), Pause Build, Resume Build
- **Delete Project**: danger zone with typed-name confirmation dialog, navigates to Collection after delete
- Archive deferred

### Phase 5C: Build Log Composer + Filters — v0.5.2
- **Composer**: text input for notes + camera/photo button; after picking a photo, inline caption field slides in before confirming
- **Backend extension**: extend `add_build_log_entry` to accept optional `source_path` + `caption` (columns already exist, currently hardcoded NULL); stash with `log_` prefix
- **Filter pills**: All | Steps | Notes | Photos | Milestones (client-side)
- **Expanded view**: composer at top, filters below, scrollable day-grouped full entry list
- **Compact view**: unchanged (day-grouped recent entries)

### Phase 5D: Gallery Card — v0.5.3
- **Three photo sources merged**: progress photos (auto-captioned from step title), milestone photos (auto-captioned from track name), gallery-only uploads (user-entered captions via `gallery_photos` table)
- **Masonry layout** (expanded): 3-column shortest-column-first algorithm, natural aspect ratios
  - Milestone photos span 2 columns as visual anchors
  - Tile treatment: bottom gradient overlay with caption + date, 3px track-color bar, hover scale-up (1.02)
  - Star icon in top-right corner, milestone flag badge in top-left
- **Compact view — featured mosaic**: asymmetric grid (1 hero photo at 60% width + 2 smaller stacked + overflow count)
- **Starring system**: star toggle on any photo (all 3 types), starred sort to top, `is_starred` column on all photo tables (migration V6)
- **Cover photo**: one designated cover via `hero_photo_path` on projects (column already exists), used as compact hero, "Set as cover" in lightbox
- **Gallery uploads**: "+ Add Photo" button (file picker, stash with `gal_` prefix, insert into `gallery_photos`), inline caption input after upload, bulk drag-and-drop onto gallery area
- **Filters**: All | Starred | Gallery | Progress | Milestones + track dropdown
- **Sort**: newest first (default), oldest-first toggle
- **Lightbox**: source badge + track color dot, star toggle, set as cover, edit caption (gallery only), delete (gallery only)
- **Header stats**: "47 photos · 3 weeks of building"
- **Empty state**: camera icon + "Capture your build journey" + tips + Add Photo button
- **Unified backend**: SQL UNION ALL query across 3 photo tables returning `UnifiedGalleryItem` type
- Compare mode deferred to polish pass

### Phase 5E: Materials Card (Expanded) — v0.5.4
- **Expanded view**: scrollable BOM list — accessories with type badges + owned/wishlist status, paints with color swatches + brand
- **Filter pills**: All | Owned | Needed (client-side)
- **"Copy Shopping List" button**: formats needed items as plain text, copies to clipboard via `navigator.clipboard.writeText()`, toast confirmation
- CSV/Markdown export deferred to Phase 7

### Phase 5F: Assembly Map Enhancements — v0.5.5
- **Replaced step styling**: strikethrough + dimmed (0.3 opacity) for steps replaced by another
- **Sub-step indicators**: small count label below nodes with children
- **Dependency arrows toggle**: button in header (off by default), draws SVG arrows between related steps; requires new `list_project_step_relations` Rust query
- **Zoom controls**: +/− buttons controlling CSS `transform: scale()` (0.5x–2x)
- **Fit-to-screen button**: calculates scale to fit all nodes in container

### Deliverable
Full project visibility. Curated photo gallery with masonry layout, build log with composer, materials BOM with shopping list, editable project info with lifecycle actions, and enhanced assembly map.

---

## Phase 6: Paint Tracking

**Goal**: Know exactly what paint you used, when, and how you mixed it.

### Per-build paint palette
- Basic palette_entries (simple paint → project links with `is_formula=0`) already exist from Phase 1B-2 for project tagging and Group by Project in the paint shelf
- Direct paints: pull in any paint from global shelf — basic version already done via edit dialog multi-select
- Phase 6 enriches palette_entries with purpose names, formulas (`palette_components`), mixing notes, and step references (`step_paint_refs`)
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

## Phase 7: Settings, Relations and Polish

**Goal**: Advanced step relation warnings, full settings page, keyboard shortcut completeness, and onboarding. Make the app feel complete before tackling export.

### ~~7A: Advanced Step Relations~~ COMPLETE

#### ~~Completion warning dialog~~
- ~~Unified confirmation dialog fires when completing a step that has relation issues (button click or Space/Enter)~~
- ~~**Blocked by**: lists incomplete blocker steps with completion markers — user can check them off directly in the dialog to resolve blockers inline~~
- ~~**Blocks access to**: lists incomplete steps that will lose access, shown in a separate section below blocked-by~~
- ~~**Pre-paint trapping**: access-sealed steps with `pre_paint=true` get red/danger highlight + "Unpainted area will be sealed!" callout~~
- ~~Dialog shows only sections with issues; if no issues, step completes normally (no dialog)~~
- ~~Buttons: Cancel (default) / Complete Anyway~~

#### ~~Replaces step enhancements~~
- ~~Replaced steps show strikethrough + dimmed (0.4 opacity) in BuildingRail (already done in AssemblyMap)~~
- ~~Replaced steps excluded from `step_count`/`completed_count` in track SQL query~~
- ~~Replaced steps skipped during auto-advance after completion~~
- ~~"Replaces" label shown on the replacing step in BuildingRail~~

### 7B: Settings Page
- **Layout**: 200px sidebar navigation (matching building rail width) + scrollable content area
- **Appearance**: Theme picker (placeholder until Phase 8 — shows "Default" only)
- **Building**: Auto-start drying timers toggle (default ON), drying time defaults per adhesive type (compact editable table with Save + Reset to defaults), completion photo prompt toggle (default ON — the "Capture your progress?" toast after step completion), auto-log control (3 individual toggles for step completions, milestones, timer expirations — all default ON)
- **Track Colors**: Editable 8-color palette with hex color picker, reset to defaults button
- **Step Tags**: Manage the predefined tag library — add custom tags, remove built-in tags, rename tags
- **Defaults**: Default currency dropdown (~10 common currencies: USD, EUR, GBP, AUD, CAD, JPY, CNY, KRW, SEK, PLN)
- **Wishlist**: Acquire behavior toggle — when marking a wishlist item as owned, preserve or clear price/retailer data
- **PDF Import**: Render DPI selector (72/150/300) — existing, moved into new layout
- **Data & Storage**: Database location (read-only + Show in Finder), storage usage stats (DB file size, stash folder size, photo count), full backup export as ZIP (DB + stash images), restore from backup with count comparison diff (projects, kits, paints, accessories, photos) and confirmation dialog
- **About**: App version
- All settings auto-save with immediate persistence (except drying times table which has explicit Save)

**Behavioral persistence** (implemented alongside, no settings UI):
- Remember last-used annotation color + stroke width across sessions (stored in `app_settings`)
- Remember assembly map zoom level + pan position per project (stored in `project_ui_state`)

### 7C: Keyboard Shortcuts
- All shortcuts wired; `?` overlay shows full table
- Two-column table grouped by zone

### 7D: Onboarding
- Welcome card on first run with Getting Started tips
- Tooltips on first visit to each zone
- Contextual empty states with actionable guidance

### Deliverable
A fully polished, complete app. Every edge case handled, settings dialled in, step relation warnings live, new users guided through first use.

---

## Phase 8: Theme System

**Goal**: A fully themeable app with 7 built-in themes — 3 light, 4 dark — including hobby-themed palettes that reflect scale modelling culture.

### Theme architecture
- All ~20 color tokens are CSS custom properties (already in `@theme` block in `index.css`)
- Each theme is a TypeScript object mapping CSS variable names to hex values
- Applying a theme sets all variables on `document.documentElement` at runtime
- Active theme ID stored in `app_settings` (key: `theme`, default: `"default"`)
- Tailwind v4 utility classes automatically use the CSS variables — no component changes needed
- Konva canvas reads accent color from a `useTheme()` hook for crop regions, annotations, and step overlays

### Built-in themes

| # | ID | Name | Type | Accent | Inspiration |
|---|-----|------|------|--------|-------------|
| 1 | `default` | Default | Light | Teal-gray `#4E7282` | IJN Kure Grey (Tamiya XF-75) |
| 2 | `claude-light` | Claude Light | Light | Terracotta `#D97757` | Claude's interface |
| 3 | `claude-dark` | Claude Dark | Dark | Terracotta `#D97757` | Claude's interface |
| 4 | `blueprint` | Blueprint | Dark | Cyan `#38BDF8` | Engineering drawings |
| 5 | `us-army` | US Army | Dark | Brass `#C8B46A` | Military field manuals |
| 6 | `quarterdeck` | Quarterdeck | Dark | Orange `#E05C1C` | Naval signal flags on steel hull |
| 7 | `instruction-sheet` | Instruction Sheet | Light | Red `#C8200C` | Tamiya instruction manual callouts |

Full color specifications for all 7 themes in UI_DESIGN.md section 37.

### Settings integration
- Theme picker in Settings → Appearance (from Phase 7B)
- Each theme shown as a selectable card with name, swatch strip (background + card + accent + text), and Light/Dark label
- Active theme has accent border + checkmark
- Clicking a theme applies it immediately

### Dark theme adjustments
- Shadows: increased opacity for definition on dark surfaces
- Status colors: `status-building` = accent, `status-completed` = success, `status-shelf` stays neutral
- Accessory type colors: lightened ~15% for dark themes
- Semantic backgrounds (badges, alerts): opacity increased from ~10% to ~15%

### Exceptions
- Instruction pages stay white (source material, not app chrome)
- User photos are never tinted
- Track colors are user data, used as-is regardless of theme

### Deliverable
The app has a distinct visual identity that users can personalize. Hobby-themed palettes give the app character and connect it to the modelling community.

---

## Phase 9: Export

**Goal**: A complete, shareable build document. Finish a build, export it.

### Build log export
- Full export dialog with three-panel layout: section list, section editor, PDF preview (see EXPORT_FEATURE.md for complete specification)
- **PDF**: Typst-rendered, A4, cover page + track sections + gallery + appendix. Full customization: section toggles, photo curation, narrative editing, gallery layout options.
- **HTML**: self-contained single-page with all images base64-embedded; suitable for browser or self-hosted site
- **ZIP**: all photos + narrative Markdown file
- **Quick Export**: one-click export with smart defaults (hero photo as cover, all photos, tracks in display order)
- Export history with "Show in Finder"; same-day exports get `-2`, `-3` suffix
- Paint palette summary included in exported document

### Deliverable
Shareable build documents in multiple formats. Every colour decision, photo, and step is captured in the export.

---

## Deferred to v2

| Feature | Notes |
| --- | --- |
| Global search | Command palette (Cmd+K) pattern. Each zone has scoped nav for v1. |
| Multi-kit projects / dioramas | One project = one kit in v1. |
| Custom color family definitions | Settings placeholder exists; full management UI deferred. |
| Notification preferences | No notification system in v1 desktop app beyond OS timer alerts. |
| Keyboard shortcut remapping | Display-only reference table in v1. |
| Custom themes | User-defined color palettes beyond the 7 built-in themes. |

---

## Summary

| Phase | Name | Unlocks |
| --- | --- | --- |
| 1A | Foundation | App shell, basic kit management, project creation |
| 1B | Collection Completeness | Paint shelf, accessories, wishlist system |
| 2A–2H | Setup Mode | PDF import, crop tool, track/step organization, tags, references, relations, quantity |
| ~~3~~ | ~~Building — Core~~ | ~~Working build loop (critical path)~~ DONE |
| ~~3.5~~ | ~~Basic Overview~~ | ~~Read-only assembly map, compact summary cards~~ DONE |
| ~~4~~ | ~~Building — Enrichment~~ | ~~Annotations, references, timers, page mode~~ DONE |
| 5 | Overview — Full | Focus mode, masonry gallery, build log composer, materials BOM, project lifecycle |
| ~~6~~ | ~~Paint Tracking~~ | ~~Global shelf integration, formulas, step references~~ DONE |
| ~~7A~~ | ~~Advanced Step Relations~~ | ~~Completion warnings, replaced step enhancements~~ DONE |
| 7B–7D | Settings + Polish | Settings page, keyboard shortcuts, onboarding |
| 8 | Theme System | 7 built-in themes (3 light, 4 dark), hobby-themed palettes, CSS variable architecture |
| 9 | Export | Shareable documents (PDF, HTML, ZIP), export dialog, quick export |
