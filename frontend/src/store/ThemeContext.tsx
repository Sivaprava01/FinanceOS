/**
 * Theme Provider
 * Manages application theme state: light, dark, system.
 * Persists preference to localStorage and responds to OS changes.
 */

import React, { ReactNode, useEffect, useState } from 'react';
import type { Theme } from '@/types';
import { ThemeContext } from './theme-context-value';

export { ThemeContext };

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('financeos-theme') as Theme | null;
    return saved || 'system';
  });

  const [isDark, setIsDark] = useState(false);

  const applyTheme = (currentTheme: Theme) => {
    const root = document.documentElement;

    if (currentTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      setIsDark(prefersDark);
    } else if (currentTheme === 'dark') {
      root.classList.add('dark');
      setIsDark(true);
    } else {
      root.classList.remove('dark');
      setIsDark(false);
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('financeos-theme', newTheme);
    applyTheme(newTheme);
  };

  useEffect(() => {
    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>{children}</ThemeContext.Provider>
  );
};
