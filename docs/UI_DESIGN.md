# Model Builder's Assistant — UI Design

This document captures UI design decisions for the app. It is being built collaboratively — the decisions below are confirmed, and the "still to decide" section lists what remains.

## Context

The app is a desktop Tauri v2 app for scale model builders (see PROJECT_PROPOSAL.md for the full UX spec and TECH_SPEC.md for the stack). It has three zones: Collection (kit/paint/accessory management), Build (instruction image workspace with setup and building modes), and Overview (project dashboard with assembly map, gallery, build log, and materials). The tech stack is React 19, shadcn/ui, Tailwind CSS v4, and Konva for the canvas layer.

The UI design process started by establishing fundamentals (mood, palette, typography) and needs to continue into component-level decisions, layout specifics, and zone-by-zone design.

### Companion Documents

- `WISHLIST_FEATURE.md` — Wishlist/owned badge system, acquire interactions, price & buy link display, batch operations, prominence escalation, Materials card BOM, shopping list export. Cross-cuts sections 27, 28, 30, 32, 34, 35.
- `EXPORT_FEATURE.md` — Build log export dialog, PDF page design (Typst), HTML/ZIP formats, photo curation, section customization. Implements the export referenced in Project Info card (section 41).
### Interactive Mockups

- `paint-shelf.jsx` — Paint shelf with catalogue lookup, grouping, and detail panel (section 32.6–32.7)
- `project-creation.jsx` — First-run empty state, create dialog, post-creation landing (section 38)
- `build-log.jsx` — Build Log with day groups, composer, filters, compact/expanded (section 39)
- `build-log-dots.jsx` — Timeline dot reference: track-colored step numbers, milestone squares (section 39.1)
- `gallery-card.jsx` — Gallery with masonry layout, lightbox, photo sources, filters (section 40)
- `wishlist-q4-prominence.jsx` — Prominence escalation variants A/B/C (section 7 of WISHLIST_FEATURE.md)
- `wishlist-q4-hybrid.jsx` — Variant A + accent strip comparison
- `wishlist-q5-materials.jsx` — Materials card compact/expanded with filters (section 8 of WISHLIST_FEATURE.md)

## How to Continue This Document

Use Claude desktop app with artifacts to continue making decisions. The process:

1. Present each open decision with visual mockups/artifacts showing the options
2. Include pros, cons, context, and examples for each option
3. Once decided, add the result to the "Decisions Made" section below
4. Work through the "Still To Decide" list, then move into zone-specific layout and component design

The goal is a complete, actionable UI design document that can be handed directly to implementation. Every decision should include concrete values (hex codes, pixel sizes, specific component behaviors) not just general direction.

---

## Decisions Made

### 1. Mood and Direction

#### 1.1 Mood
Warm modern — warm surfaces, clean flat execution, no textures or skeuomorphism. "Nice woodshop with good lighting" not "rustic barn." The warmth comes from background tones, not decorative elements.

#### 1.2 Theme Priority
Light mode first, dark mode adapted later.

#### 1.3 Density
Comfortable baseline (14px body, 8-16px padding), compact in the Build zone's rail and toolbars. Primary display is a 13.6" MacBook Air (effective ~1470px wide), so the Build zone in particular needs to be efficient with space.

#### 1.4 Personality
Polished and satisfying — smooth transitions, well-considered details. The app should feel crafted. Worth trading some efficiency for delight.

#### 1.5 Color Approach
Subtle tints — warm tinted surfaces give personality. Track colors and photos should be the primary saturated elements in the UI. The chrome itself stays muted.

---

### 2. Base Palette: Warm White

Warm enough to avoid sterile feel while letting instruction images (black-and-white line art) and track colors be the visual stars.

| Token            | Hex       | Usage                                     |
|------------------|-----------|--------------------------------------------|
| Background       | `#F8F6F3` | App background, page fills                 |
| Card             | `#FFFFFF` | Card surfaces, input backgrounds           |
| Sidebar          | `#F2EFEB` | Sidebar backgrounds, secondary surfaces    |
| Border           | `#E5E0DA` | All inline borders, dividers, separators   |
| Tag Background   | `#EDEBE8` | Tag fills, chip backgrounds, subtle wells  |

---

### 3. Accent Color: Kure Steel

