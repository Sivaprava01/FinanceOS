/**
 * Protected Layout
 * Layout for authenticated pages — floating sidebar + top navigation.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@components/layout/Sidebar';
import TopNavigation from '@components/layout/TopNavigation';

const ProtectedLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Floating Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNavigation onMenuClick={() => setSidebarOpen((prev) => !prev)} />

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto" id="main-content">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
