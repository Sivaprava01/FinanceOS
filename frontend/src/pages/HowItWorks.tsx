import React from 'react'
import { Link } from 'react-router-dom'
import { Upload, Zap, Tag, BarChart2, TrendingUp, Users, ArrowRight, Shield } from 'lucide-react'
import { Card, CardContent } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Badge } from '@components/ui/Badge'

interface Step {
  number: number
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  linkText: string
  linkHref: string
}

const steps: Step[] = [
  {
    number: 1,
    icon: Upload,
    title: 'Upload Bank Statements',
    description:
      'Export statements from your bank in PDF (including password-protected files), CSV, or Excel formats (.xls, .xlsx). Drag and drop them into FinanceOS.',
    linkText: 'Go to Statements',
    linkHref: '/statements',
  },
  {
    number: 2,
    icon: Zap,
    title: 'Automatic Extraction',
    description:
      'FinanceOS parses line items, standardizes merchant names, parses dates, and separates debits from credits with high accuracy.',
    linkText: 'View Dashboard',
    linkHref: '/dashboard',
  },
  {
    number: 3,
    icon: Tag,
    title: 'Review & Categorize',
    description:
      'View extracted transactions in your feed. Categorize spending, modify merchant names, or create manual records whenever needed.',
    linkText: 'Manage Transactions',
    linkHref: '/transactions',
  },
  {
    number: 4,
    icon: BarChart2,
    title: 'Track Net Worth & KPIs',
    description:
      'Monitor real-time income, total expenses, savings rate, and net worth across all your connected accounts and statements.',
    linkText: 'Explore Dashboard',
    linkHref: '/dashboard',
  },
  {
    number: 5,
    icon: TrendingUp,
    title: 'Deep Analytics',
    description:
      'Analyze month-over-month cashflow trends, merchant frequency, category breakdowns, and income vs. expense balance.',
    linkText: 'Open Analytics',
    linkHref: '/analytics',
  },
  {
    number: 6,
    icon: Users,
    title: 'Family & Shared Finances',
    description:
      'Invite household members, assign custom access permissions (Owner, Admin, Member, Viewer), and manage shared family balances.',
    linkText: 'Family Setup',
    linkHref: '/family',
  },
]

const HowItWorks: React.FC = () => (
  <div className="space-y-6 max-w-5xl">
    {/* Header */}
    <div className="pb-2 border-b border-border">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold tracking-tight text-foreground">How FinanceOS Works</h1>
        <Badge variant="secondary" size="sm">System Guide</Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">
        A step-by-step workflow guide to getting the most out of your personal finance operating system.
      </p>
    </div>

    {/* Step Grid */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {steps.map((step) => {
        const Icon = step.icon
        return (
          <Card key={step.number} className="flex flex-col justify-between hover:border-primary/40 transition-colors">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                  0{step.number}
                </div>
                <div className="p-1.5 rounded-md bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </CardContent>

            <div className="px-4 pb-4 pt-0">
              <Link
                to={step.linkHref}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <span>{step.linkText}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>
        )
      })}
    </div>

    {/* Security & Privacy Banner */}
    <Card className="bg-muted/20 border border-border">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-success/10 text-success shrink-0 mt-0.5 sm:mt-0">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground">Data Privacy & Local Integrity</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Your financial statements are processed securely with strict access controls and encrypted storage.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="xs" className="shrink-0 text-xs">
          <Link to="/settings">View Security Settings</Link>
        </Button>
      </CardContent>
    </Card>
  </div>
)

export default HowItWorks
