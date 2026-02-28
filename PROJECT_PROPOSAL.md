# Model Builder's Assistant — Next Generation

## Project Proposal

A desktop application for scale model builders that serves as a digital companion throughout the entire lifecycle of a build — from kit acquisition through construction to sharing the finished result. The app organizes around three zones that mirror the physical experience of the hobby: your collection, your workbench, and your big picture.

---

## Executive Summary

Scale model building is a detail-oriented visual craft. Builders work from instruction manuals, juggle parallel subassemblies, and want to document their progress — but existing tools either treat it like generic project management or don't exist at all.

This app is purpose-built for the hobby. It manages your kit collection, guides you through builds with your instruction manual as the primary interface, lets you annotate and mark up instructions as you work, tracks subassembly convergence visually, captures progress photos at natural moments, and exports shareable build logs when you're done.

The experience is organized into three zones:

- **Collection** — All your kits, paints, and accessories in one place: wishlisted, owned, in-progress, and completed
- **Build** — The active workspace where you work through steps with the instruction image front and center
- **Overview** — A single-screen project dashboard showing assembly structure, photos, parts, and build history

**Active project**: Build and Overview always refer to the currently active project — whichever one you most recently resumed or started. The nav buttons (Build, Overview) take you directly to that project's zones. If no project is active, those zones display an empty state prompting you to select one from Collection. Clicking Resume on any active build in Collection sets that project as active and opens it in the Build zone. A project name dropdown in the Build zone toolbar lets you switch between in-progress projects without leaving Build.

---

## The Three Zones

### Zone 1: Collection

The home screen. A unified surface for your entire kit collection and all your projects. No separate "dashboard" and "stash" — everything lives on one shelf.

**Layout**: A single vertically-scrolling page. Each section (Building, On the Shelf, Wishlist, etc.) has a header and expands inline. A global `+` button (top right or floating) opens a quick-add sheet where you choose what to add: kit, accessory, or paint. Scalemates search and manual entry are both accessible from this sheet.

**Sections**:

- **Building** — Active projects displayed with their latest progress photo as the cover image, a progress bar, and kit metadata (manufacturer, scale, kit number)
  - "Resume" button restores the Build zone to the exact state you left it: same step, same zoom level and pan position, same mode
