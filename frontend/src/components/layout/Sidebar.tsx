/**
 * Sidebar Component
 * Floating sidebar with navigation.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Wallet,
  FileText,
  BarChart3,
  Users,
  Tags,
  HelpCircle,
  Search,
  User,
  Settings,
  X,
  TrendingUp,
  LogOut,
} from 'lucide-react';
import { cn } from '@lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
  { name: 'Transactions', href: '/transactions', icon: Wallet },
  { name: 'Statements', href: '/statements', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Family Finance', href: '/family', icon: Users },
  { name: 'Categories', href: '/categories', icon: Tags },
];

const utilityNavItems: NavItem[] = [
  { name: 'Search', href: '/search', icon: Search },
  { name: 'How It Works', href: '/how-it-works', icon: HelpCircle },
];

const bottomNavItems: NavItem[] = [
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const NavLink: React.FC<NavItem> = ({ name, href, icon: Icon }) => {
    const isActive = location.pathname === href;

    return (
      <Link
        to={href}
        onClick={onClose}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        )}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{name}</span>
      </Link>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        id="sidebar"
        aria-label="Main navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onClose}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <TrendingUp className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="text-lg font-bold text-foreground">FinanceOS</span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Main">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
          
          {/* Divider */}
          <div className="my-2 h-px bg-border" />
          
          {/* Utility navigation */}
          {utilityNavItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        {/* Bottom navigation */}
        <div className="border-t border-border px-3 py-3">
          <div className="space-y-0.5">
            {bottomNavItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
