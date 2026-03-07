import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useAppStore } from "@/store";

/** Navigate to the Build zone with a specific step active. */
export function useNavigateToStep() {
  const setActiveStep = useAppStore((s) => s.setActiveStep);
  const setActiveZone = useAppStore((s) => s.setActiveZone);
  const navigate = useNavigate();

  return useCallback(
    (stepId: string) => {
      setActiveStep(stepId);
      setActiveZone("build");
      navigate("/build");
    },
    [setActiveStep, setActiveZone, navigate],
  );
}
