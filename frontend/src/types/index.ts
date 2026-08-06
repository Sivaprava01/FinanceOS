/**
 * Global Type Definitions
 * Central location for all TypeScript types and interfaces used across the application.
 */

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  provider: 'local' | 'google'
  isEmailVerified: boolean
  country?: string
  preferredCurrency: string
  timeZone: string
  preferences: UserPreferences
  createdAt: string
  updatedAt: string
}

export interface UserPreferences {
  language: string
  theme: 'light' | 'dark' | 'system'
  notifications: {
    email: boolean
    push: boolean
  }
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: User
    accessToken: string
  }
}

// ─── API ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  statusCode?: number
  stack?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// ─── Theme ──────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

// ─── Auth Context ──────────────────────────────────────────────────────────

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

// ─── Common ─────────────────────────────────────────────────────────────────

export interface LoadingState {
  isLoading: boolean
  error: string | null
  success: boolean
}

export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