Derived from IJN Kure Grey (Tamiya XF-75, a naval ship paint). The original paint color (#828D93) was too desaturated for UI use, so the blue undertone was deepened and saturated to create a usable accent that retains its naval heritage.

| Token         | Hex       | Usage                                      |
|---------------|-----------|--------------------------------------------|
| Accent        | `#4E7282` | Primary buttons, active nav, links, badges |
| Accent Hover  | `#3F5F6E` | Button hover, link hover                   |
| Accent Light  | `#4E728214` | Selected item backgrounds, tinted wells  |
| On-Accent     | `#FFFFFF` | Text and icons on accent backgrounds       |

---

### 4. Destructive Color

| Token         | Hex       | Usage                                      |
|---------------|-----------|--------------------------------------------|
| Destructive   | `#D43D3D` | Delete buttons, error states, danger alerts|

More true red than terracotta, for unambiguous danger signaling distinct from the Kure Steel accent.

---

### 5. Typography: DM Sans

Geometric with soft warmth and slightly rounded terminals. Warm enough to match the palette, precise enough for small metadata (11px), distinctive enough for personality.

| Level       | Size  | Weight | Usage                                 |
|-------------|-------|--------|----------------------------------------|
| Title       | 20px  | 700    | Zone titles, dialog headings           |
| Heading     | 16px  | 700    | Section headings, card titles          |
| Body        | 14px  | 400    | Body text, descriptions, form labels   |
| Small       | 12px  | 400    | Secondary text, captions               |
| Meta        | 11px  | 400    | Metadata, counts, timestamps           |
| Overline    | 10px  | 600    | Section labels, category tags          |

shadcn font variable: `--font-sans: 'DM Sans', sans-serif`

---

### 6. Corner Radii: Subtle (Precision)

Tighter corners give a deliberate, engineered quality. More "drafting tool" than "consumer app."

| Element  | Radius | shadcn token  |
|----------|--------|---------------|
| Cards    | 8px    | `--radius`    |
| Buttons  | 6px    | `calc(var(--radius) - 2px)` |
| Inputs   | 6px    | `calc(var(--radius) - 2px)` |
| Tags     | 4px    | `calc(var(--radius) - 4px)` |
| Dialogs  | 10px   | `calc(var(--radius) + 2px)` |

shadcn `--radius`: `0.375rem`

---

### 7. Elevation Style: Borders + Float Shadows

Borders for inline surfaces. Soft shadows reserved for elements that float above the page.

| Surface Type                          | Border                  | Shadow                                   |
|---------------------------------------|-------------------------|------------------------------------------|
| Cards, sidebar, info bar, rails       | `1px solid #E5E0DA`     | None                                     |
| Dialogs, popovers, dropdowns, bubble  | `1px solid #E5E0DA`     | `0 8px 30px rgba(0,0,0,0.08)`           |
| Hover on interactive cards            | `1px solid #E5E0DA`     | `0 2px 8px rgba(0,0,0,0.06)`            |

---

### 8. Motion: Polished

Smooth 150-250ms transitions. Deliberate and satisfying, not bouncy or springy.

| Context                | Duration | Easing                              | Notes                                |
|------------------------|----------|--------------------------------------|--------------------------------------|
| Panel transitions      | 200ms    | `cubic-bezier(0.16, 1, 0.3, 1)`    | Sidebar collapse/expand, mode switch |
| Hover states           | 120ms    | `ease`                              | Buttons, cards, list items           |
| Dialog entrance        | 150ms    | `cubic-bezier(0.16, 1, 0.3, 1)`    | Fade + scale from 0.97 to 1.0       |
| Step completion        | 150ms    | `cubic-bezier(0.16, 1, 0.3, 1)`    | Checkmark pop, then prompt slides in |
| Zone switching         | Instant  | —                                   | No crossfade between zones           |
| Drag-and-drop          | 0ms      | —                                   | Elements follow cursor immediately   |
| Drop target highlights | 100ms    | `ease`                              | Highlight on valid drop zones        |

No spring physics, no overshoot, no bounce.

---

### 9. Icons: Lucide Outlined

Lucide icons, outlined style, 1.5px stroke weight. Already bundled with shadcn/ui (zero extra dependency). Clean and precise, matches the subtle radius and flat elevation style.

Default size: 20px for nav, 16px for inline, 14px for compact/metadata contexts.

---

### 10. Text Color Hierarchy: High Contrast Warm

Deep warm darks for strong readability. Tertiary passes WCAG AA at all sizes.

| Token         | Hex       | Contrast on White | Usage                                      |
|---------------|-----------|-------------------|--------------------------------------------|
| Primary       | `#0C0A09` | 19.3:1            | Headings, input values, kit names          |
| Secondary     | `#44403C` | 8.8:1             | Body text, descriptions, nav labels        |
| Tertiary      | `#78716C` | 4.8:1             | Metadata, counts, timestamps, placeholders |
| Accent Text   | `#4E7282` | —                 | Links, active nav, current step indicator  |
| On-Accent     | `#FFFFFF` | —                 | Text on Kure Steel backgrounds             |

---

### 11. Semantic Colors: Warm-Shifted

Shifted warmer to stay on-palette. Success has a sage tone, warning is amber-gold, error uses the established destructive red, info reuses the accent.

| Token   | Hex       | Usage                                              |
|---------|-----------|----------------------------------------------------|
| Success | `#5A9A5F` | Completed tracks/steps, save confirmations         |
| Warning | `#C4913A` | Drying timer alerts, access-seal warnings          |
| Error   | `#C84B3A` | Validation errors, destructive confirmations       |
| Info    | `#5A7A88` | Informational toasts, help text, neutral notices   |

Usage patterns:
- Alert banners: `background: {color}10`, `border-left: 3px solid {color}`, `border: 1px solid {color}30`
- Badges: `background: {color}18`, `color: {color}`
- Status dots: `8px circle, filled with {color}`

---

### 12. Focus & Selection States: Glow Ring

Glowing halo effect using Kure Steel tint. Adds visual warmth while maintaining accessibility.

| Context             | Style                                                                   |
|---------------------|-------------------------------------------------------------------------|
| Focus ring          | `box-shadow: 0 0 0 1px #4E7282, 0 0 8px #4E728240`                   |
| Input focus         | `border: 2px solid #4E7282`, `box-shadow: 0 0 8px #4E728230`         |
| Selected list item  | `background: #4E728214`, `border-left: 3px solid #4E7282`            |
| Active nav item     | Accent text color + accent-tinted background                           |
| Selected card       | `border: 2px solid #4E7282`                                           |

---

### 13. Track Color Palette

Eight saturated colors for build track identification. Designed to be distinguishable from each other, from the Kure Steel accent, and from semantic colors. All work at 15% opacity as overlays on white instruction images.

| Index | Name          | Hex       | Default Assignment  |
|-------|---------------|-----------|---------------------|
| 1     | Terracotta    | `#C2553A` | Hull                |
| 2     | Steel Blue    | `#3A7CA5` | Superstructure      |
| 3     | Olive         | `#5B8A3C` | Weapons             |
| 4     | Gold          | `#C49A2A` | PE Details          |
| 5     | Purple        | `#7B5EA7` | Rigging             |
| 6     | Burnt Orange  | `#C47A2A` | Weathering          |
| 7     | Teal          | `#2A8A7A` | (available)         |
| 8     | Mauve         | `#8B5E6B` | (available)         |

Usage contexts:
- Step region overlays on instruction images (15% opacity fill, 100% border)
- Assembly Map node fills (completed) and strokes (incomplete)
- Track list left-border indicators
- Step tag pill backgrounds

---

### 14. Empty States: Illustrative

#### 14.1 Primary Empty States
Simple geometric illustration (using track palette colors at low opacity) + heading + description + action button. Used for major content areas: empty collection, no active project, empty gallery.

- Illustration: abstract geometric shapes (overlapping rectangles, circles), not clip art or characters
- Heading: 16px/700, describes the state ("Your collection is empty")
- Description: 12px, 1-2 lines, tells user what to do ("Add your first kit to start tracking your builds")
- Action button: primary accent button with the most logical next action

#### 14.2 Secondary Empty States
Minimal treatment for smaller sections: icon (Lucide, 32px, tertiary color at 50% opacity) + one line of text + action button. Used for empty track lists, empty step lists within a track, empty build log.

---

### 15. Toast / Notification System

#### 15.1 Position and Stacking
Bottom-right corner of the window. Toasts stack upward. Maximum 3 visible; oldest auto-dismissed when a 4th arrives.

#### 15.2 Toast Anatomy
- Left color bar (6px wide, rounded, colored by type)
- Title (12px/600)
- Optional description (11px, tertiary)
- Optional action button ("Undo", "Retry", "Dismiss")
- Close button (×)
- Border: `1px solid #E5E0DA`, shadow: `0 8px 30px rgba(0,0,0,0.08)` (floating elevation)

#### 15.3 Duration by Type

| Type            | Duration | Color bar | Action     | Behavior                          |
|-----------------|----------|-----------|------------|-----------------------------------|
| Success / Info  | 3s       | Success or Info | None  | Auto-dismiss                      |
| Undo-able       | 5s       | Accent    | "Undo"     | Dismissed on click or timeout     |
| Warning         | 6s       | Warning   | Optional   | Longer to ensure user notices     |
| Error           | Sticky   | Error     | "Retry"    | Must be manually dismissed        |

#### 15.4 Animation
- Enter: 200ms slide-up + fade-in
- Exit: 150ms slide-right + fade-out
- Stack reflow: 150ms ease-out when a toast is dismissed and others shift

---

### 16. Saving Feedback: Status Bar

Thin status bar at the bottom edge of the window. Always visible, unobtrusive.

#### 16.1 Anatomy
- Height: ~20px
- Background: `#F8F6F3` (app background)
- Top border: `1px solid #E5E0DA`
- Content: right-aligned status dot + text

#### 16.2 States

| State       | Dot color | Text              | Notes                                     |
|-------------|-----------|-------------------|-------------------------------------------|
| Saved       | Success   | "All changes saved" | Default idle state                       |
| Saving      | Warning   | "Saving..."       | Shown during write operations              |
| Save error  | Error     | "Save failed — retrying" | Auto-promotes to sticky error toast if retry fails |

The status bar may also display other contextual info (e.g., step count, zoom level) on the left side in future phases.

---

### 17. Error Handling: Layered

Three tiers of error severity, each with its own presentation.

#### 17.1 Field Validation (Inline)
- Input border turns Error color (`#C84B3A`)
- Error message appears directly below the field (10px, Error color)
- Input gets subtle error shadow: `0 0 0 1px #C84B3A20`
- Triggered on blur or on submit attempt
- Clears when user corrects the input

#### 17.2 Operation Errors (Toast)
- Sticky error toast (bottom-right, per section 15)
- Error color bar on left
- Title describes what failed ("PDF import failed")
- Description gives reason ("File may be corrupted")
- Optional "Retry" action button
- Must be manually dismissed

#### 17.3 Critical / Unrecoverable Errors (Dialog)
- Blocking modal dialog (floating elevation)
- Error icon: 32px circle with `#C84B3A15` background, "!" in Error color
- Title: what happened ("Database Error")
- Description: what it means and what user can do
- Action buttons: secondary (alternative path, e.g., "Locate File") + primary (main recovery, e.g., "Retry")
- Cannot be dismissed without taking an action

---

### 18. Undo / Redo: Toolbar + Keyboard

#### 18.1 Scope
Setup mode only. Building mode actions (step completions) use confirmation dialogs for reversal instead.

#### 18.2 UI Affordance
Undo and Redo buttons in the Setup mode toolbar, next to the mode label. Gray out when nothing to undo/redo. Always paired with keyboard shortcuts (⌘Z / ⌘⇧Z on Mac, Ctrl+Z / Ctrl+Shift+Z on Windows/Linux).

#### 18.3 Undo-able Actions
- Crop region draw and delete
- Step create, delete, and reorder
- Track create, delete, and reorder
- Step metadata edits (title, adhesive, notes, tags, etc.)

#### 18.4 Not Undo-able
- PDF upload and removal (these use confirmation dialogs)
- Image cleanup mask edits (the mask editor has its own internal undo)

#### 18.5 History
- Per-project, cleared on project switch
- Maximum 50 entries
- Linear history (performing a new action after undo clears the redo stack)

---

### 19. Confirmation Patterns: Threshold-Based

Actions are categorized by risk level. Low-risk single-item actions use toast+undo for flow. High-risk multi-item or unrecoverable actions use confirmation dialogs for safety.

#### 19.1 Action → Response Mapping

| Action                  | Response                     | Rationale                              |
|-------------------------|------------------------------|----------------------------------------|
| Delete single step      | Toast with Undo (5s)         | Low risk, easily re-created            |
| Delete track (+ steps)  | Confirmation dialog          | Destroys multiple items                |
| Delete kit              | Confirmation dialog          | Destroys project + all associated data |
| Remove PDF              | Confirmation dialog          | Affects all crops from that PDF        |
| Un-complete step        | Confirmation dialog          | Per ROADMAP spec; reverses progress    |
| Complete step           | Immediate                    | Forward progress, non-destructive      |
| Reorder step/track      | Immediate (undo via ⌘Z)     | Non-destructive, easily reversed       |
| Mark build complete     | Confirmation dialog          | Major milestone, per ROADMAP spec      |

#### 19.2 Confirmation Dialog Rules
- Destructive button label matches the action verb ("Delete Track", not "OK" or "Confirm")
- Description states what will be lost ("This will remove the track and all 12 steps")
- States whether the action is reversible ("This can't be undone")
- Button order: Cancel (secondary, left) → Destructive action (right)
- Destructive button uses `#D43D3D` background

---

### 20. Drag & Drop: Placeholder Gap

#### 20.1 Drag Feedback
When an item is dragged, it leaves its slot (which collapses with 150ms animation). A dashed placeholder appears at the current insertion point, showing exactly where the item will land.

- Placeholder: dashed border (`1px dashed #4E728240`), accent-tinted background (`#4E728206`), height matches the dragged item
- Drop target highlight: accent top-border (`2px solid #4E7282`) on the slot above the insertion point

#### 20.2 Grab Handle
Six-dot grip icon (⠿). Visible on hover in comfortable density, always visible in compact density (Build rail).

#### 20.3 Cursors
- Hover on handle: `grab`
- During drag: `grabbing`
- Over invalid target: `not-allowed`

#### 20.4 Drop Behavior
- Release on valid target: item settles into position (150ms ease-out)
- Release on invalid target or Escape: item returns to original position (150ms ease-out)
- Drag outside the list boundary: same as invalid target

#### 20.5 Contexts
- Step reorder within a track (Setup mode step list)
- Track reorder (Setup mode track list)
- Drying timer bubble repositioning (free-drag, position persists)

---

### 21. Keyboard Navigation: Roving + Shortcuts

#### 21.1 Navigation Model
Roving tabindex pattern (ARIA best practice for composite widgets). Tab moves between major regions; arrow keys navigate within lists.

| Key                  | Action                                           |
|----------------------|--------------------------------------------------|
| `Tab`                | Move focus between regions (nav → sidebar → workspace → info bar) |
| `↑ / ↓`             | Move within lists (step list, track list, kit grid) |
| `Enter`              | Activate / select focused item                   |
| `Escape`             | Back up one level (close dialog, deselect, exit overlay) |
| `?`                  | Show keyboard shortcut overlay                   |

#### 21.2 ROADMAP Shortcuts (Build Zone)

| Key                  | Action                                           |
|----------------------|--------------------------------------------------|
| `← / →`             | Previous / next step within active track         |
| `Space` or `Enter`  | Complete current step                            |
| `Tab / Shift+Tab`   | Next / previous instruction page                 |
| `T`                  | Start drying timer from current step             |
| `/`                  | Focus search within current entity tab            |

#### 21.3 Shortcut Overlay
Triggered by `?`. Modal overlay listing all shortcuts grouped by context (Global, Build, Setup). Dismissed by `Escape` or clicking outside. Uses floating elevation (shadow + border).

---

### 22. Window Sizing: Responsive (960px minimum)

#### 22.1 Minimum Dimensions
- Width: 960px
- Height: 600px

#### 22.2 Collapse Cascade

| Window width | Adaptation                                                     |
|--------------|----------------------------------------------------------------|
| 1470px+      | Full layout: all panels at comfortable density                 |
| 1200–1470px  | Sidebar labels collapse to icons only (rail mode)              |
| 1080–1200px  | Setup step editor becomes a slide-over panel instead of fixed third column |
| 960–1080px   | Compact density applied everywhere                             |
| Below 960px  | Hard minimum, no further collapse                              |

#### 22.3 Height Behavior
- Below 640px: info bar fields stack vertically instead of horizontal layout
- Below 600px: hard minimum

### 23. Buttons (Pass 3)

Two-size scale (sm/md). Five variants.

#### 23.1 Size Scale
- **sm**: height 30px, horizontal padding 12px, font-size 12px, icon 14px, icon-only button 28×28px
- **md**: height 36px, horizontal padding 16px, font-size 13px, icon 16px, icon-only button 36×36px

#### 23.2 Variants
- **Primary**: background `#4E7282`, text white, no border. Hover: `#3F5F6E`.
- **Secondary**: background transparent, text `#44403C`, border `1.5px solid #E5E0DA`. Hover: background `#F2EFEB`.
- **Ghost**: background transparent, text `#44403C`, no visible border. Hover: background `#F2EFEB`.
- **Destructive**: background `#D43D3D`, text white, no border.
- **Destructive Ghost**: background transparent, text `#D43D3D`, no visible border.

#### 23.3 Icon Buttons
Same height as text buttons. Icon centered. For icon+text buttons, 5px gap between icon and label.

#### 23.4 States
- **Loading**: 0.7 opacity, spinner (14px, 2px border, white, 0.8s linear spin) replaces icon or appears before label text. Cursor: not-allowed.
- **Disabled**: background `#EDEBE8`, text `#78716C`, cursor not-allowed.

#### 23.5 Border Radius
All buttons use 6px radius (the button/input radius from section 5.2).

### 24. Inputs & Forms (Pass 3)

Labels outside (above) inputs. Standard stacked layout for the step editor.

#### 24.1 Label Style
- Font-size 12px, weight 500, color `#44403C`
- Positioned above input with 3px margin-bottom

#### 24.2 Text Input
- Height: auto (padding determines), padding 7px 10px
- Background: `#FFFFFF`, border: `1.5px solid #E5E0DA`, radius 6px
- Font-size 13px, color `#0C0A09`

#### 24.3 Input States
- **Default**: border `#E5E0DA`, placeholder color `#78716C`
- **Focused**: border `2px solid #4E7282`, box-shadow `0 0 8px #4E728230`
- **Error**: border `1.5px solid #C84B3A`, box-shadow `0 0 0 1px #C84B3A20`. Error message below: 10px, color `#C84B3A`
- **Disabled**: background `#F2EFEB`, opacity 0.6, border `#E5E0DA`

#### 24.4 Dropdown/Select
Same dimensions as text input. Chevron-down icon (14px, `#78716C`) right-aligned inside.

#### 24.5 Textarea
Same styling as text input but with min-height 48px. Line-height 1.5.

#### 24.6 Toggle Switch
- Track: 34×18px, radius 9px. On: background `#4E7282`. Off: background `#E5E0DA`.
- Thumb: 14×14px, radius 7px, white. Positioned via flex justify.

#### 24.7 Checkbox
- 16×16px (18×18 for form-level checkboxes), radius 4px
- Checked: background `#4E7282`, border `#4E7282`, white checkmark (11px stroke)
- Unchecked: background transparent, border `1.5px solid #E5E0DA`

### 25. Navigation Bar (Pass 3)

Hybrid adaptive layout with V3 project-centric zone bar and D3 grouped context toolbar.

#### 25.1 Structure
- **Zone bar** (Row 1): Always visible across all zones. Background `#F2EFEB`, border-bottom `1px solid #E5E0DA`, padding `6px 12px`.
- **Context toolbar** (Row 2): Only visible in Build zone. Background `#F8F6F3`, border-bottom `1px solid #E5E0DA`, padding `4px 12px`. Slides in with 200ms animation when entering Build.

#### 25.2 Zone Bar Contents
- **Left**: Segmented pill zone switcher (Collection / Build / Overview) with icons (16px Lucide icons: Package for Collection, Wrench for Build, LayoutDashboard for Overview). Active state: card background + subtle shadow inside pill. Font-size 12px.
- **Center**: Separator (1px × 18px `#E5E0DA`) + project dropdown (when in Build or Overview). Dropdown: card background, 1px border, 6px dot in accent color + project name + chevron-down. In Overview, followed by completion percentage in success color.
- **Right**: Search icon button. In Collection, also the "+ Add" primary button (sm size).

#### 25.3 Context Toolbar — D3 Grouped Zones Layout
Three spatial groups with consistent positioning:

**Left group (Modes):**
- Setup/Building segmented pill (sm size)
- Track/Page segmented pill (sm size)

**Center group (Context, flex: 1):**
Adapts based on Track/Page view mode:
- **Track mode**: Track color dot (8px) + track name (11px/500) + mini progress bar (40×3px in track color, fraction text 9px)
  - In Building mode, also shows step position text ("step 3/8", 10px monospace)
- **Page mode**: Source dropdown (file icon + PDF name + chevron, 10px) + page nav arrows (◀ 4/18 ▶, monospace)

**Right group (Tools):**
Always in the same position regardless of mode:
- Zoom controls: minus button, percentage readout (9px monospace), plus button, fit-to-view button
- Separator
- Mode-specific tools:
  - Setup: Undo/Redo icon buttons (ghost)
  - Building: Camera icon button + Help icon button

#### 25.4 Toolbar Per-Zone Summary
- **Collection**: Zone bar only (single row). Contains zone switcher + search + Add button.
- **Build**: Zone bar + context toolbar (two rows). Zone bar has project dropdown. Context toolbar has all Build controls.
- **Overview**: Zone bar only (single row). Contains zone switcher + project dropdown + completion percentage + search.

#### 25.5 Segmented Pill Specs
- Container: background `#EDEBE8`, radius 6px, padding 3px
- Items: radius 4px, cursor pointer
- **md size**: padding 5px 12px, font-size 12px
- **sm size**: padding 3px 8px, font-size 10px
- Active item: background `#FFFFFF`, font-weight 600, color `#4E7282`, box-shadow `0 1px 2px rgba(0,0,0,0.05)`
- Inactive item: background transparent, font-weight 400, color `#78716C`

#### 25.6 Responsive Behavior
Per section 22, the zone bar handles collapse independently from the context toolbar:
- At 1200px: Zone switcher drops labels, shows icons only
- At 1080px: Context toolbar project name truncates, segmented pill labels may abbreviate
- At 960px: Compact density applied to both rows

### 26. Sidebar / Rail (Pass 3)

Expandable rail in Build zone. Shows track list (Track mode) or page thumbnail list (Page mode).

#### 26.1 Dimensions
- Default width: 200px
- Resizable range: 180–280px via drag handle
- Drag handle: 4×30px bar, radius 2px, color `#E5E0DA`, positioned at rail right edge, centered vertically. Cursor: col-resize.

#### 26.2 Appearance
- Background: `#F2EFEB`, border-right `1px solid #E5E0DA`
- Header: padding 8px 10px, border-bottom, "Tracks" label (11px/600) + add button (+ icon in accent color)

#### 26.3 Track List Items
- Padding: 6px 10px
- Left border: 3px solid in track color
- Track name: 12px, weight 400 (600 when active)
- Completion: fraction text (10px) in success color when complete, tertiary otherwise
- Thin progress bar: 40×3px, track-colored fill
- Active track: background `#4E728214`
- Expanded active track shows step thumbnails: 4px 6px padding, 20×14px thumbnail, 11px step name, ellipsis overflow

#### 26.4 Collapse Cascade
Per section 22: at 1200–1470px, sidebar collapses to icon-only rail mode (labels become icons). The specific collapsed width and appearance are determined by the window sizing rules.

### 27. Cards (Pass 3)

#### 27.1 Kit Card (Horizontal)
- Background: `#FFFFFF`, radius 8px, border `1px solid #E5E0DA`
- Padding: 10px 12px, cursor pointer
- Layout: flex row, 10px gap
- Thumbnail: 56×42px, radius 6px, gradient placeholder when no box art
- Title: 13px/600, color `#0C0A09`, ellipsis overflow
- Status line: 11px, status text in status color (accent for Building, tertiary for On the Shelf, warning for Wishlist, success for Completed) + weight 500
- Progress (when building): dot separator + percentage + thin bar (40×3px, accent fill)
- Wishlist kits: price (monospace) + retailer link on metadata row after manufacturer. "Acquired" button right-aligned. See `WISHLIST_FEATURE.md` sections 5.1, 6.

#### 27.2 Kit Card Accessory Tray (Accordion)
When a kit has linked accessories, a "N parts" badge appears at the card's right edge (9px/500 text, `#EDEBE8` background, 4px radius, chevron icon). Click to expand/collapse.

**Expanded tray:**
- Appears below kit info, inside the same card border
- Border-top: `1px solid #E5E0DA`, background `#F2EFEB`, padding 6px 10px 6px 12px
- Contains vertically stacked accessory rows + dashed "+ Link accessory" button

**Accessory rows (color-edge, two-line):**
- Container: background `#FFFFFF`, radius 4px, border `1px solid #E5E0DA`, overflow hidden, 3px gap between rows
- Left color bar: 3px wide, `background: {typeColor}`, full height of row
- Type colors: PE `#7B5EA7`, Resin `#C47A2A`, Decals `#3A7CA5`, 3D Print `#5B8A3C`
- Content padding: 5px 8px
- Line 1: Accessory name, 11px/500, `#0C0A09`, ellipsis overflow
- Line 2: Type label (9px/500 in type color) + dot separator + note text (9px, `#78716C`), ellipsis overflow
- Right side: owned items show 14px green check circle (`#5A9A5F` at 20% bg); wishlist items show semantic pill tag. Both are clickable toggles. See `WISHLIST_FEATURE.md` sections 3, 5.2 for full badge and acquire interaction spec.
- Wishlist items: price + buy link appear on Line 2 after brand, with separator. See `WISHLIST_FEATURE.md` section 6 for display rules.

**"+ Link accessory" button:**
- Dashed border (`1px dashed #E5E0DA`), radius 4px, 10px font, accent color, centered
- Plus icon (10px) + "Link accessory" text

#### 27.3 Overview Zone Cards
- 2×2 grid (Gallery, Build Log, Materials, Project Info)
- Background `#FFFFFF`, radius 6px, border `1px solid #E5E0DA`
- Padding 10px, cursor pointer
- Title: 11px/600 + summary text: 10px tertiary
- Click to expand, Escape to collapse

#### 27.4 Step Cards (Setup Mode, Detailed Rows)
Step list items in the track panel. Two-line rows with full metadata visibility.

**Row layout:**
- Padding: 6px 8px (sub-steps: 6px 8px 6px 28px, indented 20px)
- Active step: background `#FFFFFF`, border `1px solid #E5E0DA`, radius 4px
- Inactive step: transparent background, transparent border
- Cursor: pointer. Drag handle cursor: grab → grabbing.

**Row contents (left to right):**
1. Drag handle: 6-dot grip icon (10px, `#78716C` at 40% opacity, full on hover)
2. Step completion marker (per section 30.3): done/active/pending states
3. Thumbnail: 28×20px, radius 2px, `#EDEBE8` background with `1px solid #E5E0DA` border
4. Content block (flex: 1):
   - Line 1: Step title, 11px, weight 600 (active) or 400 (others), `#0C0A09` (pending) or `#78716C` (done, with line-through)
   - Line 2: Tags row — pre-paint flag (semantic warning pill), user tags (neutral pills per section 31.1), adhesive type (8px tertiary, after dot separator), quantity ×N (8px tertiary, after dot separator)

**Sub-step treatment:**
- Indented 20px from parent
- Same row structure, same drag behavior
- Sub-steps stay within parent's drag scope
- Optional ↳ glyph before title (visual only, indent establishes the relationship)

**Metadata visibility rules:**
- Always visible: completion marker, title, drag handle
- Visible if set: pre-paint flag, tags, thumbnail
- Visible on hover/active: adhesive type, quantity, drag handle opacity increase
- Full detail: step editor panel (click to open)

### 28. Dialogs & Sheets (Pass 3)

Centered dialogs with dimmed overlay.

#### 28.1 Overlay
- Background: `rgba(0,0,0,0.25)`
- Click outside to close (except critical error dialogs per section 18)
- Escape key to close

#### 28.2 Dialog Styles
- Background: `#FFFFFF`, radius 10px, border `1px solid #E5E0DA`
- Box-shadow: `0 8px 30px rgba(0,0,0,0.08)`
- Padding: 16px
- Animation: 150ms fade + scale(0.97→1)

#### 28.3 Dialog Sizes
- **Confirmation**: 320–400px wide. Title (14px/700) + description (12px, secondary) + 2 buttons.
- **Form dialog**: 480px wide. For quick-add, settings, edit dialogs.
- **Large dialog**: 640px wide. For keyboard shortcut overlay, complex forms.

#### 28.4 Quick-Add Sheet
Always a centered dialog (480px), triggered by the global + button. Three option buttons (Kit / Accessory / Paint) in a row, each with icon + label.

#### 28.5 Button Placement in Dialogs
- Cancel (secondary) left, primary action right
- Destructive actions: right-aligned, destructive variant
- Button labels match action verb ("Delete Track" not "OK")

### 29. Tooltips & Popovers (Pass 3)

With arrow, pointing to trigger element.

#### 29.1 Tooltip Style
- Background: `#0C0A09`, text white, font-size 11px
- Padding: 4px 8px, radius 4px
- Box-shadow: `0 2px 8px rgba(0,0,0,0.12)`
- Arrow: 5px triangle in same background color, pointing toward trigger

#### 29.2 Keyboard Shortcut Tooltips
Same base style. Shortcut displayed in `<kbd>` tag: background `rgba(255,255,255,0.15)`, radius 2px, padding 1px 4px, font-size 9px monospace.

#### 29.3 Popover Style
- Background: `#FFFFFF`, radius 8px, border `1px solid #E5E0DA`
- Box-shadow: `0 8px 30px rgba(0,0,0,0.08)`
- Arrow: 6px triangle in white with subtle drop-shadow
- Used for: Assembly Map step hover, paint reference preview

#### 29.4 Timing
- Tooltip enter delay: 400ms (prevents flicker on mouse-through)
- Tooltip exit: 100ms fade-out
- Popover enter delay: 200ms
- Popover exit: 150ms fade-out
- Side offset: 6px from trigger element

### 30. Progress Indicators (Pass 3)

Thin bars for track-level, segmented stacked bar for overall build progress.

#### 30.1 Track-Level Progress (Rail)
- Thin bar: 40×3px, radius 2px
- Background: `#EDEBE8`, fill in track color
- Accompanied by fraction text (9px, `#78716C`)

#### 30.2 Overall Build Progress
- Segmented stacked bar: height 8px, radius 4px, 2px gap between segments
- Each segment represents a track, proportional width based on step count
- Segment fill: track color, unfilled portion `#EDEBE8`
- Below bar: legend with color dot (6px) + track abbreviation + fraction (9px)
- Above bar: project name (13px/600) + percentage (12px accent/600)

#### 30.3 Step Completion Markers
- **Done**: 18×18px, radius 4px, background `#4E7282`, white checkmark (11px, stroke 3)
- **Current**: 18×18px, radius 4px, border `2px solid #4E7282`, center dot 6×6px accent
- **Pending**: 18×18px, radius 4px, border `1.5px solid #E5E0DA`, empty

### 31. Tags & Badges (Pass 3)

Rounded pills for all tag and badge treatments.

#### 31.1 Step Tags (User-Created)
- Background: `#EDEBE8`, color `#44403C`
- Font-size 10px, weight 500, padding 2px 8px, radius 10px (full pill)
- Hover: × icon appears for removal
- Max 3 visible inline, then "+N" overflow indicator

#### 31.2 Status Badges (System-Assigned)
- Background: `{statusColor}15` (15% opacity tint), color: status color
- Border: `1px solid {statusColor}25`
- Font-size 10px, weight 500, padding 2px 10px, radius 10px
- Status colors: Building `#4E7282`, On the Shelf `#78716C`, Wishlist `#C4913A`, Completed `#5A9A5F`
- Not dismissible

#### 31.3 Track Labels
- Same treatment as status badges but using track colors
- Background: `{trackColor}15`, color: track color, border `{trackColor}25`

#### 31.4 Paint Type Indicators
- Same treatment as step tags (neutral background)
- Types: Acrylic, Enamel, Lacquer

### 32. Collection Zone Layout (Pass 4)

#### 32.1 Structure
Single-column scrollable layout. One context bar below the zone bar, content area below.

#### 32.2 Context Bar
Background `#F8F6F3`, border-bottom `1px solid #E5E0DA`, padding `5px 12px`. Contains two control groups inline:

**Entity switcher (segmented pill):**
- Kits (with count) | Accessories (with count) | Paints (with count)
- Uses the standard segmented pill component (section 25.5), sm size
- Counts displayed as 8px text at 60% opacity inside each pill segment

**Status filter chips (Kits mode only):**
- Appear after a 1px × 16px separator, only when Kits is the active entity
- Chips: All, Building (count), Shelf (count), Wishlist (count), Done (count)
- Active chip: font-weight 600, color `#4E7282`, background `#4E728214`
- Inactive chip: font-weight 400, color `#78716C`, background transparent
- Chip style: padding 3px 8px, radius 10px (full pill), font-size 10px

#### 32.3 Kits View — "All" Filter
Collapsible section headers with kit cards below each. Default expanded: Building, On the Shelf, Wishlist. Default collapsed: Completed.

**Section header:**
- Chevron (10px, rotates 90° when collapsed) + section title (12px/600) + count (10px tertiary) + horizontal rule (flex: 1, 1px `#E5E0DA`)
- Padding: 6px 0, margin-top 8px
- Cursor: pointer

**Content area:**
- Padding: 8px 16px
- Kit cards stacked vertically with 4px gap
- Kit cards per section 27.1 (horizontal layout with accessory accordion per 27.2)

#### 32.4 Kits View — Status Filters
When a specific status filter is active (Building, Shelf, etc.), section headers are hidden and only matching kits are shown. Effectively a flat list of cards matching that status.

#### 32.5 Accessories View
Flat list of accessory rows using the V5 color-edge two-line pattern (section 27.2). Stacked vertically with 3px gap. Linked accessories show a link icon + parent kit name in the note line. Padding: 8px 16px.

#### 32.6 Paints View

**Toolbar additions (appended to context bar when Paints is active):**
- Group by selector: "Group:" label (9px tertiary) + pill toggles: Color Family (default) | Brand | Project. Same pill styling as status filter chips.
- Search field: 140px, card background, border, search icon + placeholder "Search paints..."
- View toggle: grid/list icon (12px tertiary), toggles between list and grid views.
- Add Paint button: primary style (accent bg, white text, 9px/600), plus icon + "Add Paint" label.

**List view (default):**
Collapsible family groups. Each group has:
- Header: chevron (10px, rotates) + family label (12px/600) + count (10px tertiary) + horizontal rule. When collapsed, header shows mini swatch previews (10×10px, up to 5, then "+N" overflow).
- Rows: 18×18px swatch (radius 3px, border) + name (11px/500) + code (9px monospace tertiary) + brand (9px tertiary) + type (8px tertiary) + kit links (8px accent) + price/link if wishlisted. Owned check or wishlist pill right-aligned. Row: card bg, radius 4px, border, padding 5px 6px, 3px gap.

**Grid view:**
Same collapsible groups. Items rendered as 64px-wide swatch cards: color fill (full width × 36px, radius 3px, border), name below (8px/500, ellipsis), code (7px monospace tertiary). Wishlisted items show a 6px warning dot (top-right of swatch, white border). Flex-wrap layout within each group.

**Detail panel:**
200px right sidebar (card bg, left border). Appears when a paint is selected in either view. Contents: large swatch (full width × 60px), name (14px/700), brand + code (11px tertiary), owned/wishlist status, "Used In" section (kit links with accent dots), color hex display, editable notes field, action buttons (Mark Owned for wishlist items, Edit for all).

**Color family assignment:**
Paints auto-assigned to a family (Reds & Oranges, Greys, Blues, Browns & Tans, Metallics, Greens, Whites & Creams, Blacks) via HSL analysis of swatch color. User can override per paint. Family definitions configurable in Settings.

**Default expanded groups:** Two largest families. Others collapsed with swatch previews.

#### 32.7 Add Paint Flow

**Trigger:** "Add Paint" button in Paints toolbar. Opens a dialog/sheet.

**Primary path — Catalog lookup:**
- Search field (focused on open): search by code, name, or brand. 
- Brand filter tabs below search: All Brands + individual brands (Tamiya, Vallejo, Mr. Color, AK Interactive, Ammo). Default brand pre-selected from Settings.
- Results list: swatch + name + brand + code per row, plus icon to add. Clicking + adds to shelf as owned.
- Auto-fills: name, swatch color, type (acrylic/enamel/lacquer), brand.

**Fallback — Manual entry:**
- "Not listed? Add manually" link at bottom of catalogue results.
- Form: name (text), brand (text/dropdown), code (text), type (dropdown: Acrylic/Enamel/Lacquer), color (color picker or hex input).

**Auto-add from project:**
- When a paint is assigned to a build step and isn't already on the shelf, it's automatically added as owned.
- Toast: "{Paint name} added to shelf." No user action required.
- Controlled by Settings toggle (default: on).

### 33. Build Zone — Setup Mode (Pass 4)

#### 33.1 Three-Panel Layout
Left-to-right: Track rail | Instruction canvas | Step editor.

- **Track rail**: 180px default width (resizable per section 26). Background `#F2EFEB`, border-right `1px solid #E5E0DA`. Shows track list with expanded steps for active track (per section 26.3).
- **Instruction canvas**: flex: 1 (fills remaining space). Background `#E8E4DF` (neutral warm grey, distinct from app-bg). Canvas content is zoomable/pannable via Konva.
- **Step editor**: 220px default width. Background `#FFFFFF`, border-left `1px solid #E5E0DA`. Scrollable. At window widths below 1080px, becomes a slide-over panel instead of fixed column (per section 22).

At 1470px, this gives: 180 + 1070 + 220 = 1470px. Canvas gets the lion's share.

#### 33.2 Step Editor — Core + Advanced (Variant B)

**Always visible (core fields):**
1. Header: "Step Editor" (12px/700) + close button (ghost X icon, right-aligned)
2. Crop preview thumbnail: full editor width, 80px height, `#EDEBE8` background, radius 6px, `1px solid #E5E0DA`
3. Title: text input (section 24.2)
4. Track + Adhesive: two-column row. Track shows color dot + track name in dropdown. Adhesive is dropdown.
5. Tags: inline pill row with "+ tag" dashed button
6. Notes: textarea (section 24.5), min-height 40px

**Collapsible "Advanced" section:**
- Toggle: chevron + "Advanced" label (10px/500 tertiary). Collapsed by default. Border-top `1px solid #E5E0DA` above toggle.
- Contents when expanded:
  - Source + Quantity: two-column row. Source is read-only (auto-populated from crop region).
  - Pre-paint required: toggle switch (section 24.6)
  - Blocked by: step picker dropdown
  - Blocks access to: step picker dropdown
  - Replaces step: step picker dropdown
  - Reference images: thumbnail strip with "+ add" dashed placeholder

#### 33.3 Crop Regions on Canvas

**Assigned regions (linked to a track):**
- Border: 2px solid, track color at 30% opacity
- Fill: track color at 5% opacity
- Corner label: solid track color background, white text (7px/700), shows track abbreviation + step number (e.g. "Hull 1"). Top-left corner, border-radius 2px 0 2px 0.

**Unassigned regions (drawn but not assigned):**
- Border: 2px dashed, `#78716C` at 30% opacity
- Fill: `#78716C` at 3% opacity
- Corner label: `#78716C` background, "?" text

**Active region (selected):**
- Border: full opacity (not 30%)
- Corner resize handles: 8×8px squares, white fill, 2px border in track color, cursor nwse-resize. Four corners.
- Clicking a region makes it active and loads it in step editor.

**Bulk selection:**
- Multiple regions selected: all show handles. "Create steps" action button appears above canvas.
- Track assignment dropdown in the bulk action bar.

#### 33.4 Page Navigator
Frosted glass bar pinned to bottom center of canvas.
- Background: `#FFFFFFE0` (white at ~88% opacity), backdrop-filter blur(8px)
- Border: `1px solid #E5E0DA`, radius 6px, padding 3px 8px
- Contents: file icon + source name (9px tertiary) | separator | page counter in monospace (10px secondary)
- Opacity: 60% when idle, 100% on hover. Transition 150ms.

### 34. Build Zone — Building Mode (Pass 4)

Building mode has two views (Track and Page) that share the same info bar and canvas. The step editor panel is not present; metadata is shown in the info bar.

#### 34.1 Track View Layout
Left-to-right: Track rail (160px) | Instruction canvas (flex: 1) | Info bar (bottom).

**Track rail (160px):**
- Narrower than Setup's 180px (no drag handles, no competing step editor).
- Same track list behavior as section 26.3: active track expanded with step list, others collapsed with completion fraction.
- Step items: 2px left padding + step marker (14px) + title (9px). Active step highlighted with `#FFFFFF` background, radius 2px.
- No drag handles in Building mode.

**Canvas:**
- Same as Setup (section 33.1) but without crop regions.
- Shows the cropped instruction image for the current step, centered and zoomable/pannable.
- Annotation hint: subtle text in top-right corner ("Click to place ✓ · Press A for annotations"), background `#FFFFFFCC`, padding 2px 6px, radius 4px.

#### 34.2 Page View Layout
Left-to-right: Page rail (110px) | Instruction canvas (flex: 1) | Info bar (bottom).

**Page rail (110px):**
- Numbered page list with mini thumbnails (28×36px, white background, 1px border).
- Active page: left border `3px solid #4E7282`, accent-light background.
- Completion indicator per page: ✓ (success color) = all steps done, · (warning color) = partial, blank = no steps done.
- Source selector: dropdown pinned to bottom of rail, border-top `1px solid #E5E0DA`. File icon + source name (8px) + chevron.

**Step regions on instruction pages:**
- Colored interactive rectangles matching crop regions but in a read-only display context.
- Unselected: 2px border at 25% opacity in track color, 8% fill.
- Selected (clicked): full-opacity border, step name label (7px/600 in track color, tinted background pill, top-left of region).
- Clicking a region selects that step and loads it in the info bar.
- No step selected: info bar shows placeholder text "Click a step region to view details."

#### 34.3 Info Bar — Two-Row (Variant B)
Fixed bar at the bottom of the workspace, below the canvas.

**Row 1 (primary):** padding 5px 12px, border-top `1px solid #E5E0DA`, border-bottom `1px solid #E5E0DA`.
- Track color dot (6px) + step title (12px/600 `#0C0A09`) — flex: 1
- Timer button: timer icon (11px) + "Timer" label (9px tertiary). Starts drying timer for current step's adhesive.
- Complete button: accent background, white text, 11px/600, padding 4px 14px, radius 6px. Check icon + "Complete". Keyboard: Space or Enter.

**Row 2 (metadata):** padding 4px 12px.
- Adhesive type (10px tertiary)
- Pre-paint flag: when set, semantic pill "Pre-paint" in warning color (`#C4913A` text, `#C4913A15` background, `1px solid #C4913A25`). Hidden when not set.
- Quantity counter: only visible when step quantity > 1. Shows "2/12" (completed/total) in 10px monospace, with −/+ buttons (14×14px ghost icon buttons). Auto-completes step when target reached.
- Tags (pill badges per section 31)
- Separator
- Notes preview (10px tertiary, flex: 1, ellipsis overflow, click to edit)
- Reference count ("0 refs", 9px accent/500, clickable — opens reference strip)
- Needed count: cart icon (9px warning) + "N needed" (9px/500 warning). Only visible when step uses wishlisted materials. Clickable — opens Needed popover. See `WISHLIST_FEATURE.md` section 4.
- Paint count ("0 paints", 9px accent/500, clickable — opens paint references)

**Total info bar height:** ~52px (two rows of ~26px each).

#### 34.4 Annotation Layer (Track Mode Only)
- **Checkmarks:** Click anywhere on instruction image to place a ✓ mark. No toolbar required. Persists on the step.
- **Annotation toolbar:** Triggered by pressing `A`. Appears as a horizontal floating pill above the canvas center.
  - Background: `#FFFFFFE0`, backdrop-filter blur(8px), radius 6px, border `1px solid #E5E0DA`, padding 3px.
  - Tools: circle, arrow, cross-out, highlight, freehand, text. Each as a 24×24px icon button. Active tool gets accent background.
  - Auto-dismisses on step advance.

#### 34.5 Step Completion Flow
1. User clicks Complete (or presses Space/Enter).
2. Step marker transitions to filled state. Next step becomes active.
3. Slim non-blocking toast appears at bottom of canvas: "Capture your progress?" with camera icon + dismiss. Auto-dismisses after 4 seconds.
4. If all steps in track complete: milestone card dialog (section 28) fires.

#### 34.6 Reference Strip
Triggered by clicking reference count in info bar, or pressing `R`.
- Opens alongside instruction image (right side of canvas, 200px wide).
- Shows reference image thumbnails stacked vertically. Click for split-screen view.
- "+ Add reference" button at bottom (imports image for current step).
- Auto-dismisses on step advance.

### 35. Overview Zone (Pass 4)

#### 35.1 Structure
Vertical stack: Zone bar | Assembly Map (collapsible) | Four-card grid.
No sidebar or rail. Full-width layout. Padding: 10px around content area.

#### 35.2 Zone Bar (Overview)
Per section 25.4: zone switcher + project dropdown + completion percentage + progress bar (60×3px) + search button.

#### 35.3 Assembly Map — Collapsible

**Header bar (always visible):**
- Background `#FFFFFF`, radius 8px (top), border `1px solid #E5E0DA`
- Padding 5px 10px
- Contents: chevron toggle (10px) + "Assembly Map" title (11px/600) + step count ("9/35", 9px tertiary) + completion percentage (9px accent/600)
- When collapsed: inline mini progress bars per track. Each bar: 12×3px, radius 1px, track color at 30% background, filled portion in solid track color. Bars have 1px gap between them.

**Expanded map canvas:**
- No internal scroll bar. Height is dynamic: sized to fit all tracks.
- Row height: 24px per track. Padding: 8px 10px top/bottom.
- Total height formula: `(trackCount × 24) + 16px padding + header height`
- Track label column: 80px. Track labels in 9px/500 secondary text. Completed tracks in success color.
- Track line: 2px stroke in track color at 30% opacity.
- Node spacing: 22px between nodes.
- Node radius: 5px.
- Complete node: filled with track color, 1.5px stroke in track color.
- Pending node: white fill, 1.5px stroke in track color at 50%.
- Join point arrows: 1px dashed line from source track's last node to receiving track's target node, track color at 40%. Small arrowhead at target.
- Hover on node: tooltip with step title + instruction thumbnail.
- Click on node: jumps to step in Build zone.

**Collapse/expand:** 200ms height transition. Collapsed: just header bar (~30px). Expanded: header + full canvas.

#### 35.4 Four-Card Grid

**2×2 mosaic (default state):**
- Grid: `grid-template-columns: 1fr 1fr`, gap 6px.
- Cards: background `#FFFFFF`, radius 8px, border `1px solid #E5E0DA`, padding 10px, min-height 70px.
- Card header: icon (14px tertiary) + title (11px/600) + expand icon (10px tertiary, right-aligned).
- Card summary: 9px tertiary, margin-top 6px.
- Card-specific summary content (photo thumbnails for Gallery, recent entries for Build Log, etc.)

**Expanded state (one card fills grid):**
- Expanded card: flex: 1, fills remaining height below Assembly Map.
- Header: icon + title (12px/600) + "Esc to close" hint (9px tertiary).
- Content area: scrollable, full card width.
- Other three cards: collapse to thin horizontal bars at the bottom.
  - Bars: flex row, gap 4px, each bar flex: 1.
  - Bar: background `#FFFFFF`, radius 4px, border `1px solid #E5E0DA`, padding 4px 8px.
  - Bar contents: icon (tertiary) + title (9px/500 secondary).
  - Click a bar to switch which card is expanded.
- Escape key returns to 2×2 mosaic.

**Card types:**
1. **Gallery:** Summary shows recent photo grid (4 thumbnails + "+N" overflow). Expanded shows full photo timeline with milestone section markers.
2. **Build Log:** Summary shows 2 most recent entries with dot + text + timestamp. Expanded shows full chronological log with composer.
3. **Materials:** Summary shows accessory count + paint count. Expanded shows accessories (V5 color-edge rows) + kit info + paint palette.
4. **Project Info:** Summary shows kit name, scale badge, category badge, status badge. Expanded shows editable project metadata, lifecycle actions (Mark Complete, Pause, Archive, Delete).

### 36. Drying Timer Bubble (Pass 4)

#### 36.1 Floating Bubble
Draggable, always-on-top element in Build zone. Position persists across sessions.

**Collapsed state — H2 Full-Bleed Progress Card:**
- Card: 170px wide, background `#FFFFFF`, border-radius 8px, border `1px solid #E5E0DA`, box-shadow `0 2px 10px rgba(0,0,0,0.1)`.
- Header bar: padding 4px 8px, border-bottom `1px solid #E5E0DA`. Contents: timer icon (10px accent) + "Timers" (9px/600) + count (8px tertiary) + chevron down (8px tertiary).
- Timer rows: one per active timer, stacked vertically.
  - Row: label (9px secondary, ellipsis) + time (9px/600 monospace accent), padding 4px 8px 2px.
  - Full-bleed progress bar below each row: 2px height, `#EDEBE8` track, `#4E7282` fill. No left/right padding — bleeds to card edges.
  - Progress bar doubles as row separator (no additional divider lines needed).
- When no timers active: header only, no rows. "No active timers" text (8px tertiary) inside card.
- Click card to expand.

**Expanded state (click to expand):**
- Width: 260px. Same card styling with larger shadow: `0 4px 20px rgba(0,0,0,0.12)`.
- Header: timer icon (12px accent) + "Drying Timers" (11px/600) + count (9px tertiary) + close X button.
- Timer cards: one per timer, stacked with 4px gap, inside 6px 8px padding.
  - Card: background `#F8F6F3`, border-radius 6px, border `1px solid #E5E0DA`, padding 6px 8px.
  - Row 1: label (10px/500 primary, flex: 1) + time (12px/700 monospace accent) + pause button (18px circle, ghost) + dismiss button (18px circle, ghost X).
  - Row 2: horizontal progress bar (3px, radius 2px, `#EDEBE8` track / `#4E7282` fill, flex: 1) + adhesive type (8px tertiary).
- "+ Add timer" button at bottom: dashed border `1px dashed #E5E0DA`, radius 6px, 9px accent/500, centered with plus icon. Opens inline form: label input + duration picker (preset chips: 15m, 30m, 45m, 1h, or custom input).
- Click outside bubble or close button to collapse.

#### 36.2 Timer States
- **Running:** accent color progress bar fill. Time counting down in monospace.
- **Completed:** success color (`#5A9A5F`). Progress bar fully filled in success color. Label shows "Done!" for 10 seconds, then auto-logs to build log. OS notification fires. Pulse animation: 3 cycles of scale(1.05), 300ms each, on the collapsed card.
- **Multiple timers (collapsed):** All timers visible as rows. Most urgent (least time remaining) listed first. Card grows vertically to fit all rows (no scroll). At 4 timers the card is roughly 120px tall.

#### 36.3 Starting Timers
- From info bar: timer button starts timer using current step's adhesive drying time. Label auto-set to step title.
- From bubble: "+ Add timer" with custom label and duration.
- Keyboard shortcut: `T` starts timer for current step.

---

### 37. Dark Mode (Pass 5)

#### 37.1 Implementation Strategy
All color tokens defined as CSS custom properties in `:root` (light) and `.dark` (dark). Tailwind v4 `@theme` directive maps them automatically. One class toggle on `<html>` switches the entire app. No component-level changes except Konva canvas (see 37.6).

#### 37.2 Surface Palette — Dark

| Token            | Light       | Dark        | Notes                                      |
|------------------|-------------|-------------|--------------------------------------------|
| Background       | `#F8F6F3`   | `#1A1816`   | Warm dark grey, not pure black             |
| Card             | `#FFFFFF`   | `#242220`   | Slightly lighter than bg (inverted hierarchy) |
| Sidebar          | `#F2EFEB`   | `#1F1D1B`   | Between bg and card                        |
| Border           | `#E5E0DA`   | `#3A3632`   | Visible but not harsh                      |
| Tag Background   | `#EDEBE8`   | `#2E2B28`   | Subtle well                                |

#### 37.3 Accent — Dark

| Token         | Light         | Dark          | Notes                                    |
|---------------|---------------|---------------|------------------------------------------|
| Accent        | `#4E7282`     | `#6A9DB0`     | Lightened ~15% for dark surface readability |
| Accent Hover  | `#3F5F6E`     | `#7FB3C5`     | Lighter on hover (inverted direction)    |
| Accent Light  | `#4E728214`   | `#6A9DB015`   | Slightly higher opacity for visibility   |
| On-Accent     | `#FFFFFF`     | `#1A1816`     | Flips to dark bg for button text         |

#### 37.4 Text — Dark

| Token         | Light       | Dark        |
|---------------|-------------|-------------|
| Primary       | `#0C0A09`   | `#E8E5E1`   |
| Secondary     | `#44403C`   | `#B5B0A9`   |
| Tertiary      | `#78716C`   | `#807A73`   |

#### 37.5 Semantic & Destructive — Dark

All semantic colors lightened slightly for dark background readability:

| Token       | Light       | Dark        |
|-------------|-------------|-------------|
| Success     | `#5A9A5F`   | `#72B878`   |
| Warning     | `#C4913A`   | `#D9A64E`   |
| Error       | `#C84B3A`   | `#D9675A`   |
| Info        | `#5A7A88`   | `#7A9DAB`   |
| Destructive | `#D43D3D`   | `#E06060`   |

Semantic usage opacity adjustments:
- Alert backgrounds: 10% → 15%
- Badge backgrounds: 18% → 20%
- Crop region overlay fills: 15% → 20%

#### 37.6 Track Colors — Dark

All lightened ~15% to maintain visibility on dark surfaces. Hue preserved. Gold and Burnt Orange get the largest adjustments.

| Index | Name          | Light       | Dark        |
|-------|---------------|-------------|-------------|
| 1     | Terracotta    | `#C2553A`   | `#D4715B`   |
| 2     | Steel Blue    | `#3A7CA5`   | `#52A0C7`   |
| 3     | Olive         | `#5B8A3C`   | `#74A85A`   |
| 4     | Gold          | `#C49A2A`   | `#D9B345`   |
| 5     | Purple        | `#7B5EA7`   | `#9878BF`   |
| 6     | Burnt Orange  | `#C47A2A`   | `#D99545`   |
| 7     | Teal          | `#2A8A7A`   | `#45A898`   |
| 8     | Mauve         | `#8B5E6B`   | `#A67888`   |

#### 37.7 Elevation — Dark

| Surface Type                          | Border                  | Shadow                                   |
|---------------------------------------|-------------------------|------------------------------------------|
| Cards, sidebar, info bar, rails       | `1px solid #3A3632`     | None                                     |
| Dialogs, popovers, dropdowns, bubble  | `1px solid #3A3632`     | `0 8px 30px rgba(0,0,0,0.30)`           |
| Hover on interactive cards            | `1px solid #3A3632`     | `0 2px 8px rgba(0,0,0,0.20)`            |

#### 37.8 Special Surfaces — Dark

| Element              | Light            | Dark             | Notes                                    |
|----------------------|------------------|------------------|------------------------------------------|
| Canvas background    | `#E8E4DF`        | `#2A2725`        | Dark neutral, contrasts with white PDF pages |
| Frosted glass bg     | `#FFFFFFE0`      | `#242220E0`      | Card color at ~88% opacity               |
| Frosted glass border | `#E5E0DA`        | `#3A3632`        | Standard dark border                     |
| Focus ring glow      | `#4E728240`      | `#6A9DB040`      | Uses dark accent                         |

#### 37.9 Exceptions

1. **Instruction pages stay white.** PDF renders are source material, not app chrome. White page on dark canvas (#2A2725) provides natural contrast.
2. **Konva canvas reads theme from React context.** A `useTheme()` hook exposes the current palette object to Konva components (crop regions, annotations, step region overlays). This is the only code-level exception — all other components consume CSS custom properties automatically.
3. **User photos are never tinted.** Gallery thumbnails, progress photos, and reference images display at native colors regardless of theme.

---

### 38. Project Creation Flow

#### 38.1 First-Run Empty State

When the app opens with zero projects, the Collection zone shows a centered welcome card:
- Illustration: accent-tinted circle (80×80px) with scissors icon
- Title: "Welcome to Model Builder's Assistant" (20px/700)
- Subtitle: description text (13px secondary, 1.6 line height)
- CTA: "Create First Project" button (primary, 14px/600, plus icon)
- Below: "Getting Started" card (card bg, border, radius 8px) with three numbered tips. Each tip: 18×18px accent circle with step number + description (11px secondary).

The nav bar's "+ New Project" button is also visible from the start.

#### 38.2 Create Project Dialog

Standard dialog (per section 28). Width: 420px. Package icon in header.

**Required fields:**
- Project Name: text input, placeholder "e.g. Yamato 1945 Final Fit"
- Kit: tabbed selection with "From Shelf" and "Add New Kit" modes
  - From Shelf: search input (live-filtered) + scrollable list (max-height 130px) of shelf kits showing thumbnail placeholder, name, brand, scale, status. Selected kit gets accent border + check circle. Scale auto-fills from selected kit.
  - Add New Kit: name input, manufacturer input, scale pill selector.
- Scale: when linked to shelf kit, read-only display. When new kit or no kit, pill selector with common scales (1/350, 1/700, 1/72, 1/48, 1/35, 1/144, 1/32) + freeform "Other..." input. Pills: 10px, radius 10px, accent when active.

**Optional fields (collapsible):**
"More details (optional)" toggle below the required fields, separated by a top border. Chevron + label (10px/500 tertiary). Starts collapsed.

- Category: pill selector — Ship, Aircraft, Armor, Vehicle, Figure, Sci-Fi, Other. Same pill styling as scale. Deselectable.
- Scalemates URL: text input, placeholder "https://www.scalemates.com/kits/...". Hint text: "reference link" (10px tertiary).
- Product Code: short text input (140px), placeholder "e.g. #78030".

**Footer:** sidebar bg, Cancel (secondary) + Create Project (primary with package icon). Create button disabled until project name and kit (shelf or new) are provided.

#### 38.3 Kit Status Change

When a shelf kit is linked to a new project, its status automatically changes to "Building." Toast confirms: "{Kit name} moved to Building." Kit moves to the Building section in Collection. Controlled by Settings toggle (default: on).

Shelf kits already linked to an active building project show a subtle indicator in the kit list and cannot be re-linked until paused or completed.

#### 38.4 Post-Creation Landing

After project creation, a confirmation card appears:
- Success indicator (green check circle) + "Project Created" (13px/600)
- Project summary: thumbnail placeholder + name + kit info + "Building" status badge
- "Next Steps" section with three suggested actions:
  1. Upload instructions (primary highlight, accent-tinted background)
  2. Add accessories (standard)
  3. Add paints (standard)
- Footer: "You can do any of these later. The project is ready to use." (9px tertiary, centered)

#### 38.5 Settings Implications

- Default scale: pre-selects a scale pill in the create dialog.
- Project storage location: where project data lives on disk. Default: app data directory. Configurable to cloud-synced folders.
- Auto-status change: toggle for automatically moving shelf kit to "Building" on project link.

---

### 39. Build Log (Overview Card)

#### 39.1 Entry Types

Five entry types, each with a distinct timeline dot:

| Type | Dot | Size | Visual | Auto/Manual |
|------|-----|------|--------|-------------|
| Step completed | Circle with step number (white text) | 14×14px, radius 7px | Filled with track color | Auto-logged on step completion |
| Note | Circle, hollow | 10×10px, radius 5px | Accent border + 30% accent fill | Manual (user-initiated). Timer completions auto-logged as notes. |
| Photo | Circle, hollow | 10×10px, radius 5px | Accent border + 30% accent fill | Manual (user-initiated) |
| Milestone | Rounded square with flag icon | 14×14px, radius 3px | Track color border + 25% track color fill, flag in track color | Auto on track completion, or manual |
| Build complete | Star shape | 14×14px | Accent fill, white star outline | Auto on "Mark Complete" |

Step dots display the step number (7px/700 white) inside the track-colored circle. This creates a scannable color stripe down the timeline that shows which track was active and build sequence at a glance.

Notes and photos use the same smaller accent dot (user annotation, not build progress).

#### 39.2 Entry Layouts

**Step entry:**
- Dot (track color, step number) + step label (11px primary) on first line.
- Below: track name (8px, track color, 500 weight) + time (8px tertiary) + "auto" tag (7px tertiary italic).

**Note entry:**
- Dot (accent) + text in sidebar-colored card (border, radius 4px, 10px primary, 1.6 line height).
- Below card: time (8px tertiary) + "edit" link (8px accent).

**Photo entry:**
- Dot (accent) + image thumbnail (140×80px expanded, 120×80px compact, radius 4px, border).
- Below: caption in italic (9px secondary) + time (8px tertiary).

**Milestone entry:**
- Square dot (track color) + warning-tinted card using track color (10% track color bg, 30% track color border).
- Card contents: title (12px/600 primary). If track completion: track color bar (4×10px) + step count + check icon. No redundant track name label (title already conveys the track identity).
- Below card: time (8px tertiary).
- Manual milestones with no track link use accent as default color.

**Build complete entry:**
- Star dot (accent) + accent-tinted card (10% accent bg, 30% accent border).
- Card contents: "Build Complete" title (12px/600 primary) + project name (10px secondary) + completion date.
- Below card: time (8px tertiary) + "auto" tag (7px tertiary italic).

#### 39.3 Day Grouping

Entries grouped by day with collapsible headers:
- Header: chevron (10px) + day label ("Today", "Yesterday", or weekday name, 12px/600) + date (10px tertiary) + horizontal rule.
- Collapsed state: summary badges after the rule (step count in track colors, milestone count, note count, photo count, all 8px).
- Default: today + 2 previous days expanded, older days collapsed.

#### 39.4 Compact vs Expanded

**Compact (2×2 grid):**
- Smaller entries (9-10px fonts), no composer, no filters.
- Day headers and timeline visible. Photos at 120×80px.
- Header shows total counts: "N steps · N notes · N photos · N milestones" (8px tertiary).

**Expanded (full-width):**
- Composer at top, filter bar below, larger entries (11px fonts), photos at 200×130px.
- Expand/collapse via maximize/minimize icon in card header.

#### 39.5 Composer (Expanded Only)

Three tabs: Note | Photo | Milestone. Each tab shows its icon (9px) + label. Active tab: accent color + accent light bg.

- **Note tab:** Textarea (2 rows default, resizable), placeholder "Add a build note..."
- **Photo tab:** Drop zone (dashed border, camera icon, "Drop an image or click to browse") + caption input below (optional).
- **Milestone tab:** Title input + checkbox "Track completion" with track selector dropdown. When checked, completing the milestone auto-links to the selected track.

Submit button: "Add {type}" (primary, 9px/600, plus icon). Right-aligned below the input area.

#### 39.6 Filters (Expanded Only)

Pill toggles: All | Steps | Notes | Photos | Milestones. Same pill styling as other filter bars (9px, accent when active). Filters apply to all day groups. Empty day groups are hidden when filtered.

---

### 40. Gallery Card (Overview)

#### 40.1 Photo Sources

Gallery is a superset of all project photos:
- **Build Log photos:** Auto-appear in Gallery, tagged with a "Log" badge (top-left, dark overlay pill with book icon + "Log" label, 7px white text).
- **Gallery-only photos:** Added directly via "Add Photo" button. For showcase shots, reference images, and progress photos not tied to specific log entries.

#### 40.2 Masonry Layout (Expanded)

Three-column variable-height grid. Photos distributed by shortest-column-first algorithm for visual balance.

Each tile:
- Photo fills tile width, variable height based on aspect ratio.
- Border radius 4px, 1px border.
- Caption + date overlaid at bottom (gradient overlay: transparent → rgba(0,0,0,0.6)). Caption: 8px white. Date: 7px white at 60% opacity.
- Source badge: top-left, "Log" pill for Build Log photos. Absent for gallery-only photos.
- Milestone badge: top-right, flag icon in warning color on dark pill. Present on photos tagged as milestones.

#### 40.3 Compact View

Single row of uniform thumbnails (50px tall), overflow hidden. "+N" tile at end if more than 5 photos (50×50px, tagBg, border, count in 10px/600 tertiary). Clicking any thumbnail or overflow expands the card.

#### 40.4 Lightbox

Click any photo tile to open full-size viewer:
- Dark overlay (rgba(0,0,0,0.85)), centered photo, max-width 500px.
- Navigation: left/right chevrons (click), keyboard arrows.
- Close: X button (top-right) or Escape key.
- Below photo: caption (13px white), date (10px white at 60%), source badge ("From Build Log"), milestone badge if applicable.

#### 40.5 Filters (Expanded Only)

Pill toggles: All (count) | Gallery (count) | From Log (count) | Milestones (count). Same pill styling as other filters.

#### 40.6 Add Photo

Button in expanded header only (primary, 8px/600, plus icon). Opens file picker. Drag-drop also supported on the gallery area. New photos default to gallery-only. Caption added inline after upload (optional).

---

### 41. Project Info Card (Overview)

#### 41.1 Purpose

Fourth card in the Overview 2×2 grid (alongside Gallery, Build Log, Materials). Displays and edits project metadata set during creation. Also houses project lifecycle actions.

#### 41.2 Compact View

Card shows:
- Kit name + manufacturer (11px/500 primary + 9px tertiary)
- Scale badge (9px, accent pill)
- Category badge if set (9px, tagBg pill)
- Status badge: Building (accent), Paused (warning), Complete (success)

#### 41.3 Expanded View

Editable fields, all populated from project creation:
- **Project name:** text input (12px/600)
- **Kit:** display with "Change" link (opens kit selector from creation dialog)
- **Scale:** pill selector (same as creation dialog)
- **Category:** pill selector (Ship, Aircraft, Armor, Vehicle, Figure, Sci-Fi, Other)
- **Scalemates URL:** text input with "Open" link icon if populated. If populated, shows box art thumbnail.
- **Product Code:** text input (140px)
- **Notes / Build Goals:** textarea (3 rows, placeholder "Build goals, reference notes...")

#### 41.4 Project Actions

Below the editable fields, separated by a border:
- **Mark Complete:** primary button. Changes project status to Complete, moves kit from Building to a "Completed" section in Collection. Confirmation dialog: "Mark {project name} as complete? The kit will move to your completed builds."
- **Pause Build:** secondary button. Changes status to Paused. Kit stays in Collection with a "Paused" indicator.
- **Resume Build:** replaces Pause when project is paused.

#### 41.5 Danger Zone

At the bottom, separated by a warning-tinted border:
- **Archive Project:** removes from active view but retains data. Reversible.
- **Delete Project:** permanent deletion. Confirmation dialog with project name typed to confirm.

Both are text links (9px, error color for delete, tertiary for archive), not prominent buttons.

---

### Design Decision: Search Deferred

Global search is deferred to a future version. Current rationale: each zone already has scoped navigation (Collection entity switcher, paint shelf search, Build zone track/step nav). The app's data volume at v1 (5-15 projects, 50-100 paints) doesn't warrant a global search. If the user base grows or data volume increases, a command palette (Cmd+K) pattern is the recommended approach.

---

### Overview 2×2 Grid Summary

The four Overview cards are:
1. **Gallery** (section 40) — masonry photo grid, superset of log + gallery-only photos
2. **Build Log** (section 39) — day-grouped journal with auto-logged steps, notes, photos, milestones
3. **Materials** (section in WISHLIST_FEATURE.md §8) — BOM with owned/needed filters, urgency grouping, shopping list export
4. **Project Info** (section 41) — editable project metadata, lifecycle actions, danger zone

All four follow the compact/expanded pattern: compact shows a summary in the 2×2 grid, clicking the expand icon takes the card to full-width with the other three collapsed to a row below.

---

### 42. Settings Page

#### 42.1 Access

Gear icon in the nav bar, right-aligned, after the "+ New Project" button. Clicking navigates to a dedicated full-width settings page. Back arrow or clicking a zone tab returns to the previous view.

Page header: "Settings" (20px/700), no subtitle. Full-width within the app's max-width container.

#### 42.2 Layout

Single scrollable page with section headers. Each section:
- Section header: label (14px/700 primary) + horizontal rule below.
- Settings within a section: stacked rows. Each row is a card-background strip (padding 8px 12px, border-bottom 1px) containing: label (11px/500 primary) on the left, control on the right. Description text below the label when needed (9px tertiary, max-width 300px).
- Sections separated by 20px vertical gap.

#### 42.3 Sections & Settings

**Appearance**

| Setting | Control | Default | Description |
|---------|---------|---------|-------------|
| Theme | Three-way toggle: Light / Dark / System | System | Per section 37. System follows OS preference. |

**Build Defaults**

| Setting | Control | Default | Description |
|---------|---------|---------|-------------|
| Default scale | Pill selector (1/350, 1/700, 1/72, 1/48, 1/35, 1/144, 1/32) + freeform | None | Pre-selects scale in project creation dialog. |
| Default adhesive drying times | Four number inputs with unit labels: plastic cement, CA glue, epoxy, white/PVA glue | 30min, 5min, 60min, 45min | Used by drying timer in Build zone. Per-step overrides still available. |
| Auto-status change | Toggle | On | Automatically moves shelf kit to "Building" when linked to a new project. |
| PDF processing DPI | Dropdown: 72 / 150 / 300 | 150 | Resolution for PDF instruction rendering. Higher = sharper but slower. |
| PDF crop behavior | Dropdown: Auto-crop white margins / Keep original | Auto-crop | How imported PDF pages are processed. |

**Paint & Catalog**

| Setting | Control | Default | Description |
|---------|---------|---------|-------------|
| Default brand | Dropdown: Tamiya, Vallejo, Mr. Color, AK Interactive, Ammo, None | None | Pre-selects brand tab in catalogue lookup. |
| Visible catalogues | Multi-checkbox: Tamiya, Vallejo, Mr. Color, AK Interactive, Ammo | All checked | Controls which brands appear in paint catalogue lookup. Unchecked brands hidden from search. |
| Color family definitions | Link: "Manage families →" | Standard set | Opens sub-view to rename, merge, or split color families. Advanced setting. |
| Auto-add paints from project | Toggle | On | Automatically adds paints to shelf when assigned to a build step. |

**Currency & Pricing**

| Setting | Control | Default | Description |
|---------|---------|---------|-------------|
| Default currency | Dropdown: USD, EUR, GBP, JPY, CAD, AUD + freeform ISO code | USD | Applied to new wishlist items. Per-item currency still allowed. |
| Acquire behavior | Two-option radio: "Keep price & link" / "Clear price & link" | Keep | What happens to price/URL fields when an item is marked as owned. |

**Data & Storage**

| Setting | Control | Default | Description |
|---------|---------|---------|-------------|
| Project storage location | Path display + "Change" button (opens folder picker) | App data directory | Where project files are saved on disk. Can point to cloud-synced folders (Dropbox, iCloud, OneDrive). |
| Auto-save interval | Dropdown: 30s / 1min / 2min / 5min | 1min | How frequently unsaved changes are written to disk. |
| Backup | "Back up now" button + last backup timestamp | — | Creates a full ZIP backup of all project data, settings, paint shelf, and collection. Manual trigger. |
| Restore | "Import backup" button | — | Restores from a previously exported ZIP. Confirmation dialog warns about overwriting current data. |

**Keyboard Shortcuts**

Not a settings section per se, but a reference card at the bottom of the page. Expandable section (collapsed by default) showing all keyboard shortcuts grouped by zone:

- **Global:** Cmd+K (future search), Cmd+, (settings), Cmd+N (new project)
- **Build zone:** Arrow keys (step nav), Space (toggle step complete), T (new track), Cmd+Z (undo)
- **Collection:** / (focus search within current entity tab)

Displayed as a two-column table: shortcut (monospace, tagBg pill) + description (9px secondary).

#### 42.4 Behavior

- All settings auto-save on change (no Save button). Subtle toast: "Setting updated" (1s, auto-dismiss).
- Changing theme applies immediately without page reload.
- Changing project storage location triggers a move dialog: "Move existing projects to new location?" with Yes / No / Cancel.
- Changing PDF DPI only affects future imports, not already-processed pages.
- Reset option: "Reset to defaults" text link (tertiary, 9px) next to each section header resets that section only. "Reset all to defaults" link at the very bottom (error color) resets everything. Both require confirmation dialog.

#### 42.5 Nav Bar Update

The nav bar (established in section 38.2 mockup) gains a gear icon:

`[MBA] | [Collection] [Build] [Overview] | ............... | [+ New Project] [⚙]`

Gear icon: 14px, tertiary color, accent on hover. Clicking navigates to settings. Active state: accent color, same as zone tabs.

---

## Still To Decide

No remaining feature gaps. All zones, cards, and features are specified. The design spec is complete for v1.

Future considerations documented elsewhere:
- Global search (command palette pattern, deferred per section decision)
- Multi-kit projects / dioramas (deferred per section 38.2)
- Notification preferences (deferred — no notification system in v1 desktop app)
- Custom color family definitions (setting placeholder in 42.3, full UI deferred to v2)