- **On the Shelf** — Owned kits not yet started
  - "Start Build" creates a project, links the kit, imports any attached instruction PDFs as source pages (rasterizing them into the project's instructions directory), prompts for a markings scheme, and opens the Build zone in Setup mode. If no PDFs are attached to the kit, the project opens in Setup mode with an empty state and an "Upload instructions" prompt.
- **Wishlist** — Kits you want to acquire
  - Retailer URL links, pricing (manually recorded), notes
  - "Mark as acquired" button on each item — moves it to On the Shelf immediately
- **Completed** — Finished builds displayed with a user-selected hero photo
  - "View" opens the Overview for that build. "Resume" also works — completed builds are fully accessible in the Build zone. You can still navigate steps, add photos, edit notes, and re-open them in Build.
  - A build is marked complete manually by the user (via the Export + Settings card in Overview). On completion: a dialog prompts to confirm, select a hero photo (from the gallery or upload a new one), and optionally export the build log. A "Build complete" entry is added to the build log. The project moves to the Completed section.
- **Accessories** — Aftermarket items: PE sets, resin kits, decal sets, 3D-printed sets, etc.
  - Parent kit is optional — accessories designed for a specific kit are grouped under it; generic or multi-use accessories (e.g. generic stowage sets) are listed without a parent
  - Can be linked to any project
  - Paints are **not** in this section — see Paints below
- **Paints** — Global paint shelf. Not grouped under any kit; managed independently across all builds
  - Each entry: brand, colour name, manufacturer reference code (e.g. `XF-69`, `70.896`), paint type (acrylic / enamel / lacquer / oil)
  - Owned / wishlist status
  - Notes (e.g. "getting low", "discontinued — use XF-4 as substitute")
  - The paint shelf feeds the per-build paint palette in every project (see Paint Tracking)

**Capabilities**:

- Full-text search across all kits and projects
- Filters by type (base kit, PE set, resin/3D print, decal set, paint, accessory), status (on shelf / building / completed / wishlist), scale, manufacturer
- Scalemates integration — paste a URL or search to import kit metadata (name, manufacturer, scale, kit number, box art) automatically
- Manual kit entry for items not on Scalemates
- Instruction PDF and image attachment per kit — these auto-import as source pages when starting a build
- Kit-to-project linking — see which project a kit is being used in, and which kits are associated with a project

---

### Zone 2: Build

The workspace where building happens. This is where you spend 80%+ of your time in the app. It has two modes: **Setup** (for organizing the project) and **Building** (for actually working through steps). These reflect two genuinely different activities that happen at different times — setup is front-loaded when you start a project, and building is the ongoing experience.

#### Setup Mode

Used when preparing a project: uploading instruction PDFs, cropping step images, creating tracks, organizing steps, configuring step metadata. Optimized for information density and bulk operations.

**Layout**: Three panels — track/step list on the left, instruction page with crop tools in the center, full step editor on the right.

**Capabilities**:

- **PDF upload and page management**
  - Upload instruction PDFs; pages are automatically rasterized into individual images
  - Page browser for navigating through the instruction manual
  - Support for multiple PDFs per project (base kit instructions, PE instructions, aftermarket instructions) — each PDF is a named source; the page browser includes a source selector to switch between them
- **Crop tool**
  - Draw rectangular regions on instruction pages to define step images
  - Assign each region to a track
  - Crop regions stored as normalized coordinates; cropping performed at full resolution when the step image is first displayed or exported
  - "Full page" option for steps that span an entire instruction page
  - Undo/redo in Setup mode covers: crop region drawing, step creation/deletion/reorder, track creation/deletion/reorder, and step metadata changes. Building mode actions (step completion, photo capture) are not in the undo stack — un-completing a step is its own explicit action.
  - **Image cleanup within a crop** — after cropping a region, paint over areas to mask out visual noise bleeding in from adjacent steps (callout arrows, part numbers from neighbouring diagrams). The mask is stored as a layer; the source image is never modified.
- **Track management**
  - Create, rename, reorder, and delete tracks (subassemblies)
  - Each track has a name, color, and display order
  - **Track join point** — each track has at most one join point: the step at which this subassembly is incorporated into another track (e.g. "Interior joins Hull at step 22"). Mid-build cross-track dependencies — where a step in one track must complete before a step in another can proceed — are handled by the dependency graph, not additional join points.
  - **Standalone option** — tracks that never formally merge (e.g. a "Details" track that adds scattered items throughout) can be marked as "Standalone — no join." The Assembly Map shows a clean line end for standalone tracks with no "?" prompt.
  - Join point notes for describing the merge
- **Step management**
  - Create steps manually or from crop regions
  - Reorder steps via drag-and-drop
  - **Sub-steps** — a step can contain ordered child steps. The parent step acts as a container; completing all sub-steps auto-completes the parent. Sub-steps each have their own instruction image, notes, and metadata. Created via an "Add sub-step" button in the step editor, or by right-clicking a step in the left panel.
  - **Bulk step creation** — draw multiple crop regions on a page, then select all and click "Create steps." A dialog lets you assign all selected regions to a track at once; each region becomes a step in sequence. Useful for quickly processing a full page of steps.
- **Step editor** (full form, right panel)
  - Title
  - Source type: base kit / photo-etch / resin & 3D printed / aftermarket / custom/scratch
  - Source name (e.g. "Aber PE set #35xxx")
  - Adhesive type — predefined dropdown (None / Liquid cement / Tube cement / CA thin / CA medium–thick / Epoxy / PVA / Custom) with a default drying time pre-filled per type; user can override the duration
  - Pre-paint required flag — shows a paint brush indicator on the step. The app issues a soft warning when another step's "blocks access to" relation would seal off this area before it has been painted.
  - Quantity — optional count for repeated-action steps (e.g. 12 road wheels). In Building mode, a +/− counter appears in the info bar; the step auto-completes when the count reaches the target.
  - Notes (freeform text)
  - Tags — select from a predefined tag set managed in app settings (e.g. "pre-paint", "dry-fit", "drying", "fragile")
  - Paint references — tag which colours from the project's paint palette were used in this step
  - Relations:
    - "Blocked by" — this step cannot proceed until the listed steps are done. Building mode warns (but allows) if you complete this step with unmet prerequisites.
    - "Blocks access to" — completing this step physically seals off the listed steps' areas. Building mode warns you if any of those steps have the pre-paint flag set and are not yet done.
  - Replaces step — link this step as a replacement for a base kit step (e.g. a PE grille replacing the kit's plastic part). The replaced step is shown with a strikethrough in the Assembly Map, excluded from the completion count, and auto-completed when this step is completed.
  - Reference image attachments

---

#### Building Mode

Used when you're at the bench doing the actual work. Optimized for the instruction image being as large and clear as possible, with minimal surrounding UI. The app should feel like having your instruction manual open with nothing else in the way.

**Layout**: A zone toolbar at the top contains the active project selector, mode controls, and the camera. Below that, a thin rail on the left and the instruction image on the right. A compact info bar at the bottom holds step-specific controls.

**Track mode** (navigate by subassembly):

```text
┌──────────────────────────────────────────────────────────────┐
│  ▾ Tiger I (Tamiya)  [Setup|Building]  [Track|Page]  [📷][?] │ ← zone toolbar
├──────────────┬───────────────────────────────────────────────┤
│ ● Hull(14/22)│                                               │
│  [img] 13 ✓ │                                               │
│  [img] 14 ✓ │        Instruction Image                      │
│  [img]→15   │        (zoomable, pannable,                   │
│  [img] 16   │         annotatable)                          │
│  [img] 17   │                                               │
│ ○ Turret     │   ◀ prev       15/22        next ▶           │
│ ○ Interior   ├───────────────────────────────────────────────┤
│ ○ Details    │   Step 15: Glue upper hull              [✓]  │
└──────────────┴───────────────────────────────────────────────┘
```

**Page mode** (navigate by instruction page):

```text
┌──────────────────────────────────────────────────────────────┐
│  ▾ Tiger I (Tamiya)  [Setup|Building]  [Track|Page]  [📷][?] │ ← zone toolbar
├──────────────┬───────────────────────────────────────────────┤
│   pg  1      │                                               │
│   pg  2  ✓  │                                               │
│   pg  3  ✓  │        Instruction Page 4                     │
│  ►pg  4      │        (zoomable, pannable)                   │
│   pg  5      │                                               │
│   pg  6      │  ┌── Hull step 8 ─────────────────────────┐  │
│   pg  7      │  └────────────────────────────────────────┘  │
│   pg  8      │  ┌── Turret step 3 ──────┐                   │
│              │  └────────────────────────┘                   │
│ ▾ Base kit   │   ◀ prev      pg 4/18       next ▶           │
│              ├───────────────────────────────────────────────┤
│              │   Step 8: Glue upper hull              [✓]   │
└──────────────┴───────────────────────────────────────────────┘
```

**Zone toolbar** (always visible at the top of the Build zone):

- **Active project dropdown** — shows the current project name; click to switch to any other in-progress project without going to Collection
- Setup / Building mode toggle
- Track / Page mode toggle
- `📷` Camera button — opens the file picker; photo added as a progress photo for the current step. In Page mode, disabled until a step region is clicked.
- `?` Keyboard shortcut help

**Info bar contents**:

- Step title
- Key metadata — adhesive type, tags, paint references (tappable to add or remove; editable in Building mode, not just Setup), pre-paint indicator if flagged
- Reference count (e.g. "2 refs") — tappable to reveal the references drawer
- Quantity counter (if step has a quantity set) — `4 / 12` with `+` and `−` buttons; step auto-completes when count reaches the target
- Notes preview — tappable to expand into an editable text field; auto-saves on blur
- "Start timer" button — starts a drying timer using the step's configured drying time; labelled with the step name
- Complete button

**Marking up the instruction image**:

Builders mark up their physical instructions — circling parts, crossing things out, highlighting areas. The app supports this directly on the instruction image:

- **Checkmarks**: The default tap/click behavior on the instruction image (no toolbar required). Click anywhere on the diagram to place a small checkmark at that spot — tracking which parts within a step you've already handled. Checkmarks are spatial and visual, not a list. They persist on the step and remain editable even after the step is completed. Checkmarks are stored in the same annotation layer as toolbar annotations.
- **Annotation tools**: Toggle on a floating toolbar with circle, arrow, cross-out, highlight, freehand draw, and text tools. Draw directly on the instruction image. Annotations persist on the step and are visible whenever you return to it.
- **Zoom and pan**: Mouse wheel or pinch to zoom. Drag to pan. Essential for studying complex instruction diagrams closely.

**Sub-steps in Building mode**:

When a step has sub-steps, the center image area shows the parent step's overview diagram. A sub-step rail appears below the image (or as an expandable strip) showing each child step with its thumbnail. Clicking a sub-step loads its instruction image into the center. Each sub-step has its own complete button. When all sub-steps are marked complete, the parent step's complete button activates. The step rail on the left shows the parent step node with a small indicator denoting it contains sub-steps; it does not expand to show children inline in the rail.

**Pulling in context**:

Building mode starts clean for every step. Two visual overlays can be pulled in on demand:

- **References**: Tap the reference count in the info bar (or `R` shortcut) to reveal reference images alongside the instruction image. A strip of thumbnails appears; tap one to view it split-screen next to the instructions. A `+ Add reference` button in the strip lets you import a new reference image for the current step on the fly. Dismiss to return to the full-width image.
- **Annotations**: Tap `A` or the annotation button to reveal the floating drawing toolbar. Dismiss when done.

Info bar fields (notes, tags, paint references) expand inline on tap — they do not overlay the instruction image.

All edits made in Building mode — tags, notes, paint references, added reference images — are immediately persisted to the step record. There is no explicit save action.

When you advance to the next step (via the Complete button, prev/next arrows, or clicking a step in the rail), everything resets to the clean default state. Each step starts minimal. This means complexity is per-step and temporary — you only see extra UI when you ask for it, and it goes away automatically.

**Two navigation sub-modes within Building**:

- **Track mode**: The left rail lists all tracks. The active track is expanded to show step thumbnails and numbers; other tracks are shown as collapsed labels (name + completion fraction). Click a collapsed track to switch to it — it expands and the previous track collapses. The `◀ prev / next ▶` arrows and step counter (e.g. `15/22`) navigate within the active track only. Best for focused work on a single subassembly.
- **Page mode**: The left rail switches from step thumbnails to a numbered page list. Each entry shows the page number and a completion indicator (✓ = all steps on page complete, · = partial). A source selector at the bottom of the rail switches between PDFs (base kit, PE sheet, etc.). The instruction page is shown with colored interactive regions for each step (colored by track color). Click a region to select a step; the info bar loads that step's data. Until a region is clicked, the info bar shows "No step selected." Steps from multiple tracks on the same page are all visible and selectable simultaneously. The `◀ prev / next ▶` arrows and page counter (`pg 4/18`) navigate pages. Best for working through the manual sequentially.

Toggle between modes with `1` / `2` or the control in the zone toolbar. The center image and info bar behave the same in both modes.

**Step completion**:

- Click the Complete button in the info bar
- Or press Space / Enter
- On completion, a slim non-blocking prompt appears for a few seconds: "Capture your progress?" with a camera button. Auto-dismisses if ignored. Never blocks the flow.
- **Un-completing a step**: clicking the completion indicator on an already-completed step shows a confirmation dialog before reverting it to incomplete.

**Milestone capture**:

When all steps in a track are marked complete, a more prominent (but still dismissible) milestone card appears:

- "Hull Assembly complete!"
- Options: Capture Photo, Add Note, Continue
- Stays until the user dismisses it
- Milestone photos and notes are stored separately from step-level progress photos

**Photo capture**:

The `📷` button in the zone toolbar is always visible in Track mode. In Page mode it is disabled until a step region is clicked — once a step is selected it activates normally. One tap opens the file picker; the photo is added as a progress photo for the current step. The post-completion "Capture?" prompt and the milestone card's Capture button use the same mechanism — all progress photos are stored under `photos/progress/` associated with their step.

---

### Zone 3: Overview

A single-screen project dashboard that shows the state of the entire build at a glance. No tabs. The summary is designed to fit on one screen for typical builds; the Assembly Map scrolls horizontally for builds with many steps, and the card area scrolls vertically if needed. Everything important is visible simultaneously without navigating between pages.

**Layout**: The Assembly Map spans the full width across the top. Below it, four cards in a 2x2 grid.

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌─ Assembly Map ──────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  Hull     ●●●●●●●●●●●●●●○○○○○○○○○◆●●●●                │ │
│  │  Turret   ●●●●●●●●○○○○○───────────┘                    │ │
│  │  Interior ●●●●●●●●●●●●○─┘                               │ │
│  │  Details  ●●○○○○○○○○○───────────────────────→ ◆          │ │
│  │                                                         │ │
│  │  28/38 complete · 73%                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ Gallery ──────────────┐  ┌─ Build Log ─────────────────┐ │
│  │                        │  │                             │ │
│  │  (photo grid with      │  │  (chronological entries     │ │
│  │   milestone markers)   │  │   with icons and dates)     │ │
│  │                        │  │                             │ │
│  │         [Expand ↗]    │  │              [Expand ↗]     │ │
│  ├────────────────────────┤  ├─────────────────────────────┤ │
│  │ Materials & Paints     │  │ Export /                    │ │
│  │                        │  │ Settings                    │ │
│  │         [Expand ↗]    │  │              [Expand ↗]     │ │
│  └────────────────────────┘  └─────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Assembly Map

A flow diagram showing every track as a horizontal line of step nodes. This is the primary element of the Overview.

**Node legend**:

- `●` — completed step
- `○` — pending step
- `◆` — join event: the point on a receiving track where a sub-track's arrow terminates; marks where assemblies merge
- `─┘` / `───┘` — a sub-track's line ending with an arrow joining the receiving track at its `◆`
- Standalone tracks end cleanly (no arrow, no "?")
- Tracks with no join point configured (and not marked standalone) end with a dashed line and a "?" prompt — a discoverable hint to set the join point

**Behaviour**:

- Steps with sub-steps show a small indicator on their node
- Replaced steps (superseded by an aftermarket substitution) are shown with a strikethrough style and are not counted in the completion total
- Nodes are colored by track
- Join point arrows always visible — structural
- Dependency arrows ("blocked by" / "blocks access to" relations) shown in a distinct style; togglable via a map toolbar button to reduce visual noise on complex builds
- Hover any node to see step title and instruction image thumbnail
- Click any node to jump to that step in the Build zone
- Scrollable horizontally for builds with many steps; zoom controls (fit-to-screen, zoom in/out) in the map toolbar
- Overall completion count and percentage displayed below the map

#### Four Summary Cards

Below the Assembly Map, four cards show summary views of key project information:

- **Gallery** — Recent progress photos in a grid, organized with milestone markers as section dividers
- **Build Log** — Chronological activity: step completions, milestone events, drying timer completions, manual journal entries, photo additions
- **Materials & Paints** — Aftermarket accessories linked to the build with per-item step completion status; the project's paint palette with colour formulas; kit metadata (manufacturer, scale, kit number, chosen markings scheme)
- **Export + Settings** — Hero photo, export buttons (HTML / PDF / ZIP), project settings (name, start date, notes), mark-as-complete action, file health check

**Expand/collapse interaction**: Clicking "Expand" on any card smoothly expands it to fill the full area below the Assembly Map. The other three cards collapse to a thin labeled bar at the bottom. Click any collapsed card or press Escape to return to the four-card mosaic. The Assembly Map always stays visible at the top. This allows deep dives into any section (full gallery view, full build log, full materials management) without tabs or page navigation.

#### Gallery (expanded)

When the Gallery card is expanded:

- Full photo timeline organized chronologically
- Milestone markers as section headers ("Hull Assembly complete", "Paint session", etc.)
- Photos displayed at a comfortable viewing size with step name, track, and date
- Click any photo to view full-screen with zoom/pan
- Right-click (or long-press) any photo to "Set as hero photo" — immediately updates the project cover
- Before/after comparison: for any step that has both a cropped instruction image and a progress photo, a "Compare" button appears on the photo. Tapping it shows the instruction image and progress photo side-by-side with synchronized zoom/pan.

#### Build Log (expanded)

When the Build Log card is expanded:

- Full chronological log with entry types:
  - Manual entries (user-written notes with optional photos)
  - Auto-entries:
    - Step completions — step title, track name, timestamp
    - Milestone events — track name (track complete), timestamp
    - Drying timer completions — label, linked step name if applicable, elapsed time
    - Photo additions — step name, timestamp (one entry per photo added)
    - Build complete event
- Composer at the top for adding manual entries
- Inline editing and deletion for manual entries
- Export shortcut button — triggers the same export flow as the Export + Settings card; a convenience for when you're already reviewing the log

#### Export + Settings (expanded)

When the Export + Settings card is expanded:

**Export**:

- Hero photo — select from gallery or upload a new one (used as cover image in exports)
- Export buttons: HTML / PDF / ZIP. Each exports immediately with smart defaults.
- Export history: list of previous exports with date, format, and a "Show in Finder" button

**Project Settings**:

- Project name (defaults to kit name; can be renamed)
- Start date (auto-set when build started; editable)
- Project notes — freeform notes at the project level (separate from step notes and build log entries)
- "Mark as complete" action — initiates the build completion flow

**File Health**:

- Checks that all files referenced in the database exist on disk
- Detects photos or instruction images moved or deleted outside the app
- Offers to re-link missing files or remove orphaned records

#### Materials & Paints (expanded)

When the Materials & Paints card is expanded, two sections are shown:

**Accessories**:

- Every aftermarket item linked to the build (PE sets, resin parts, 3D prints, decal sets)
- For each item: name, source, and how many steps using it are complete vs. total
- Link or unlink accessories from the project here

**Paint Palette**:

- The full palette for this build — colours used, their formulas, which steps reference each colour
- Add colours from the global paint shelf or create new entries inline
- See Paint Tracking section for full detail

**Kit Info**:

- Manufacturer, scale, kit number, box art
- Chosen markings scheme (text + optional reference image)
- Linked kits and accessories from Collection

---

## Paint Tracking

Paint tracking operates at two levels: a global paint shelf in Collection, and a per-build palette in each project.

### Global Paint Shelf

Lives in Collection as a standalone section. Contains every paint you own or want to acquire, independent of any specific kit or project. Each entry:

- Brand (Tamiya, Vallejo, AK Interactive, Mr. Color, etc.)
- Colour name and manufacturer reference code
- Paint type (acrylic / enamel / lacquer / oil)
- Owned / wishlist status
- Notes

### Per-Build Paint Palette

Each project has its own palette of colours used in that build. A palette entry is one of:

- **Direct paint** — a paint from the global shelf, used straight from the bottle
- **Formula** — a named custom colour with a recipe:
  - Colour name (e.g. "Winter Dunkelgelb")
  - Purpose / stage — freeform text (e.g. "base coat", "highlight", "enamel wash", "chipping layer")
  - Components: one or more paints from the global shelf, each with a percentage or ratio
  - Mixing notes (freeform — e.g. "slightly warmer than last build, could reduce XF-57 next time")

Palette entries are managed from the Materials & Paints card in Overview, and referenced from the step editor when tagging which colours were used in a step.

### Per-Step Paint References

Any step can be tagged with one or more colours from the build palette. This creates a record of what was painted at each stage and is included in the build log export.

---

## Drying Timers

A floating timer bubble is available in all zones. It appears when one or more timers are active and disappears when all timers have been dismissed.

**Starting a timer**:

- From a step's info bar in Building mode — uses the step's configured adhesive/drying time preset; labelled with the step name
- From the bubble directly — custom label and duration, not tied to any step

**The bubble**:

- Draggable anywhere in the window; position is remembered persistently across sessions
- Collapsed state: shows the most urgent timer (shortest remaining) with its label
- Expanded state: lists all active timers with remaining time, a dismiss button per timer, and an "+ Add timer" button for freestanding timers
- Always on top of zone content; does not obstruct the instruction image when dragged to a corner

**On timer completion**:

- OS system notification fires (works even if the app is in the background)
- The bubble pulses briefly to draw attention

**App close with active timers**: Active timers are persisted to the database. On relaunch, any timer whose start time plus duration has already elapsed fires an immediate "Timer completed while away" notification. Timers still in progress resume with the correct remaining time.

**Build log**: Drying timer completions are recorded as auto-entries in the build log, noting the step name (if step-linked) and elapsed time.

---

## Build Log Export

The build log is an exportable, shareable document that captures the story of the build. It assembles automatically from progress photos, milestone photos, milestone notes, journal entries, and paint palette data accumulated over the course of the project.

**Content structure**:

- Cover photo (user-selected hero image)
- Kit information (name, manufacturer, scale, kit number, chosen markings scheme, linked accessories)
- Paint palette summary (colour names, formulas, stages used)
- One section per track, in display order:
  - Track name and completion status
  - Milestone photo (if captured) as section header image
  - Progress photos in chronological order with captions from step notes and journal entries
  - Annotation renders (instruction image with markup baked in) where available
- Final section: any project-level notes or closing remarks

**Export formats**:

- **HTML** — Self-contained single-page document with all images embedded. Viewable in any browser. Suitable for hosting on a personal or self-hosted site, or viewing locally.
- **PDF** — Formatted for print (Letter / A4). Photos arranged in a clean grid with captions. Suitable for personal records.
- **ZIP** — All photos plus a narrative Markdown file. For archival or manual formatting.

**Export behaviour**: No pre-export editing wizard. The export uses smart defaults: all progress and milestone photos, step notes as captions, tracks in display order. The project's hero photo is used as the cover — set and managed in Overview's Export + Settings card, not at export time.

---

## Photo and File Management

### File Storage Structure

```text
App Data Directory/
├── projects/
│   └── <project-id>/
│       ├── instructions/              # Rasterized instruction PDF pages
│       │   └── <pdf-id>/              # One subdirectory per source PDF
│       │       └── page-001.png       # Zero-padded sequential numbering
│       │
│       ├── steps/                     # Cropped step images (from instruction pages)
│       │   └── <step-id>.png
│       │
│       ├── masks/                     # Image cleanup masks (per-step paint-over data; user work, not regenerable)
│       │   └── <step-id>.mask.png
│       │
│       ├── thumbnails/                # Auto-generated thumbnail images (regenerable)
│       │   └── <step-id>.thumb.png
│       │
│       ├── photos/
│       │   ├── progress/              # Per-step progress photos
│       │   │   └── <step-id>_<YYYYMMDD_HHMMSS>.jpg
│       │   │
│       │   ├── milestones/            # Track completion photos
│       │   │   └── <track-name>_<YYYYMMDD_HHMMSS>.jpg
│       │   │
│       │   ├── references/            # Reference images attached to steps
│       │   │   └── <ref-id>.jpg
│       │   │
│       │   └── hero/                  # Project cover photo (single file)
│       │       └── cover.jpg
│       │
│       ├── annotations/               # Rendered annotation images (for build log export)
│       │   └── <step-id>_annotated.png
│       │
│       └── exports/                   # Self-contained build log exports
│           └── <YYYYMMDD>[-N]/        # Suffix -2, -3 … added if same-day exports exist
│               ├── build-log.html
│               ├── build-log.pdf
│               └── images/            # Copies of all referenced photos
│
└── stash/
    └── <item-id>/
        ├── cover.jpg                  # Kit box art or cover image
        └── instructions/              # Instruction PDFs and images
            └── <instruction-id>.<ext>
```

**Design principles**:

- **Human-readable filenames** — Page numbers are zero-padded. Photo filenames include dates for chronological sorting. Milestone photos include the track name for identification outside the app. Instruction pages are stored in per-PDF subdirectories so pages from different sources (base kit, PE sheet, etc.) are distinguishable on disk.
- **Self-contained exports** — Each export directory includes copies of all referenced images. The folder can be shared, moved, or archived independently.
- **Regenerable artifacts separated** — Thumbnails can be regenerated from source data and excluded from backups. Annotation renders (`annotations/`) are generated on demand at export time, not kept in sync continuously; they are also regenerable. Masks (`masks/`) are user-created data and must be included in backups.
- **Stable associations** — Step images and progress photos reference the step's unique ID, so renaming a step title doesn't break file associations.
- **Multiple photos per step** — The `<step-id>_<timestamp>` naming pattern naturally supports and orders multiple progress photos per step.

---

## Key Interactions Summary

### Navigation

- Three zones, three buttons, always visible: Collection, Build, Overview
- One click to move between zones from anywhere
- Within Build: switch active project via the dropdown in the zone toolbar (no trip to Collection needed)
- Within Build: toggle between Track mode and Page mode
- Within Build: toggle between Setup and Building mode
- Within Overview: expand/collapse individual cards for detail without leaving the page

### Step Interaction During Building

- View the instruction image (large, central, dominant)
- Zoom and pan to study details
- Click anywhere on the image to place a checkmark at that spot (default behavior; no toolbar needed)
- Pull in reference images split-screen when needed (auto-dismisses on step advance)
- Activate annotation tools when needed (auto-dismisses on step advance)
- Edit notes and tags inline from the info bar
- Start a drying timer for the current step with one click
- Complete the step with one click or keypress
- Advance to the next step — workspace resets to clean

### Photo Capture

- Always-available camera button in the Build zone toolbar (disabled in Page mode until a step is selected)
- Non-blocking "Capture?" prompt on step completion (auto-dismisses in 4 seconds)
- Prominent milestone card on track completion
- Photos auto-associate with the current step or milestone
- All photos visible in the Overview's Gallery card

### Timer Bubble

- Floating bubble visible in all zones when timers are active
- Start from a step's info bar or directly from the bubble
- OS notification on completion

### Discoverability

- Track join points surfaced visually on the Assembly Map (dashed "?" for unset joins)
- First-use tooltips on navigation elements explaining what each zone and mode does
- Keyboard shortcut help overlay accessible via `?` from anywhere
- Contextual empty states with guidance (e.g. "Upload a PDF to get started" in an empty project)

---

## Keyboard Shortcuts

| Key | Context | Action |
| --- | --- | --- |
| `1` / `2` | Build zone | Switch: Track mode / Page mode |
| `←` / `→` | Build (Track mode) | Previous / next step within current track |
| `Tab` / `Shift+Tab` | Build (Page mode) | Next / previous instruction page |
| `R` | Build (Building mode) | Toggle references drawer |
| `A` | Build (Building mode) | Toggle annotation tools |
| `Space` or `Enter` | Build (Building mode) | Complete current step |
| `T` | Build (Building mode) | Start drying timer for current step |
| `P` | Build zone | Quick photo capture |
| `/` | Anywhere | Search |
| `?` | Anywhere | Show keyboard shortcut help |

---

## App Settings

A settings area (accessible from the app menu or a gear icon) manages global configuration that doesn't belong to any specific project or zone:

- **Tag library** — create, rename, and delete the predefined tags available for steps across all projects (e.g. "pre-paint", "dry-fit", "drying", "fragile", "reference needed")
- **Default drying times** — override the default drying times for each adhesive type
- **File storage location** — view or change the app data directory
- **PDF rasterization quality** — DPI setting for converting instruction PDFs to images
- **Appearance** — light / dark / system theme
