import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyInstructionsStateProps {
  onUpload: () => void;
}

export function EmptyInstructionsState({ onUpload }: EmptyInstructionsStateProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <FileText className="h-6 w-6 text-accent" />
        </div>
        <h2 className="mb-1 text-sm font-semibold text-text-primary">
          No Instructions Yet
        </h2>
        <p className="mb-4 max-w-[260px] text-xs text-text-tertiary">
          Upload a PDF of your kit instructions to start setting up your build.
        </p>
        <Button
          size="sm"
          onClick={onUpload}
          className="gap-1.5 bg-accent text-xs text-white hover:bg-accent-hover"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload PDF
        </Button>
      </div>
    </div>
  );
}
