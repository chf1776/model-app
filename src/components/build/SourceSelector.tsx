import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InstructionSource } from "@/shared/types";

interface SourceSelectorProps {
  sources: InstructionSource[];
  currentSourceId: string | null;
  onSelect: (sourceId: string) => void;
}

export function SourceSelector({
  sources,
  currentSourceId,
  onSelect,
}: SourceSelectorProps) {
  if (sources.length <= 1) return null;

  return (
    <Select value={currentSourceId ?? ""} onValueChange={onSelect}>
      <SelectTrigger className="h-6 w-auto min-w-[120px] gap-1.5 border-none bg-transparent px-1.5 text-xs font-medium text-text-primary shadow-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sources.map((s) => (
          <SelectItem key={s.id} value={s.id} className="text-xs">
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
