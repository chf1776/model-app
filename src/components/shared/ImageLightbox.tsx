import { useEffect, useCallback, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";

export interface LightboxImage {
  src: string;
  alt?: string;
  caption?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
  title?: string;
  actions?: ReactNode;
}

export function ImageLightbox({
  images,
  index,
  open,
  onOpenChange,
  onIndexChange,
  title = "Image preview",
  actions,
}: ImageLightboxProps) {
  const count = images.length;
  const canPrev = index > 0;
  const canNext = index < count - 1;
  const current = images[index];

  const goPrev = useCallback(() => {
    if (canPrev) onIndexChange(index - 1);
  }, [canPrev, index, onIndexChange]);

  const goNext = useCallback(() => {
    if (canNext) onIndexChange(index + 1);
  }, [canNext, index, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onOpenChange(false);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.key === "ArrowLeft") goPrev();
        else goNext();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, goPrev, goNext, onOpenChange]);

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/70" />
        <div
          className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center"
          onClick={() => onOpenChange(false)}
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>

          {/* Main area */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Left arrow */}
            {count > 1 && (
              <button
                onClick={goPrev}
                disabled={!canPrev}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 disabled:invisible"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Image */}
            <img
              src={current.src}
              alt={current.alt ?? ""}
              className="max-h-[80vh] max-w-[85vw] object-contain"
            />

            {/* Right arrow */}
            {count > 1 && (
              <button
                onClick={goNext}
                disabled={!canNext}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 disabled:invisible"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Bottom section */}
          <div
            className="mt-3 flex flex-col items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {current.caption && (
              <p className="text-sm text-white/80">{current.caption}</p>
            )}
            {count > 1 && (
              <span className="text-xs text-white/50">
                {index + 1} of {count}
              </span>
            )}
            {actions}
            {/* Thumbnail strip */}
            {count > 1 && (
              <div className="mt-1 flex max-w-[85vw] gap-1.5 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => onIndexChange(i)}
                    className={`h-10 w-10 shrink-0 overflow-hidden rounded ${
                      i === index ? "ring-2 ring-white" : "opacity-60 hover:opacity-90"
                    }`}
                  >
                    <img
                      src={img.src}
                      alt={img.alt ?? ""}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
