/**
 * Sidebar Component
 * Floating sidebar with navigation menu and desktop collapse capability.
 */

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutGrid,
  Wallet,
  FileText,
  BarChart3,
  Users,
  Tags,
  HelpCircle,
  User,
  Settings,
  X,
  Search as SearchIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@lib/utils'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const location = useLocation()

  const navGroups: NavGroup[] = [
    {
      label: 'Main',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
        { name: 'Transactions', href: '/transactions', icon: Wallet },
        { name: 'Statements', href: '/statements', icon: FileText },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      ],
    },
    {
      label: 'Collaboration',
      items: [{ name: 'Family Finance', href: '/family', icon: Users }],
    },
    {
      label: 'Organize',
      items: [
        { name: 'Categories', href: '/categories', icon: Tags },
        { name: 'Search', href: '/search', icon: SearchIcon },
      ],
    },
  ]

  const bottomItems: NavItem[] = [
    { name: 'How It Works', href: '/how-it-works', icon: HelpCircle },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
    const { name, href, icon: Icon } = item
    const isActive = location.pathname === href

    return (
      <Link
        to={href}
        title={isCollapsed ? name : undefined}
        className={cn(
          'group flex items-center rounded-md text-xs font-medium transition-all duration-150',
          isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2',
          isActive
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        )}
        onClick={() => onClose()}
      >
        <Icon
          className={cn(
            'h-4 w-4 shrink-0 transition-colors',
            !isCollapsed && 'mr-2.5',
            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          )}
        />
        {!isCollapsed && <span className="truncate">{name}</span>}
        {!isCollapsed && isActive && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onClose}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 transform border-r border-border bg-card transition-all duration-200 ease-in-out md:relative md:transform-none',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'md:w-16' : 'md:w-56',
          'w-56' // mobile drawer width always standard
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          {/* Header & Logo */}
          <div className="flex h-14 items-center justify-between border-b border-border px-3.5">
            <Link to="/dashboard" className="flex items-center gap-2.5 outline-none min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground font-serif font-bold text-sm shadow-xs">
                F
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-serif font-bold tracking-tight text-foreground leading-tight truncate">
                    FinanceOS
                  </span>
                  <span className="text-[10px] text-muted-foreground font-sans leading-none tracking-normal">
                    Calm Intelligence
                  </span>
                </div>
              )}
            </Link>

            <div className="flex items-center gap-1">
              {/* Collapse button for Desktop */}
              <button
                onClick={onToggleCollapse}
                className="hidden rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground md:flex"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>

              {/* Close button for Mobile */}
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
                aria-label="Close sidebar navigation"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-4 overflow-y-auto px-2.5 py-3" aria-label="Primary navigation">
            {navGroups.map((group, idx) => (
              <div key={idx} className="space-y-0.5">
                {group.label && !isCollapsed && (
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {group.label}
                  </p>
                )}
                {isCollapsed && idx > 0 && <div className="my-2 border-t border-border/60" />}
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            ))}
          </nav>

          {/* Bottom Navigation & User Profile */}
          <div className="border-t border-border p-2.5 space-y-1 bg-secondary/30">
            {bottomItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}

            {/* Logout Button */}
            <button
              onClick={() => {
                localStorage.removeItem('accessToken')
                window.location.href = '/login'
              }}
              title={isCollapsed ? 'Log out' : undefined}
              className={cn(
                'group flex w-full items-center rounded-md text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors',
                isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'
              )}
              aria-label="Logout from your account"
            >
              <LogOut
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors group-hover:text-destructive',
                  !isCollapsed && 'mr-2.5'
                )}
              />
              {!isCollapsed && <span>Log out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
