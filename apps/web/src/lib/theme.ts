export type ThemePreference = "light" | "dark" | "system";

const THEME_KEY = "voca-theme";

const isStoredTheme = (value: string | null): value is "light" | "dark" =>
  value === "light" || value === "dark";

export const getThemePreference = (): ThemePreference => {
  const stored = localStorage.getItem(THEME_KEY);
  return isStoredTheme(stored) ? stored : "system";
};

export const applyTheme = (preference: ThemePreference) => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedTheme = preference === "system" ? (prefersDark ? "dark" : "light") : preference;

  const root = document.documentElement;
  root.dataset.theme = preference;
  root.dataset.resolvedTheme = resolvedTheme;
};

export const setThemePreference = (preference: ThemePreference) => {
  if (preference === "system") {
    localStorage.removeItem(THEME_KEY);
  } else {
    localStorage.setItem(THEME_KEY, preference);
  }

  applyTheme(preference);
};

export const getThemeFromDom = (): ThemePreference | null => {
  const current = document.documentElement.dataset.theme;
  if (current === "light" || current === "dark" || current === "system") return current;
  return null;
};
