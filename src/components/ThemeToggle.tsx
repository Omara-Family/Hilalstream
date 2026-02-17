import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('hilal-theme');
    if (stored === 'light') {
      setIsDark(false);
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('hilal-theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('hilal-theme', 'light');
    }
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
