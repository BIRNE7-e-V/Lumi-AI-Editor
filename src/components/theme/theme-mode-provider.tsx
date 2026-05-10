import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ThemeMode = 'light' | 'dark';

type ThemeModeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const THEME_STORAGE_KEY = 'lumi-theme-mode';

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

function getPreferredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (isThemeMode(storedMode)) {
    return storedMode;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeMode(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode);
  document.documentElement.style.colorScheme = mode;
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => getPreferredThemeMode());

  useEffect(() => {
    applyThemeMode(mode);
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      setMode,
      toggleMode: () => setMode((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [mode]
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const value = useContext(ThemeModeContext);

  if (!value) {
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  }

  return value;
}

