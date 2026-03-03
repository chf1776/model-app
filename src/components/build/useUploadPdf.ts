import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import * as api from "@/api";

export function useUploadPdf() {
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const setIsProcessingPdf = useAppStore((s) => s.setIsProcessingPdf);
  const addInstructionSource = useAppStore((s) => s.addInstructionSource);
  const setCurrentSource = useAppStore((s) => s.setCurrentSource);

  return async () => {
    if (!activeProjectId) return;

    const selected = await openFileDialog({
      multiple: false,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });

    if (!selected) return;

    setIsProcessingPdf(true);
    try {
      const source = await api.uploadInstructionPdf(activeProjectId, selected);
      addInstructionSource(source);
      setCurrentSource(source.id);
      toast.success(`Imported "${source.name}" (${source.page_count} pages)`);
    } catch (err) {
      toast.error(`Failed to import PDF: ${err}`);
    } finally {
      setIsProcessingPdf(false);
    }
  };
}
