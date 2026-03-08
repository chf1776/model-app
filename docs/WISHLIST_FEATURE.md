# Wishlist Feature Specification

Cross-references: `UI_DESIGN.md` for component specs (sections 27, 28, 30, 34), `ROADMAP.md` for data model.

---

## 1. Overview

Three entity types support wishlist status: Kits, Accessories, and Paints. Wishlist items represent things the user wants but hasn't acquired yet. Each wishlisted entity can optionally store a price, currency, and buy URL. The feature surfaces across six UI contexts in Collection, Build, and Overview zones.

---

## 2. Data Model Additions

All three entity types (kits, accessories, paints) gain these fields:

| Field              | Type              | Notes                                                                 |
|--------------------|-------------------|-----------------------------------------------------------------------|
| `price`            | `number | null`   | Optional. Stored in raw numeric form.                                 |
| `currency`         | `string`          | ISO 4217 code (e.g., "USD", "JPY"). Default from user settings.      |
| `buy_url`          | `string | null`   | Optional. Full URL to retailer page.                                  |
| `price_updated_at` | `datetime | null`  | When price was last set. Enables future stale-price indicator.        |

- Fields are only populated when status is "wishlist."
- On acquire, fields are optionally preserved (for purchase history) or cleared. Default: preserved.
- Retailer display name auto-extracted from URL domain (e.g., `hlj.com` → "HLJ", `amazon.com` → "Amazon", `hobbysearch.com` → "HobbySearch").
- Default currency is set in the app settings page and applied to new entities. Per-entity currency allows mixed currencies (e.g., Japanese shop in JPY alongside Amazon in USD).

---

## 3. Badge System

### 3.1 Wishlist Pill

Semantic pill in warning color. Two sizes:

| Size     | Font | Padding     | Line Height | Usage                                           |
|----------|------|-------------|-------------|--------------------------------------------------|
| Standard | 10px | 1px 8px     | 16px        | Kit cards                                        |
| Compact  | 8px  | 0px 5px     | 14px        | Accessory rows, paint rows, info bar, popovers  |

Shared style: `background: #C4913A15`, `color: #C4913A`, `border: 1px solid #C4913A25`, `border-radius: 10px`, `font-weight: 500`.

In accessory rows and paint rows, the pill is **clickable** — clicking it toggles to owned status (see section 5.2).

### 3.2 Owned Check Circle

| Size     | Diameter | Check Size | Usage                            |
|----------|----------|------------|----------------------------------|
| Standard | 14px     | 8px        | Accessory rows, standalone lists |
| Compact  | 12px     | 6px        | Paint shelf rows                 |

Shared style: `background: #5A9A5F20`, check stroke in `#5A9A5F`.

In accessory rows and paint rows, the check is **clickable** — clicking it toggles back to wishlist status.

### 3.3 When to Show Each Badge

| Context                        | Wishlist Pill | Owned Check | Rationale                                           |
|--------------------------------|---------------|-------------|------------------------------------------------------|
| Kit card (Wishlist section)    | ✓ Standard    | —           | Section header implies wishlist, but pill is scannable when all sections expanded |
| Kit card (Shelf/Building/Done) | —             | —           | Presence in section = owned. Redundant.              |
| Accessory in kit accordion     | ✓ Compact     | ✓ Standard  | Mixed owned/wishlist siblings. Must distinguish.     |
| Accessory standalone list      | ✓ Compact     | ✓ Standard  | Mixed list. Same logic.                              |
| Paint shelf                    | ✓ Compact     | ✓ Compact   | Mixed list. Consistent with accessories.             |
| Materials card (Overview)      | —             | —           | Filtered by Needed — context is implicit.            |
| Build zone info bar            | Special*      | —           | See section 4.                                       |

*Info bar uses a count badge, not the standard pill. See section 4.

---

## 4. Build Zone "Needed" Indicator

### 4.1 Info Bar Badge

When the current step uses any wishlisted material (paint or accessory), a warning-colored count badge appears in info bar row 2:

- Icon: cart icon (9px) in `#C4913A`
- Text: "N needed" in 9px/500 `#C4913A`
- Clickable: opens the Needed popover (see 4.2)
- When all materials are owned: badge does not appear

### 4.2 Needed Popover (Style B — Grouped by Type)

Anchored below the "N needed" badge. 230px wide.

**Header:** cart icon (11px warning) + "Needed for this step" (10px/600) + count (8px tertiary).

