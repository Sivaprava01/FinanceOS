/**
 * Top Navigation Component
 * Minimal, premium header - editorial aesthetic
 */

import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Menu, Search, User, ChevronRight } from 'lucide-react'
import ThemeToggle from '@components/ThemeToggle'
import { Button } from '@components/ui/Button'
import { useAuth } from '@hooks/useAuth'
import { getInitials } from '@lib/utils'

interface TopNavigationProps {
  onMenuClick: () => void
}

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/statements': 'Statement Imports',
  '/analytics': 'Analytics',
  '/family': 'Family Finance',
  '/categories': 'Categories',
  '/search': 'Search',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/how-it-works': 'How It Works',
}

const TopNavigation: React.FC<TopNavigationProps> = ({ onMenuClick }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  const currentTitle = ROUTE_LABELS[location.pathname] || 'Overview'

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-card/95 backdrop-blur-xs">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile Menu + Breadcrumb */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMenuClick}
            className="md:hidden text-muted-foreground"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </Button>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="hidden sm:inline font-medium">FinanceOS</span>
            <ChevronRight className="hidden sm:inline h-3 w-3 text-muted-foreground/60" />
            <span className="font-semibold text-foreground">{currentTitle}</span>
          </div>
        </div>

        {/* Center: Quick Search */}
        <div className="hidden md:flex flex-1 max-w-sm mx-6">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="top-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anything (press Enter)…"
              className="h-8 w-full rounded-md border border-border bg-background/80 py-1 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              aria-label="Search"
            />
          </form>
        </div>

        {/* Right: Theme Toggle + User Avatar */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-full p-0.5 hover:bg-secondary transition-colors"
            title={user?.name || user?.email || 'Profile'}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
              {user?.name ? getInitials(user.name) : <User className="h-3.5 w-3.5" />}
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}

export default TopNavigation
