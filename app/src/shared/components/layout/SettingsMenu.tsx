import { useEffect, useRef } from "react";
import { X, Monitor, Sun, Moon } from "lucide-react";
import { cn } from "../ui/utils";
import { useSettings } from "../../context/SettingsContext";
import type { Language } from "../../i18n/translations";

const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Español", flag: "🇪🇸" },
];

interface SettingsMenuProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsMenu({ open, onClose }: SettingsMenuProps) {
  const { t, language, theme, setLanguage, setTheme } = useSettings();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-start pointer-events-none">
      <div
        ref={ref}
        className={cn(
          "pointer-events-auto mb-2 ml-2 w-72 rounded-xl border border-border bg-card shadow-2xl",
          "animate-in slide-in-from-bottom-2 fade-in duration-150"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold">{t.settings.title}</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Language */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t.settings.language}
            </p>
            <div className="flex flex-col gap-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLanguage(lang.value)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                    language === lang.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <span className="text-base leading-none">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {language === lang.value && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t.settings.theme}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <ThemeButton
                active={theme === "light"}
                icon={<Sun className="w-3.5 h-3.5" />}
                label={t.settings.themeLight}
                onClick={() => setTheme("light")}
              />
              <ThemeButton
                active={theme === "dark"}
                icon={<Moon className="w-3.5 h-3.5" />}
                label={t.settings.themeDark}
                onClick={() => setTheme("dark")}
              />
              <ThemeButton
                active={theme === "system"}
                icon={<Monitor className="w-3.5 h-3.5" />}
                label={t.settings.themeSystem}
                onClick={() => setTheme("system")}
              />
            </div>
          </div>

          {/* Version */}
          <p className="text-xs text-muted-foreground/50 text-center pt-1">
            {t.settings.version} 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}

function ThemeButton({
  active, icon, label, onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 py-2 px-1 rounded-lg text-xs transition-colors",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
