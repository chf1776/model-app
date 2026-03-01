import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { EntitySwitcher } from "@/components/collection/EntitySwitcher";
import { StatusFilterChips } from "@/components/collection/StatusFilterChips";
import { KitsTab } from "@/components/collection/KitsTab";
import { WelcomeCard } from "@/components/collection/WelcomeCard";
import { AddKitDialog } from "@/components/shared/AddKitDialog";
import { EditKitDialog } from "@/components/shared/EditKitDialog";
import { CreateProjectDialog } from "@/components/shared/CreateProjectDialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Kit } from "@/shared/types";

export default function CollectionRoute() {
  const kits = useAppStore((s) => s.kits);
  const activeEntityTab = useAppStore((s) => s.activeEntityTab);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editKit, setEditKit] = useState<Kit | null>(null);
  const [startProjectKit, setStartProjectKit] = useState<Kit | null>(null);

  // Listen for add-kit-dialog event from AppShell
  useEffect(() => {
    const handler = () => setAddDialogOpen(true);
    window.addEventListener("open-add-kit-dialog", handler);
    return () => window.removeEventListener("open-add-kit-dialog", handler);
  }, []);

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
          <WelcomeCard onAddKit={() => setAddDialogOpen(true)} />
        ) : activeEntityTab === "kits" ? (
          <KitsTab
            onKitClick={(kit) => setEditKit(kit)}
            onStartProject={(kit) => setStartProjectKit(kit)}
          />
        ) : activeEntityTab === "accessories" ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-text-tertiary">
              Accessories coming in Phase 1B
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-text-tertiary">
              Paint shelf coming in Phase 1B
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Dialogs */}
      <AddKitDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <EditKitDialog kit={editKit} onClose={() => setEditKit(null)} />
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
