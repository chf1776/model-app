# Model Builder's Assistant — Next Generation

## Project Proposal

A desktop application for scale model builders that serves as a digital companion throughout the entire lifecycle of a build — from kit acquisition through construction to sharing the finished result. The app organizes around three zones that mirror the physical experience of the hobby: your collection, your workbench, and your big picture.

---

## Executive Summary

Scale model building is a detail-oriented visual craft. Builders work from instruction manuals, juggle parallel subassemblies, and want to document their progress — but existing tools either treat it like generic project management or don't exist at all.

This app is purpose-built for the hobby. It manages your kit collection, guides you through builds with your instruction manual as the primary interface, lets you annotate and mark up instructions as you work, tracks subassembly convergence visually, captures progress photos at natural moments, and exports shareable build logs when you're done.

The experience is organized into three zones:

- **Collection** — All your kits in one place: wishlisted, owned, in-progress, and completed
- **Build** — The active workspace where you work through steps with the instruction image front and center
- **Overview** — A single-screen project dashboard showing assembly structure, photos, parts, and build history

---

## The Three Zones

### Zone 1: Collection

The home screen. A unified surface for your entire kit collection and all your projects. No separate "dashboard" and "stash" — everything lives on one shelf.

**Sections**:

- **Building** — Active projects displayed with their latest progress photo as the cover image, a progress bar, and kit metadata (manufacturer, scale, kit number)
  - "Resume" button restores the Build zone to the exact state you left it: same step, same scroll position, same mode
- **On the Shelf** — Owned kits not yet started
  - "Start Build" creates a project, links the kit, imports any attached instruction PDFs as source pages, and opens the Build zone
- **Wishlist** — Kits you want to acquire
  - Retailer URL links, pricing, notes
- **Completed** — Finished builds displayed with a user-selected hero photo
  - "View" opens the Overview for that build
- **Accessories** — PE sets, resin kits, paints, decals, etc.
  - Grouped visually under their parent kit
  - Can be linked to any project

**Capabilities**:

- Full-text search across all kits and projects
- Filters by type (base kit, detail set, enhancement, paint, decal), status (owned, wishlist, building, completed), scale, manufacturer
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
  - Support for multiple PDFs per project (base kit instructions, PE instructions, aftermarket instructions)
