/**
 * Sidebar Component
 * Floating sidebar with navigation menu.
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
} from 'lucide-react'
import { cn } from '@lib/utils'
import { Button } from '@components/ui/Button'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation()

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { name: 'Transactions', href: '/transactions', icon: Wallet },
    { name: 'Statements', href: '/statements', icon: FileText },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Family Finance', href: '/family', icon: Users },
    { name: 'Categories', href: '/categories', icon: Tags },
    { name: 'Search', href: '/search', icon: SearchIcon },
    { name: 'How It Works', href: '/how-it-works', icon: HelpCircle },
  ]

  const bottomItems = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const NavLink: React.FC<{
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
  }> = ({ name, href, icon: Icon }) => {
    const isActive = location.pathname === href

    return (
      <Link
        to={href}
        className={cn(
          'group flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        )}
        onClick={() => onClose()}
      >
        <Icon className="mr-3 h-5 w-5" />
        {name}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-card shadow-lg transition-transform duration-300 ease-in-out md:relative md:transform-none md:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h1 className="text-xl font-bold text-primary">FinanceOS</h1>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-secondary md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                name={item.name}
                href={item.href}
                icon={item.icon}
              />
            ))}
          </nav>

          {/* Bottom Navigation */}
          <div className="border-t border-border px-4 py-4">
            <div className="space-y-1">
              {bottomItems.map((item) => (
                <NavLink
                  key={item.href}
                  name={item.name}
                  href={item.href}
                  icon={item.icon}
                />
              ))}
            </div>

            {/* Logout Button */}
            <Button
              variant="destructive"
              size="sm"
              className="mt-4 w-full"
              onClick={() => {
                localStorage.removeItem('accessToken')
                window.location.href = '/login'
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
