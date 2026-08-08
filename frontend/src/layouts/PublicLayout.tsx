/**
 * Public Layout
 * Layout for unauthenticated pages — centered, clean background.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-background">
      {/* Subtle background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PublicLayout;
