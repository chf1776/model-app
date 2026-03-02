import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store";
import { EntitySwitcher } from "@/components/collection/EntitySwitcher";
import { StatusFilterChips } from "@/components/collection/StatusFilterChips";
import { KitsTab } from "@/components/collection/KitsTab";
import { AccessoriesTab } from "@/components/collection/AccessoriesTab";
import { WelcomeCard } from "@/components/collection/WelcomeCard";
import { AddKitDialog } from "@/components/shared/AddKitDialog";
import { EditKitDialog } from "@/components/shared/EditKitDialog";
import { AddAccessoryDialog } from "@/components/shared/AddAccessoryDialog";
import { EditAccessoryDialog } from "@/components/shared/EditAccessoryDialog";
import { CreateProjectDialog } from "@/components/shared/CreateProjectDialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Kit, Accessory } from "@/shared/types";

export default function CollectionRoute() {
  const kits = useAppStore((s) => s.kits);
  const activeEntityTab = useAppStore((s) => s.activeEntityTab);
  const loadAccessories = useAppStore((s) => s.loadAccessories);

  // Kit dialogs
  const [addKitDialogOpen, setAddKitDialogOpen] = useState(false);
  const [editKit, setEditKit] = useState<Kit | null>(null);
  const [startProjectKit, setStartProjectKit] = useState<Kit | null>(null);

  // Accessory dialogs
  const [addAccessoryDialogOpen, setAddAccessoryDialogOpen] = useState(false);
  const [editAccessory, setEditAccessory] = useState<Accessory | null>(null);
  const [addAccessoryForKitId, setAddAccessoryForKitId] = useState<
    string | null
  >(null);

  // Listen for add-kit-dialog event from AppShell
  useEffect(() => {
    const handler = () => setAddKitDialogOpen(true);
    window.addEventListener("open-add-kit-dialog", handler);
    return () => window.removeEventListener("open-add-kit-dialog", handler);
  }, []);

  // Listen for add-accessory-dialog event from AppShell
  useEffect(() => {
    const handler = () => setAddAccessoryDialogOpen(true);
    window.addEventListener("open-add-accessory-dialog", handler);
    return () =>
      window.removeEventListener("open-add-accessory-dialog", handler);
  }, []);

  const handleAddAccessoryForKit = useCallback((kitId: string) => {
    setAddAccessoryForKitId(kitId);
    setAddAccessoryDialogOpen(true);
  }, []);

  const handleAccessoryDialogClose = useCallback(
    (open: boolean) => {
      setAddAccessoryDialogOpen(open);
      if (!open) {
        // Notify kit cards to reload their accessories
        if (addAccessoryForKitId) {
          window.dispatchEvent(
            new CustomEvent("accessory-added-for-kit", {
              detail: { kitId: addAccessoryForKitId },
            }),
          );
        }
        setAddAccessoryForKitId(null);
        // Reload global accessories list
        loadAccessories();
      }
    },
    [addAccessoryForKitId, loadAccessories],
  );

  const handleEditAccessoryClose = useCallback(() => {
    setEditAccessory(null);
    loadAccessories();
  }, [loadAccessories]);

  const showWelcome = kits.length === 0 && activeEntityTab === "kits";

  return (
    <>
      {/* Context Bar */}
      <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-[5px]">
        <EntitySwitcher />
        {activeEntityTab === "kits" && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <StatusFilterChips />
          </>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100%-37px)]">
        {showWelcome ? (
          <WelcomeCard onAddKit={() => setAddKitDialogOpen(true)} />
        ) : activeEntityTab === "kits" ? (
          <KitsTab
            onEditKit={(kit) => setEditKit(kit)}
            onAddAccessoryForKit={handleAddAccessoryForKit}
            onStartProject={(kit) => setStartProjectKit(kit)}
          />
        ) : activeEntityTab === "accessories" ? (
          <AccessoriesTab
            onEdit={(a) => setEditAccessory(a)}
            onAdd={() => setAddAccessoryDialogOpen(true)}
          />
        ) : (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-text-tertiary">
              Paint shelf coming in Phase 1B
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Dialogs */}
      <AddKitDialog
        open={addKitDialogOpen}
        onOpenChange={setAddKitDialogOpen}
      />
      <EditKitDialog kit={editKit} onClose={() => setEditKit(null)} />
      <AddAccessoryDialog
        open={addAccessoryDialogOpen}
        onOpenChange={handleAccessoryDialogClose}
        preselectedKitId={addAccessoryForKitId}
      />
      <EditAccessoryDialog
        accessory={editAccessory}
        onClose={handleEditAccessoryClose}
      />
      <CreateProjectDialog
        open={!!startProjectKit}
        onOpenChange={(open) => {
          if (!open) setStartProjectKit(null);
        }}
        preselectedKit={startProjectKit ?? undefined}
      />
    </>
  );
}