**Body:** Items grouped under section headers ("Paints", "Accessories"). No wishlist pills (the popover context establishes these are all needed).

Each item row:
- **Paint:** 10×10px color swatch + name (9px primary) + price (8px/600 monospace) + external link icon (8px accent)
- **Accessory:** 3px type color bar + name (9px primary) + price (8px/600 monospace) + external link icon (8px accent)

**Footer:** "View all in Materials →" link (9px accent/500) + running total (9px/600 tertiary monospace).

Dismiss: click outside or Escape.

---

## 5. "Mark as Acquired" Interactions

### 5.1 Kits — Confirmation Dialog

**Trigger:** "Acquired" button on kit card in Wishlist section.
- Button: ghost style (card background, 1.5px border), package icon + "Acquired" text, right-aligned on card.

**Confirmation dialog:**
- Title: "Move to Shelf?" (14px/700)
- Body: "{Kit name} will move from Wishlist to On the Shelf. You can always move it back." (11px secondary)
- Actions: Cancel (secondary button) | Move to Shelf (primary button with package icon)
- Dialog styling per UI_DESIGN.md section 7 (10px radius, border, float shadow).

**Result:**
- Kit card animates from Wishlist section to On the Shelf section.
- Wishlist section count decrements. Shelf section count increments.
- Success toast: green check circle + "{Kit name} moved to On the Shelf" + Undo button.
- Toast auto-dismisses after 5 seconds.
- Undo moves kit back to Wishlist section.

### 5.2 Accessories & Paints — Inline Toggle

**Trigger:** Click the wishlist pill or owned check circle.

**Behavior:**
- Wishlist pill → owned check: 150ms transition. Brief success toast: "{Name} marked as owned" + hint "click check to undo" (8px tertiary).
- Owned check → wishlist pill: 150ms transition. No toast (intentional revert).
- No confirmation dialog. Lightweight, instantly reversible.

**Toast:** auto-dismisses after 3 seconds.

### 5.3 Batch Operations — Multi-Select

Available in standalone Accessories view and standalone Paints view (not inside kit accordion trays).

**Selection mode:**
- Checkbox (14×14px, radius 3px) appears left of each row.
- Unchecked: `1.5px solid border`. Checked: accent fill + white check icon.
- Selected row border changes to accent color.

**Batch action bar:**
- Appears above the list when ≥1 items selected.
- Background: accent color. Full-width rounded bar.
- Contents: "{N} selected" (10px white/500) + "Mark as acquired" button (white bg, accent text, package icon) + dismiss X.

**Result:**
- All selected items flip to owned. Checkboxes disappear.
- Success toast: "{N} items marked as owned" + Undo button (5s auto-dismiss).
- Undo reverts all items in the batch.

---

## 6. Price & Buy Link Display Rules

| Context                        | Price Display                          | Link Display                         |
|--------------------------------|----------------------------------------|--------------------------------------|
| Kit card (Wishlist section)    | Metadata row, after manufacturer       | Retailer name + external icon        |
| Accessory (kit accordion)      | Metadata line, after brand + separator | External icon only (compact)         |
| Accessory (standalone list)    | Metadata line, after brand + separator | Retailer name + external icon        |
| Paint shelf                    | After brand code + separator           | External icon only (compact)         |
| Materials "Needed" filter      | Right-aligned per row + total footer   | External icon per row                |
| Build zone popover             | Right-aligned per row + total footer   | External icon per row                |
| Owned items (any context)      | Hidden                                 | Hidden                               |

**Price formatting:**
- Monospace font for numeric alignment across rows.
- Currency symbol prefix (e.g., "$28", "¥3,200").
- If no price set: field simply absent (no "$0" or placeholder).

**Link formatting:**
- Full: retailer display name (9px accent/500) + external icon (9px accent). Used where horizontal space allows.
- Compact: external icon only (8px accent). Used in tight rows (accordion, paint shelf, popovers).
- Clicking opens URL in system browser.

**Running totals:**
- Materials "Needed" filter footer: "Estimated total" label + formatted total. Background: `warning color at 6% opacity`.
- Build zone popover footer: total right-aligned (9px/600 tertiary monospace).
- Mixed currencies: totals shown per currency (e.g., "$49.50 + ¥3,200").

---

## 7. Prominence Escalation

### 7.1 Approach: Uniform Badge + Urgency Sort + Accent Border

No badge variation. The wishlist pill looks identical everywhere regardless of linked kit status. Urgency is communicated through layout in the Materials card.

