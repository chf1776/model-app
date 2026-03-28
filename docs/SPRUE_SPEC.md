# Sprue & Parts System Specification

> Written 2026-03-24. Tracks GitHub issue #12. Supersedes #10 and #11.

---

## 1. Problem Statement

Scale model kits contain plastic frames called **sprues** (or runners), each labeled with a letter (A, B, C, ...). Individual parts on each sprue are numbered (A14, B7, C3). Each instruction step references specific parts the builder must locate, cut from the sprue, and assemble.

The app currently has no concept of sprues or parts. Builders must mentally cross-reference between the instruction step on screen and the physical sprue in their hands. There is no way to see which sprues a step requires, view sprue diagrams without leaving the current step, or track which parts have been consumed.

This feature adds sprue and part tracking integrated across setup mode, building mode, and the overview zone, with LLM-powered auto-detection from instruction crops.

---

## 2. Relevant Existing Infrastructure

This section covers only the patterns that sprue crops directly reuse or extend. For general architecture, see TECH_SPEC.md and CLAUDE.md.

### 2.1 Crop System

Steps store rectangular crops on instruction pages via `source_page_id` + `crop_x/y/w/h` fields, with an optional `clip_polygon` (JSON array of `{x, y}` vertices) for freeform shapes. All coordinates are stored in **image-space** (pre-rotation) and converted to effective-space for rendering.

Key components that sprue crops reuse directly:
- `useCropDrawing` hook — mouse interaction for drawing rectangles
- `CropRegion` — Konva rectangle with Transformer for resize/reposition
- `CropPreview` — renders a cropped region of an instruction page
- Polygon mode (P key) — freeform vertex drawing

Sprue reference crops are structurally identical to step crops — same coordinate system, same page reference, same rendering pipeline. The difference is the target entity (`sprue_refs` row vs. `steps` row) and that sprue crops do not use the file stash (they render on-the-fly from already-rasterized instruction page PNGs).

### 2.2 Junction Table Pattern

`step_paint_refs` links steps to palette entries via a simple junction table with `list_for_step()`, `set_for_step()`, and `list_for_project()` queries. The sprue junction table (`step_sprue_parts`) follows the same pattern but adds per-row metadata (`ai_detected` flag) and uses individual insert/delete instead of set-all, since LLM results arrive incrementally.

---

## 3. Data Model

### 3.1 `sprue_refs` — Sprue Reference Library

Kit-level sprue reference crops. Each row represents one labeled sprue with an optional crop region on an instruction page.

```sql
CREATE TABLE sprue_refs (
    id              TEXT PRIMARY KEY,
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_page_id  TEXT REFERENCES instruction_pages(id) ON DELETE SET NULL,
    crop_x          REAL,
    crop_y          REAL,
    crop_w          REAL,
    crop_h          REAL,
    polygon_points  TEXT,          -- JSON array of {x, y} vertices; null = rectangle crop
    label           TEXT NOT NULL,  -- "A", "B", "C" (user-editable)
    color           TEXT NOT NULL,  -- hex color, auto-assigned from SPRUE_COLORS palette
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      INTEGER NOT NULL
);

CREATE INDEX idx_sprue_refs_project ON sprue_refs(project_id);
```

**`project_id` FK:** Sprue crops reference instruction pages which belong to projects, making them project-specific. Simpler queries (no join through kits). If the same kit is built twice, sprues are re-cropped per project.

**`ON DELETE SET NULL` for `source_page_id`:** If instruction sources are re-imported, the sprue ref survives (retaining label and color) but loses its crop. The user can re-attach later.

**Placeholder rows:** When the LLM detects a sprue letter with no existing `sprue_refs` entry, a placeholder row is created with `source_page_id = NULL` and no crop coordinates. It appears in the UI with label and color but no thumbnail.

**Color palette:** Auto-assigned in creation order from `SPRUE_COLORS` — 8 colors (Steel Blue, Burnt Orange, Olive, Purple, Terracotta, Teal, Gold, Mauve), intentionally distinct from `TRACK_COLORS`. Stored as hex on the row. Colors cycle if >8 sprues.

### 3.2 `step_sprue_parts` — Step-Part Junction

Links steps to individual sprue parts.

