import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ArrowLeft, FolderOpen, Plus, X, Download, Upload, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router";
import { appDataDir } from "@tauri-apps/api/path";
import { getVersion } from "@tauri-apps/api/app";
import { revealItemInDir, openPath } from "@tauri-apps/plugin-opener";
import { open, save } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import * as api from "@/api";
import {
  TRACK_COLORS,
  SETTINGS_DEFAULTS,
  getSettingBool,
  getSettingString,
  parseTrackColors,
  parseStepTags,
} from "@/shared/types";
import type { StorageStats, BackupDiff } from "@/shared/types";

type PdfDpi = "72" | "150" | "300";

const DPI_OPTIONS: { value: PdfDpi; label: string }[] = [
  { value: "72", label: "72 (Draft)" },
  { value: "150", label: "150 (Default)" },
  { value: "300", label: "300 (High)" },
];

const SECTIONS = [
  { id: "appearance", label: "Appearance" },
  { id: "building", label: "Building" },
  { id: "track-colors", label: "Track Colors" },
  { id: "step-tags", label: "Step Tags" },
  { id: "defaults", label: "Defaults" },
  { id: "wishlist", label: "Wishlist" },
  { id: "pdf-import", label: "PDF Import" },
  { id: "data", label: "Data" },
  { id: "about", label: "About" },
];

const DRYING_TIME_ROWS = [
  { key: "drying_time_liquid_cement", label: "Liquid Cement" },
  { key: "drying_time_tube_cement", label: "Tube Cement" },
  { key: "drying_time_ca_thin", label: "CA Thin" },
  { key: "drying_time_ca_medium_thick", label: "CA Medium/Thick" },
  { key: "drying_time_epoxy", label: "Epoxy" },
  { key: "drying_time_pva", label: "PVA" },
];

const CURRENCY_OPTIONS = [
  { value: "", label: "None" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "AUD", label: "AUD" },
  { value: "CAD", label: "CAD" },
  { value: "JPY", label: "JPY" },
  { value: "CNY", label: "CNY" },
  { value: "KRW", label: "KRW" },
  { value: "SEK", label: "SEK" },
  { value: "PLN", label: "PLN" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function SettingToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-md border px-2.5 py-2 transition-colors ${
        checked
          ? "border-accent/40 bg-accent/10"
          : "border-border bg-transparent hover:bg-muted/50"
      }`}
    >
      <span className={`text-[11px] font-medium ${
        checked ? "text-accent" : "text-text-tertiary"
      }`}>
        {label}
      </span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        checked
          ? "bg-accent/20 text-accent"
          : "bg-muted text-text-tertiary"
      }`}>
        {checked ? "ON" : "OFF"}
      </span>
    </button>
  );
}

