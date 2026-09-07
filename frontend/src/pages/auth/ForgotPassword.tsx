import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setSubmitted(true)
      setIsLoading(false)
    }, 1000)
  }

  if (submitted) {
    return (
      <Card className="border border-border shadow-xs">
        <CardHeader className="pb-3 text-center">
          <CardTitle className="text-lg">Check Your Email</CardTitle>
        </CardHeader>
        <CardContent className="pt-2 text-center space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            If an account exists with that email address, we have sent instructions to reset your password.
          </p>
          <Button asChild size="sm" className="w-full text-xs font-semibold">
            <Link to="/login">Back to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border shadow-xs">
      <CardHeader className="pb-3 text-center">
        <CardTitle className="text-lg">Reset Password</CardTitle>
        <CardDescription className="text-xs">Enter your email to receive reset instructions</CardDescription>
      </CardHeader>
      <CardContent className="pt-2 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-muted-foreground mb-1">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <Button type="submit" size="sm" className="w-full text-xs font-semibold mt-2" isLoading={isLoading}>
            Send Reset Link
          </Button>
        </form>

        <div className="pt-3 border-t border-border/80 text-center">
          <Link to="/login" className="text-xs font-medium text-primary hover:underline">
            Back to Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default ForgotPassword
