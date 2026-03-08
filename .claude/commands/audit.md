# Audit: Full Codebase Review

Review the entire codebase for reuse opportunities, quality issues, and efficiency problems. Fix any issues found.

## Phase 1: Map the Codebase

Run `find src -name "*.ts" -o -name "*.tsx" | head -80` and `find src-tauri/src -name "*.rs" | head -40` to get a file listing. Identify the key areas:
- Shared utilities and helpers (`src/shared/`, `src/components/ui/`, store slices)
- Component directories (`src/components/build/`, `src/components/shared/`, `src/routes/`)
- Backend modules (`src-tauri/src/commands/`, `src-tauri/src/db/queries/`)

## Phase 2: Launch Review Agents in Parallel

Use the Agent tool to launch all agents concurrently in a single message. Use `subagent_type: "general-purpose"` for all agents. Each agent should read the actual source files (not diffs) and search broadly.

### Agent 1: Code Reuse Review (PRIORITY)

This is the most important review. Systematically search for duplication across the codebase:

1. **Duplicated constants**: Use Grep to find repeated magic numbers, color values, size values, timing values, and string literals across files. Flag any value that appears in 3+ files without a shared constant.
2. **Duplicated logic patterns**: Search for similar function shapes across components — zoom/pan handlers, store subscription patterns, coordinate conversions, debounce patterns, file path construction, Konva event handlers. Flag any pattern repeated 3+ times that could be a shared utility.
3. **Duplicated components**: Compare structurally similar React components — look for near-identical JSX patterns, identical prop shapes, components that wrap the same library primitives (Konva shapes, shadcn components) with minor variations.
4. **Duplicated Rust patterns**: Compare query files in `src-tauri/src/db/queries/` for repeated SQL patterns, identical `map_row` shapes, and command files for repeated invoke patterns.
5. **Underused existing utilities**: Read `src/shared/types.ts`, `src/components/build/tree-utils.ts`, `src/components/build/zoom-utils.ts`, and any other utility files. Search for places that hand-roll logic these utilities already provide.

For each finding, cite the specific files and line numbers, and suggest the consolidation approach.

### Agent 2: Code Quality Review

Scan for structural quality issues across the codebase:

1. **Redundant state**: State that duplicates other state, derived values stored instead of computed, effects that could be direct calls
2. **Inconsistent patterns**: Mixed approaches to the same problem — some components using one pattern, others using a different one for the same task (e.g., mixed `getState()` vs subscribed selectors, mixed event handler styles)
3. **Type safety gaps**: `as` casts that could be eliminated, `any` types, overly broad types where discriminated unions exist, missing null checks
4. **Stale dependencies**: useCallback/useMemo/useEffect with incorrect or missing dependency arrays — read each hook and verify its deps match what the closure captures
5. **Dead code**: Unused imports, unreachable branches, exported functions with no consumers, commented-out code

### Agent 3: Efficiency Review

Scan for performance and resource issues:

1. **Render efficiency**: Components subscribing to broad store slices when they only need a narrow value, missing memoization on expensive computations, inline object/array literals in JSX props causing unnecessary re-renders
2. **Memory**: Unbounded data structures (caches, stacks, maps that grow without cleanup), event listener leaks, stale refs
3. **Hot paths**: Expensive work in render functions, repeated DOM measurements, N+1 patterns in data loading
4. **Bundle concerns**: Large imports that could be narrowed, components that could be lazy-loaded

## Phase 3: Fix Issues

Wait for all agents to complete. Aggregate findings, deduplicate overlapping reports, and prioritize:
1. **Fix** issues that are clearly bugs (stale closures, missing deps, type errors)
2. **Fix** duplication that can be consolidated with a simple extract-and-import
3. **Note but skip** findings that would require major refactoring — list them as future work
4. **Skip** false positives

Run `npx tsc --noEmit` after all fixes to verify nothing is broken.

When done, summarize: what was fixed, what was noted for future work, and confirm the codebase compiles clean.
