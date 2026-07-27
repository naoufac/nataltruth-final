import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type FontSize = "S" | "M" | "L" | "XL";
type Theme = "light" | "dark";

interface Prefs {
  theme: Theme;
  fontSize: FontSize;
  readingMode: boolean;
}

interface PrefsCtx extends Prefs {
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setFontSize: (s: FontSize) => void;
  toggleReadingMode: () => void;
}

const FONT_VAR: Record<FontSize, string> = {
  S: "16px",
  M: "17.5px",
  L: "19.5px",
  XL: "22px",
};

const Ctx = createContext<PrefsCtx | null>(null);

function load(): Prefs {
  const stored = localStorage.getItem("nt-prefs");
  const sys: Theme =
    window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
  if (stored) {
    try {
      const p = JSON.parse(stored);
      return { theme: p.theme ?? sys, fontSize: p.fontSize ?? "M", readingMode: !!p.readingMode };
    } catch {
      /* ignore */
    }
  }
  return { theme: sys, fontSize: "M", readingMode: false };
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(load);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", prefs.theme);
    document.documentElement.style.setProperty("--font-base", FONT_VAR[prefs.fontSize]);
    document.documentElement.classList.toggle("reading-mode", prefs.readingMode);
    localStorage.setItem("nt-prefs", JSON.stringify(prefs));
  }, [prefs]);

  const value: PrefsCtx = {
    ...prefs,
    setTheme: (theme) => setPrefs((p) => ({ ...p, theme })),
    toggleTheme: () => setPrefs((p) => ({ ...p, theme: p.theme === "dark" ? "light" : "dark" })),
    setFontSize: (fontSize) => setPrefs((p) => ({ ...p, fontSize })),
    toggleReadingMode: () => setPrefs((p) => ({ ...p, readingMode: !p.readingMode })),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePrefs must be used within PrefsProvider");
  return ctx;
}
