# Export Feature Specification

> This document supersedes the "Build Log Export" section in PROJECT_PROPOSAL.md. The original spec called for smart defaults with no pre-export editing. Based on design review, the export now includes a full curation dialog with section toggles, photo selection, narrative editing, and live PDF preview. The original's content structure and format definitions remain accurate; this document extends them.

---

## 1. Design Philosophy

The export is the trophy of the build. It's a shareable showcase document, not a database dump. Photos are the star, layout makes it feel premium, narrative gives it personality, and technical reference (paint formulas, materials) is appendix material for those who want it.

**Primary audience**: Other modelers, forum communities (Britmodeller, ModelWarships, Scale Modelling Now), contest entries, and personal archives.

**Guiding principles**:
- Photos dominate every spread. Text supports photos, not the other way around.
- Track colors carry through from the app into the document as the primary accent system.
- The user curates what goes in. Smart defaults make the common case fast, but every section is togglable, every photo is selectable, and every narrative block is editable.
- "Quick Export" exists for people who just want the PDF now.

---

## 2. Export Dialog

The export dialog is a full-screen modal opened from the Project Info card in the Overview zone (Export button) or from the project dropdown menu in the nav bar.

### 2.1 Layout

Three-panel layout:

| Panel | Width | Content |
|-------|-------|---------|
| Left | 240px fixed | Section list with toggles, format selector, page estimate |
| Center | Flexible | Section editor (changes based on selected section) |
| Right | 320px fixed | Live PDF page preview |

### 2.2 Title Bar

Top bar spanning all three panels:
- Left: "Export Build Log" title, project name + kit subtitle below
- Right: two buttons
  - **Quick Export** (secondary): Exports immediately using current settings. No further interaction. Uses smart defaults if the dialog hasn't been opened before.
  - **Export PDF** (primary, accent color): Triggers export with current curation settings. Shows progress indicator during generation.

### 2.3 Left Panel: Section List

Ordered list of togglable sections. Each row shows:
- Section icon (monochrome glyph)
- Section title (bold)
- Section subtitle (secondary text, brief description)
- Toggle switch (on/off, does not require selecting the section)

Clicking the row selects it (highlights with accent left border + accent background tint) and loads its editor in the center panel. Clicking the toggle enables/disables the section without selecting it.

**Section list** (default order, all enabled except Materials and Assembly Map):

| # | Icon | Title | Subtitle | Default |
|---|------|-------|----------|---------|
| 1 | ◉ | Cover Page | Hero photo + project details | On |
| 2 | ▤ | Build Story | {N} tracks with photos & notes | On |
| 3 | ◫ | Gallery | Finished model showcase | On |
| 4 | ◔ | Paint Palette | {N} colors with swatches | On |
| 5 | ▦ | Materials List | Kits, PE, accessories used | Off |
| 6 | ⟿ | Assembly Map | Track structure diagram | Off |
| 7 | ▥ | Build Statistics | Duration, sessions, step count | On |

Below the section list:

**Format selector**: Radio group with three options:
- **PDF (Typst)** — selected by default. The polished, typeset document.
- **HTML** — Self-contained single-page document with embedded images.
- **ZIP** — Photos directory + narrative Markdown file.

Note: The section curation applies to all formats. HTML and ZIP use the same section/photo selections but render them in their respective formats.

**Page estimate**: Accent-tinted info box showing estimated page count and selected photo count. Recalculates as sections are toggled and photos are selected/deselected.

### 2.4 Center Panel: Section Editors

Each section has a dedicated editor view. The editor loads when the section is clicked in the left panel.

#### Cover Page Editor

- **Hero photo selector**: Grid of candidate photos (gallery and hero type). Click to select one as the cover image. Selected photo shows accent border + "SELECTED" badge. Default: the project's designated hero photo (set via Gallery card right-click menu).
- **Title field**: Editable text input, pre-filled with project name. Font weight 600, size 14px.
- **Subtitle field**: Editable text input, pre-filled with "{manufacturer} {scale} · {product_code}". Secondary color, size 12px.

The cover page always pulls build date range and track/step counts from the project data automatically. These are not editable in the dialog.

#### Build Story Editor

One card per track, in display order. Each card shows:
- Track color dot + track name (bold)
- Step count + photo count (secondary text, right-aligned)
- Narrative textarea: pre-populated with milestone notes if they exist, otherwise placeholder text ("Write about the {track name} build..."). The user writes or edits the narrative for each track section here. This text appears in the PDF below the track header and above the photo grid.

