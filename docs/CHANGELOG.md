# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.1] — 2026-03-28 — Part Tick-Off

### Added
- **Part tick-off**: Click individual parts in the "Parts Used" section to mark them as used during assembly — ticked parts show a green checkmark with strikethrough, per-sprue progress counter (e.g. "3/5"), and success border when all parts are ticked
- **Sprue thumbnails in step panel**: Building mode "Parts Used" section now shows horizontal cards with sprue crop thumbnail on the left and tickable part chips on the right; click thumbnail to open lightbox
- **V13 migration**: `is_ticked` column on `step_sprue_parts` for tick-off persistence
- **Ticked state in lightbox and overview**: SprueLightbox and overview SprueCard show ticked/unticked indicators per part

### Changed
- **Floating sprue panel removed**: Tick-off and thumbnails integrated into the right-hand step panel; floating SpruePanel overlay and S key shortcut removed

## [1.1.0] — 2026-03-28 — Sprue Tracking System

### Added
- **Sprue & parts tracking**: Full sprue reference system — define lettered sprues (A, B, C...) per project with auto-assigned colors, draw crop regions on instruction pages, and track individual part usage per step
- **AI part detection**: Claude Vision API integration auto-detects part callouts (e.g. A14, B7) from step crop images; constrained to user-defined sprues only, with paint/tool code exclusion and server-side label filtering
- **PartChipEditor**: Rapid manual part entry with "A15" syntax, color-tinted chips grouped by sprue, sparkle indicator for AI-detected parts, duplicate detection
- **SprueRail**: Setup rail mode for managing sprue references with click-to-select, crop preview thumbnails, inline create/edit/delete dialogs
- **Sprue overlay layer**: Visual crop regions for sprue refs on instruction canvas with drag-resize and label badges
- **AI Features settings**: API key input with show/hide toggle, model picker (Haiku 4.5 / Sonnet 4.5), auto-detect toggle, connection test via backend
- **Re-detect button**: Per-step re-detect/detect button in PartChipEditor, bypasses auto-detect setting for manual triggers
- **Sprue depletion summary**: Backend query for tracking part usage across completed steps
- **Step sprue badges**: Part count badges on step items in BuildingRail
- **V11 migration**: `sprue_refs`, `step_sprue_parts` tables, `sprues_detected` column on steps
- **Floating sprue panel**: Building mode overlay (S key toggle) showing crop thumbnails for sprues relevant to the active step, with dynamic grid layout (1–2 stacked, 3+ in 2-column grid)
- **Sprue lightbox**: Full-screen dialog with zoomable/pannable crop image and parts checklist sidebar; click a part to navigate to its step
- **Overview sprue card**: 5th card in overview zone showing per-sprue part counts with expandable rows, crop thumbnails, and clickable parts list
- **Overview grid layout**: Changed from 2×2 to 3+2 layout (three cards top row, two bottom row) to accommodate sprue card
- **SprueCropThumb**: Shared DPR-aware canvas component for rendering sprue crop thumbnails, used by SpruePanel, SprueLightbox, and SprueCard
- **comparePartNumbers utility**: Shared numeric-then-lexicographic part number sort extracted to `src/shared/utils.ts`
- **V12 migration**: `sprue_panel_open` column on `project_ui_state` for panel state persistence

## [1.0.0] — 2026-03-23 — v1.0 Release

