import { Loader2 } from "lucide-react";

export function ProcessingOverlay() {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">
            Processing PDF
          </p>
          <p className="text-xs text-text-tertiary">
            Rendering pages...
          </p>
        </div>
      </div>
    </div>
  );
}