Track cards are collapsible. Clicking the track header toggles the textarea visibility.

Future consideration: per-track photo selection (pick which progress photos appear in each track's spread). For v1, all progress and milestone photos for a track are included automatically. The Gallery section handles global photo curation.

#### Gallery Editor

Shows all project photos in a selectable grid, regardless of type. Photo types included:
- Hero photos
- Gallery photos (finished model shots added directly to Gallery card)
- Progress photos (captured during step completion)
- Reference photos (attached to steps for accuracy checking)

**Filter tabs** above the grid:
- **All** ({total count})
- **Gallery** ({gallery + hero count})
- **Progress** ({progress count})
- **Reference** ({reference count})

Each photo in the grid shows:
- Thumbnail with track-color gradient tint
- Caption label at bottom (photo label or filename)
- Selection state: selected photos show accent border + checkmark badge. Deselected photos show at 40% opacity.
- Type badge: "HERO" (warning yellow) for hero photos, "REF" (accent blue) for reference photos. Gallery and progress photos have no badge.

Click to toggle selection. Selected count shown above the grid ("{N} of {total} selected").

Default selection: all gallery and hero photos selected. Progress and reference photos deselected. User can override.

#### Paint Palette Editor

Shows all paints from the project palette. Each paint displays:
- Color swatch (20×20px rounded square)
- Paint code (monospace, secondary color)
- Paint name
- Brand (tertiary text, right-aligned)

All paints are included by default. Individual paint toggle (include/exclude) is deferred to v2. For v1, the palette is all-or-nothing via the section toggle.

#### Materials List Editor

Placeholder for v1. Shows "Included in export" or "Section disabled" based on toggle state. When included, the export pulls the full BOM from the Materials card: kit name, all linked accessories with type badges, and status (owned/needed).

#### Assembly Map Editor

Placeholder for v1. When included, the export renders the assembly map as a static diagram: track lines with step nodes, colored by track, showing completion state. The diagram is generated from the same data as the Overview zone's Assembly Map canvas, rendered to a static image by the Rust backend.

#### Build Statistics Editor

Placeholder for v1. When included, the export generates a stats block with: build duration (days), session count, total steps, total tracks, photo count, paint count.

### 2.5 Right Panel: PDF Preview

Scrollable preview of the PDF pages as they would render. Uses the app's dark background (#141416) as the preview chrome, with page thumbnails rendered at A4 proportions (1:1.414 aspect ratio) with drop shadows.

The preview updates as sections are toggled and photos are selected. It is a visual approximation, not a pixel-perfect render of the Typst output. The purpose is to give the user a feel for page count, photo layout, and section ordering before committing to export.

Preview pages shown (when their sections are enabled):
1. Cover Page
2. Track spread pages (one representative page shown per track)
3. Gallery page
4. Appendix page (paint palette + statistics combined)

---

## 3. PDF Page Design

The PDF is generated by the Typst crate in the Rust backend. A `.typ` template defines the layout; the backend populates it with structured data from the project database and photo files.

### 3.1 Paper and Typography

- **Page size**: A4 (210×297mm). Configurable to Letter (8.5×11") in Settings.
- **Margins**: 20mm all sides.
- **Body font**: DM Sans, 11pt. Matches the app's UI typography.
- **Heading font**: DM Sans, bold weights.
- **Color palette**: Warm cream paper background (#F8F6F3). Body text in near-black (#1A1A1A). Secondary text in medium grey (#666). Accent colors from track assignments. Kure Steel (#7B9EB8) for global accents outside track contexts.

### 3.2 Cover Page

Full first page. No page number.

- **Top 60%**: Hero photo, displayed large with subtle rounded corners. If no hero photo is set, this area shows the box art image from the kit. If neither exists, the area shows a solid gradient in Kure Steel tones.
- **Bottom 40%**: Title block on cream background.
  - Project name: 22pt bold, tight letter-spacing (-0.5), near-black.
  - Subtitle: 11pt semibold, Kure Steel color, 0.5 letter-spacing. Format: "{MANUFACTURER} {SCALE} · {PRODUCT_CODE}".
  - Metadata row: Three items side by side, each with an uppercase 7pt label (grey) and 9pt value (dark grey). Items: "Built" (date range), "Steps" ("{N} across {M} tracks"), "Sessions" ("{N} build sessions").
  - Accent line: 40px wide, 2px tall, Kure Steel gradient fading to transparent. Decorative separator below metadata.

### 3.3 Track Spread Pages

One section per track, in display order. A track section may span one or more pages depending on photo count and narrative length.

**Section header** (top of first page for each track):
- Track color dot (12×12px rounded square) + "TRACK {N} OF {TOTAL}" label (8pt uppercase, grey, 1.5 letter-spacing)
- Track name: 18pt bold, near-black, -0.3 letter-spacing
- User narrative text: 9pt, medium grey, line-height 1.5, max-width 80% of page width. This is the text from the Build Story editor.

**Photo grid**: Below the narrative. 2-column grid with 8px gaps. Each photo cell:
- Photo at 16:10 aspect ratio, rounded corners (4px)
- Caption overlay at bottom: gradient from transparent to 50% black, white text 7pt

Photos are the progress and milestone photos for this track, in chronological order.

**Milestone callout**: If the track has a milestone note, a callout box appears after the photo grid:
- Left border: 3px solid, track color
- Background: track color at 7% opacity
- "◆ MILESTONE" label: 7pt bold uppercase, track color
- Milestone text: 9pt, dark grey

### 3.4 Gallery Pages

Dedicated section for the curated gallery photos selected in the export dialog. Layout adapts to photo count:

**5+ photos** (typical):
- Section header: "GALLERY" label (8pt uppercase grey) + "Completed Model" title (18pt bold)
- Hero layout: First selected photo displayed large at 16:9, full page width, 6px rounded corners
- Three-up row: Next three photos in equal columns at 4:3 aspect ratio
- Remaining photos: Continued in 2-column grid on subsequent pages

**1-4 photos**:
- All photos displayed large, one or two per page, at 16:9

**Reference photos**: If selected, reference photos appear in a separate subsection titled "Reference Images" after the gallery photos. They use the same 2-column grid layout.

### 3.5 Paint Palette Page (Appendix)

Included when the Paint Palette section is enabled.

**Section header**: "APPENDIX" label (8pt uppercase grey) + "Paint Palette" title (18pt bold)

**Swatch strip**: Full-width horizontal bar showing all palette colors side by side, no gaps, rounded container (4px). Each color gets equal width. This provides an at-a-glance visual summary.

**Paint table**: Below the swatch strip. Bordered table with header row (grey background):
- Columns: Swatch (14×14 color square), Code (monospace), Name, Brand
- Rows: One per paint in the palette, sorted by color family

### 3.6 Build Statistics Block

Can appear standalone or combined with the Paint Palette on the appendix page.

**Stats grid**: 3-column, 2-row grid of stat cards. Each card shows:
- Large number: 18pt bold, Kure Steel color
- Label: 7pt uppercase, grey, 1 letter-spacing

Stats displayed: Days (build duration), Sessions, Steps, Tracks, Photos (count of photos included in export), Paints (palette count).

### 3.7 Materials List (Appendix)

When enabled, appears after the paint palette / stats on the appendix pages.

**Section title**: "Materials" (12pt bold)

**Kit info**: Kit name, manufacturer, scale, product code.

**Accessories table**: Bordered table with columns: Name, Type (PE/Resin/Decal/Other), Brand, Status (owned/needed). Sorted by type, then alphabetically.

### 3.8 Assembly Map Diagram

When enabled, renders as a full-width diagram on its own page.

The assembly map is rendered to a static PNG by the Rust backend using the same layout algorithm as the Overview zone's Konva canvas, but outputting to an image file instead of a screen canvas. The image is then embedded in the Typst document.

Track lines are horizontal with step nodes: filled circle for complete, open circle for pending, diamond for join event. Track colors match the app. Join point arrows connect sub-tracks to parent tracks.

### 3.9 Running Headers and Footers

- **Header** (pages 2+): Project name, left-aligned, 8pt, grey. Track name on track spread pages, right-aligned.
- **Footer** (pages 2+): Page number, right-aligned, 8pt, grey.
- **Cover page**: No header or footer.

### 3.10 Page Break Logic

- Each track section starts on a new page.
- Gallery section starts on a new page.
- Appendix (palette + stats + materials) starts on a new page.
- Assembly map starts on a new page.
- Within a track section, photos are allowed to break across pages. Typst handles widow/orphan control to avoid a single photo stranded on a new page.

---

## 4. HTML Export

Self-contained single-page HTML document. All images base64-embedded. No external dependencies. Viewable in any browser, suitable for hosting.

Uses the same section selections and photo curation from the export dialog. The HTML layout is a responsive single-column design:
- Max-width 800px, centered
- Cover section with hero image and metadata
- Track sections with narrative and photo grids (CSS grid, 2 columns)
- Gallery section with responsive photo grid
- Appendix section with paint table (HTML table) and stats

Styling is inline CSS (no external stylesheet). Typography uses system fonts with DM Sans as preferred (loaded via Google Fonts link if online, falls back gracefully).

The HTML file is saved to `exports/<YYYYMMDD>[-N]/build-log.html` within the project directory.

---

## 5. ZIP Export

Archive containing:
- `images/` directory with copies of all selected photos (JPEG, original resolution)
- `build-log.md` — Narrative Markdown file with the same structure as the PDF/HTML: cover info, track sections with narrative text, photo references as Markdown image links (relative paths to `images/`), paint palette as a Markdown table, and stats.

The ZIP format is for archival and manual formatting. The Markdown file is designed to be readable in Obsidian, VS Code, or any Markdown viewer.

The ZIP file is saved to `exports/<YYYYMMDD>[-N]/build-log.zip` within the project directory.

---

## 6. Quick Export

The "Quick Export" button bypasses the dialog and generates a PDF immediately using smart defaults:

- All sections enabled except Materials List and Assembly Map
- All gallery and hero photos selected; progress and reference photos deselected
- No user narrative (milestone notes used where available)
- Hero photo: project's designated hero photo
- Title: project name
- Subtitle: "{manufacturer} {scale} · {product_code}"
- Format: PDF

If the user has previously opened the export dialog and made curation changes, Quick Export uses those saved settings instead of the defaults.

---

## 7. Export History

Each export is recorded in the `export_history` database table (see TECH_SPEC.md):

```sql
CREATE TABLE IF NOT EXISTS export_history (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  format      TEXT NOT NULL CHECK(format IN ('pdf','html','zip')),
  file_path   TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
```

The Project Info card in Overview shows the most recent export date and format. A "View exports" link opens the exports directory in the system file manager.

---

## 8. Typst Template Architecture

The Typst template is bundled with the app in `src-tauri/resources/templates/build-log.typ`. It receives a JSON data file generated by the Rust backend containing all project data, section enable flags, selected photo paths, and narrative text.

### 8.1 Data flow

1. User clicks "Export PDF" in dialog
2. Frontend sends export configuration to Rust backend via Tauri command: `export_build_log { project_id, format, sections, selected_photos, cover_config, track_narratives }`
3. Rust backend:
   a. Queries database for project data, tracks, steps, paints, accessories, build log entries
   b. Copies selected photos to a temporary staging directory
   c. Generates a JSON data file matching the template's expected schema
   d. Invokes Typst compiler with the template and data file
   e. Writes output PDF to `exports/<YYYYMMDD>[-N]/build-log.pdf`
   f. Records export in `export_history` table
   g. Returns file path to frontend
4. Frontend shows success notification with "Open" and "Show in Folder" actions

### 8.2 Template structure

```
src-tauri/resources/templates/
├── build-log.typ         # Main template (page setup, section routing)
├── cover.typ             # Cover page layout
├── track-spread.typ      # Track section layout
├── gallery.typ           # Gallery page layout
├── appendix.typ          # Paint palette, stats, materials
├── assembly-map.typ      # Assembly map embed
└── fonts/
    └── DMSans-*.ttf      # Bundled font files
```

The main template imports section modules and conditionally includes them based on the section enable flags in the data file.

---

## 9. Export Configuration Persistence

Export settings are stored per-project in the database so the user's curation carries across sessions. When the export dialog opens, it loads the last-used settings. If no previous export exists, defaults are used (section 6).

Settings stored:
- Section enable/disable flags
- Selected photo IDs (for gallery)
- Cover hero photo ID
- Cover title and subtitle overrides
- Track narrative text (per track)
- Format selection

These are stored as a JSON blob in the `project_ui_state` table (same table used for build zone UI state persistence).

---

## 10. Cross-References

- **TECH_SPEC.md** § "Build log PDF export": Typst crate integration, HTML and ZIP code paths
- **TECH_SPEC.md** § "Cargo.toml dependencies": `typst = "0.12"`
- **TECH_SPEC.md** § "Export history table": `export_history` schema
- **PROJECT_PROPOSAL.md** § "Build Log Export": Original content structure (superseded by this document's section definitions, but original format descriptions remain valid)
- **PROJECT_PROPOSAL.md** § "File Storage Structure": `exports/<YYYYMMDD>[-N]/` directory layout
- **UI_DESIGN.md**: Design tokens (colors, typography, spacing) used in the export dialog
- **ROADMAP.md** § Phase 7: Export implementation phase
- **export-mockup.jsx**: Interactive React mockup of the export dialog
