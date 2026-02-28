# Model Builder's Assistant — Implementation Roadmap

Phases are ordered so each one produces something testable and useful on its own. The critical path to a working build experience is Phases 1–3.

---

## Phase 1: Foundation

**Goal**: A working app shell with kit collection management. No building yet — just the infrastructure everything else depends on.

### Database
- Full schema established upfront (all tables, even those used in later phases). One migration file. Later phases only add commands and UI, not schema changes.
- Core tables: `projects`, `tracks`, `steps`, `step_relations`, `step_tags`
- Collection tables: `kits`, `accessories`, `paints`, `project_accessories`, `kit_files`
- Media tables: `instruction_sources`, `instruction_pages`, `progress_photos`, `milestone_photos`, `reference_images`, `annotations`, `masks`
- Build tables: `build_log_entries`, `tags`, `drying_timers`, `export_history`
- Paint tables: `palette_entries`, `palette_components`, `step_paint_refs`
- Settings: `app_settings`, `project_ui_state`

### App scaffold
- Electron project with React 19 + TypeScript + electron-vite
- Three-zone navigation bar (Collection / Build / Overview), always visible
- Active project state: last-resumed project ID stored in `app_settings`; Build and Overview show empty state when none active
- Basic routing: `/collection`, `/build`, `/overview`

### Collection zone
- Sections: Building, On the Shelf, Wishlist, Completed, Accessories, Paints — each collapsible
- Add kit: manual entry form (name, manufacturer, scale, kit number, box art) + Scalemates search import
- Edit and delete kit
- Wishlist: retailer URL, price, notes; "Mark as acquired" moves item to On the Shelf
- Start Build: creates project record, links kit, opens Build zone in Setup mode
- Completed builds: "View" opens Overview; "Resume" sets active project and opens Build
- Global `+` button: quick-add sheet (kit / accessory / paint)
- Accessories section: add PE set, resin, decal set, 3D print; optional parent kit link
- Paints section: paint shelf (brand, name, reference code, type, owned/wishlist status, notes)

### Deliverable
You can manage your entire kit collection — add kits from Scalemates, maintain a wishlist, and create a project. The app has a persistent shell to build everything else on.

---

## Phase 2: Setup Mode

**Goal**: Import your instruction manual, define tracks, and crop every step. The project is ready to build.

### PDF handling (Rust)
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

## Phase 5: Overview Zone

**Goal**: See the entire build at a glance — structure, photos, history.

### Assembly Map
- Horizontal track lines with step nodes: `●` complete, `○` pending, `◆` join event
- Sub-track arrows joining receiving tracks at `◆`; standalone tracks end cleanly; unset joins show dashed `?`
- Replaced steps shown with strikethrough; excluded from completion count
- Nodes colored by track; dependency arrows togglable
- Hover: step title + instruction thumbnail; click: jump to step in Build zone
- Horizontal scroll; fit-to-screen and zoom controls; overall completion count + percentage

### Four-card layout
- 2×2 grid below Assembly Map
- Expand any card to fill the area; others collapse to thin labeled bars; Escape returns to mosaic
- Assembly Map always visible

### Gallery card
- Summary: recent photo grid with milestone section markers
- Expanded: full photo timeline, click for full-screen, right-click → "Set as hero photo"
- Before/after comparison: "Compare" on any step with both a crop and a progress photo; synchronized zoom/pan

### Build Log card
- Summary: chronological entries with icons and dates
- Expanded: step completions, milestone events, timer completions, photo additions, build complete
- Composer for manual entries with optional photos; inline edit/delete
- Export shortcut button (same flow as Export + Settings)

### Materials & Paints card (Phase 5 subset)
- Accessories: linked aftermarket items, per-item step completion fraction, link/unlink
- Kit Info: manufacturer, scale, kit number, box art, markings scheme
- Paint Palette section present but fully populated in Phase 6

### Export + Settings card (Phase 5 subset)
- Project settings: name, start date, project notes
- Mark as complete → build completion flow (confirm, select hero photo, optional export)
- File health check: detect missing/moved files, offer re-link or remove orphan

### Deliverable
Full project visibility. See the build structure, browse all photos, and read the complete build history.

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
- Managed from Overview → Materials & Paints

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
- **HTML**: self-contained single-page with all images embedded; suitable for browser or self-hosted site
- **PDF**: Letter / A4, clean photo grid with captions
- **ZIP**: all photos + narrative Markdown file
- No wizard; smart defaults (hero photo as cover, all photos, tracks in display order)
- Export history in Export + Settings with "Show in Finder"; same-day exports get `-2`, `-3` suffix

### Advanced step relations
- "Blocked by" / "Blocks access to" soft warnings in Building mode
- Pre-paint + access-seal detection: warn when sealing step would trap an unpainted pre-paint step
- "Replaces step": replaced step gets strikethrough, excluded from count, auto-completes

### Search
- `/` from anywhere: full-text search across kits, project names, step titles, step notes

### Keyboard shortcuts — complete
- All shortcuts wired; `?` overlay shows full table

### First-use onboarding
- Tooltips on first visit to each zone
- Contextual empty states with actionable guidance (e.g. "Upload a PDF to get started")

### App Settings — complete
- Tag library (create, rename, delete)
- Default drying times per adhesive type
- File storage location
- PDF rasterization DPI
- Appearance (light / dark / system)

### Deliverable
A fully polished, complete app. Finish a build, export a shareable document, every edge case handled.

---

## Summary

| Phase | Name | Unlocks |
| --- | --- | --- |
| 1 | Foundation | Collection management, project creation |
| 2 | Setup Mode | PDF import, crop tool, track/step organization |
| **3** | **Building — Core** | **Working build loop (critical path)** |
| 4 | Building — Enrichment | Annotations, references, timers, page mode |
| 5 | Overview Zone | Assembly map, gallery, build log |
| 6 | Paint Tracking | Global shelf, formulas, step references |
| 7 | Export + Polish | Shareable documents, relations, search, shortcuts |
