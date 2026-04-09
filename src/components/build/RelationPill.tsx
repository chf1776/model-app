import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/store";
import { parseStepRelations } from "./tree-utils";

export function RelationPill() {
  const activeStepId = useAppStore((s) => s.activeStepId);
  const steps = useAppStore((s) => s.steps);
  const stepContexts = useAppStore((s) => s.stepContexts);
  const setActiveStep = useAppStore((s) => s.setActiveStep);

  const [visible, setVisible] = useState(false);

  const relations = activeStepId ? stepContexts[activeStepId]?.relations ?? [] : [];
  const blockedByIds = useMemo(
    () => activeStepId ? parseStepRelations(relations, activeStepId).blockedByIds : [],
    [relations, activeStepId],
  );

  // Show pill when step changes and has blocked_by relations, auto-dismiss after 5s
  useEffect(() => {
    if (blockedByIds.length > 0) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [activeStepId, blockedByIds.length]);

  if (!visible || blockedByIds.length === 0) return null;

  const firstBlocker = steps.find((s) => s.id === blockedByIds[0]);
  const label =
    blockedByIds.length === 1
      ? `Blocked by ${firstBlocker?.title ?? "unknown"}`
      : `Blocked by ${blockedByIds.length} steps`;

  const handleClick = () => {
    if (blockedByIds[0]) {
      setActiveStep(blockedByIds[0]);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="absolute top-2 left-1/2 z-10 -translate-x-1/2 cursor-pointer rounded-full bg-amber-500/90 px-3 py-1 text-xs font-medium text-white shadow-md transition-opacity hover:bg-amber-600/90"
    >
      {label}
    </button>
  );
}
