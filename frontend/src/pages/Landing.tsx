/**
 * Landing Page - FinanceOS Public Landing
 * Data-dense, restrained fintech landing page with blue primary theme.
 */

import { motion } from 'framer-motion'
import { ArrowRight, BarChart3, Lock, Users, Zap, TrendingUp, PieChart, CheckCircle2, LayoutDashboard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@components/ui/Button'
import { Badge } from '@components/ui/Badge'
import { Card, CardContent } from '@components/ui/Card'
import { useAuth } from '@hooks/useAuth'

export default function Landing() {
  const { isAuthenticated, user } = useAuth()

  const features = [
    {
      icon: BarChart3,
      title: 'Visual Financial Overview',
      description: 'Real-time financial metrics, tabular numbers, and net balance calculation.',
    },
    {
      icon: Lock,
      title: 'Bank-Grade Security',
      description: 'Local processing and encrypted storage for maximum transaction data privacy.',
    },
    {
      icon: Users,
      title: 'Shared Family Workspaces',
      description: 'Invite family members with granular role-based permissions (Admin, Member, Viewer).',
    },
    {
      icon: Zap,
      title: 'Automated Extraction',
      description: 'Upload PDF, password-protected PDF, CSV, or Excel statements with line-item extraction.',
    },
    {
      icon: TrendingUp,
      title: 'Cashflow Analytics',
      description: 'Track income vs expense ratios, top merchant spending, and category distribution trends.',
    },
    {
      icon: PieChart,
      title: 'Smart Categorization',
      description: 'Automatic tag assignment with customizable system and user category locks.',
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border backdrop-blur-md bg-background/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2.5 outline-none">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-xs">
              F
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">FinanceOS</span>
          </Link>
          <div className="flex gap-2 items-center">
            {isAuthenticated ? (
              <Button asChild size="xs" className="text-xs font-semibold gap-1.5">
                <Link to="/dashboard">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard ({user?.name?.split(' ')[0] || 'Account'})
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="xs" className="text-xs">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild size="xs" className="text-xs font-semibold">
                  <Link to="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-border bg-muted/10">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="default" size="md" className="mx-auto font-medium">
              ✨ Bank Statement Parser & Financial Control System
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground"
          >
            Your Personal Finance <br className="hidden sm:inline" />
            <span className="text-primary">Operating System</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Upload bank statements, automate transaction parsing, track family spending, and inspect cashflow analytics with a fast, data-dense fintech layout.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center pt-2"
          >
            {isAuthenticated ? (
              <>
                <Button asChild size="default" className="text-xs font-semibold gap-1.5">
                  <Link to="/dashboard">
                    Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="default" className="text-xs">
                  <Link to="/statements">Upload Statement</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="default" className="text-xs font-semibold gap-1.5">
                  <Link to="/register">
                    Start Tracking Free <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="default" className="text-xs">
                  <Link to="/login">Sign In to Dashboard</Link>
                </Button>
              </>
            )}
          </motion.div>

          <div className="pt-4 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" /> PDF, CSV & Excel
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Password-Protected PDF
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Family Workspace
            </span>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12 space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Built for Financial Clarity</h2>
          <p className="text-xs text-muted-foreground max-w-xl mx-auto">
            Everything you need to master your bank statements and manage household balances
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-5 space-y-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border bg-card">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h2 className="text-lg font-bold text-foreground">Ready to streamline your financial records?</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Create an account in seconds and upload your first bank statement.
          </p>
          {isAuthenticated ? (
            <Button asChild size="sm" className="text-xs font-semibold">
              <Link to="/dashboard">Open Your Dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="text-xs font-semibold">
              <Link to="/register">Create Free Account</Link>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>&copy; {new Date().getFullYear()} FinanceOS. Encrypted & Confidential.</p>
          <div className="flex gap-4">
            <Link to="/how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link to="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-foreground transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
