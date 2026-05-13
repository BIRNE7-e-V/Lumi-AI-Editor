import { useContext } from 'react';

import { ThemeModeContext } from '@components/theme/theme-mode-context';

export function useThemeMode() {
  const value = useContext(ThemeModeContext);

  if (!value) {
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  }

  return value;
}
