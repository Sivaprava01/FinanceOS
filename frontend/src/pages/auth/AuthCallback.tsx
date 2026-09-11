import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { Loader2, AlertCircle } from 'lucide-react'

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loginWithToken } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const processedRef = useRef(false)

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true

    const handleCallback = async () => {
      const token = searchParams.get('token')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        setError('Authentication failed. Please try logging in again.')
        setTimeout(() => navigate('/login?error=google_auth_failed', { replace: true }), 2500)
        return
      }

      if (!token) {
        setError('No authentication token received from Google OAuth.')
        setTimeout(() => navigate('/login', { replace: true }), 2500)
        return
      }

      try {
        await loginWithToken(token)
        navigate('/dashboard', { replace: true })
      } catch {
        setError('Failed to authenticate with token. Please login again.')
        setTimeout(() => navigate('/login', { replace: true }), 2500)
      }
    }

    handleCallback()
  }, [searchParams, loginWithToken, navigate])

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        {error ? (
          <div className="flex items-center gap-3 text-destructive font-medium text-sm p-4 rounded-xl bg-destructive/10 border border-destructive/20 shadow-sm">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Authenticating with Google, please wait...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthCallback
