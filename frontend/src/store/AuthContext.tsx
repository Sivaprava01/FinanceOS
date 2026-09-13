import React, { createContext, useEffect, useState } from 'react'
import type { User, AuthContextType } from '@/types'
import { authService } from '@services/auth.service'

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

const parseJwtPayload = (token: string): Partial<User> | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonPayload)
    if (payload && (payload.email || payload._id)) {
      return {
        _id: payload._id || '',
        name: payload.name || (payload.email ? payload.email.split('@')[0] : 'User'),
        email: payload.email || '',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        preferredCurrency: 'INR',
      }
    }
    return null
  } catch {
    return null
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (token) {
          const preliminary = parseJwtPayload(token)
          if (preliminary) {
            setUser(preliminary as User)
          }
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
        }
      } catch (err) {
        console.warn('Authentication check failed:', err)
        localStorage.removeItem('accessToken')
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<void> => {
    const response = await authService.login(email, password)
    localStorage.setItem('accessToken', response.data.accessToken)
    setUser(response.data.user)
  }

  const loginWithToken = async (token: string): Promise<void> => {
    localStorage.setItem('accessToken', token)
    const preliminary = parseJwtPayload(token)
    if (preliminary) {
      setUser(preliminary as User)
    }
    setIsLoading(false)

    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (err) {
      console.warn('Could not fetch full user profile, continuing with token session:', err)
    }
  }

  const register = async (name: string, email: string, password: string): Promise<void> => {
    const response = await authService.register(name, email, password)
    localStorage.setItem('accessToken', response.data.accessToken)
    setUser(response.data.user)
  }

  const logout = async (): Promise<void> => {
    try {
      await authService.logout()
    } finally {
      localStorage.removeItem('accessToken')
      setUser(null)
    }
  }

  const updateUser = (updates: Partial<User>): void => {
    if (user) {
      setUser({ ...user, ...updates })
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithToken,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
