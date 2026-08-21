/**
 * Theme Toggle Component
 * Button to toggle between light, dark, and system themes with smooth animations.
 */

import React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@hooks/useTheme'
import { Button } from '@components/ui/Button'
import { scaleInVariants } from '@lib/motion'
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
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          aria-label="Toggle theme"
        >
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {theme === 'light' && <Sun className="h-5 w-5" />}
            {theme === 'dark' && <Moon className="h-5 w-5" />}
            {theme === 'system' && <Monitor className="h-5 w-5" />}
          </motion.div>
        </Button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              variants={scaleInVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute right-0 top-full z-50 mt-2 w-40 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
            >
              {themes.map(({ value, label, icon: Icon }) => (
                <motion.button
                  key={value}
                  onClick={() => {
                    setTheme(value)
                    setOpen(false)
                  }}
                  whileHover={{ backgroundColor: 'hsl(var(--secondary))' }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    theme === value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ThemeToggle
