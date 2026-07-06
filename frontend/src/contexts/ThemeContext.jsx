// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// shared theme state used across player and admin interfaces.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'openassess-theme';

function getInitialTheme() {
  if (typeof localStorage === 'undefined') {
    return 'light';
  }

  const storedTheme = localStorage.getItem(STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(() => {
    function toggleTheme() {
      const next = theme === 'dark' ? 'light' : 'dark';
      const apply = () => {
        setTheme(next);
      };

      if (typeof document !== 'undefined' && document.startViewTransition) {
        document.startViewTransition(() => {
          flushSync(apply);
        });
        return;
      }

      apply();
    }

    return {
      theme,
      isDarkMode: theme === 'dark',
      setTheme,
      toggleTheme,
    };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}

export { ThemeProvider, useTheme };
export default ThemeContext;
