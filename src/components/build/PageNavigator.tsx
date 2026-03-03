import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store";
import { SourceSelector } from "./SourceSelector";

export function PageNavigator() {
  const instructionSources = useAppStore((s) => s.instructionSources);
  const currentSourceId = useAppStore((s) => s.currentSourceId);
  const currentSourcePages = useAppStore((s) => s.currentSourcePages);
  const currentPageIndex = useAppStore((s) => s.currentPageIndex);
  const setCurrentSource = useAppStore((s) => s.setCurrentSource);
  const nextPage = useAppStore((s) => s.nextPage);
  const prevPage = useAppStore((s) => s.prevPage);

  const totalPages = currentSourcePages.length;
  if (totalPages === 0) return null;

  const currentSource = instructionSources.find((s) => s.id === currentSourceId);

  return (
    <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
      <div className="flex items-center gap-1.5 rounded-md border border-border bg-white/88 px-2 py-1 opacity-60 shadow-sm backdrop-blur-[8px] transition-opacity duration-150 hover:opacity-100">
        {/* Source selector (only if multiple) */}
        {instructionSources.length > 1 ? (
          <SourceSelector
            sources={instructionSources}
            currentSourceId={currentSourceId}
            onSelect={setCurrentSource}
          />
        ) : (
          currentSource && (
            <span className="max-w-[140px] truncate px-1 text-xs font-medium text-text-primary">
              {currentSource.name}
            </span>
          )
        )}

        <div className="mx-1 h-3 w-px bg-border" />

        {/* Page navigation */}
        <button
          onClick={prevPage}
          disabled={currentPageIndex === 0}
          className="rounded p-0.5 text-text-secondary hover:bg-muted disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <span className="min-w-[48px] text-center font-mono text-xs tabular-nums text-text-secondary">
          {currentPageIndex + 1} / {totalPages}
        </span>

        <button
          onClick={nextPage}
          disabled={currentPageIndex === totalPages - 1}
          className="rounded p-0.5 text-text-secondary hover:bg-muted disabled:opacity-30"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
