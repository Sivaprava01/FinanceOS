/**
 * How It Works Page
 * Premium product guide explaining the complete FinanceOS end-to-end workflow,
 * data processing pipeline, and quick-start actions.
 */

import React from 'react'
import { Link } from 'react-router-dom'
import {
  UploadCloud,
  Cpu,
  SlidersHorizontal,
  Wallet,
  TrendingUp,
  Users,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Database,
  LineChart,
} from 'lucide-react'
import { Card, CardContent } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Badge } from '@components/ui/Badge'

interface WorkflowStep {
  number: string
  stepIndex: number
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
  description: string
  linkText: string
  linkHref: string
  tag: string
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    number: '01',
    stepIndex: 1,
    icon: UploadCloud,
    title: 'Upload Bank Statements',
    subtitle: 'Multi-Format Support',
    description:
      'Export statements from any bank or credit card in PDF (including password-protected files), CSV, XLS, or XLSX. Drop them directly into FinanceOS.',
    linkText: 'Go to Statements',
    linkHref: '/statements',
    tag: 'Input',
  },
  {
    number: '02',
    stepIndex: 2,
    icon: Cpu,
    title: 'Automatic Extraction',
    subtitle: 'Automated Parsing Engine',
    description:
      'FinanceOS parses individual line items, standardizes messy merchant names, resolves ISO currencies, and cleanly separates debits from credits.',
    linkText: 'View Statements',
    linkHref: '/statements',
    tag: 'Processing',
  },
  {
    number: '03',
    stepIndex: 3,
    icon: SlidersHorizontal,
    title: 'Review & Categorize',
    subtitle: 'Transaction Management',
    description:
      'Inspect imported transactions in your feed. Correct merchant names with machine-learned mapping rules, assign categories, or add manual records.',
    linkText: 'Manage Transactions',
    linkHref: '/transactions',
    tag: 'Organization',
  },
  {
    number: '04',
    stepIndex: 4,
    icon: Wallet,
    title: 'Track Net Worth & KPIs',
    subtitle: 'Financial Command Center',
    description:
      'Monitor real-time income, total expenses, savings rate, active loans, and net worth across all your connected accounts and statements.',
    linkText: 'Explore Dashboard',
    linkHref: '/dashboard',
    tag: 'Overview',
  },
  {
    number: '05',
    stepIndex: 5,
    icon: TrendingUp,
    title: 'Deep Analytics',
    subtitle: 'Patterns & Trends',
    description:
      'Analyze month-over-month cash flow trends, merchant spending frequency, category breakdowns, and real-time dual-currency valuations.',
    linkText: 'Open Analytics',
    linkHref: '/analytics',
    tag: 'Intelligence',
  },
  {
    number: '06',
    stepIndex: 6,
    icon: Users,
    title: 'Family & Shared Finances',
    subtitle: 'Household Collaboration',
    description:
      'Invite household members, assign role-based access permissions (Owner, Admin, Member, Viewer), and manage shared family balances.',
    linkText: 'Family Setup',
    linkHref: '/family',
    tag: 'Collaboration',
  },
]

interface PipelineNode {
  step: string
  title: string
  detail: string
  icon: React.ComponentType<{ className?: string }>
}

const PIPELINE_NODES: PipelineNode[] = [
  {
    step: '1',
    title: 'Bank Statement',
    detail: 'PDF, CSV, XLSX files',
    icon: FileSpreadsheet,
  },
  {
    step: '2',
    title: 'Extraction',
    detail: 'OCR & text token parsing',
    icon: Cpu,
  },
  {
    step: '3',
    title: 'Normalization',
    detail: 'Dates, debits/credits & currencies',
    icon: Layers,
  },
  {
    step: '4',
    title: 'Categorization',
    detail: 'Learned merchant dictionary',
    icon: SlidersHorizontal,
  },
  {
    step: '5',
    title: 'Analytics',
    detail: 'Aggregations & trend calculations',
    icon: LineChart,
  },
  {
    step: '6',
    title: 'Financial Insights',
    detail: 'Net worth & health metrics',
    icon: Sparkles,
  },
]

