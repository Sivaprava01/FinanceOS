/**
 * Theme Toggle Component
 * Dropdown to switch between light, dark, and system themes.
 */

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@hooks/useTheme';
import { Button } from '@components/ui/Button';
import type { Theme } from '@/types';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);

  const themes: {
    value: Theme;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const CurrentIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-label="Toggle theme"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <CurrentIcon className="h-5 w-5" />
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div
            role="listbox"
            aria-label="Select theme"
            className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          >
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                role="option"
                aria-selected={theme === value}
                onClick={() => {
                  setTheme(value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  theme === value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle;
