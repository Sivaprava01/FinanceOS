/**
 * useTheme Hook
 * Access theme context and theme utilities.
 */

import { useContext } from 'react'
import { ThemeContext } from '@store/ThemeContext'
import type { ThemeContextType } from '@types/index'

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