- **Crop tool**
  - Draw rectangular regions on instruction pages to define step images
  - Assign each region to a track
  - Crop regions stored as normalized coordinates; cropping performed server-side at full resolution
  - "Full page" option for steps that span an entire instruction page
  - Undo support for region drawing
  - **Image cleanup within a crop** — after cropping a region, erase or mask out unwanted elements inside the image (other steps' callouts bleeding into the crop, irrelevant part numbers, arrows from adjacent steps, etc.). Paint over areas to remove visual noise so the step image shows only what's relevant to that step.
- **Track management**
  - Create, rename, reorder, and delete tracks (subassemblies)
  - Each track has a name, color, and display order
  - Track join points — define where a subassembly merges into another track (e.g., "Interior joins Hull at Step 22")
  - Join point notes for describing the merge
- **Step management**
  - Create steps manually or from crop regions
  - Reorder steps via drag-and-drop
  - Parent/child step nesting (sub-steps)
  - Bulk step creation from multiple crop regions at once
- **Step editor** (full form, right panel)
  - Title
  - Source type: base kit, photo-etch, 3D printed, aftermarket, custom/scratch
  - Source name (e.g., "Aber PE set #35xxx")
  - Adhesive type and drying time
  - Pre-paint required flag
  - Quantity tracking (for steps like "fit 12 road wheels")
  - Notes (freeform text)
  - Tags (freeform labels)
  - Relations: "blocked by" (this step can't proceed until another is done) and "blocks access to" (completing this step seals off access to another area)
  - Replaces step (for aftermarket substitutions)
  - Reference image attachments

#### Building Mode

Used when you're at the bench doing the actual work. Optimized for the instruction image being as large and clear as possible, with minimal surrounding UI. The app should feel like having your instruction manual open with nothing else in the way.

**Default state**: The instruction image fills most of the screen. A thin step rail on the left shows where you are. A compact info bar at the bottom shows the essentials.

```
┌──────────────┬───────────────────────────────────────┐
│ ● Hull (14/22)│                                       │
│  [img] 13  ✓ │                                       │
│  [img] 14  ✓ │       Instruction Image               │
│  [img]→15    │       (zoomable, pannable,            │
│  [img] 16    │        annotatable)                   │
│  [img] 17    │                                       │
│ ○ Turret (5/12)                                      │
│ ○ Interior (18/20)                                   │
│ ○ Details (2/14)│                                     │
│              │  ◀ prev       15/38       next ▶      │
│              ├───────────────────────────────────────┤
│              │  Step 15: Glue upper hull  [📷] [✓]   │
└──────────────┴───────────────────────────────────────┘
```

**Info bar contents**:
- Step title
- Key metadata (adhesive type, tags)
- Notes preview (tappable to edit inline)
- Photo capture button
- Complete button

**Marking up the instruction image**:

Builders mark up their physical instructions — circling parts, crossing things out, highlighting areas. The app supports this directly on the instruction image:

- **Checkmarks**: Tap anywhere on the instruction image to place a small checkmark at that spot. This is how you track which parts within a step you've already handled. The checkmarks are visible on the image itself — spatial and visual, not a list. When you're done with the step, hit Complete.
- **Annotation tools**: Toggle on a floating toolbar with circle, arrow, cross-out, highlight, freehand draw, and text tools. Draw directly on the instruction image. Annotations persist on the step and are visible whenever you return to it.
- **Zoom and pan**: Mouse wheel or pinch to zoom. Drag to pan. Essential for studying complex instruction diagrams closely.

**Pulling in context** (the "drawer" system):

Building mode starts clean for every step. When a step is complex and you need more information, you pull it in on demand:

- **References**: Tap the reference count in the info bar (or keyboard shortcut) to reveal reference images alongside the instruction image. A strip of thumbnails appears; tap one to view it split-screen next to the instructions. Dismiss to return to the full-width image.
- **Annotations**: Tap `A` or the annotation button to activate the floating drawing toolbar. Dismiss when done.
- **Notes**: Tap the notes preview in the info bar to expand it into an editable text field. Auto-saves on blur.
- **Tags**: Tap tags in the info bar to add or remove.

When you advance to the next step (via the Complete button, prev/next arrows, or clicking a step in the rail), everything resets to the clean default state. Each step starts minimal. This means complexity is per-step and temporary — you only see extra UI when you ask for it, and it goes away automatically.

**Two navigation sub-modes within Building**:

- **Track mode**: Navigate by subassembly. The left rail shows step numbers for the active track. Switch tracks via a dropdown at the top of the rail. Best for focused work on a single subassembly.
- **Page mode**: Navigate by instruction page. The left rail is replaced by a page strip along the top. The instruction page is shown with colored interactive regions for each step (colored by track). Click a region to select that step and load its info in the bar. Steps from different tracks on the same page are all visible simultaneously. Best for working through the manual page by page.

Toggle between Track and Page mode with a keyboard shortcut or a small control in the header. The center image and bottom bar behave the same in both modes.

**Step completion**:

- Click the Complete button in the info bar
- Or press Space / Enter
- On completion, a slim non-blocking prompt appears for a few seconds: "Capture your progress?" with a camera button. Auto-dismisses if ignored. Never blocks the flow.

**Milestone capture**:

When a significant event occurs — all steps in a track completed, a join point reached — a more prominent (but still dismissible) milestone card appears:

- "Hull Assembly complete!"
- Options: Capture Photo, Add Note, Continue
- Stays until the user dismisses it
- Milestone photos and notes are stored separately from step-level progress photos

**Always-available photo capture**:

A camera icon is always visible in the Build zone header. One tap opens the file picker. The photo is automatically associated with the current step as a progress photo. No navigation, no dialogs, no extra steps.

---

### Zone 3: Overview

A single-screen project dashboard that shows the state of the entire build at a glance. No tabs. No scrolling required for the summary. Everything is visible simultaneously.

**Layout**: The Assembly Map spans the full width across the top. Below it, four cards in a 2x2 grid.

```
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
│  │ Parts        Kit Info  │  │ Linked Kits    Export/      │ │
│  │                        │  │                Settings     │ │
│  │         [Expand ↗]    │  │                             │ │
│  └────────────────────────┘  └─────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Assembly Map

A flow diagram showing every track as a horizontal line of step nodes. This is the primary element of the Overview.

- Each node is a step: filled = complete, hollow = pending
- Nodes are colored by track
- Arrows show where tracks converge at join points
- Hover any node to see step title and instruction image thumbnail
- Click any node to jump to that step in the Build zone
- Tracks without a join point set show a dashed line with a "?" prompt — making the join feature discoverable without the user needing to find it in settings
- Overall completion count and percentage displayed below the map

#### Four Summary Cards

Below the Assembly Map, four cards show summary views of key project information:

- **Gallery** — Recent progress photos in a grid, organized with milestone markers as section dividers
- **Build Log** — Chronological activity: step completions, milestone events, manual journal entries, photo additions
- **Parts + Kit Info** — Inventory status (per part group with completion counts) and kit metadata (manufacturer, scale, kit number, linked stash items)
- **Export + Settings** — Build log export button, project settings, file health/reconciliation status

**Expand/collapse interaction**: Clicking "Expand" on any card smoothly expands it to fill the full area below the Assembly Map. The other three cards collapse to a thin labeled bar at the bottom. Click any collapsed card or press Escape to return to the four-card mosaic. The Assembly Map always stays visible at the top. This allows deep dives into any section (full gallery view, full build log, full inventory management) without tabs or page navigation.

#### Gallery (expanded)

When the Gallery card is expanded:

- Full photo timeline organized chronologically
- Milestone markers as section headers ("Hull Assembly complete", "Paint session", etc.)
- Photos displayed at a comfortable viewing size with step name, track, and date
- Click any photo to view full-screen with zoom/pan
- Before/after comparison: instruction image side-by-side with progress photo for any step that has both

#### Build Log (expanded)

When the Build Log card is expanded:

- Full chronological log with entry types:
  - Manual entries (user-written notes with optional photos)
  - Auto-entries (step completions, milestone events, drying timer completions)
- Composer at the top for adding manual entries
- Inline editing and deletion for manual entries
- Build log export button (also accessible from the card's summary view)

---

## Build Log Export

The build log is an exportable, shareable document that captures the story of the build. It assembles automatically from progress photos, milestone photos, milestone notes, and journal entries accumulated over the course of the project.

**Content structure**:

- Cover photo (user-selected hero image)
- Kit information (name, manufacturer, scale, kit number, linked accessories)
- One section per track, in display order:
  - Track name and completion status
  - Milestone photo (if captured) as section header image
  - Progress photos in chronological order with captions from step notes and journal entries
  - Annotation renders (instruction image with markup baked in) where available
- Final section: any project-level notes or closing remarks

**Export formats**:

- **HTML** — Self-contained responsive page with all images embedded. Viewable in any browser. Suitable for hosting on a personal site or sharing as a file.
- **PDF** — Formatted for print (Letter / A4). Photos arranged in a clean grid with captions. Suitable for club presentations or personal records.
- **Forum Markdown** — Plain text with image references, formatted for BBCode or Markdown. Copy-paste ready for modeling forums.
- **ZIP** — All photos plus a narrative Markdown file. For archival or manual formatting.

**User editing before export**:

- Select which photos to include or exclude
- Edit captions and narrative text
- Choose a cover photo
- Reorder sections if desired

---

## Photo and File Management

### File Storage Structure

```
App Data Directory/
├── projects/
│   └── <project-id>/
│       ├── instructions/              # Rasterized instruction PDF pages
│       │   └── page-001.png           # Zero-padded sequential numbering
│       │
│       ├── steps/                     # Cropped step images (from instruction pages)
│       │   └── <step-id>.png
│       │
│       ├── thumbnails/                # Auto-generated thumbnail images (regenerable)
│       │   └── <step-id>.thumb.png
│       │
│       ├── photos/
│       │   ├── progress/              # Per-step progress photos
│       │   │   └── <step-id>_<YYYYMMDD_HHMMSS>.jpg
│       │   │
│       │   ├── milestones/            # Track completion and join point photos
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
│           └── <YYYYMMDD>/
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

- **Human-readable filenames** — Page numbers are zero-padded. Photo filenames include dates for chronological sorting. Milestone photos include the track name for identification outside the app.
- **Self-contained exports** — Each export directory includes copies of all referenced images. The folder can be shared, moved, or archived independently.
- **Regenerable artifacts separated** — Thumbnails and annotation renders can be regenerated from source data. They could be excluded from backups.
- **Stable associations** — Step images and progress photos reference the step's unique ID, so renaming a step title doesn't break file associations.
- **Multiple photos per step** — The `<step-id>_<timestamp>` naming pattern naturally supports and orders multiple progress photos per step.

---

## Key Interactions Summary

### Navigation
- Three zones, three buttons, always visible: Collection, Build, Overview
- One click to move between zones from anywhere
- Within Build: toggle between Track mode and Page mode
- Within Build: toggle between Setup and Building mode
- Within Overview: expand/collapse individual cards for detail without leaving the page

### Step Interaction During Building
- View the instruction image (large, central, dominant)
- Zoom and pan to study details
- Place checkmarks on the image to track completed parts within a step
- Pull in reference images split-screen when needed (auto-dismisses on step advance)
- Activate annotation tools when needed (auto-dismisses on step advance)
- Edit notes and tags inline from the info bar
- Complete the step with one click or keypress
- Advance to the next step — workspace resets to clean

### Photo Capture
- Always-available camera button in the Build zone header
- Non-blocking "Capture?" prompt on step completion (auto-dismisses in 4 seconds)
- Prominent milestone card on track completion / join point reached
- Photos auto-associate with the current step or milestone
- All photos visible in the Overview's Gallery card

### Discoverability
- Track join points surfaced visually on the Assembly Map (dashed "?" for unset joins)
- First-use tooltips on navigation elements explaining what each zone and mode does
- Keyboard shortcut help overlay accessible via `?` from anywhere
- Contextual empty states with guidance (e.g., "Upload a PDF to get started" in an empty project)

---

## Keyboard Shortcuts

| Key | Context | Action |
|---|---|---|
| `1` / `2` | Build zone | Switch: Track mode / Page mode |
| `←` / `→` | Build zone | Previous / next step |
| `Tab` / `Shift+Tab` | Build (Page mode) | Next / previous instruction page |
| `A` | Build (Building mode) | Toggle annotation tools |
| `Space` or `Enter` | Build (Building mode) | Complete current step |
| `P` | Build zone | Quick photo capture |
| `/` | Anywhere | Search |
| `?` | Anywhere | Show keyboard shortcut help |
