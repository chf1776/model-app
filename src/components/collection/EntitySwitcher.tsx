import { useAppStore } from "@/store";
import { SegmentedPill } from "@/components/shared/SegmentedPill";

type EntityTab = "kits" | "accessories" | "paints";

export function EntitySwitcher() {
  const activeTab = useAppStore((s) => s.activeEntityTab);
  const setActiveTab = useAppStore((s) => s.setActiveEntityTab);
  const kits = useAppStore((s) => s.kits);
  const accessories = useAppStore((s) => s.accessories);
  const paints = useAppStore((s) => s.paints);

  const items: { value: EntityTab; label: string; count: number }[] = [
    { value: "kits", label: "Kits", count: kits.length },
    { value: "accessories", label: "Accessories", count: accessories.length },
    { value: "paints", label: "Paints", count: paints.length },
  ];

  return (
    <SegmentedPill
      items={items}
      value={activeTab}
      onChange={setActiveTab}
      size="sm"
    />
  );
}