```sql
CREATE TABLE step_sprue_parts (
    id           TEXT PRIMARY KEY,
    step_id      TEXT NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
    sprue_label  TEXT NOT NULL,     -- "A", "B", "C" — matches sprue_refs.label
    part_number  TEXT,              -- "14", "7"; null = sprue-level only
    ai_detected  INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL
);

CREATE INDEX idx_step_sprue_parts_step ON step_sprue_parts(step_id);
CREATE INDEX idx_step_sprue_parts_sprue ON step_sprue_parts(sprue_label);
CREATE UNIQUE INDEX idx_step_sprue_parts_unique
    ON step_sprue_parts(step_id, sprue_label, COALESCE(part_number, ''));
```

**No FK to `sprue_refs`:** `sprue_label` is a soft link. Parts can be detected or entered before a `sprue_refs` row exists. The two are joined by label for display.

**`ai_detected` flag:** Informational only — the UI shows a subtle sparkle indicator on AI-detected chips. Does not affect behavior.

### 3.3 Step Table Addition

```sql
ALTER TABLE steps ADD COLUMN sprues_detected INTEGER NOT NULL DEFAULT 0;
```

Prevents redundant LLM calls. Set to `1` after detection runs. "Re-detect" resets to `0`.

### 3.4 Entity Relationships

```
Project ──< sprue_refs (project_id)
                  │
                  └── source_page_id ──> InstructionPage

Step ──< step_sprue_parts (step_id)
             │
             └── sprue_label ─ ─ ─ > sprue_refs.label (soft join)
```

### 3.5 Depletion Calculation

"Parts used" and "total parts known" per sprue are derived, not stored:

```sql
SELECT ssp.sprue_label,
       COUNT(DISTINCT COALESCE(ssp.part_number, ''))
FROM step_sprue_parts ssp
JOIN steps s ON s.id = ssp.step_id
JOIN tracks t ON t.id = s.track_id
WHERE t.project_id = ?1
GROUP BY ssp.sprue_label;
```

The denominator is emergent — it grows as more steps reference parts from that sprue. There is no upfront "this sprue has 18 parts" declaration. See §8.1 for trade-offs.

---

## 4. Feature Specification

### 4.1 Sprue Reference Library — Setup Mode Authoring

A mode toggle in the setup toolbar: `[Steps] [Sprues]` (segmented pill, same pattern as the `[Track] [Page]` toggle in building mode).

**In Sprues mode:**

- **Left rail** shows sprue ref entries ordered by `display_order`: color swatch, label (e.g. "Sprue A"), page number, crop thumbnail via `CropPreview`. Placeholder icon if no crop attached.

- **Canvas** shows instruction pages with the same pan/zoom/page navigation as step authoring.

- **Crop drawing** uses `useCropDrawing` and `CropRegion`. Rectangle mode (C key) or polygon mode (P key). On completion, an inline label input appears (pre-filled with next unused letter), color is auto-assigned, row saves to `sprue_refs`.

- **Editing:** Click a sprue in the rail to select. Crop highlights on canvas. User can resize/reposition (Transformer), edit the label, re-draw, or delete (delete key).

- **Canvas overlays:** All sprue crop regions drawn with colored borders matching their assigned color.

### 4.2 Step-Part Linking — Step Detail Panel

A "Parts Used" section in both `StepEditorPanel` (setup) and `BuildingStepPanel` (building).

```
Parts Used

  Sprue A                          ← color swatch + label
  [A3 ⨯] [A14 ⨯] [A15 ✨⨯]       ← chips, ✨ = AI-detected

  Sprue C
  [C7 ⨯] [C12 ✨⨯]

  [+ Add part...]                  ← text input
```

**Chips:** Background tinted to sprue color. `⨯` removes the row. `✨` on `ai_detected = 1` chips. Alphabetical order within each sprue group.

**Add input:** Type `A15` → creates part under Sprue A with number `15`. Type `A` → sprue-level entry (no part number). First letter(s) = sprue label, remainder = part number. Unknown sprue letters auto-create a placeholder `sprue_refs` row. Focus stays in input for rapid entry.

**Building mode:** Read-only by default with an "Edit" button to enable add/remove.

### 4.3 Rail Card Sprue Badges

Step cards in `BuildingRail` show compact sprue letter badges:

```
┌────────────────────────┐
│ ┌────┐                 │
│ │crop│ Step 14          │
│ │ img│ Attach fuselage  │
│ └────┘ [A] [B] [C]     │
└────────────────────────┘
```

~16px height, rounded, muted background tinted to sprue color. Letter only, deduplicated. Max 4 visible, overflow shows `+N`. No badges on sub-step cards.

### 4.4 Floating Sprue Panel — Building Mode

