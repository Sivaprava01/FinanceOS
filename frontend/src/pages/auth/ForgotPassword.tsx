/**
 * Forgot Password Page
 * Password reset request form — Phase 1 UI only, no backend connection.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Phase 1: UI-only simulation — no backend call
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 800);
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
                If an account exists with that email, we&apos;ll send password reset instructions
                within a few minutes.
              </p>
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
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
              Send reset link
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
