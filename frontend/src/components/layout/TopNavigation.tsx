/**
 * Top Navigation Component
 * Header with search input and theme toggle.
 */

import React from 'react';
import { Menu } from 'lucide-react';
import ThemeToggle from '@components/ui/ThemeToggle';
import { Button } from '@components/ui/Button';
import { SearchInput } from '@components/ui/SearchInput';

interface TopNavigationProps {
  onMenuClick: () => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ onMenuClick }) => {
  return (
    <header className="border-b border-border bg-card shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search */}
          <div className="hidden flex-1 max-w-md md:block">
            <SearchInput placeholder="Search..." aria-label="Search FinanceOS" />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;