const HowItWorks: React.FC = () => {
  return (
    <div className="space-y-8 max-w-6xl pb-8">
      {/* ─── SECTION 1: HERO ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-gradient-to-b from-card via-card/90 to-background p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-primary uppercase">
              <Sparkles className="h-3 w-3" />
              SYSTEM GUIDE
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">v1.0</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            How FinanceOS Works
          </h1>

          <p className="text-sm font-medium text-foreground/90 leading-relaxed">
            From bank statements to financial clarity.
          </p>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            FinanceOS turns your raw financial data into organized transactions, meaningful analytics,
            and a unified financial command center. Follow the connected six-step workflow below to get
            the most out of your financial operating system.
          </p>

          {/* Quick feature highlights */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>Multi-Format Support</span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>Learned Merchant Mappings</span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>Auto Currency Detection</span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>Role-Based Family Sharing</span>
            </div>
          </div>
        </div>

        {/* Subtle decorative background glow */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl"
          aria-hidden="true"
        />
      </div>

      {/* ─── SECTION 2: WORKFLOW (6 CONNECTED STAGES) ───────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              End-to-End Workflow
            </h2>
            <p className="text-xs text-muted-foreground">
              A continuous, structured cycle designed to convert statement exports into actionable decisions.
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground/80">Stages 01 → 06</span>
        </div>

        {/* Workflow Grid / Connected Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW_STEPS.map((step, idx) => {
            const Icon = step.icon
            return (
              <Card
                key={step.number}
                className="group relative flex flex-col justify-between border-border/80 bg-card/60 hover:border-primary/50 hover:bg-card hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Step Top Bar / Accent */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-border group-hover:bg-primary transition-colors" />

                <CardContent className="p-5 space-y-4">
                  {/* Step Header: Number, Tag & Icon */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-xs font-mono">
                        {step.number}
                      </div>
                      <Badge variant="secondary" size="sm" className="text-[10px] tracking-wide uppercase">
                        {step.tag}
                      </Badge>
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-primary uppercase tracking-wider">
                      {step.subtitle}
                    </p>
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </CardContent>

                {/* Step Footer Link */}
                <div className="border-t border-border/60 bg-muted/20 px-5 py-3 flex items-center justify-between">
                  <Link
                    to={step.linkHref}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                  >
                    <span>{step.linkText}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </Link>

                  <span className="text-[11px] text-muted-foreground/60 font-mono">
                    Step {idx + 1} of 6
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* ─── SECTION 3: WHAT HAPPENS TO YOUR DATA (DATA PIPELINE) ────────────── */}
      <Card className="border-border/80 bg-card/60 shadow-xs overflow-hidden">
        <CardContent className="p-6 sm:p-7 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                What Happens to Your Data
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              How FinanceOS processes your uploaded statement files into structured intelligence.
            </p>
          </div>

          {/* Desktop & Tablet Horizontal Pipeline */}
          <div className="hidden md:grid grid-cols-6 gap-2.5 relative">
            {PIPELINE_NODES.map((node, i) => {
              const NodeIcon = node.icon
              return (
                <div key={node.step} className="relative flex flex-col items-center text-center space-y-2.5">
                  {/* Connecting line */}
                  {i < PIPELINE_NODES.length - 1 && (
                    <div
                      className="absolute top-4 left-1/2 w-full h-0.5 bg-border/80 -z-0"
                      aria-hidden="true"
                    />
                  )}

                  {/* Node Circle */}
                  <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-background text-primary shadow-xs">
                    <NodeIcon className="h-3.5 w-3.5" />
                  </div>

                  {/* Node Details */}
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">{node.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">{node.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile Vertical Pipeline */}
          <div className="md:hidden relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {PIPELINE_NODES.map((node) => {
              const NodeIcon = node.icon
              return (
                <div key={node.step} className="relative flex items-start gap-3">
                  <div className="absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full border border-primary/30 bg-background text-primary text-[10px] font-bold">
                    <NodeIcon className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{node.title}</p>
                    <p className="text-[11px] text-muted-foreground">{node.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ─── SECTION 4: QUICK START CTA ──────────────────────────────────────── */}
      <Card className="border-primary/40 bg-gradient-to-r from-primary/10 via-card to-card p-6 sm:p-8 shadow-sm">
        <CardContent className="p-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary">
                QUICK START
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Ready to get started?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Import your first bank statement and let FinanceOS automatically organize your financial records
              into clear, actionable insights.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
            <Button asChild size="sm" className="gap-2 text-xs shadow-sm">
              <Link to="/statements">
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Upload a Statement</span>
              </Link>
            </Button>

            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
              <Link to="/dashboard">
                <span>View Dashboard</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── SECTION 5: SECURITY & PRIVACY GUARANTEE ─────────────────────────── */}
      <Card className="border-border/70 bg-muted/20">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success shrink-0 mt-0.5 sm:mt-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">
                Data Privacy & Secure Statement Deletion
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed max-w-2xl">
                FinanceOS strictly isolates user datasets. Uploaded statement files are securely processed and
                automatically cleaned up following successful transaction extraction.
              </p>
            </div>
          </div>

          <Button asChild variant="ghost" size="xs" className="shrink-0 text-xs text-muted-foreground hover:text-foreground">
            <Link to="/settings">Privacy Settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default HowItWorks
