import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-text-secondary">
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, label }: { keys: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-text-secondary">{label}</span>
      <div className="flex items-center gap-1">{keys}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

const modKey = navigator.platform.includes("Mac") ? "\u2318" : "Ctrl";

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Section title="Canvas">
            <ShortcutRow keys={<Kbd>V</Kbd>} label="View mode" />
            <ShortcutRow keys={<Kbd>C</Kbd>} label="Crop mode" />
            <ShortcutRow keys={<Kbd>F</Kbd>} label="Full page step" />
            <ShortcutRow keys={<><Kbd>+</Kbd> / <Kbd>-</Kbd></>} label="Zoom in / out" />
            <ShortcutRow keys={<Kbd>0</Kbd>} label="Fit to view" />
            <ShortcutRow keys={<Kbd>R</Kbd>} label="Rotate page" />
          </Section>

          <Section title="Navigation">
            <ShortcutRow keys={<><Kbd>←</Kbd> / <Kbd>→</Kbd></>} label="Previous / next page" />
            <ShortcutRow keys={<><Kbd>Tab</Kbd> / <Kbd>Shift</Kbd> <Kbd>Tab</Kbd></>} label="Previous / next page" />
            <ShortcutRow keys={<Kbd>Esc</Kbd>} label="Deselect / exit mode" />
          </Section>

          <Section title="Building Mode">
            <ShortcutRow keys={<><Kbd>Space</Kbd> / <Kbd>Enter</Kbd></>} label="Complete step" />
            <ShortcutRow keys={<><Kbd>↑</Kbd> / <Kbd>↓</Kbd></>} label="Previous / next step" />
            <ShortcutRow keys={<Kbd>T</Kbd>} label="Start drying timer" />
            <ShortcutRow keys={<Kbd>A</Kbd>} label="Deselect annotation tool" />
            <ShortcutRow keys={<><Kbd>1</Kbd>-<Kbd>7</Kbd></>} label="Select annotation tool" />
            <ShortcutRow keys={<Kbd>Del</Kbd>} label="Delete selected annotation" />
            <ShortcutRow keys={<Kbd>Esc</Kbd>} label="Cancel mid-draw" />
          </Section>

          <Section title="Editing">
            <ShortcutRow keys={<><Kbd>{modKey}</Kbd> <Kbd>Z</Kbd></>} label="Undo (crop or annotation)" />
            <ShortcutRow keys={<><Kbd>{modKey}</Kbd> <Kbd>⇧</Kbd> <Kbd>Z</Kbd></>} label="Redo annotation" />
            <ShortcutRow keys={<><Kbd>{modKey}</Kbd> click</>} label="Multi-select steps" />
            <ShortcutRow keys={<Kbd>?</Kbd>} label="Show shortcuts" />
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
