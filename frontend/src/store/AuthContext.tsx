import React, { createContext, useEffect, useState } from 'react'
import type { User, AuthContextType } from '@/types'
import { authService } from '@services/auth.service'

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (token) {
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
        }
      } catch {
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
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
