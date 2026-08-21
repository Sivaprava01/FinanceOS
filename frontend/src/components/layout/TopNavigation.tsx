/**
 * Top Navigation Component
 * Minimal, premium header - editorial aesthetic
 */

import React from 'react'
import { Menu, Search } from 'lucide-react'
import ThemeToggle from '@components/ThemeToggle'
import { Button } from '@components/ui/Button'

interface TopNavigationProps {
  onMenuClick: () => void
}

const TopNavigation: React.FC<TopNavigationProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>

          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative hidden max-w-md md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <label htmlFor="search" className="sr-only">Search transactions</label>
              <input
                id="search"
                type="search"
                placeholder="Search..."
                className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Search transactions"
              />
            </div>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export default TopNavigation
