import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { type Language, type Translations, translations } from "../i18n/translations";

type Theme = "light" | "dark" | "system";

interface Settings {
  language: Language;
  theme: Theme;
}

interface SettingsContextValue extends Settings {
  t: Translations;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const STORAGE_KEY = "dr-settings";

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { language: "en", theme: "system", ...JSON.parse(raw) };
  } catch {}
  return { language: "en", theme: "system" };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const save = useCallback((next: Settings) => {
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    applyTheme(next.theme);
  }, []);

  useEffect(() => {
    applyTheme(settings.theme);

    if (settings.theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [settings.theme]);

  const setLanguage = useCallback((language: Language) => save({ ...settings, language }), [settings, save]);
  const setTheme = useCallback((theme: Theme) => save({ ...settings, theme }), [settings, save]);

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        t: translations[settings.language],
        setLanguage,
        setTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
