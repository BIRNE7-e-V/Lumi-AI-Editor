import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

import { useThemeMode } from '@components/theme/use-theme-mode';

export function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode();

  const isDark = mode === 'dark';

  return (
    <button className="btn btn-ghost gap-2" type="button" onClick={toggleMode}>
      {isDark ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
      <span>{isDark ? 'Hell' : 'Dunkel'}</span>
    </button>
  );
}
