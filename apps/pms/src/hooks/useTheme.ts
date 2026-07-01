import * as React from 'react';
import { type Theme } from '@trinserhof/types';

const STORAGE_KEY = 'theme';

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'winter';
};

// userTheme is the signed-in user's stored preference, once known — it takes
// priority over the local/system fallback so the same account sees a
// consistent theme across devices.
const useTheme = (userTheme?: Theme): [Theme, (theme: Theme) => void] => {
  const [theme, setTheme] = React.useState<Theme>(() => userTheme ?? getInitialTheme());

  React.useEffect(() => {
    if (userTheme) setTheme(userTheme);
  }, [userTheme]);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return [theme, setTheme];
};

export default useTheme;
