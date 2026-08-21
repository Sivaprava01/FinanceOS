/**
 * Theme Context
 * Manages application theme state (light, dark, system).
 */

import React, { createContext, ReactNode, useEffect, useState } from 'react'
import type { Theme, ThemeContextType } from '@/types'

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get theme from localStorage or default to 'system'
    const saved = localStorage.getItem('theme') as Theme
    return saved || 'system'
  })

  const [isDark, setIsDark] = useState(false)

  // Handle theme changes
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  // Apply theme to document
  const applyTheme = (currentTheme: Theme) => {
    const root = document.documentElement

    if (currentTheme === 'system') {
      // Follow system preference
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', isDarkMode)
      setIsDark(isDarkMode)
    } else if (currentTheme === 'dark') {
      root.classList.add('dark')
      setIsDark(true)
    } else {
      root.classList.remove('dark')
      setIsDark(false)
    }
  }

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(theme)

    // Listen for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        applyTheme('system')
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}
