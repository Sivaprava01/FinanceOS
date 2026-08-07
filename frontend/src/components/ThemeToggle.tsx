/**
 * Theme Toggle Component
 * Button to toggle between light, dark, and system themes.
 */

import React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@hooks/useTheme'
import { Button } from '@components/ui/Button'
import type { Theme } from '@/types'

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)

  const themes: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-label="Toggle theme"
      >
        {theme === 'light' && <Sun className="h-5 w-5" />}
        {theme === 'dark' && <Moon className="h-5 w-5" />}
        {theme === 'system' && <Monitor className="h-5 w-5" />}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-lg border border-border bg-card shadow-lg">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => {
                  setTheme(value)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  theme === value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary'
                } ${value === 'light' ? 'rounded-t-lg' : ''} ${value === 'system' ? 'rounded-b-lg' : ''}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default ThemeToggle
