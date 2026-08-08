/**
 * Generic Error Page
 * Fallback error page for unexpected failures.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@components/ui/Button';

interface ErrorPageProps {
  error?: Error | null;
  message?: string;
  onRetry?: () => void;
}

const Error: React.FC<ErrorPageProps> = ({
  error,
  message = 'Something went wrong. Please try again.',
  onRetry,
}) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      navigate(0); // reload current route
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden="true" />
      </div>

      {/* Heading */}
      <h1 className="mb-3 text-3xl font-bold text-foreground">Unexpected Error</h1>

      {/* Message */}
      <p className="mb-2 max-w-md text-muted-foreground">{message}</p>

      {/* Technical detail (dev-friendly, no stack trace exposed) */}
      {error?.message && (
        <p className="mb-8 max-w-sm rounded-lg bg-muted px-4 py-2 font-mono text-xs text-muted-foreground">
          {error.message}
        </p>
      )}

      {!error?.message && <div className="mb-8" />}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button onClick={handleRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try Again
        </Button>
        <Button variant="outline" asChild>
          <Link to="/dashboard">
            <Home className="h-4 w-4" aria-hidden="true" />
            Go to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default Error;
