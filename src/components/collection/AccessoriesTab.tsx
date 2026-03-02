import { Plus } from "lucide-react";
import { useAppStore } from "@/store";
import { AccessoryRow } from "./AccessoryRow";
import { Button } from "@/components/ui/button";
import type { Accessory } from "@/shared/types";

interface AccessoriesTabProps {
  onEdit: (accessory: Accessory) => void;
  onAdd: () => void;
}

export function AccessoriesTab({ onEdit, onAdd }: AccessoriesTabProps) {
  const accessories = useAppStore((s) => s.accessories);

  if (accessories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="text-sm text-text-tertiary">
          No accessories yet
        </p>
        <Button
          size="sm"
          className="gap-1.5 bg-accent text-xs text-white hover:bg-accent-hover"
          onClick={onAdd}
        >
          <Plus className="h-3 w-3" />
          Add your first accessory
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-4 py-2">
      {accessories.map((a) => (
        <AccessoryRow key={a.id} accessory={a} onEdit={onEdit} />
      ))}
    </div>
  );
}
