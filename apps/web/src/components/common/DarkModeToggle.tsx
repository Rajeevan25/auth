import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export const DarkModeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className={`p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus-ring transition-colors duration-150 ${className}`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-slate-700 hover:text-slate-900 transition-transform duration-200 hover:-rotate-12" />
      ) : (
        <Sun className="w-5 h-5 text-amber-400 hover:text-amber-300 transition-transform duration-200 hover:rotate-45" />
      )}
    </button>
  );
};