### 7.2 Materials Card Urgency Grouping

When the "All" or "Needed" filter is active, items linked to a building kit are grouped under a Building header with an accent left-border:

| Group      | Header                                           | Left Border           | Background |
|------------|--------------------------------------------------|-----------------------|------------|
| Building   | 5px accent dot + "BUILDING" (8px/600 accent)    | `3px solid #4E7282`  | None       |
| On Shelf   | 5px tertiary dot + "ON SHELF" (8px/600 tertiary) | None                  | None       |
| Unlinked   | "UNLINKED" (8px/600 tertiary)                    | None                  | None       |

- Building group always appears first. Within each group, items sorted by type (Accessories, then Paints).
- The 3px accent left-border on the Building group is the only urgency signal. No tint, no badge changes.
- When no items are linked to a building kit, the Building group header is hidden.
- The "Owned" filter does not show urgency grouping (all items are acquired, urgency is moot). Items in Owned are grouped by type only.

### 7.3 Other Contexts — No Urgency Signal

Kit accordion trays, standalone lists, paint shelf, and Build zone popover show uniform wishlist pills with no urgency differentiation. Rationale: in a kit accordion you already know the kit's status from the card above. The Materials card is the dedicated triage view.

---

## 8. Materials Card Layout (Overview Zone)

The Materials card is one of four cards in the Overview zone's 2×2 mosaic grid. It supports compact (mosaic) and expanded (focus mode) states.

### 8.1 Header

`padding: 6px 10px`, bottom border. Contents:
- Title: "Materials" (11px/600 primary)
- Expand icon (10px tertiary, right-aligned) — enters focus mode

In expanded/focus mode, header adds:
- Back arrow (← ArrowLeft, clickable, returns to mosaic)
- Filter pills: All | Owned (count) | Needed (count, warning color when active)
- "Copy Shopping List" button (right-aligned, ghost style, copy icon)

### 8.2 Compact State (2×2 Mosaic)

Condensed summary view (9px font). Two sections:
- Accessory count with type badges (using `ACCESSORY_TYPE_COLORS`)
- Paint count with color swatches

Footer shows count summary ("N accessories · N paints"). No filters or interactions in compact mode.

### 8.3 Expanded State (Focus Mode)

Scrollable BOM list filling the full grid area below Assembly Map. Two sections:

**Accessories list:**
- Rows with: name (10px primary), type badge (colored pill using `ACCESSORY_TYPE_COLORS`), owned/wishlist badge
- Owned items: success check circle. Wishlist items: warning pill.

**Paints list:**
- Rows with: color swatch (10×10px circle), name (10px primary), brand (9px tertiary), owned/wishlist badge

### 8.4 Filter Behavior

- **All:** Full BOM showing all accessories and paints grouped by type. Footer: count summary.
- **Owned:** Only items with owned status. Grouped by type (Accessories, Paints).
- **Needed:** Only items with wishlist status. Grouped by type. Footer: item count.

Urgency grouping (Building/Shelf/Unlinked) deferred. Filter state persists across focus/mosaic transitions.

### 8.5 Copy Shopping List

"Copy Shopping List" button appears in expanded header. Copies needed items (wishlist status) as plain text to clipboard via `navigator.clipboard.writeText()`. Toast confirmation on success.

Format:
```
Needed for {Project Name}:

Accessories:
  {Name} ({Type})
  ...

Paints:
  {Name} ({Brand})
  ...
```

Items without a type or brand omit those fields. Empty sections are omitted. CSV/Markdown export deferred to Phase 7.

---

## 9. Shopping List Export

### 9.1 Trigger

"Copy Shopping List" button in the Materials card expanded header. Always available (not gated behind Needed filter), but only copies items with wishlist status.

### 9.2 UI

Single ghost button: "Copy Shopping List" (9px accent/500, copy icon). On click, copies formatted plain text to clipboard.

On copy success: toast notification "Shopping list copied to clipboard" (auto-dismisses after 3s).

### 9.3 Format

**Copy text (clipboard):**
```
Needed for {Project Name}:

Accessories:
  {Name} ({Type})
  ...

Paints:
  {Name} ({Brand})
  ...
```

Items grouped by type (Accessories, Paints). Items without a type or brand omit those fields. Empty sections are omitted. Only wishlisted items are included.

### 9.4 Future Enhancements (Phase 7)

CSV and Markdown export formats deferred to Phase 7 (Export + Polish). When implemented, the button becomes a split button with a chevron dropdown for format selection.