**Collapsed:** Floating button at `bottom-right` of the canvas container (`position: absolute; bottom: 1rem; right: 1rem`). Grid/layers icon + sprue count badge. ~36×36px. Toggle via click or S key.

No overlap with `AnnotationToolbar` (bottom-center) or `NavigationBar` (outside canvas container).

**Expanded:** ~200px wide card expanding upward. Scrollable.

```
┌──────────────────────┐
│  Sprues              │
│                      │
│  ┃┌────┐ Sprue A    ┃│  ← accent border (needed for current step)
│  ┃│ img│ ████░░ 12/18┃│
│  ┃└────┘            ┃│
│   ┌────┐ Sprue B     │  ← dimmed (not needed)
│   │ img│ ██░░░░  4/14│
│   └────┘             │
│  ┃┌────┐ Sprue C    ┃│
│  ┃│ img│ ████████  8/8┃│  ← ✓ Done
│  ┃└────┘            ┃│
└──────────────────────┘
```

Per row: color bar (left edge), crop thumbnail (or placeholder), label, thin progress bar, done checkmark when fully consumed.

**Context linking:** Sprues needed by the active step get accent border + full opacity. Others dimmed to 60%. Auto-scrolls to first relevant sprue on step change. No highlighting when no step is active.

**Click:** Opens the lightbox (§4.5).

**Persistence:** Expanded/collapsed state saved in `ProjectUiState` (`sprue_panel_open`).

### 4.5 Sprue Lightbox

Full-screen overlay. Two panels:

```
┌──────────────────────────┬────────────┐
│                          │ █ Sprue A  │
│                          │ 12/18      │
│                          │            │
│   [sprue diagram         │ ✓ A1       │
│    at full resolution,   │ ✓ A2       │
│    zoomable]             │ ✓ A3       │
│                          │   A4       │
│                          │   A5       │
│                          │ ✓ A6       │
│                          │   ...      │
└──────────────────────────┴────────────┘
```

**Left:** Sprue crop at full resolution. Zoom via scroll/pinch, pan via click-drag.

**Right sidebar (~160px):** Label with color swatch, progress bar, parts checklist sorted numerically. ✓ = part appears in a `step_sprue_parts` row. Clicking a checked part navigates to the step that uses it.

Read-only. Dismiss via Escape, click outside, or close button.

### 4.6 Overview Sprue Card

New card in the overview zone grid (5th card — grid layout needs adjustment, see §8.5).

**Compact:**

```
┌──────────────────────────────────┐
│  Sprues                  6 total │
│                                  │
│  █ Sprue A  ████████░░░░  12/18  │
│  █ Sprue B  ████░░░░░░░░   4/14  │
│  █ Sprue C  ████████████   8/8 ✓ │
│  █ Sprue D  ░░░░░░░░░░░░   0/22  │
│                                  │
│  Total: 44/88 parts (50%)        │
└──────────────────────────────────┘
```

Color swatch, progress bar, and done checkmark per sprue. Total summary at bottom.

**Focus mode:** Sprue rows expandable to show full parts checklists. Thumbnails visible when expanded. Part numbers clickable to navigate to their step.

**Empty state:** "No sprues tracked yet. Set up sprue references in Setup mode, or enable AI detection in Settings."

---

## 5. LLM Auto-Detection

### 5.1 Trigger

On step crop creation (rectangle, polygon, or full-page), the system fires an async detection call if:
1. AI detection is enabled in settings (toggle + valid API key)
2. The step has a `source_page_id`
3. `sprues_detected` is `0` on this step

The flag is set to `1` immediately to prevent duplicate triggers.

### 5.2 API Call

HTTP POST to the Claude Messages API from the Rust backend. The crop region is extracted from the rasterized page PNG and base64-encoded.

**Prompt:**

```
You are analyzing a scale model instruction manual step image.
Identify all part callouts visible — these are alphanumeric labels like A14, B7, C3
that reference specific plastic parts on lettered sprues (runners).

Return a JSON object with this exact structure:
{
  "parts": [
    {"sprue": "A", "number": "14"},
    {"sprue": "B", "number": "7"}
  ]
}

Rules:
- "sprue" is the letter prefix (A, B, C, etc.)
- "number" is the numeric suffix (14, 7, 3, etc.)
- If a callout is just a letter with no number, set "number" to null
- Only include parts that are clearly labeled in the image
- Do not guess or infer parts that aren't visible
- If no part callouts are visible, return {"parts": []}
```

**Model:** Configurable — Haiku 4.5 (faster, cheaper) or Sonnet 4.6 (more accurate).

