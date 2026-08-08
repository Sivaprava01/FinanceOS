/**
 * 404 Not Found Page
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@components/ui/Button';

const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Large 404 */}
      <p className="select-none text-[8rem] font-bold leading-none text-primary/10 md:text-[12rem]">
        404
      </p>

      {/* Content */}
      <div className="-mt-4">
        <h1 className="mb-3 text-3xl font-bold text-foreground">Page not found</h1>
        <p className="mb-8 max-w-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Button asChild>
            <Link to="/dashboard">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
