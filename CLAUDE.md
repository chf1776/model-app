# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Model Builder's Assistant — a Tauri v2 desktop app for scale model builders. React 19 frontend + Rust backend, SQLite database, canvas-based PDF viewer with annotation tools.

## Commands

```bash
npm run tauri dev          # Launch full app in dev mode (Vite HMR + Rust backend)
npm run dev                # Frontend only (Vite dev server on port 1420)
npm run build              # Build frontend (tsc -b && vite build)
npm run tauri build        # Production bundle
tsc -b                     # Type-check only
```

No test suite or linter configured. TypeScript strict mode is enforced (`noUnusedLocals`, `noUnusedParameters`).

Rust backend requires CMake (mupdf builds from C source).

## Architecture

**Data flow:** React component → Zustand action → `src/api/index.ts` invoke wrapper → Tauri IPC → Rust command handler → rusqlite query → response back up the chain.

**Frontend (`src/`):**
- `api/index.ts` — All Tauri invoke wrappers (typed, ~660 lines). Every backend call goes through here.
- `store/` — Zustand slices combined in `index.ts`. `build-slice.ts` is the largest (~1000 lines). Actions handle both state updates and API calls.
- `shared/types.ts` — All TypeScript interfaces (~150+), must stay aligned with Rust models.
- `routes/` — Four pages: `collection.tsx`, `build.tsx`, `overview.tsx`, `settings.tsx`
- `components/ui/` — shadcn/ui primitives (New York style). `components.json` configures shadcn CLI.
- `index.css` — Tailwind v4 `@theme` block defines all design tokens

**Backend (`src-tauri/src/`):**
- `lib.rs` — Tauri setup, all command registrations in `invoke_handler`
- `models.rs` — Serde structs for all entities (must stay aligned with TS types)
- `commands/` — One module per domain (collection, steps, tracks, etc.)
- `db/queries/` — One module per table, pure SQL via rusqlite
- `db/mod.rs` — `AppDb` struct wraps `Mutex<Connection>`, runs migrations on init
- `services/` — PDF rasterization (mupdf), file stash management
- `migrations/` — Refinery SQL files (V1–V7), auto-run on startup via `embed_migrations!`

## Key Patterns

**Adding a new feature end-to-end:**
1. Migration in `src-tauri/migrations/V<N>__name.sql`
2. Query functions in `src-tauri/src/db/queries/<domain>.rs`
3. Rust models in `src-tauri/src/models.rs`
4. Command handler in `src-tauri/src/commands/<domain>.rs`
5. Register command in `lib.rs` invoke_handler
6. TypeScript types in `src/shared/types.ts`
7. API wrapper in `src/api/index.ts`
8. Zustand action in the relevant store slice
9. React component

**Nullable fields in Rust:** Use `Option<Option<T>>` with custom `deserialize_optional_nullable` to distinguish "not sent" (`None`) from "explicitly null" (`Some(None)`).

**Styling:** Always use Tailwind design token classes (`text-accent`, `bg-success`) — never hardcode hex values. Theming is dynamic (7 built-in themes + dark mode via `dark:` variant).

**Tailwind v4 JIT caveat:** Dynamic class interpolation like `` h-[${SIZE}px] `` won't work. Use static values.

**Crop coordinates:** Stored in image-space (pre-rotation). Converted to effective-space for rendering.

**File stash:** All user images copied to `{appDataDir}/model-builder/stash/` with prefix+UUID filenames (`prog_`, `mile_`, `ref_`, `acc_`, `gal_`).

**Path alias:** `@/*` maps to `./src/*` (configured in both tsconfig.json and vite.config.ts).

## Versioning

Phase-based: Phase N = v0.N.x. Version synced across `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`. Currently v0.5.1.
