/**
 * Landing Page - FinanceOS Public Landing
 * Redesigned using Stitch 'Calm Financial Intelligence' design system.
 */

import { motion } from 'framer-motion'
import {
  ArrowRight,
  Shield,
  FileSpreadsheet,
  Users,
  TrendingUp,
  PieChart,
  CheckCircle2,
  Lock,
  LayoutDashboard,
  Layers,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@components/ui/Button'
import { Card, CardContent } from '@components/ui/Card'
import ThemeToggle from '@components/ThemeToggle'
import { useAuth } from '@hooks/useAuth'

export default function Landing() {
  const { isAuthenticated, user } = useAuth()

  const capabilities = [
    {
      icon: FileSpreadsheet,
      title: 'Automated Statement Parsing',
      description:
        'Import PDF, CSV, and Excel statements with support for password-protected bank documents.',
    },
    {
      icon: Shield,
      title: 'Privacy-First Design',
      description:
        'Private and secure. No third-party bank logins, credentials, or scraping required.',
    },
    {
      icon: Users,
      title: 'Family Finance Sharing',
      description:
        'Share budgets with household members with custom permissions (Admin, Member, Viewer) and unified balances.',
    },
    {
      icon: TrendingUp,
      title: 'Income & Expense Analytics',
      description:
        'Track monthly income vs. expenses, debt ratios, and net worth progress in your preferred currency.',
    },
    {
      icon: PieChart,
      title: 'Smart Categorization',
      description:
        'Automatically categorizes transactions and learns your preferred category rules for future statements.',
    },
    {
      icon: Layers,
      title: 'Multi-Currency Support',
      description:
        'Convert transactions seamlessly across INR, USD, EUR, and 150+ world currencies using live exchange rates.',
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      {/* Top Announcement Bar */}
      <div className="border-b border-border bg-card text-[11px] font-mono text-muted-foreground px-4 sm:px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-primary" />
          <span className="font-semibold text-foreground">FinanceOS</span>
          <span className="hidden sm:inline text-border">•</span>
          <span className="hidden sm:inline">Private personal finance & statement tracking</span>
        </div>
        <div className="flex items-center gap-4">
          <span>CURRENCIES: <strong className="text-foreground">INR (₹)</strong> • USD ($) • EUR (€)</span>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/90 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 group outline-none">
              <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-base shadow-xs">
                F
              </div>
              <div>
                <span className="font-serif font-bold text-lg text-foreground tracking-tight block leading-tight">
                  FinanceOS
                </span>
                <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground block leading-none">
                  Personal Finance
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground pl-4">
              <a href="#overview" className="hover:text-foreground transition-colors">Overview</a>
              <a href="#capabilities" className="hover:text-foreground transition-colors">Features</a>
              <a href="#security" className="hover:text-foreground transition-colors">Security & Privacy</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {isAuthenticated ? (
              <Button asChild size="sm" className="text-xs font-medium gap-1.5 shadow-sm">
                <Link to="/dashboard">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard ({user?.name?.split(' ')[0] || 'Account'})
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-xs font-medium">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="text-xs font-semibold shadow-sm">
                  <Link to="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="overview" className="pt-16 pb-20 px-4 sm:px-6 border-b border-border bg-gradient-to-b from-background via-background to-secondary/30">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs font-mono text-muted-foreground shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Personal Finance • Zero Bank Credentials Required</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-6xl text-foreground font-normal tracking-tight leading-[1.15]"
          >
            Take control of your personal finances.<br />
            <span className="italic text-primary font-serif">Clear, simple, and privacy-focused.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed font-normal"
          >
            FinanceOS turns your bank statements into organized transactions, clear spending insights, and shared family budgets—without connecting to third-party bank aggregators.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4"
          >
            {isAuthenticated ? (
              <Button asChild size="lg" className="w-full sm:w-auto text-xs font-semibold gap-2 shadow-sm">
                <Link to="/dashboard">
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="w-full sm:w-auto text-xs font-semibold gap-2 shadow-sm">
                  <Link to="/register">
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-xs font-medium">
                  <Link to="/login">Sign In</Link>
                </Button>
              </>
            )}
          </motion.div>

          {/* Statement Format Compatibility Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>PDF Bank Statements</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>CSV & Excel Spreadsheets</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>Family & Household Groups</span>
            </div>
          </div>
        </div>

        {/* Preview Card */}
        <div className="max-w-5xl mx-auto mt-14">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden text-left">
            <div className="border-b border-border px-4 py-2.5 bg-secondary/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-border" />
                <span className="w-2.5 h-2.5 rounded-full bg-border" />
                <span className="w-2.5 h-2.5 rounded-full bg-border" />
                <span className="ml-2 text-xs font-mono text-muted-foreground">app.financeos.com</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                SAMPLE OVERVIEW
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Net Worth
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-bold font-serif text-foreground tracking-tight">
                    ₹42,85,600
                  </span>
                  <span className="text-xs font-semibold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                    +4.2% This Quarter
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tracked across your bank accounts, credit cards, and investments.
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg border border-border bg-secondary/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-muted-foreground">Total Assets</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <span className="text-base font-bold text-foreground">₹58,12,400.00</span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5">Bank Accounts + Investments</span>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-secondary/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-muted-foreground">Total Liabilities</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  </div>
                  <span className="text-base font-bold text-destructive">₹15,26,800.00</span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5">Loans + Credit Cards</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full border-b border-border">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
            Features
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-foreground tracking-tight">
            Built for Complete Financial Clarity
          </h2>
          <p className="text-sm text-muted-foreground">
            Everything you need to organize statements, analyze spending, and manage household finances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((item, idx) => {
            const Icon = item.icon
            return (
              <Card key={idx} className="border border-border shadow-xs hover:border-primary/40 transition-colors">
                <CardContent className="p-6 space-y-3">
                  <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-foreground tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Security & Privacy Callout */}
      <section id="security" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="rounded-xl border border-border bg-secondary/40 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-primary font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Privacy-First Security</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground tracking-tight">
              Your Financial Data Stays Private
            </h2>
            <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
              We never ask for your bank passwords or third-party bank logins. Upload statements directly, process transactions securely, and maintain full control of your records.
            </p>
          </div>

          <Button asChild size="lg" className="shrink-0 text-xs font-semibold shadow-sm">
            <Link to="/register">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Editorial Footer */}
      <footer className="border-t border-border bg-card text-xs text-muted-foreground py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-foreground">FinanceOS</span>
            <span>•</span>
            <span>© {new Date().getFullYear()} FinanceOS. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
