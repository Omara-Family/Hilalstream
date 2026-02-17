import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('hilal-theme');
    const theme = stored || getSystemTheme();
    const dark = theme !== 'light';
    setIsDark(dark);
    document.documentElement.classList.toggle('light', !dark);

    // Listen for system theme changes when no user preference is stored
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('hilal-theme')) {
        setIsDark(!e.matches);
        document.documentElement.classList.toggle('light', e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('light', next);
    localStorage.setItem('hilal-theme', next ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

export default ThemeToggle;
