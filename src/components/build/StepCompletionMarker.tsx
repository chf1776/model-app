import { Check } from "lucide-react";

interface StepCompletionMarkerProps {
  completed: boolean;
  onClick: () => void;
}

export function StepCompletionMarker({
  completed,
  onClick,
}: StepCompletionMarkerProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full transition-colors ${
        completed
          ? "bg-accent"
          : "border-[1.5px] border-border hover:border-accent/50"
      }`}
    >
      {completed && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
    </button>
  );
}
