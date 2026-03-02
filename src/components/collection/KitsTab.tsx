import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useAppStore } from "@/store";
import { KitCard } from "./KitCard";
import { cn } from "@/lib/utils";
import type { Kit, KitStatus } from "@/shared/types";

interface SectionConfig {
  status: KitStatus;
  label: string;
  defaultExpanded: boolean;
}

const SECTIONS: SectionConfig[] = [
  { status: "building", label: "Building", defaultExpanded: true },
  { status: "shelf", label: "On Shelf", defaultExpanded: true },
  { status: "wishlist", label: "Wishlist", defaultExpanded: true },
  { status: "completed", label: "Completed", defaultExpanded: false },
];

interface KitsSectionProps {
  section: SectionConfig;
  kits: Kit[];
  onEditKit: (kit: Kit) => void;
  onAddAccessoryForKit: (kitId: string) => void;
  onStartProject?: (kit: Kit) => void;
}

function KitsSection({
  section,
  kits,
  onEditKit,
  onAddAccessoryForKit,
  onStartProject,
}: KitsSectionProps) {
  const [expanded, setExpanded] = useState(section.defaultExpanded);

  if (kits.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 py-1.5"
      >
        <ChevronRight
          className={cn(
            "h-2.5 w-2.5 text-text-tertiary transition-transform",
            expanded && "rotate-90",
          )}
        />
        <span className="text-xs font-semibold text-text-primary">
          {section.label}
        </span>
        <span className="text-[10px] text-text-tertiary">{kits.length}</span>
        <div className="ml-1 h-px flex-1 bg-border" />
      </button>
      {expanded && (
        <div className="flex flex-col gap-1 px-4 py-1">
          {kits.map((kit) => (
            <KitCard
              key={kit.id}
              kit={kit}
              onEditKit={onEditKit}
              onAddAccessoryForKit={onAddAccessoryForKit}
              onStartProject={onStartProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface KitsTabProps {
  onEditKit: (kit: Kit) => void;
  onAddAccessoryForKit: (kitId: string) => void;
  onStartProject?: (kit: Kit) => void;
}

export function KitsTab({
  onEditKit,
  onAddAccessoryForKit,
  onStartProject,
}: KitsTabProps) {
  const kits = useAppStore((s) => s.kits);
  const statusFilter = useAppStore((s) => s.statusFilter);

  const filteredKits = useMemo(() => {
    if (statusFilter === "all") return kits;
    return kits.filter((k) => k.status === statusFilter);
  }, [kits, statusFilter]);

  const kitsByStatus = useMemo(() => {
    const grouped: Record<KitStatus, Kit[]> = {
      building: [],
      shelf: [],
      wishlist: [],
      completed: [],
      paused: [],
    };
    for (const kit of filteredKits) {
      grouped[kit.status].push(kit);
    }
    // Merge paused into building for display
    grouped.building.push(...grouped.paused);
    return grouped;
  }, [filteredKits]);

  // When filtering by a specific status, show a flat list
  if (statusFilter !== "all") {
    return (
      <div className="flex flex-col gap-1 px-4 py-2">
        {filteredKits.map((kit) => (
          <KitCard
            key={kit.id}
            kit={kit}
            onEditKit={onEditKit}
            onAddAccessoryForKit={onAddAccessoryForKit}
            onStartProject={onStartProject}
          />
        ))}
        {filteredKits.length === 0 && (
          <p className="py-8 text-center text-xs text-text-tertiary">
            No kits with this status
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="pb-4">
      {SECTIONS.map((section) => (
        <KitsSection
          key={section.status}
          section={section}
          kits={kitsByStatus[section.status]}
          onEditKit={onEditKit}
          onAddAccessoryForKit={onAddAccessoryForKit}
          onStartProject={onStartProject}
        />
      ))}
    </div>
  );
}
