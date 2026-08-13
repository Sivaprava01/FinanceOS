/**
 * Forgot Password Page
 * Password reset request form with backend integration.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { authService } from '@/services/auth.service';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate email
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      console.log('[ForgotPassword] Submitting form with email:', email);

      // Call backend to request password reset
      const result = await authService.forgotPassword(email);
      
      console.log('[ForgotPassword] Got response from backend:', result);
      
      // Safely check for development token
      if (result && typeof result === 'object' && 'devToken' in result && result.devToken) {
        console.log('📧 Development Reset Link Ready:');
        console.log(`http://localhost:3000/reset-password?token=${result.devToken}&email=${email}`);
      }
      
      console.log('[ForgotPassword] Setting submitted = true');
      // Show success message (prevent account enumeration)
      setSubmitted(true);
      setIsLoading(false);
      console.log('[ForgotPassword] Form submission completed successfully');
    } catch (err: any) {
      console.error('[ForgotPassword] Error caught:', err);
      // The API interceptor returns error.response.data directly
      // So err should be the API response object or an Error
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (err && typeof err === 'object') {
        // If it's the API error response object
        if ('message' in err && typeof err.message === 'string') {
          errorMessage = err.message;
        }
        // If it's an Error object
        else if ('toString' in err && typeof err.toString === 'function') {
          const str = err.toString();
          if (str && str !== '[object Object]') {
            errorMessage = str;
          }
        }
      }
      
      console.error('[ForgotPassword] Setting error message:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <TrendingUp className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">FinanceOS</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="h-7 w-7 text-primary" aria-hidden="true" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">Check your email</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                If an account exists with that email, we&apos;ve sent password reset instructions.
              </p>
              
              {import.meta.env.DEV && (
                <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
                  <p className="mb-2 text-xs font-semibold text-blue-900">💡 Development Mode</p>
                  <p className="text-xs text-blue-800 mb-2">
                    In development, check your browser console or the backend console for the reset link.
                  </p>
                  <p className="text-xs text-blue-700 font-mono break-all">
                    Look for "🔐 Development Reset Link Ready:" message
                  </p>
                </div>
              )}
              
              <Button asChild className="w-full">
                <Link to="/login">Back to sign in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Branding */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <TrendingUp className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">FinanceOS</h1>
        <p className="mt-1 text-sm text-muted-foreground">We&apos;ll send you reset instructions</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Forgot your password?</CardTitle>
          <CardDescription>Enter the email address associated with your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !email.trim()}>
              {isLoading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-6">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
