import { Check } from "lucide-react";

interface StepCompletionMarkerProps {
  completed: boolean;
  /** Progress fraction 0-1 for circular ring (sub-step or quantity progress) */
  progress?: number;
  onClick: () => void;
}

const SIZE = 18;
const STROKE = 1.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function StepCompletionMarker({
  completed,
  progress,
  onClick,
}: StepCompletionMarkerProps) {
  const hasProgress = progress !== undefined && progress > 0;
  const isFull = progress !== undefined && progress >= 1;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${
        completed
          ? "bg-accent"
          : hasProgress
            ? "border-transparent"
            : "border-[1.5px] border-border hover:border-accent/50"
      }`}
    >
      {/* Progress ring SVG (behind the circle) */}
      {!completed && hasProgress && (
        <svg
          className="absolute inset-0"
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
        >
          {/* Background ring */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-border"
          />
          {/* Progress arc */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            className={isFull ? "text-success" : "text-accent"}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
      )}
      {completed && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
    </div>
  );
}
