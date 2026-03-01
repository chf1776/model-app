import { Scissors, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeCardProps {
  onAddKit: () => void;
}

export function WelcomeCard({ onAddKit }: WelcomeCardProps) {
  return (
    <div className="flex h-full items-center justify-center px-4 py-12">
      <div className="flex max-w-md flex-col items-center text-center">
        {/* Icon */}
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
          <Scissors className="h-8 w-8 text-accent" />
        </div>

        {/* Title + subtitle */}
        <h1 className="mb-2 text-xl font-bold text-text-primary">
          Welcome to Model Builder's Assistant
        </h1>
        <p className="mb-6 text-[13px] leading-relaxed text-text-secondary">
          Your personal workspace for managing scale model kits, tracking builds,
          and documenting your modelling journey.
        </p>

        {/* CTA */}
        <Button
          onClick={onAddKit}
          className="mb-8 gap-1.5 bg-accent text-sm font-semibold text-white hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Add Your First Kit
        </Button>

        {/* Getting started tips */}
        <div className="w-full rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-xs font-semibold text-text-primary">
            Getting Started
          </h3>
          <div className="flex flex-col gap-2.5">
            {[
              "Add kits from your collection or wishlist",
              "Create a project to start tracking a build",
              "Document progress with photos and notes",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
                  {i + 1}
                </div>
                <p className="text-[11px] leading-snug text-text-secondary">
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
