import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Package, ChevronDown, Check } from "lucide-react";
import type { Kit } from "@/shared/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store";
import * as api from "@/api";
import { cn } from "@/lib/utils";
import {
  COMMON_SCALES,
  KIT_CATEGORIES,
  type KitCategory,
} from "@/shared/types";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedKit?: Kit;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  preselectedKit,
}: CreateProjectDialogProps) {
  const navigate = useNavigate();
  const kits = useAppStore((s) => s.kits);
  const loadKits = useAppStore((s) => s.loadKits);
  const loadProjects = useAppStore((s) => s.loadProjects);
  const setActiveProject = useAppStore((s) => s.setActiveProject);
  const setActiveZone = useAppStore((s) => s.setActiveZone);
  const setIsProcessingPdf = useAppStore((s) => s.setIsProcessingPdf);

  const [projectName, setProjectName] = useState("");
  const [kitMode, setKitMode] = useState<"shelf" | "new">("shelf");
  const [selectedKitId, setSelectedKitId] = useState("");
  const [kitSearch, setKitSearch] = useState("");
  const [newKitName, setNewKitName] = useState("");
  const [newKitManufacturer, setNewKitManufacturer] = useState("");
  const [newKitScale, setNewKitScale] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [category, setCategory] = useState<KitCategory | "">("");
  const [scalematesUrl, setScalematesUrl] = useState("");
  const [productCode, setProductCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // When a preselected kit is provided, auto-populate
  useEffect(() => {
    if (preselectedKit && open) {
      setKitMode("shelf");
      setSelectedKitId(preselectedKit.id);
      setProjectName(preselectedKit.name);
    }
  }, [preselectedKit, open]);

  const shelfKits = useMemo(
    () => kits.filter((k) => k.status === "shelf"),
    [kits],
  );

  const filteredShelfKits = useMemo(() => {
    if (!kitSearch.trim()) return shelfKits;
    const q = kitSearch.toLowerCase();
    return shelfKits.filter(
      (k) =>
        k.name.toLowerCase().includes(q) ||
        k.manufacturer?.toLowerCase().includes(q),
    );
  }, [shelfKits, kitSearch]);

  const selectedKit = kits.find((k) => k.id === selectedKitId);
  const displayScale =
    kitMode === "shelf" ? selectedKit?.scale ?? "" : newKitScale;

  const canSubmit =
    projectName.trim() &&
    (kitMode === "shelf" ? selectedKitId : newKitName.trim());

  const reset = () => {
    setProjectName("");
    setKitMode("shelf");
    setSelectedKitId("");
    setKitSearch("");
    setNewKitName("");
    setNewKitManufacturer("");
    setNewKitScale("");
    setShowOptional(false);
    setCategory("");
    setScalematesUrl("");
    setProductCode("");
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    // Show processing overlay early — navigate to build zone before the
    // potentially slow createProject call so the user sees progress
    const kitHasPdfs = kitMode === "shelf" && selectedKitId;
    if (kitHasPdfs) {
      setIsProcessingPdf(true);
      setActiveZone("build");
      navigate("/build");
      onOpenChange(false);
    }

    try {
      const project = await api.createProject({
        name: projectName.trim(),
        kit_id: kitMode === "shelf" ? selectedKitId : null,
        new_kit_name: kitMode === "new" ? newKitName.trim() : null,
        new_kit_manufacturer:
          kitMode === "new" ? newKitManufacturer.trim() || null : null,
        new_kit_scale: kitMode === "new" ? newKitScale || null : null,
        category: (category as KitCategory) || null,
        scalemates_url: scalematesUrl.trim() || null,
        product_code: productCode.trim() || null,
      });

      await loadKits();
      await loadProjects();
      await setActiveProject(project.id);

      if (!kitHasPdfs) {
        setActiveZone("build");
        navigate("/build");
        onOpenChange(false);
      }

      toast.success(`Project "${project.name}" created`);
      reset();
    } catch (err) {
      toast.error(`Failed to create project: ${err}`);
    } finally {
      setSubmitting(false);
      setIsProcessingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-[420px] flex-col border-border bg-card p-4 shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-bold">
            <Package className="h-4 w-4 text-accent" />
            Create Project
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 py-2">
          {/* Project name */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">
              Project Name <span className="text-error">*</span>
            </Label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Yamato 1945 Final Fit"
              className="h-8 text-xs"
              autoFocus
            />
          </div>

          {/* Kit selection tabs */}
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-medium">
              Kit <span className="text-error">*</span>
            </Label>
            {!preselectedKit && (
              <div className="flex gap-1 rounded-md bg-muted p-[3px]">
                <button
                  onClick={() => setKitMode("shelf")}
                  className={cn(
                    "flex-1 rounded-[5px] py-[3px] text-[10px] transition-colors",
                    kitMode === "shelf"
                      ? "bg-card font-semibold text-accent shadow-sm"
                      : "text-text-tertiary",
                  )}
                >
                  From Shelf
                </button>
                <button
                  onClick={() => setKitMode("new")}
                  className={cn(
                    "flex-1 rounded-[5px] py-[3px] text-[10px] transition-colors",
                    kitMode === "new"
                      ? "bg-card font-semibold text-accent shadow-sm"
                      : "text-text-tertiary",
                  )}
                >
                  Add New Kit
                </button>
              </div>
            )}

            {kitMode === "shelf" ? (
              preselectedKit ? (
                <div className="mt-1 flex items-center gap-2 rounded-md border border-accent/30 bg-accent/5 px-2 py-1.5">
                  <div className="flex h-6 w-8 shrink-0 items-center justify-center rounded bg-muted">
                    <div className="h-full w-full rounded bg-gradient-to-br from-accent/10 to-accent/5" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[10px] font-medium">
                      {preselectedKit.name}
                    </span>
                    <span className="text-[9px] text-text-tertiary">
                      {[preselectedKit.manufacturer, preselectedKit.scale]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <Check className="h-3 w-3 text-accent" />
                </div>
              ) : (
              <div className="mt-1 flex flex-col gap-1">
                <Input
                  value={kitSearch}
                  onChange={(e) => setKitSearch(e.target.value)}
                  placeholder="Search kits..."
                  className="h-7 text-[10px]"
                />
                <div className="max-h-[130px] overflow-y-auto rounded-md border border-border">
                  {filteredShelfKits.length === 0 ? (
                    <p className="px-2 py-3 text-center text-[10px] text-text-tertiary">
                      {shelfKits.length === 0
                        ? "No kits on shelf"
                        : "No matches"}
                    </p>
                  ) : (
                    filteredShelfKits.map((kit) => (
                      <button
                        key={kit.id}
                        onClick={() => setSelectedKitId(kit.id)}
                        className={cn(
                          "flex w-full items-center gap-2 border-b border-border px-2 py-1.5 text-left last:border-0",
                          selectedKitId === kit.id
                            ? "border-accent/30 bg-accent/5"
                            : "hover:bg-muted",
                        )}
                      >
                        <div className="flex h-6 w-8 shrink-0 items-center justify-center rounded bg-muted">
                          <div className="h-full w-full rounded bg-gradient-to-br from-accent/10 to-accent/5" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[10px] font-medium">
                            {kit.name}
                          </span>
                          <span className="text-[9px] text-text-tertiary">
                            {[kit.manufacturer, kit.scale]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </div>
                        {selectedKitId === kit.id && (
                          <Check className="h-3 w-3 text-accent" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
              )
            ) : (
              <div className="mt-1 flex flex-col gap-2">
                <Input
                  value={newKitName}
                  onChange={(e) => setNewKitName(e.target.value)}
                  placeholder="Kit name"
                  className="h-7 text-[10px]"
                />
                <Input
                  value={newKitManufacturer}
                  onChange={(e) => setNewKitManufacturer(e.target.value)}
                  placeholder="Manufacturer"
                  className="h-7 text-[10px]"
                />
                <div className="flex flex-wrap gap-1">
                  {COMMON_SCALES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setNewKitScale(newKitScale === s ? "" : s)
                      }
                      className={cn(
                        "rounded-[10px] px-2 py-[2px] text-[10px] transition-colors",
                        newKitScale === s
                          ? "bg-accent font-semibold text-white"
                          : "bg-muted text-text-tertiary",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scale (read-only when from shelf) */}
          {displayScale && (
            <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
              <span>Scale:</span>
              <span className="font-medium text-text-secondary">
                {displayScale}
              </span>
            </div>
          )}

          {/* Optional fields toggle */}
          <button
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center gap-1 text-[10px] font-medium text-text-tertiary hover:text-text-secondary"
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                showOptional && "rotate-180",
              )}
            />
            More details (optional)
          </button>

          {showOptional && (
            <div className="flex flex-col gap-2 pl-1">
              {/* Category */}
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] text-text-tertiary">
                  Category
                </Label>
                <div className="flex flex-wrap gap-1">
                  {KIT_CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() =>
                        setCategory(category === c.value ? "" : c.value)
                      }
                      className={cn(
                        "rounded-[10px] px-2 py-[2px] text-[10px] transition-colors",
                        category === c.value
                          ? "bg-accent font-semibold text-white"
                          : "bg-muted text-text-tertiary",
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scalemates URL */}
              <div className="flex flex-col gap-0.5">
                <Label className="text-[10px] text-text-tertiary">
                  Scalemates URL
                </Label>
                <Input
                  value={scalematesUrl}
                  onChange={(e) => setScalematesUrl(e.target.value)}
                  placeholder="https://www.scalemates.com/kits/..."
                  className="h-7 text-[10px]"
                />
              </div>

              {/* Product code */}
              <div className="flex flex-col gap-0.5">
                <Label className="text-[10px] text-text-tertiary">
                  Product Code
                </Label>
                <Input
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  placeholder="e.g. #78030"
                  className="h-7 w-[140px] text-[10px]"
                />
              </div>
            </div>
          )}
        </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="gap-1.5 bg-accent text-xs text-white hover:bg-accent-hover"
          >
            <Package className="h-3 w-3" />
            {submitting ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