### 5.3 Result Handling

Results are auto-applied: each detected part is inserted into `step_sprue_parts` with `ai_detected = 1` (skipping duplicates). Unknown sprue letters auto-create placeholder `sprue_refs` rows. Toast: "✨ Detected N parts".

**Errors:**
- Network failure → toast, reset `sprues_detected` to `0` for retry
- Invalid API key → toast, disable auto-triggers for the session
- Empty result → no toast (valid outcome for text-only steps)

### 5.4 Re-detect

Button in the step detail panel. Resets `sprues_detected` to `0`, deletes AI-detected parts (preserves manual), triggers a new detection call.

### 5.5 Settings — AI Features

```
AI Features

  API Key        [••••••••••••••••]  [Show/Hide]
  Model          (●) Haiku 4.5 — faster, lower cost
                 ( ) Sonnet 4.6 — more accurate
  Auto-detect    [toggle] Automatically detect parts when steps are created

  Status: ✓ Connected (or ⚠ No API key configured)
```

API key stored in OS keychain (not SQLite). Model and toggle stored in `settings` table. If no API key is configured, LLM features are silently disabled — everything else works with manual entry.

---

## 6. Implementation Plan

### Phase A: Data Model + Backend + Manual Sprue Authoring

Migration `V11__sprue_system.sql` (tables, indexes, step column). Rust models, queries, and commands for `sprue_refs` and `step_sprue_parts` — following the `reference_images` and `step_paint_refs` patterns respectively. TS types, API wrappers, build-slice state.

Frontend: `[Steps] / [Sprues]` mode toggle + `SprueRail.tsx` for setup authoring. `PartChipEditor.tsx` for the step detail panel. Sprue letter badges on `BuildingRail` step cards.

### Phase B: LLM Auto-Detection

`services/ai_detection.rs` for the vision API call. Secure credential storage. Settings page "AI Features" section. Auto-trigger on crop creation, toast notifications, re-detect button, `✨` indicators.

### Phase C: Floating Panel + Lightbox + Overview Card

`SpruePanel.tsx` (floating button + expanded card with context highlighting). `SprueLightbox.tsx` (diagram + parts sidebar). `SprueCard.tsx` (overview card with compact/focus modes). S key binding, panel state persistence.

---

## 7. New Files

| File | Purpose |
|---|---|
| `src-tauri/migrations/V11__sprue_system.sql` | Tables, indexes, step column |
| `src-tauri/src/db/queries/sprue_refs.rs` | Sprue ref CRUD |
| `src-tauri/src/db/queries/step_sprue_parts.rs` | Step-part junction queries + depletion |
| `src-tauri/src/commands/sprue_refs.rs` | Sprue ref Tauri commands |
| `src-tauri/src/commands/step_sprue_parts.rs` | Step-part + detection commands |
| `src-tauri/src/services/ai_detection.rs` | LLM vision API |
| `src/components/build/SpruePanel.tsx` | Floating panel |
| `src/components/build/SprueLightbox.tsx` | Diagram viewer + parts checklist |
| `src/components/build/SprueRail.tsx` | Setup mode left rail |
| `src/components/build/PartChipEditor.tsx` | Grouped chip editor |
| `src/components/overview/SprueCard.tsx` | Overview depletion card |

---

## 8. Open Questions

### 8.1 Depletion Denominator

The "total parts" count per sprue is emergent — it grows as steps reference new parts. Early in a build, "2/2 parts used" may be misleading when 16 more parts will appear later.

**Possible mitigation:** Allow manual "total parts" override on `sprue_refs`. Not in current scope.

### 8.2 LLM Accuracy

Modern kits with clear callouts (Tamiya, Meng): accuracy expected >90%. Scanned vintage manuals or non-standard labeling: accuracy drops. Auto-apply with easy undo keeps false-positive cost low.

**Question:** Should the spec include a confidence threshold for flagging vs. auto-applying?

### 8.3 API Key on Linux

OS keychain may not be available on Linux without a keychain service. Fallback: store in settings table with a UI warning.

### 8.5 Overview Grid Layout

Adding a 5th card to the 2x2 grid requires a layout change (3-column, scrolling, or adaptive). The `focusedCard` state works unchanged.

### 8.6 Blocking vs Async Reqwest

The Scalemates scraper uses blocking `reqwest`. LLM detection should avoid holding the `Mutex<Connection>` lock during the network call. Consider using async or splitting the command into a non-DB network call followed by a DB write.