export default function SettingsRoute() {
  const navigate = useNavigate();
  const settings = useAppStore((s) => s.settings);
  const updateSetting = useAppStore((s) => s.updateSetting);

  // Scroll tracking
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState("appearance");

  // Local state
  const [dbPath, setDbPath] = useState("");
  const [appVersion, setAppVersion] = useState("");
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [newTagInput, setNewTagInput] = useState("");
  const [backupDiff, setBackupDiff] = useState<BackupDiff | null>(null);
  const [backupPath, setBackupPath] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Drying times local state
  const [dryingTimes, setDryingTimes] = useState<Record<string, string>>({});
  const [dryingTimesDirty, setDryingTimesDirty] = useState(false);

  // Track colors local state
  const [trackColors, setTrackColors] = useState<{ value: string; label: string }[]>([]);
  const [trackColorsDirty, setTrackColorsDirty] = useState(false);

  // Initialize drying times from settings
  const dryingTimeKeys = DRYING_TIME_ROWS.map((r) => settings[r.key]).join(",");
  useEffect(() => {
    const times: Record<string, string> = {};
    for (const row of DRYING_TIME_ROWS) {
      times[row.key] = getSettingString(settings, row.key);
    }
    setDryingTimes(times);
    setDryingTimesDirty(false);
  }, [dryingTimeKeys]);

  // Initialize track colors from settings
  useEffect(() => {
    setTrackColors(parseTrackColors(settings).map((c) => ({ ...c })));
    setTrackColorsDirty(false);
  }, [settings.track_colors]);

  // Parsed step tags
  const stepTags = useMemo<string[]>(() => parseStepTags(settings), [settings.step_tags]);

  // Load on mount
  useEffect(() => {
    appDataDir()
      .then((dir) => {
        const base = dir.endsWith("/") ? dir : `${dir}/`;
        setDbPath(`${base}model-builder/db.sqlite`);
      })
      .catch(() => {});
    getVersion().then(setAppVersion).catch(() => {});
    api.getStorageStats().then(setStorageStats).catch(() => {});
  }, []);

  // IntersectionObserver for sidebar highlighting
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { root: scrollRef.current, rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    for (const ref of Object.values(sectionRefs.current)) {
      if (ref) observer.observe(ref);
    }
    return () => observer.disconnect();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSwitchSetting = useCallback(
    (key: string) => (checked: boolean) => {
      updateSetting(key, checked ? "true" : "false");
    },
    [updateSetting],
  );

  const handleSaveDryingTimes = useCallback(async () => {
    await Promise.all(
      DRYING_TIME_ROWS.map((row) =>
        updateSetting(row.key, dryingTimes[row.key] || SETTINGS_DEFAULTS[row.key]),
      ),
    );
    setDryingTimesDirty(false);
    toast.success("Drying times saved");
  }, [dryingTimes, updateSetting]);

  const handleResetDryingTimes = useCallback(() => {
    const reset: Record<string, string> = {};
    for (const row of DRYING_TIME_ROWS) {
      reset[row.key] = SETTINGS_DEFAULTS[row.key];
    }
    setDryingTimes(reset);
    setDryingTimesDirty(true);
  }, []);

  const handleSaveTrackColors = useCallback(async () => {
    await updateSetting("track_colors", JSON.stringify(trackColors));
    setTrackColorsDirty(false);
    toast.success("Track colors saved");
  }, [trackColors, updateSetting]);

  const handleResetTrackColors = useCallback(() => {
    setTrackColors(TRACK_COLORS.map((c) => ({ ...c })));
    setTrackColorsDirty(true);
  }, []);

  const handleAddTag = useCallback(async () => {
    const tag = newTagInput.trim();
    if (!tag || stepTags.includes(tag)) return;
    const updated = [...stepTags, tag];
    await updateSetting("step_tags", JSON.stringify(updated));
    setNewTagInput("");
  }, [newTagInput, stepTags, updateSetting]);

  const handleRemoveTag = useCallback(
    async (tag: string) => {
      const updated = stepTags.filter((t) => t !== tag);
      await updateSetting("step_tags", JSON.stringify(updated));
    },
    [stepTags, updateSetting],
  );

  const handleDpiChange = useCallback(
    (value: PdfDpi) => {
      updateSetting("pdf_dpi", value);
    },
    [updateSetting],
  );

  const handleExportBackup = useCallback(async () => {
    const path = await save({
      title: "Export Backup",
      filters: [{ name: "Zip Archive", extensions: ["zip"] }],
    });
    if (!path) return;
    try {
      await api.exportBackup(path);
      toast.success("Backup exported successfully");
    } catch (err) {
      toast.error(`Export failed: ${err}`);
    }
  }, []);

  const handleImportBackup = useCallback(async () => {
    const path = await open({
      title: "Import Backup",
      filters: [{ name: "Zip Archive", extensions: ["zip"] }],
      multiple: false,
    });
    if (!path) return;
    try {
      const diff = await api.previewBackup(path as string);
      setBackupDiff(diff);
      setBackupPath(path as string);
      setShowImportDialog(true);
    } catch (err) {
      toast.error(`Preview failed: ${err}`);
    }
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!backupPath) return;
    try {
      await api.applyBackup(backupPath);
      toast.success("Backup imported successfully");
      setShowImportDialog(false);
      setBackupDiff(null);
      setBackupPath(null);
    } catch (err) {
      toast.error(`Import failed: ${err}`);
    }
  }, [backupPath]);

  const pdfDpi = getSettingString(settings, "pdf_dpi") as PdfDpi;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="flex w-[200px] shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="px-4 pt-5 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-bold text-text-primary hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Settings
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                sectionRefs.current[section.id]?.scrollIntoView({ behavior: "smooth" });
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-left text-[11px] transition-colors",
                activeSection === section.id
                  ? "bg-muted font-semibold text-accent"
                  : "text-text-secondary hover:bg-muted/50 hover:text-text-primary",
              )}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-10 px-8 py-6">
          {/* ── Appearance ─────────────────────────────────────────────── */}
          <div
            id="appearance"
            ref={(el) => { sectionRefs.current["appearance"] = el; }}
            className="scroll-mt-6"
          >
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Appearance</h2>
            <Separator className="mb-4" />
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Label className="text-[11px] text-text-secondary">Theme</Label>
                <Badge variant="secondary" className="text-[10px]">Default</Badge>
              </div>
              <p className="text-[10px] text-text-tertiary">
                More themes coming in a future update.
              </p>
            </div>
          </div>

          {/* ── Building ───────────────────────────────────────────────── */}
          <div
            id="building"
            ref={(el) => { sectionRefs.current["building"] = el; }}
            className="scroll-mt-6"
          >
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Building</h2>
            <Separator className="mb-4" />
            <div className="space-y-6">
              {/* Auto-start drying timers */}
              <SettingToggle
                label="Auto-start drying timers"
                checked={getSettingBool(settings, "auto_start_timers")}
                onChange={handleSwitchSetting("auto_start_timers")}
              />

              {/* Drying time defaults */}
              <div className="space-y-3">
                <Label className="text-[11px] text-text-secondary">Drying time defaults (minutes)</Label>
                <div className="space-y-2">
                  {DRYING_TIME_ROWS.map((row) => (
                    <div key={row.key} className="flex items-center justify-between">
                      <span className="text-[11px] text-text-secondary">{row.label}</span>
                      <Input
                        type="number"
                        min={1}
                        className="h-7 w-16 text-center text-[11px]"
                        value={dryingTimes[row.key] ?? ""}
                        onChange={(e) => {
                          setDryingTimes((prev) => ({ ...prev, [row.key]: e.target.value }));
                          setDryingTimesDirty(true);
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-[10px]"
                    disabled={!dryingTimesDirty}
                    onClick={handleSaveDryingTimes}
                  >
                    Save
                  </Button>
                  <button
                    onClick={handleResetDryingTimes}
                    className="text-[10px] text-text-tertiary hover:text-accent"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Completion photo prompt */}
              <SettingToggle
                label="Completion photo prompt"
                checked={getSettingBool(settings, "photo_prompt_enabled")}
                onChange={handleSwitchSetting("photo_prompt_enabled")}
              />

              {/* Auto-log controls */}
              <div className="space-y-3">
                <Label className="text-[11px] text-text-secondary">Auto-log controls</Label>
                <div className="space-y-2">
                  <SettingToggle
                    label="Log step completions"
                    checked={getSettingBool(settings, "auto_log_step_complete")}
                    onChange={handleSwitchSetting("auto_log_step_complete")}
                  />
                  <SettingToggle
                    label="Log milestones"
                    checked={getSettingBool(settings, "auto_log_milestone")}
                    onChange={handleSwitchSetting("auto_log_milestone")}
                  />
                  <SettingToggle
                    label="Log timer expiry"
                    checked={getSettingBool(settings, "auto_log_timer_expiry")}
                    onChange={handleSwitchSetting("auto_log_timer_expiry")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Track Colors ───────────────────────────────────────────── */}
          <div
            id="track-colors"
            ref={(el) => { sectionRefs.current["track-colors"] = el; }}
            className="scroll-mt-6"
          >
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Track Colors</h2>
            <Separator className="mb-4" />
            <div className="space-y-2">
              {trackColors.map((color, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 shrink-0 rounded-[3px] border border-border"
                    style={{ backgroundColor: color.value }}
                  />
                  <input
                    type="color"
                    value={color.value}
                    onChange={(e) => {
                      const updated = [...trackColors];
                      updated[index] = { ...updated[index], value: e.target.value };
                      setTrackColors(updated);
                      setTrackColorsDirty(true);
                    }}
                    className="h-7 w-8 cursor-pointer rounded border border-border bg-transparent p-0.5"
                  />
                  <Input
                    className="h-7 flex-1 text-[11px]"
                    value={color.label}
                    onChange={(e) => {
                      const updated = [...trackColors];
                      updated[index] = { ...updated[index], label: e.target.value };
                      setTrackColors(updated);
                      setTrackColorsDirty(true);
                    }}
                  />
                  <span className="w-16 shrink-0 text-[10px] text-text-tertiary">{color.value}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  className="h-7 text-[10px]"
                  disabled={!trackColorsDirty}
                  onClick={handleSaveTrackColors}
                >
                  Save
                </Button>
                <button
                  onClick={handleResetTrackColors}
                  className="flex items-center gap-1 text-[10px] text-text-tertiary hover:text-accent"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* ── Step Tags ──────────────────────────────────────────────── */}
          <div
            id="step-tags"
            ref={(el) => { sectionRefs.current["step-tags"] = el; }}
            className="scroll-mt-6"
          >
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Step Tags</h2>
            <Separator className="mb-4" />
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {stepTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 text-[10px]"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-0.5 rounded-full hover:text-destructive"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  className="h-7 flex-1 text-[11px]"
                  placeholder="New tag name"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddTag();
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-[10px]"
                  onClick={handleAddTag}
                  disabled={!newTagInput.trim()}
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* ── Defaults ───────────────────────────────────────────────── */}
          <div
            id="defaults"
            ref={(el) => { sectionRefs.current["defaults"] = el; }}
            className="scroll-mt-6"
          >
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Defaults</h2>
            <Separator className="mb-4" />
            <div className="flex items-center gap-4">
              <Label className="text-[11px] text-text-secondary">Currency</Label>
              <Select
                value={getSettingString(settings, "default_currency") || "none"}
                onValueChange={(v) => updateSetting("default_currency", v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-7 w-28 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || "none"} value={opt.value || "none"} className="text-[11px]">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Wishlist ───────────────────────────────────────────────── */}
          <div
            id="wishlist"
            ref={(el) => { sectionRefs.current["wishlist"] = el; }}
            className="scroll-mt-6"
          >
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Wishlist</h2>
            <Separator className="mb-4" />
            <SettingToggle
              label="Clear price and retailer when acquiring items"
              checked={getSettingBool(settings, "acquire_clear_price")}
              onChange={handleSwitchSetting("acquire_clear_price")}
            />
          </div>

          {/* ── PDF Import ─────────────────────────────────────────────── */}
          <div
            id="pdf-import"
            ref={(el) => { sectionRefs.current["pdf-import"] = el; }}
            className="scroll-mt-6"
          >
            <h2 className="mb-3 text-sm font-semibold text-text-primary">PDF Import</h2>
            <Separator className="mb-4" />
            <div className="flex items-center gap-4">
              <Label className="text-[11px] text-text-secondary">Render DPI</Label>
              <div className="flex gap-1 rounded-md bg-muted p-[3px]">
                {DPI_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => handleDpiChange(d.value)}
                    className={cn(
                      "rounded-[5px] px-3 py-[3px] text-[10px] transition-colors",
                      pdfDpi === d.value
                        ? "bg-card font-semibold text-accent shadow-sm"
                        : "text-text-tertiary",
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-1.5 text-[10px] text-text-tertiary">
              Higher DPI = sharper pages but larger files and slower import.
              Applies to new imports only.
            </p>
          </div>

          {/* ── Data & Storage ─────────────────────────────────────────── */}
          <div
            id="data"
            ref={(el) => { sectionRefs.current["data"] = el; }}
            className="scroll-mt-6"
          >
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Data & Storage</h2>
            <Separator className="mb-4" />
            <div className="space-y-5">
              {/* DB Location */}
              <div className="space-y-2">
                <Label className="text-[11px] text-text-secondary">Database location</Label>
                {dbPath && (
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-text-tertiary">
                      {dbPath}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 shrink-0 gap-1.5 text-[10px]"
                      onClick={() => {
                        const dir = dbPath.substring(0, dbPath.lastIndexOf("/"));
                        revealItemInDir(dbPath).catch(() =>
                          openPath(dir).catch((e) => toast.error(`Failed to open: ${e}`))
                        );
                      }}
                    >
                      <FolderOpen className="h-3 w-3" />
                      Show in Finder
                    </Button>
                  </div>
                )}
              </div>

              {/* Storage stats */}
              {storageStats && (
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-text-secondary">Storage</Label>
                  <div className="space-y-1">
                    <p className="text-[10px] text-text-tertiary">
                      Database: {formatFileSize(storageStats.db_size_bytes)}
                    </p>
                    <p className="text-[10px] text-text-tertiary">
                      Image stash: {formatFileSize(storageStats.stash_size_bytes)}
                    </p>
                    <p className="text-[10px] text-text-tertiary">
                      Photos: {storageStats.photo_count}
                    </p>
                  </div>
                </div>
              )}

              {/* Backup */}
              <div className="space-y-2">
                <Label className="text-[11px] text-text-secondary">Backup</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-[10px]"
                    onClick={handleExportBackup}
                  >
                    <Download className="h-3 w-3" />
                    Export Backup
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-[10px]"
                    onClick={handleImportBackup}
                  >
                    <Upload className="h-3 w-3" />
                    Import Backup
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ── About ──────────────────────────────────────────────────── */}
          <div
            id="about"
            ref={(el) => { sectionRefs.current["about"] = el; }}
            className="scroll-mt-6"
          >
            <h2 className="mb-3 text-sm font-semibold text-text-primary">About</h2>
            <Separator className="mb-4" />
            <div className="space-y-1">
              <p className="text-[11px] text-text-tertiary">
                Model Builder's Assistant{appVersion ? ` v${appVersion}` : ""}
              </p>
              <p className="text-[10px] text-text-tertiary">
                Built with Tauri + React
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Import Backup Confirmation Dialog */}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Backup</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>This backup contains:</p>
                {backupDiff && (
                  <ul className="list-inside list-disc space-y-0.5 text-[11px]">
                    <li>{backupDiff.projects} project(s)</li>
                    <li>{backupDiff.kits} kit(s)</li>
                    <li>{backupDiff.paints} paint(s)</li>
                    <li>{backupDiff.accessories} accessory(ies)</li>
                    <li>{backupDiff.photos} photo(s)</li>
                  </ul>
                )}
                <p>Are you sure you want to import this backup? This will replace your current data.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>
              Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
