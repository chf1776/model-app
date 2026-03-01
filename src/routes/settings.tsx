import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import * as api from "@/api";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const THEMES: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function SettingsRoute() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    api.getSetting("theme").then((v) => setTheme(v as Theme)).catch(() => {});
  }, []);

  const handleThemeChange = async (value: Theme) => {
    setTheme(value);
    await api.setSetting("theme", value);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-lg px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="rounded-md p-1 text-text-tertiary hover:bg-muted hover:text-text-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-lg font-bold text-text-primary">Settings</h1>
        </div>

        {/* Appearance */}
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold text-text-primary">
            Appearance
          </h2>
          <Separator className="mb-3" />
          <div className="flex items-center gap-4">
            <Label className="text-[11px] text-text-secondary">Theme</Label>
            <div className="flex gap-1 rounded-md bg-muted p-[3px]">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleThemeChange(t.value)}
                  className={cn(
                    "rounded-[5px] px-3 py-[3px] text-[10px] transition-colors",
                    theme === t.value
                      ? "bg-card font-semibold text-accent shadow-sm"
                      : "text-text-tertiary",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Data */}
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold text-text-primary">
            Data
          </h2>
          <Separator className="mb-3" />
          <p className="text-[11px] text-text-tertiary">
            Import/export and backup features coming in Phase 5.
          </p>
        </section>

        {/* About */}
        <section>
          <h2 className="mb-2 text-xs font-semibold text-text-primary">
            About
          </h2>
          <Separator className="mb-3" />
          <p className="text-[11px] text-text-tertiary">
            Model Builder's Assistant v0.1.0
          </p>
        </section>
      </div>
    </div>
  );
}
