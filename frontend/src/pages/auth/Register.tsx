import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { useAuth } from '@hooks/useAuth'

const registerSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

type RegisterFormData = z.infer<typeof registerSchema>

const Register: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register: registerUser } = useAuth()
  const [serverError, setServerError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const oauthError =
    searchParams.get('error') === 'google_oauth_not_configured'
      ? 'Google OAuth credentials are not configured on the server. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env or sign in with your email and password.'
      : searchParams.get('error') === 'google_auth_failed'
      ? 'Google authentication was cancelled or failed. Please try again.'
      : ''

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)
    setServerError('')
    try {
      await registerUser(data.name, data.email, data.password)
      const onboardingSkipped = localStorage.getItem('onboarding_skipped')
      if (!onboardingSkipped) {
        navigate('/onboarding', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Registration failed. Please try again.'
      setServerError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
    window.location.href = `${apiUrl}/auth/google?returnTo=${encodeURIComponent(window.location.origin)}`
  }

  return (
    <Card className="border border-border shadow-xs">
      <CardHeader className="pb-3 text-center">
        <CardTitle className="text-lg">Create Account</CardTitle>
        <CardDescription className="text-xs">Get started with FinanceOS in seconds</CardDescription>
      </CardHeader>
      <CardContent className="pt-2 space-y-4">
        {(serverError || oauthError) && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium">
            {serverError || oauthError}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-xs font-medium flex items-center justify-center gap-2 border-border/80 hover:bg-muted/50"
          onClick={handleGoogleSignIn}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-border/80 w-full" />
          <span className="bg-card px-2 text-[11px] text-muted-foreground uppercase absolute">Or</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">

          <div>
            <label htmlFor="name" className="block text-xs font-medium text-muted-foreground mb-1">
              Full Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-muted-foreground mb-1">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-muted-foreground mb-1">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            ) : (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Min 8 characters, 1 uppercase letter, 1 number
              </p>
            )}
          </div>

          <Button type="submit" size="sm" className="w-full text-xs font-semibold mt-2" isLoading={isSubmitting}>
            Create Account
          </Button>
        </form>

        <div className="pt-3 border-t border-border/80 text-center">
          <p className="text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default Register