### Added
- **Polygon crop tool**: Draw freeform polygon crop regions on instruction pages (P key or toolbar button) with closing line, rubber-band cursor preview, click-first-vertex to close, Enter to accept, and double-click to finish
- **Polygon visual feedback**: Saved polygon outlines on canvas with click-to-select, active highlight, and polygon badge on thumbnails/previews
- **Polygon clip rendering**: CropCanvas clips step images to polygon shape instead of bounding rectangle
- **Polygon editing**: Press P with a polygon step selected to edit its vertices; save/discard dialog when switching steps mid-edit
- **Clear polygon button**: Eraser icon in toolbar to remove polygon from active step
- **Canvas-scoped toasts**: Step creation and polygon save/clear toasts now appear in the bottom-right of the canvas area instead of the app corner
- **Step creation toasts**: Crop and full-page step creation now show "Step created" confirmation (matching polygon's "Polygon saved")
- **Keyboard shortcuts**: P for polygon mode, Enter to accept polygon; documented in shortcuts dialog
- **Auto-open devtools**: WebKit devtools open automatically in debug builds
- **KitCard Scalemates link icon**: Link icon appears in kit metadata row when `scalemates_url` is set; clicking opens the Scalemates page

### Fixed
- **Can't clear nullable fields**: Kit and project update forms now properly clear fields like `box_art_path`, `category`, `scalemates_url`, `scalemates_id`, `retailer_url`, `notes`, and `product_code` — previously, sending `null` was indistinguishable from "not sent" due to `Option<T>` vs `Option<Option<T>>` serde handling
- **Auto-clear `scalemates_id` when URL cleared**: Clearing the Scalemates URL in Edit Kit now also clears the linked Scalemates ID
- **Step title numbering**: Full-page and F-key step creation now count only root steps (excluding sub-steps) for title numbering, matching crop mode behavior
- **Polygon steps show rectangle**: Polygon steps no longer render a rectangular CropRegion overlay — only the polygon outline is shown

### Changed
- **Page mode simplified**: Removed crop region overlays from PageCanvas and nested step lists from PageRail — page mode now shows clean full pages with page-level step counts
- **Thicker checkmark annotations**: Checkmark stroke width now scales proportionally to the checkmark size for consistent visibility at all zoom levels
- **Scalemates data consolidated onto kits**: Removed `scalemates_url` column from projects table (V9 migration migrates existing data to associated kit); project creation now stores Scalemates URL on the kit via `new_kit_scalemates_url`
- **ProjectInfoCard**: Scalemates link sourced exclusively from kit; removed project-level Scalemates URL edit field
- **`kit_scalemates_id` surfaced on Project**: Joined from kits table for downstream use

## [0.5.2] — 2026-03-17 — Scalemates Integration

### Added
- **Scalemates web scraping**: Fetch kit metadata (name, manufacturer, scale, kit number, category, box art) from any Scalemates kit URL
- **Import diff dialog**: Side-by-side comparison of current vs Scalemates data with per-field checkboxes to selectively apply updates
- **Box art download**: Automatically download box art images from Scalemates and save to file stash
- **Instruction manual download**: Download instruction PDFs from Scalemates with related-boxing detection and confirmation dialog
- **Provenance tracking**: `source_kit_name` / `source_kit_year` columns on `kit_files` and `instruction_sources` tables; "Scalemates" badge on downloaded files
- **Scalemates URL field**: Added to Add Kit and Edit Kit dialogs with Import/Refresh button
- **`scalemates_id` field on kits**: Tracks the Scalemates numeric ID for refresh detection
- **V8 migration**: `scalemates_id` on kits, provenance columns on kit_files and instruction_sources
- **Rust scraping service**: `reqwest` (blocking) + `scraper` crate for HTML parsing with browser-like UA, timeout handling, and related-boxing detection
- **`formatProvenanceLabel` utility**: Shared provenance display logic for kit files and instruction sources
- **`SCALEMATES_KIT_URL_PATTERN` constant**: Shared URL validation pattern

### Changed
- **ProjectInfoCard**: Scalemates link prefers kit-level `scalemates_url` over project-level URL
- **AddKitDialog save flow**: Box art and manual downloads run in parallel via `Promise.allSettled`
- **EditKitDialog box art**: Download updates Zustand state directly using returned path instead of re-fetching all kits

## [0.5.1] — 2026-03-16 — Phase 6–8: Palettes, Settings, Themes & Polish

### Added
- **Completion warning dialog**: Unified confirmation dialog fires when completing a step that has relation issues — shows incomplete blockers ("Blocked by") and access-loss steps ("Will block access to") with inline completion markers to resolve blockers directly in the dialog
- **Pre-paint trapping warning**: Access-sealed steps with `pre_paint=true` get red/danger highlight + PRE-PAINT badge + "Unpainted area will be sealed!" callout in completion dialog
- **Replaced step styling in BuildingRail**: Steps replaced by another show strikethrough title, hidden completion marker, 0.4 opacity; replacing steps show "Replaces [name]" subtitle
- **Replaced step exclusion from counts**: Track `step_count`/`completed_count` SQL queries exclude steps that have been replaced by another step
- **Replaced step navigation skip**: Auto-advance after completion, keyboard arrow keys, and "Step N of M" label all skip replaced steps
- **App icon**: Custom icon generated for all platforms via `npx tauri icon`; macOS dev mode dock icon set via Cocoa APIs (`include_bytes!` + `NSImage`)
- **Pre-paint toggle redesign**: Full-width styled button with distinct ON/OFF states using gold (#C4913A) theming, replacing the hard-to-see Switch component
- **V7 migration**: `idx_steps_replaces` index on `steps(replaces_step_id)` for efficient replaced-step exclusion queries
- **`getReplacedStepIds` utility**: Shared helper in tree-utils extracting replaced step set computation (was inline in AssemblyMap)
- **`getCompletionWarnings` / `hasCompletionWarnings`**: Relation-aware warning computation for the completion dialog
- **`requestStepCompletion` store action**: Entry point for all step completion — checks relations, shows dialog or completes directly
- **`completeStepById` helper**: Extracted shared update-step + reload pattern, eliminating 3 duplicate copies
- **Paint swatches in overview**: Square swatch design in PaletteSection with cross-zone palette sync
- **Palette CRUD**: Full palette management in Overview Materials card — add/remove/rename palette entries with purpose names
- **Step paint references**: Tag steps with palette entries via `step_paint_refs` junction table; Paints section in both BuildingStepPanel and StepEditorPanel; usage counts in PaletteSection
- **Settings page (Phase 7B)**: Full settings page with 200px sidebar navigation and scrollable content area with IntersectionObserver-driven active section highlighting
- **Settings — Building**: Auto-start drying timers toggle, drying time defaults per adhesive type (editable table with Save/Reset), completion photo prompt toggle, auto-log controls (step completions, milestones, timer expirations — individually toggleable)
- **Settings — Track Colors**: Editable 8-color palette with native color picker + label editing, Save/Reset to defaults
- **Settings — Step Tags**: Manage predefined tag library — add custom tags, remove tags inline with badge + X buttons
- **Settings — Defaults**: Default currency dropdown (10 currencies: USD, EUR, GBP, AUD, CAD, JPY, CNY, KRW, SEK, PLN) — pre-fills currency selectors in Add Kit/Accessory/Paint dialogs
- **Settings — Wishlist**: Acquire behavior toggle — optionally clear price/retailer/buy URL when marking wishlist items as owned
- **Settings — Data & Storage**: Database location (read-only + Show in Finder), storage usage stats (DB file size, stash folder size, photo count), full backup export as ZIP, restore from backup with count comparison dialog and app restart
- **Backup system**: Rust backend for ZIP export (WAL checkpoint + db.sqlite + stash images), preview (extract db to temp dir, count entities), and restore (extract to app data, restart app); `zip` crate dependency
- **Settings Zustand slice**: `settings-slice.ts` with `loadSettings`/`updateSetting` actions, `SETTINGS_DEFAULTS` constants, loaded at app startup alongside other data
- **Settings helpers**: `getSettingBool`, `getSettingString`, `getSettingNumber`, `parseTrackColors`, `parseStepTags` utilities in `types.ts`
- **Annotation persistence**: Last-used annotation color and stroke width saved to `app_settings` and restored on next session
- **Assembly map zoom persistence**: Zoom level saved per project in `app_settings` with debounced writes
- **Tauri capabilities**: `dialog:allow-save` and `opener:allow-reveal-item-in-dir` permissions

### Changed
- **BuildingRail completion**: All completion paths route through `requestStepCompletion` instead of inline API calls
- **BuildingRail progress**: `totalSteps`/`totalCompleted` derived from track counts (which exclude replaced steps) instead of raw step array
- **BuildingRail lookups**: `stepsById` Map for O(1) step lookups instead of `steps.find()` in render loop
- **`flattenTrackSteps`**: Accepts optional `excludeReplacedIds` parameter to skip replaced steps
- **`getStepLabel`**: Accepts optional `excludeReplacedIds` parameter for correct "Step N of M" totals
- **CompletionWarningDialog inline completion**: Uses `requestStepCompletion` from store instead of direct API calls
- **`pendingCompletion` state**: Simplified to `{ stepId: string }` — warnings re-derived from live state, `useFullFlow` derived from `activeStepId` comparison
- **AssemblyMap**: Uses shared `getReplacedStepIds` utility instead of inline computation
- **PaintRefChips**: Square swatch design with improved layout
- **MaterialsCard**: Integrated PaletteSection for overview palette display
- **Drying timer defaults**: `getEffectiveDryingMinutes` now checks user-configured drying times from settings before falling back to hardcoded defaults
- **Auto-start timers**: Completion-triggered drying timers now respect the `auto_start_timers` setting (default ON)
- **Auto-log entries**: Step completion, milestone, and timer expiry build log entries now respect individual `auto_log_*` settings (all default ON)
- **Step tag picker**: StepEditorPanel reads predefined tags from settings instead of hardcoded `PREDEFINED_TAGS` array
- **Track color picker**: TrackDialogs reads colors from settings instead of hardcoded `TRACK_COLORS` array
- **Currency defaults**: AddKitDialog, AddAccessoryDialog, AddPaintDialog pre-fill currency from `default_currency` setting
- **Wishlist acquire behavior**: AccessoryRow, KitCard, PaintRow, PaintDetailPanel optionally clear price/currency/buy_url on status toggle based on `acquire_clear_price` setting
- **Theme system (Phase 8)**: 7 built-in themes (3 light, 4 dark) — Default, Claude Light, Claude Dark, Blueprint, US Army, Quarterdeck, Instruction Sheet
- **Theme definitions**: `src/shared/themes.ts` with typed `ThemeDefinition` objects, `THEME_MAP` for O(1) lookup, light/dark accessory type color variants
- **Theme engine**: `src/shared/theme-engine.ts` applies themes by setting CSS variables on `documentElement`, handles derived tokens (status colors, popover), shadow adjustments for dark themes, `.dark` class toggle for shadcn components, accessory type color lightening
- **`useTheme` hook**: `src/hooks/useTheme.ts` provides resolved theme colors to Konva canvas components that cannot consume CSS variables
- **Theme picker**: Settings Appearance section shows all 7 themes as selectable cards with color swatch strips, Light/Dark labels, and active checkmark
- **Hardcoded hex cleanup**: Replaced 19 hardcoded color values across 10 components with theme-aware alternatives (CSS variables for DOM, `useTheme()` for Konva)
- **Sonner dark mode**: Toast notifications now adapt to dark/light theme via `useTheme()` hook
- **`ACCESSORY_TYPE_COLORS`**: Now references CSS variables instead of hardcoded hex, automatically adapting to theme
- **Reset Settings button**: Red outlined button at bottom of Settings About section, restores all settings to `SETTINGS_DEFAULTS` with AlertDialog confirmation
- **Reset App button**: Red filled button with destructive confirmation — lists all data that will be deleted, requires typing "RESET" to proceed, offers "Export Backup First" shortcut; clears all database tables (transactional) and wipes stash directory, then reloads the page
- **`reset_app_data` Tauri command**: Backend command that checkpoints WAL, clears all user data tables in a transaction, removes and recreates the stash directory
- **Database reconnection (`AppDb::reopen`)**: Extracted `open_conn()` helper for shared connection setup; `reopen()` method closes and reopens the database connection after file replacement (backup import)
- **Backup import reload**: `apply_backup` no longer calls `app.restart()` — instead checkpoints WAL before extraction, removes stale WAL/SHM files after, reopens the database connection, and frontend triggers `window.location.reload()`

### Changed
- **Zone bar fixed height**: Zone bar uses `h-10` (40px) fixed height instead of content-dependent sizing, preventing height jitter between zones
- **Project selector height**: SelectTrigger uses `h-auto!` with `py-[5px]` to match SegmentedPill button height exactly
- **SegmentedPill font consistency**: Active tab no longer toggles between `font-semibold`/`font-normal` — all tabs use `font-medium` to prevent width shift when switching zones
- **Claude Light theme background**: Changed from `#FFFFFF` to `#F8F6F3` to match the default theme's viewport background color
- **Removed unused `accent-muted`**: Deleted CSS variable from `index.css` and derived token from theme engine (was defined but never consumed)
- **Backup import no longer restarts app**: Replaced `app.restart()` with frontend page reload for dev-mode compatibility; backend reopens database connection in-place

### Fixed
- **Backup import white screen**: `app.restart()` in dev mode launched the production binary disconnected from Vite; replaced with `window.location.reload()` and `AppDb::reopen()` so imported data is visible without restarting
- **Backup import data not loading**: Old database connection persisted after db.sqlite file replacement; added WAL checkpoint before extraction, WAL/SHM file cleanup after, and `db.reopen()` to establish a fresh connection to the imported database
- **Reset SQL atomicity**: Wrapped all DELETE statements in an explicit transaction to prevent partial data clears if an error occurs mid-batch
- **TOCTOU in stash removal**: Removed `stash_path.exists()` check before `remove_dir_all()` — just attempt deletion and ignore errors
- **`open_conn` parameter type**: Changed from `&PathBuf` to idiomatic `&Path`

## [0.5.0] — 2026-03-08 — Overview Zone (Phase 5A–5C)

### Added
- **Overview focus mode**: Click expand button on any overview card to fill the grid; other cards hide. Back button (×) and Escape key return to 2×2 mosaic
- **ProjectInfoCard expanded view**: Hero header with box art, badge row (scale, category, status, product code, Scalemates link), overall progress bar, 5-tile stats grid (steps, tracks, photos, accessories, paints), per-track progress with completion counts and strikethrough, timeline section (start date, build duration, last activity, log count), read-only notes display
- **ProjectInfoCard editable metadata**: Collapsible "Edit Details" section with auto-save-on-blur for project name, category toggle buttons, Scalemates URL with open button, product code, and notes textarea
- **ProjectInfoCard status actions**: Mark Complete (with confirmation dialog + kit status sync + build log entry), Pause Build, Resume Build, and Delete Project (typed-name confirmation, navigates to Collection)
- **BuildLogCard composer**: Text input + camera button + send button for adding note and photo entries directly from the overview
- **BuildLogCard photo uploads**: Pick image via file dialog, preview thumbnail with caption input, stash with `blog_` prefix via new `add_build_log_photo` Tauri command
- **BuildLogCard filter pills**: All / Steps / Notes / Photos / Milestones client-side filtering in expanded view
- **BuildLogCard expanded view**: Full scrollable entry list (no longer capped at 50), inline photo thumbnails with lightbox, day-grouped layout
- **`update_project` backend**: New Tauri command + Rust query for updating project fields with `Option<Option<T>>` nullable pattern for `hero_photo_path` and `completion_date`
- **`addBuildLogPhoto` API**: Frontend wrapper for the new photo upload command
- **`addOverviewBuildLogEntry` store action**: Optimistic prepend to avoid full reload after composer submissions
- **`formatDuration` utility**: Human-readable elapsed time formatting (days, months, years)
- **`PROJECT_STATUS_COLORS` constant**: Design token map for project status badge colors
- **`hero_photo_path` on Project**: Exposed existing DB column through queries, models, and TypeScript types
- **`UpdateProjectInput` type**: Shared TypeScript interface for project updates

### Changed
- **OverviewCard**: Added expand/collapse button props and flex-1 sizing in expanded mode
- **GalleryCard, MaterialsCard**: Accept expanded/onExpand/onCollapse props for focus mode integration
- **ImageLightbox**: Escape key now properly closes lightbox before bubbling to overview Escape handler (stopImmediatePropagation on capture phase)
- **`projects.rs` queries**: Extracted `map_row` + `SELECT_COLS` to eliminate duplicated row mapping between `list_all` and `get_by_id`
- **`build_log_entries::insert`**: Consolidated `insert_with_photo` into a single `insert` function with optional `photo_path`/`caption` parameters; extracted shared `fetch_by_id` helper
- **`list_by_project`**: Removed hardcoded `LIMIT 50`; accepts optional limit parameter so expanded view shows all entries
- **Kit status sync**: Raw SQL for kit status updates now includes `updated_at` timestamp
- **ProjectInfoCard status handlers**: Deduplicated into shared `changeStatus` helper; `loadKits` fires in parallel instead of blocking the toast
- **BuildLogCard photo memos**: `photoEntries` and `lightboxImages` skip computation in compact mode

## [0.4.4] — 2026-03-07 — Codebase Audit & Cleanup

### Added
- **Arrow key page navigation in setup mode**: Left/Right arrow keys now navigate pages, matching building mode's arrow key pattern

### Changed
- **Rust file stash service**: Extracted shared `file_stash::save_to_stash()` utility, simplifying progress photo, milestone photo, and reference image commands
- **Zoom constants deduplicated**: `MIN_ZOOM`, `MAX_ZOOM`, `ZOOM_STEP` moved to shared `zoom-utils.ts`
- **Build log command refactored**: Rust `add_build_log_entry` now accepts a single `CreateBuildLogEntryInput` struct instead of 9 individual parameters
- **Timer tick isolated**: Timer countdown re-renders now only affect the TimerBubble component instead of the entire build UI (removed `timerTickCount` from global store)
- **Build route selectors reduced**: Keyboard handler rewritten with `getState()` pattern, reducing BuildRoute from 30+ store subscriptions to 7
- **Annotation API simplified**: JSON parse/stringify moved from store into API layer
- **PageRail sort optimized**: Steps pre-sorted in `useMemo` instead of sorting on every render
- **Timer expiration deduplicated**: Extracted shared `handleTimerExpired` helper for crash recovery and active expiry paths

### Fixed
- **Race condition on app load**: `Promise.all` in `loadActiveProject` and `setActiveProject` was not awaited, causing data loads to run detached
- **Stale closure in setActiveStep**: Removed unnecessary `setTimeout` wrapper for annotation loading
- **Sequential step metadata loads**: Tags, relations, and reference images now load in parallel when switching steps
- **Memory leak on step deletion**: Per-step annotation undo/redo stacks now cleaned up when a step is removed

## [0.4.3] — 2026-03-07 — Phase 4 Polish

### Added
- **Drag to reposition annotations**: Click to select an annotation, then drag to move it — works for all 7 shape types including arrows (both endpoints) and freehand (all points)
- **Undo/redo for annotations**: Per-step undo/redo stacks (50 levels deep) with ⌘Z/⌘⇧Z keyboard shortcuts and undo/redo buttons in toolbar
- **Stroke width presets**: Thin/Medium/Thick stroke buttons in annotation toolbar for controlling line weight
- **Trackpad pinch-to-zoom**: Smooth pinch gesture support on trackpad across all three canvases (InstructionCanvas, CropCanvas, PageCanvas)
- **Escape cancels mid-draw**: Press Escape to abort an in-progress annotation draw (circle, arrow, highlight, freehand)
- **Active tool label in nav bar**: Current annotation tool name shown in the navigation bar when a tool is selected
- **Tool-specific cursors**: Text tool shows text cursor, drawing tools show crosshair, hover feedback on existing annotations
- **Annotation count badge**: Undo button shows current annotation count

### Changed
- **Reusable ImageLightbox component**: Extracted inline lightbox implementations from KitCard, BuildingStepPanel, and GalleryCard into a single shared `ImageLightbox` component with dark overlay, prev/next navigation, keyboard arrows, thumbnail strip, captions, and an action slot for contextual buttons
- **Annotation toolbar always visible**: Toolbar now shows by default at bottom of canvas when a cropped step is active, removing the need to toggle with 'A' key
- **'A' key deselects tool**: 'A' now deselects the current annotation tool instead of toggling toolbar visibility
- **Number keys always active**: 1-7 tool shortcuts work in building mode without needing to toggle the toolbar first
- **Annotation tool persists across steps**: Switching steps no longer deselects the active annotation tool; a toast reminder shows the active tool name
- **⌘Z context-aware**: Undo triggers annotation undo in building mode, crop undo in setup mode

### Fixed
- **Thumbnail annotation sizes**: Thumbnails now use shared size constants and respect custom annotation sizes instead of using independent hardcoded values
- **Stale stroke width on draw**: Fixed useCallback dependency bug where changing stroke width mid-session would not apply to new annotations
- **Clear all floods undo stack**: "Clear all" now uses a single batch operation instead of N individual removes, producing one undo snapshot
- **Crop canvas centering**: Cropped step images now center in the display area immediately instead of appearing at top-left
- **Lightbox keyboard isolation**: Arrow keys in lightbox no longer bubble to build mode step navigation
- **Lightbox persistence on step change**: Lightbox closes when navigating to a different step
- **Sub-step rail visibility**: Building rail sub-steps stay expanded when a child step is active (not just the parent)
- **Annotation event listener leak**: AnnotationLayer keyboard listener now uses useEffect with proper cleanup instead of attaching/detaching on every render
- **Annotation debounce per-step**: Saving annotations for one step no longer cancels the pending save for another step
- **Annotation toolbar subscription**: Narrowed store subscription to only the active step's annotations instead of the entire annotations map
- **Native dialogs replaced**: Text annotation prompt and clear-all confirm replaced with inline HTML input and two-click confirmation pattern
- **PageCanvas memoization**: Added useMemo for pageSteps and trackMap to prevent unnecessary recalculation

## [0.4.2] — 2026-03-07 — Page Mode (Phase 4C)

### Added
- **Page navigation mode**: Toggle between Steps and Pages view in building mode via toolbar segmented pill
- **PageRail**: Left panel showing numbered page list with per-page step counts and completion indicators; clicking a page shows its steps inline
- **PageCanvas**: Full instruction page view with colored interactive crop regions showing step boundaries, completion status, and click-to-navigate
- **Page NavigationBar**: "Page N of M" with step completion counts in page mode
- **Nav mode persistence**: Page/track preference saved per project via `nav_mode` column in `project_ui_state`

## [0.4.1] — 2026-03-07 — Annotations (Phase 4B)

### Added
- **Annotation system**: 7 annotation tools for marking up instruction images in building mode — checkmark, circle, arrow, cross, highlight, freehand, and text
- **CropCanvas Konva migration**: Rewrote building mode CropCanvas from Canvas 2D API to react-konva for interactive annotation support while preserving zoom/pan/fit-to-view behavior
- **AnnotationLayer**: Konva layer rendering annotations with normalized coordinates, selection, and drawing previews
- **AnnotationToolbar**: Floating toolbar with tool buttons (1-7), color swatches (6 presets), undo last, and clear all
- **Annotation persistence**: Annotations saved per-step to `annotations` table as JSON blob with 500ms debounced auto-save
- **Thumbnail compositing**: Annotations rendered on step thumbnails in BuildingRail via Canvas 2D draw helpers
- **Keyboard shortcuts**: `A` toggles annotation toolbar, `1`-`7` selects annotation tool, `Delete`/`Backspace` removes selected annotation
- **Backend CRUD**: Rust queries and Tauri commands for annotation get/upsert (uses existing `annotations` table)

## [0.4.0] — 2026-03-07 — Drying Timers & Setup Focus (Phase 4A)

### Added
- **Drying timers**: Start countdown timers for steps with drying times — tracks cure times with visual countdown in a floating bubble overlay
- **Timer bubble**: Draggable floating card on the canvas showing all active timers with circular progress indicators, MM:SS countdown, track color dots, adhesive type labels, and click-to-navigate
- **Auto-start timers**: Completing a step with adhesive/drying time automatically starts a timer with a dismissable toast notification
- **Adhesive default durations**: Research-based defaults for each adhesive type (liquid cement 10m, tube cement 20m, CA thin 2m, CA medium/thick 5m, epoxy 30m, PVA 30m)
- **Cancel timer on hover**: Hovering the progress circle shows a red X; clicking opens a confirmation dialog
- **OS notifications**: Desktop notification fires when a timer completes (via tauri-plugin-notification)
- **Build log integration**: Timer completions automatically logged as build log entries
- **Crash recovery**: Expired timers detected on app relaunch with "expired while away" notification
- **Add custom timer**: Plus button in bubble header opens inline form to create ad-hoc timers with custom label and duration
- **Start Timer button**: Always visible in BuildingStepPanel — one-click for preset durations, manual input for custom
- **T keyboard shortcut**: Start drying timer for active step in building mode (uses adhesive defaults)
- **Focus on crop in setup mode**: Clicking a step in the track rail centers and zooms the canvas on that step's crop region
- **Timer slice**: New Zustand store slice (`timer-slice.ts`) with 1-second tick interval, automatic cleanup on expiry

## [0.3.5] — 2026-03-07 — Overview Polish

### Added
- **Build Log improvements**: Entries grouped by day (Today/Yesterday/date), show step titles in labels (e.g. "Completed 'Hull Assembly'"), clickable entries navigate to step in Build zone
- **Gallery lightbox**: Click any thumbnail to open full-size photo in a dialog; shows date, photo type, and "Go to step" link for progress photos
- **Assembly map active step marker**: Accent-colored ring highlights the currently active step node
- **Project Info enhancements**: "Started X ago" and "Last activity X ago" timestamps; per-track progress bars with tooltips when multiple tracks exist
- **Empty state hints**: All four overview cards now show icon + actionable guidance text (e.g. "Complete steps in Build mode to see history")
- **`useNavigateToStep` hook**: Shared navigate-to-step-in-build-zone pattern extracted from 3 components
- **`relativeTime` utility**: Shared relative timestamp formatter in `src/shared/format.ts`

### Changed
- Collapsed assembly map mini progress bars use Radix tooltips instead of native `title` attributes
- Build Log subtitle uses proper pluralization ("1 entry" vs "N entries")
- ProjectInfoCard uses targeted Zustand selector for last activity timestamp

## [0.3.4] — 2026-03-06 — Phase 3.5: Basic Overview

### Added
- **Overview zone**: Read-only project dashboard replacing the placeholder cards
- **Assembly Map**: Collapsible SVG visualization of tracks and steps; filled nodes for completed steps, hollow for pending; dashed join arrows between tracks; hover tooltips; click navigates to Build zone; collapsed view shows mini progress bars per track
- **Project Info card**: Kit name, scale/category/status badges, box art thumbnail, overall progress bar
- **Gallery card**: Merged progress + milestone photos sorted by date; row of thumbnails with overflow count
- **Build Log card**: Recent activity timeline with colored dots per track, relative timestamps
- **Materials card**: Linked accessories with type badges, paints with color swatches
- **Overview data loading**: New `overview-slice` fires 5 queries in parallel on zone switch; skeleton loading state
- **Backend queries**: `list_by_project` for build_log_entries, progress_photos, milestone_photos, accessories; `list_paints_for_project` via palette_entries JOIN
- **5 new Tauri commands**: `list_build_log_entries`, `list_project_progress_photos`, `list_project_milestone_photos`, `list_accessories_for_project`, `list_paints_for_project`

## [0.3.3] — 2026-03-06 — Phase 3 Polish: Photos, Milestones, Relations

### Added
- **Progress photos**: Camera button in BuildingStepPanel to capture photos for the active step; images stashed with `prog_` prefix; auto-creates build log entry
- **Milestone photos**: Drag-and-drop or click-to-browse image area in MilestoneDialog; stashed with `mile_` prefix
- **Build log entries**: General-purpose logging backend (`build_log_entries` table) with typed entry types (`step_complete`, `note`, `photo`, `milestone`, `build_complete`)
- **Milestone detection**: Completing the last step in a track triggers a milestone dialog instead of auto-advancing
- **MilestoneDialog**: Overlay card with track color dot, "Track Complete!" heading, combined drag-drop photo area + note textarea; only Continue closes and auto-advances to next track's first incomplete step
- **Un-complete confirmation**: Clicking Complete on an already-completed step (panel or rail) shows an AlertDialog before toggling back to incomplete
- **RelationPill**: Floating amber pill overlaid on CropCanvas when active step has `blocked_by` relations; shows blocker title or count, click navigates to blocking step, auto-dismisses after 5 seconds
- **`BuildLogEntryType` union type**: Type-safe string union matching the DB CHECK constraint
- **`IMAGE_FILE_FILTER` constant**: Shared image file picker filter for reuse across dialogs

### Changed
- `completeActiveStep` now awaits track reload for milestone detection, inserts `step_complete` and `milestone` build log entries
- `addBuildLogEntry` API uses an options object instead of 8 positional parameters
- BuildingRail completion routes through `completeActiveStep` for the active step (logging, milestone detection)
- Viewer state resets when entering building mode and switching steps, fixing crop image centering

## [0.3.2] — 2026-03-06 — Phase 3C: Step Panel & Completion Flow

### Added
- **BuildingStepPanel**: Read-only 280px right panel in building mode showing all step context — header with track dot/name, completion button, quantity tracker with pips, sub-step checklist, relations (blocked by, blocks, blocks access to, access blocked by), replaces link, details (adhesive, drying time, source, pre-paint pill, tags), notes, and reference images in masonry grid
- **Step completion flow**: Complete button toggles completion state; on completion, auto-advances to next incomplete step in flat walk order (wrapping around)
- **`completeActiveStep` store action**: Centralized completion + auto-advance logic shared by panel button and keyboard shortcut
- **Space/Enter keyboard shortcut**: Completes the active step in building mode
- **Keyboard shortcuts dialog**: Added "Building Mode" section with Space/Enter and arrow key shortcuts
- **`parseStepRelations` utility**: Shared relation filtering helper in tree-utils, used by both BuildingStepPanel and StepEditorPanel

## [0.3.1] — 2026-03-06 — Phase 3B: Building Rail & Crop Canvas

### Added
- **BuildingRail**: Single-track step list (200px) with Popover track selector dropdown showing project-wide progress, per-track done/total counts, and completed track checkmarks
- **Step thumbnails**: Canvas-rendered crop thumbnails (36px height) in building rail step rows with shared image cache, opacity states (45% for completed, full + accent glow for active)
- **Building rail step rows**: Completion marker, thumbnail, title with "Step N of M" secondary line on active step, pre-paint amber dot indicator
- **Sub-step expansion**: Sub-steps visible beneath parent when parent step is active
- **Join point indicators**: Incoming (source track color bar + arrow + name) and outgoing (arrow + destination color bar + name) inline markers, clickable to navigate across tracks
- **CropCanvas**: Dedicated canvas showing only the active step's crop region, fit-to-view by default with zoom/pan support; pan uses CSS transform (no redraw), zoom triggers canvas redraw
- **Show Full Page modal**: Expand button on crop canvas opens full-screen instruction page with crop region highlighted and surrounding area dimmed
- **NavigationBar**: Flat step traversal with hierarchical labels ("Step 2.1 of 8 steps"); track color dot and name alongside counter
- **Shared utilities in tree-utils.ts**: `getEffectiveDimensions()` (rotation math), `buildChildrenMap()` (parent→children map), `getOrderedTrackSteps()`, `flattenTrackSteps()`, `getStepLabel()`

## [0.3.0] — 2026-03-06 — Phase 3A: Mode Toggle & Building Layout

### Added
- **Setup/Building mode toggle**: SegmentedPill in the build toolbar switches between Setup and Building modes, persisted per-project in `project_ui_state`
- **Active track persistence**: `active_track_id` saved to DB via new V5 migration, restored on project load
- **Building mode layout**: TrackRail and StepEditorPanel hidden in building mode; canvas expands to fill available space
- **NavigationBar**: Slim 30px bar below canvas in building mode with prev/next buttons and "Step N of M" counter
- **Setup-only tool hiding**: View/Crop toggle, Full Page button, Source Manager, and Upload PDF hidden when in building mode
- **Keyboard guards**: C (crop) and F (full page) keys disabled in building mode; arrow keys navigate between steps in building mode
- **Auto-select on enter**: Switching to building mode with no active step auto-selects the first incomplete step
- **Canvas mode guard**: Crop mode blocked in building mode (both from keyboard and store)

## [0.2.8] — 2026-03-05 — Phase 2H: Step Relations, Progress Ring & Quantity Counter

### Added
- **Step relations**: "Blocked by" and "Blocks access to" relation types between steps, with step picker UI in the editor panel grouped by track with search filtering
- **Bidirectional relation display**: Relations shown from both sides with semantic labels — "Blocked by" ↔ "Blocks", "Blocks access to" ↔ "Access blocked by" — editable and removable from either end
- **Relation chip navigation**: Click a relation chip to navigate to the linked step; click X to remove the relation
- **Replaces step**: Set a single step that this step replaces via `replaces_step_id`; target step shows "Replaced by" with removable chip
- **Step relation persistence**: Full Rust backend (queries, commands) for the `step_relations` table that already existed in the schema
- **Sub-step progress ring**: Parent steps show a circular progress arc in the completion marker — perimeter fills proportionally as sub-steps are completed, turns green when all done
- **Quantity counter**: Steps with quantity > 1 show +/− buttons in the editor panel and a "3/5" fraction label on the rail; completion marker ring fills proportionally to quantity progress
- **Quantity current persistence**: `quantity_current` field added to `UpdateStepInput` (Rust + TypeScript) for increment/decrement support
- **Nullable field clearing**: `replaces_step_id` uses `Option<Option<String>>` pattern to distinguish "not provided" from "explicitly set to null"

## [0.2.7] — 2026-03-05 — Phase 2G: Join Point Indicators & Crop-to-Step

### Added
- **Incoming join point markers**: Target tracks now show an inline divider at the join point step with the source track's color bar and name, making both ends of a join visible
- **Outgoing join point markers**: Source tracks show a directional marker at the end of their step list with an arrow and the target track's color bar
- **Directional join point icons**: Replaced ambiguous GitMerge icons with arrow + colored bar indicators — bar position (left vs right of arrow) distinguishes incoming from outgoing
- **Collapsed join point label**: Track headers show the join target with arrow + color bar when collapsed; hidden when expanded (markers take over)
- **Menu wording**: "Set Join Point" renamed to "Joins Into…" with ArrowRight icon for clearer directionality
- **Crop empty steps**: Clicking the empty crop preview in the step editor switches to crop mode; drawing a crop updates the existing step instead of creating a new one
- **Crop tool root steps**: Crop tool now always creates root-level steps (Step 1, 2, 3…) instead of auto-nesting under the active step

### Fixed
- Crop tool creating sub-steps (Step 1.1, 2.1) instead of sequential root steps

## [0.2.6] — 2026-03-04 — Phase 2F: Tags, Reference Images & Drag-to-Nest

### Added
- **Drag-to-nest**: Drag a step horizontally in the track rail to change its nesting depth — drag right to nest under the item above, drag left to un-nest to root level. Uses dnd-kit SortableTree-style projection from horizontal offset
- **Drop indicator line**: Accent-colored line with circle marker shows at the projected depth during drag, giving real-time visual feedback for nest/un-nest operations
- **Auto-rename on nest/un-nest**: Steps with auto-generated titles (e.g. "Step 3", "Step 2.1") are automatically renamed to match their new context when nesting changes
- **Position-aware un-nesting**: Un-nesting a sub-step places it after the drop target when dropped on a root step, or after the former parent when dropped in place
- **Parent collapse during drag**: Dragging a root step that has children collapses them into the parent — children travel with the drag and reappear at the new position
- **Drag projection performance**: O(1) step lookup for projection guard, eliminated redundant linear scan in `getProjection`, skip unnecessary track reload on nest/un-nest
- **Backend**: `set_step_parent` command for explicit parent set/clear, `reorder_children_steps` command for scoped child reordering
- **Step tags**: Predefined tag library (Dry Fit, Paint First, Filler Needed, Masking, Decals, Clear Coat, Weathering, Rigging, Fragile, Optional) with tag picker popover in step editor panel
- **Tag persistence**: Full backend CRUD — `tags` and `step_tags` tables with ensure-or-create semantics, Tauri commands, TypeScript API wrappers, and Zustand store integration
- **Reference image attachments**: Per-step reference images (photos, screenshots, diagrams) with native file picker (png/jpg/jpeg/webp), file copy to stash directory, and database tracking
- **Reference image thumbnails**: 2-column grid of 50px-tall thumbnails in the step editor panel with click-to-expand larger view
- **Reference image captions**: Click-to-edit inline captions under each thumbnail, saved on blur or Enter
- **Reference image deletion**: Hover-to-reveal X button removes image from database and stash
- **Reference images backend**: Full Rust data layer — queries, commands with file stash integration, TypeScript types, API wrappers, and Zustand store with targeted add/update/remove actions

## [0.2.5] — 2026-03-03 — Phase 2E: Cross-Track Drag-and-Drop & Track Expansion

### Added
- **Cross-track drag-and-drop**: Drag steps between tracks directly in the rail — single steps or multi-selected groups. Steps insert at the drop position in the target track with automatic reordering of both source and target tracks
- **Multi-track expansion**: Multiple tracks can now show their step lists simultaneously. Click a track header to toggle its expansion; Cmd+click to expand exclusively (collapsing all others)
- **Expand/collapse all buttons**: Two state-aware icon buttons in the track rail header — expand all (highlighted when all tracks open) and collapse all (highlighted when all tracks closed)
- **Unified DndContext**: Single drag-and-drop context hoisted to TrackRail level, enabling within-track reorder and cross-track moves in one gesture
- **Drop zones on expanded tracks**: Empty expanded tracks show a "Drop steps here" placeholder; collapsed tracks have no drop zone

### Removed
- **Move to Track menu**: Removed the dropdown submenu for moving steps between tracks — superseded by direct drag-and-drop

## [0.2.4] — 2026-03-03 — Phase 2D-remaining: Selection, Editing & Polish

### Added
- **Track reassignment**: Change a step's track via the editor dropdown — step moves to end of destination track, step counts refresh on both tracks, destination track auto-expands in the rail
- **Bidirectional rail↔canvas sync**: Clicking a step in the rail navigates the canvas to its page and highlights the crop region; clicking a crop region on the canvas expands the step's track and selects it
- **Crop preview**: Canvas-rendered thumbnail of the step's cropped+rotated region in the editor panel, with skeleton loading state, "Page N" badge, and click-to-navigate
- **Page number badges**: Steps with crop regions show a subtle "P3" badge in the rail indicating which instruction page they reference
- **Step editor panel**: Widened from 220px to 260px for better readability; canvas container fixed with `min-w-0` to prevent editor panel clipping

## [0.2.3] — 2026-03-03 — Phase 2D: Crop Region Resize & Reposition

### Added
- **Resize handles**: Selected crop regions show 8 Konva Transformer handles (corners + edges) for precise resizing
- **Drag to reposition**: Selected crop regions are draggable to adjust position on the instruction page
- **Inverse coordinate conversion**: `effectiveToImage` converts effective-space (post-rotation) coordinates back to image-space for database storage
- **Zoom-independent handles**: Anchor size, stroke width, and corner radius scale inversely with zoom to maintain constant visual size
- **Minimum crop size**: Enforced 5px minimum in both dimensions via Transformer `boundBoxFunc`

## [0.2.2] — 2026-03-02 — Phase 2C: Canvas Crop Tool & Step Creation

### Added
- **Selection-first step creation**: Draw a rectangle on the instruction PDF canvas to instantly create a step on the active track — the primary way to create steps
- **Canvas mode toggle**: View mode (pan/zoom) and Crop mode (draw crops) with toolbar buttons and keyboard shortcuts (V/C)
- **Crop regions on canvas**: All crop regions visible on the current page with track-colored borders, semi-transparent fills, and corner labels showing track abbreviation + step number
- **Full-page step shortcut**: Create a step covering the entire page via toolbar button or F key
- **Keyboard shortcuts**: C (crop mode), V (view mode), F (full-page step), Escape (deselect step or exit crop mode)
- **CropLayer component**: Konva Layer rendering all crop regions for the current page with in-progress drawing rectangle
- **CropRegion component**: Konva Group with inverse-zoom-scaled labels and borders that stay readable at any zoom level
- **useCropDrawing hook**: State machine for crop drawing with stage-to-image coordinate conversion supporting all rotation angles (0/90/180/270)
- **Canvas mode state**: `canvasMode` in build-slice with guard preventing crop mode without an active track

## [0.2.1] — 2026-03-02 — Phase 2B: Track & Step Foundation

### Added
- **Track & step backend**: Full Rust data layer for tracks and steps — CRUD queries, Tauri commands, TypeScript types, API wrappers, and Zustand store integration
- **Three-panel build layout**: Build zone now has TrackRail (left) | Canvas (center) | StepEditorPanel (right) layout
- **Track rail UI**: 200px left panel with track list, add/rename/change-color/delete dialogs, progress bars, and empty state
- **Track auto-color**: New tracks auto-assign from an 8-color rotating palette (Terracotta, Steel Blue, Olive, Gold, Purple, Burnt Orange, Teal, Mauve)
- **Active track toolbar**: Selected track shown with color dot + name in the build toolbar
- **Step editor panel**: 220px right sidebar with title, track, adhesive, source type, pre-paint toggle, notes, and advanced fields (quantity, drying time)
- **Step UI components**: StepItem, StepCompletionMarker for track rail display
- **Paint group expand/collapse all**: Toolbar buttons to expand or collapse all paint group sections at once
- **Persistent paint group state**: Expanded/collapsed state for paint groups survives tab switches; uses a base+overrides model so expand/collapse all sets the default for new groups too
- **Lazy image loading**: Kit box art and accessory thumbnails now use `loading="lazy"`

### Changed
- **Paint group default**: All paint groups now default to expanded (previously only the two largest)
- **Paint group swatches**: Collapsed mini swatches now appear next to the group count instead of far right
- **Paint toolbar**: Removed redundant "Group:" label
- **Rust backend cleanup**: Extracted shared `util.rs` module with `now()`, `get_pdf_dpi()`, `project_dir()`, and `instructions_dir()` helpers — deduplicated 8 `now()` functions across query files and consolidated ~25 mutex lock patterns into `AppDb::conn()`
- **Build slice cleanup**: Extracted `DEFAULT_PAGE_STATE` and `DEFAULT_VIEWER_STATE` constants, renamed `fitToViewCounter` to `fitToViewTrigger`
- **AppShell init**: Parallelized data loads with `Promise.all`
- **PaintRow selector**: Fixed unstable Zustand selector reference (`?? []` inside selector → stable `EMPTY_PROJECTS` constant)

### Removed
- Dead code: `set_build_mode()` in project_ui_state queries, `delete_by_source()` in instruction_pages queries
- Unused `compact` prop from AccessoryRow

## [0.2.0] — 2026-03-02 — Phase 2A: PDF Import, Page Viewer & Build Zone Shell

### Added
- **PDF import via MuPDF**: Rust-side PDF rasterization using `mupdf` crate (builds MuPDF from C source via cargo). Pages rendered as PNGs at configurable DPI (72/150/300)
- **Instruction source management**: Upload, list, delete, and process instruction PDFs per project. Files stored in `{appData}/model-builder/projects/{id}/instructions/`
- **Konva page viewer**: Full canvas-based page viewer using react-konva with scroll-wheel zoom (centered on cursor), click-drag pan, fit-to-view, and white page backing for transparent PDFs
- **Page rotation**: Rotate pages 90 degrees at a time (toolbar button or `R` key), persisted to database across sessions
- **Page navigator**: Frosted glass overlay at bottom-center with source name, page counter, prev/next controls, and multi-source dropdown
- **Source manager panel**: Slide-out panel listing all instruction sources with delete (confirmation dialog) and process actions
- **Build toolbar**: Context toolbar with Setup mode label, project name, zoom controls (in/out/fit/rotate), source manager toggle, and Upload PDF button
- **Empty instructions state**: Upload CTA shown when no PDFs exist for the active project
- **Processing overlay**: Full-screen loading indicator during PDF rasterization (project creation and additional uploads)
- **Project UI state persistence**: Zoom and pan state saved to database per project
- **Keyboard shortcuts**: Tab/Shift+Tab (next/prev page), +/- (zoom), 0 (fit to view), R (rotate)
- **DPI setting**: New "PDF Import" section in Settings with 72/150/300 DPI toggle
- **Project overflow menu**: Three-dot menu next to project dropdown with Rename, Delete (with confirmation), and Archive (greyed out, coming soon)
- **Rename project**: Inline rename dialog from the project overflow menu
- **Delete project**: Removes project, all instruction sources/pages, and files on disk
- **V4 migration**: `ALTER TABLE instruction_pages ADD COLUMN rotation`

### Changed
- **Build zone**: Replaced Phase 2 placeholder with full instruction viewer layout
- **Build slice**: Expanded with instruction sources, page navigation, viewer state, rotation, and processing state
- **Project creation**: Kit PDF files are now auto-rasterized during project creation with a processing overlay instead of requiring manual processing
- **Code cleanup**: Extracted `useUploadPdf` hook (deduplicated 3 copies), `rasterize_and_persist` Rust helper (deduplicated 3 copies), transaction-wrapped page batch inserts, fixed stale closures in canvas viewer

## [0.1.5] — 2026-03-01 — Phase 1B-4: Collection Toolbars & Accessory Images

### Added
- **Accessory thumbnail images**: Accessories now support an optional image, displayed as a 32×42px thumbnail in AccessoryRow with gradient placeholder fallback
- **Accessory image picker**: "Choose image" button in both Add and Edit Accessory dialogs (png/jpg/jpeg/webp), matching the kit box art picker pattern
- **save_accessory_image command**: Rust backend command copies image to stash directory and updates the `image_path` column
- **V3 migration**: `ALTER TABLE accessories ADD COLUMN image_path TEXT`
- **Unified context bar**: All three Collection tabs (Kits, Accessories, Paints) now render tab-specific toolbars in the shared context bar after EntitySwitcher
- **KitToolbar**: Status filter (segmented pill), group-by toggle (Status / Category / Manufacturer), search input, and grid view placeholder
- **AccessoryToolbar**: Status filter (All / Owned / Wishlist), type filter (All / PE / Resin / Decal / Other with per-type colors), group-by toggle (Type / Parent Kit), search input, and grid view placeholder
- **Kit search**: Filters kits by name, manufacturer, scale, and kit number
- **Kit group-by**: Group kits by Status (default sections), Category (Ship/Aircraft/Armor/etc), or Manufacturer (alphabetical)
- **Accessory filtering**: Filter by status (owned/wishlist) and type (PE/resin/decal/other), with search by name, brand, and reference code
- **Accessory grouping**: Collapsible sections grouped by Type or Parent Kit (with "Unlinked" group for unlinked accessories)
- **Paint search in store**: Paint search state moved from local component state to Zustand store for context bar integration

### Changed
- **PaintsToolbar**: Moved from inline toolbar inside PaintsTab to the shared context bar
- **StatusFilterChips**: Absorbed into KitToolbar; standalone component deleted
- **Toolbar styling**: All filter/group selectors use consistent segmented pill style with text labels (Status:, Type:, Group:)

### Removed
- `StatusFilterChips.tsx` (replaced by KitToolbar)

---

- Project proposal document defining the three-zone UX architecture (Collection, Build, Overview)
- EXPORT_FEATURE.md: Full export feature specification (curation dialog, PDF page design, Typst templates, HTML/ZIP formats)
- export-mockup.jsx: Interactive React mockup of the export dialog

## [0.1.4] — 2026-03-01 — Phase 1B-3: Wishlist Polish & Kit-to-Project Pipeline

### Fixed
- **create_project bug**: Removed premature `active_project_id` set that wrote the kit ID instead of the project ID
- **create_project bug**: Removed `file_path` column from `instruction_sources` INSERT (column is auto-populated by default value from V2 migration)

### Added
- **Kit-to-project pipeline**: Creating a project from a kit now auto-links all accessories with matching `parent_kit_id` via `project_accessories`
- **Kit wishlist fields in AddKitDialog**: Price, currency, and retailer URL fields appear when adding a kit with "Wishlist" status
- **Kit wishlist fields in EditKitDialog**: Price, currency, and retailer URL fields appear when status is "Wishlist"; fixed dialog scroll for long content
- **Price display on wishlisted kits**: KitCard info line shows price after status label (e.g., "Wishlist · $29.99 · Tamiya · 1/350")
- **Price display on wishlisted accessories**: AccessoryRow info line shows price after brand
- **Price display on wishlisted paints**: PaintRow shows price after type; PaintDetailPanel shows price/currency below status toggle

## [0.1.3] — 2026-03-01 — Phase 1B-2: Project Tags on Paints

### Added
- **Project tags on paints**: Link paints to projects via `palette_entries` table — lightweight tagging that evolves into rich palette slots in Phase 6
- **Project tag pills on PaintRow**: Shows up to 2 project names with "+N" overflow
- **Project count badge on PaintSwatchCard**: Small accent badge on grid view cards
- **Projects section in PaintDetailPanel**: Lists linked project names or "None"
- **Project multi-select in EditPaintDialog**: Toggle pills to assign/unassign projects
- **Group by Project**: Paint shelf can now group paints by project, with "Unassigned" group for unlinked paints; paints in multiple projects appear in each group
- **Palette entries backend**: `list_paint_project_mappings` and `set_paint_projects` Tauri commands with deduplication and sync logic

## [0.1.2] — 2026-03-01 — Phase 1B-2: Paints & Catalogue

### Added
- **Paint CRUD**: Full create, read, update, delete for paints with brand, name, type, finish, hex color, color family, and status (owned/wishlist)
- **Paint queries & commands**: Rust backend with `list_all`, `get_by_id`, `insert`, `update`, `delete`
- **Paint catalogue**: Bundled reference data (2,598 paints) from Arcturus5404/miniature-paints (MIT) — Tamiya, Vallejo (Model Color, Model Air, Game Color), Mr. Hobby (Mr. Color, Aqueous Hobby Color), AK Interactive, Ammo by Mig Jimenez
- **Color family utility**: Auto-assignment from hex via HSL analysis (reds & oranges, yellows, greens, blues, purples, browns, greys, whites, blacks)
- **PaintsTab**: Main container with grouped sections, search filter, and conditional detail panel
- **PaintRow**: List view with 18px swatch, name, code (monospace), brand, type, and inline owned/wishlist status toggle
- **PaintSwatchCard**: Grid view with 64px swatch cards (36px color block + name + code)
- **PaintGroupSection**: Collapsible groups with chevron toggle, count, mini swatch previews when collapsed
- **PaintDetailPanel**: 200px right sidebar with large swatch, full info, auto-save notes, and edit button
- **PaintsToolbar**: Group by (Color Family / Brand / Project-disabled), search input, list/grid view toggle
- **AddPaintDialog**: Catalogue search mode (autoFocus, brand filter pills, quick-add from results) + manual entry mode (brand, name, type, code, finish, hex + live preview, notes, wishlist fields)
- **EditPaintDialog**: Pre-populated edit form with color family override dropdown and AlertDialog delete confirmation
- **Paint count in EntitySwitcher**: Live count from store
- **loadPaints in AppShell**: Paint data initialized on app mount

## [0.1.1] — 2026-03-01 — Phase 1B-1: Accessories

### Added
- **Accessory CRUD**: Full create, read, update, delete for accessories (PE, Resin/3D, Decals, Other)
- **Accessory queries & commands**: Rust backend with `list_all`, `list_by_kit`, `get_by_id`, `insert`, `update`, `delete`; LEFT JOIN for parent kit name
- **AccessoryRow component**: Color-coded type bar, type label, linked parent kit name, brand, and popover-based owned/wishlist status toggle
- **AccessoriesTab**: Flat list view with empty-state CTA
- **AddAccessoryDialog**: Name, type pill selector, status toggle, manufacturer, brand, reference code, searchable parent kit picker, notes, and conditional wishlist fields (price, currency, buy URL)
- **EditAccessoryDialog**: Pre-populated edit form with AlertDialog delete confirmation
- **Expandable kit cards**: Click-to-expand tray replacing click-to-edit; tray shows kit details, "Edit Kit" button, linked accessories with inline status toggles, and "Add Accessory" button with kit pre-linked
- **Entity-aware Add button**: AppShell "Add" button dispatches correct dialog based on active entity tab (Kits / Accessories / Paints)
- **Accessory count in EntitySwitcher**: Live count from store

### Changed
- **KitCard**: Outer element changed from `<button>` to `<div>` with clickable header; expand/collapse replaces direct edit-dialog open
- **KitsTab**: Props updated from `onKitClick` to `onEditKit` + `onAddAccessoryForKit`
- **AppShell**: Loads accessories on init; Add button is entity-tab-aware
- **Collection route**: Wired AccessoriesTab, AddAccessoryDialog, EditAccessoryDialog, and kit-tray callbacks

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
