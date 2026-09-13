import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  Globe,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/Card'
import { SkeletonLoader, ErrorState, EmptyState } from '@components/ui'
import { useSpendingAnalysis, useMonthlyComparison } from '@hooks/useDashboard'
import { useCurrency } from '@hooks/useCurrency'
import { useDualCurrencyConversion } from '@hooks/useCurrencyConversion'
import { useNavigate, useSearchParams } from 'react-router-dom'

const CHART_COLORS = ['#176B52', '#2A9D8F', '#E76F51', '#F4A261', '#E9C46A', '#6B7280', '#8B5CF6', '#EC4899']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type Tab = 'overview' | 'expenses' | 'categories' | 'cashflow'
type Period = 'all' | 'current_month' | 'last_month' | '3_months' | '6_months' | '1_year'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name?: string; value: number; color?: string; dataKey?: string }>
  label?: string
  formatter?: (value: number) => string
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5">
        <p className="font-serif font-bold text-foreground">{label || payload[0]?.name}</p>
        <div className="space-y-1">
          {payload.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || '#176B52' }} />
                <span className="capitalize">{item.name || item.dataKey}:</span>
              </span>
              <span className="font-mono font-bold text-foreground tabular-nums">
                {formatter ? formatter(item.value) : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

const Analytics: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const urlMonth = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null
  const urlYear = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null
  const urlPeriod = (searchParams.get('period') as Period) || null

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [selectedPeriod, setSelectedPeriod] = useState<Period | 'custom_month'>(
    urlMonth && urlYear ? 'custom_month' : urlPeriod || 'all'
  )
  const [selectedMonth, setSelectedMonth] = useState<number | null>(urlMonth)
  const [selectedYear, setSelectedYear] = useState<number | null>(urlYear)

  // Sync state if URL params change
  useEffect(() => {
    const qm = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null
    const qy = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null
    const qp = (searchParams.get('period') as Period) || null

    if (qm && qy) {
      setSelectedPeriod('custom_month')
      setSelectedMonth(qm)
      setSelectedYear(qy)
    } else if (qp) {
      setSelectedPeriod(qp)
      setSelectedMonth(null)
      setSelectedYear(null)
    }
  }, [searchParams])

  const analysisQueryParam =
    selectedPeriod === 'custom_month' && selectedMonth && selectedYear
      ? { month: selectedMonth, year: selectedYear }
      : { period: selectedPeriod as Period }

  const {
    data: analysis,
    isLoading: aLoading,
    error: aError,
    refetch: refetchA,
  } = useSpendingAnalysis(analysisQueryParam)

  const comparisonQueryParam =
    selectedPeriod === 'custom_month' && selectedMonth && selectedYear
      ? { month: selectedMonth, year: selectedYear }
      : undefined

  const {
    data: comparison,
    isLoading: cLoading,
    error: cError,
    refetch: refetchC,
  } = useMonthlyComparison(comparisonQueryParam)

  const { currency, format, formatCompact } = useCurrency()
  const { preferredCurrency, liveInrRate } = useDualCurrencyConversion()

  const isLoading = aLoading || cLoading
  const hasError = aError || cError

  const periodOptions: Array<{ id: Period; label: string }> = [
    { id: 'all', label: 'All Time' },
    { id: 'current_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: '3_months', label: '3 Months' },
    { id: '6_months', label: '6 Months' },
    { id: '1_year', label: 'This Year' },
  ]

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Overview', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'expenses', label: 'Expense Analysis', icon: <TrendingDown className="w-3.5 h-3.5" /> },
    { id: 'categories', label: 'Categories', icon: <Percent className="w-3.5 h-3.5" /> },
    { id: 'cashflow', label: 'Cash Flow', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="space-y-2">
          <SkeletonLoader type="text" height="h-7" width="w-48" />
          <SkeletonLoader type="text" height="h-4" width="w-80" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonLoader key={i} type="stat" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonLoader type="chart" />
          <SkeletonLoader type="chart" />
        </div>
      </div>
    )
  }

  if (hasError) {
    const errorObj = aError || cError
    const errorMessage =
      (errorObj as { message?: string })?.message ||
      'There was an error loading your analytics data. Please try again.'

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="pb-2 border-b border-border">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">Financial Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Detailed breakdown of your financial activity</p>
        </div>
        <ErrorState
          title="Failed to Load Analytics"
          message={errorMessage}
          onRetry={() => {
            refetchA()
            refetchC()
          }}
        />
      </div>
    )
  }

  if (!analysis || !comparison) return null

  const monthlyTrendData = (analysis.monthlyTrend || []).map((p) => ({
    label: `${MONTH_NAMES[(p.month || 1) - 1]} ${p.year}`,
    total: p.total || p.expenses || 0,
    expenses: p.expenses || p.total || 0,
    income: p.income || 0,
    savings: p.savings || (p.income || 0) - (p.expenses || p.total || 0),
  }))

  const categoryPieData = (analysis.byCategory || []).map((c) => ({
    name: c._id || 'Uncategorized',
    value: c.total || 0,
    count: c.count || 0,
  }))

  const totalIncome = analysis.incomeVsExpense?.income || 0
  const totalExpenses = analysis.incomeVsExpense?.expenses || 0
  const netSavings = analysis.incomeVsExpense?.savings || 0
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0

  const hasAnyData = totalIncome > 0 || totalExpenses > 0 || (analysis.byCategory && analysis.byCategory.length > 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Control Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
              Financial Analytics
            </h1>
            {analysis.periodLabel && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                <Calendar className="w-3 h-3" />
                {analysis.periodLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Track spending trends, cash flow velocity, and category allocations over time.
          </p>
        </div>

        {/* Period & Statement Month Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Presets */}
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/60 overflow-x-auto">
            <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground px-2 py-0.5 font-semibold">
              <Filter className="w-3 h-3" /> Preset:
            </span>
            {periodOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setSelectedPeriod(opt.id)
                  setSelectedMonth(null)
                  setSelectedYear(null)
                  setSearchParams({ period: opt.id })
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap ${
                  selectedPeriod === opt.id
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Statement Month Dropdown Picker */}
          {analysis?.availableMonths && analysis.availableMonths.length > 0 && (
            <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/60">
              <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground px-2 py-0.5 font-semibold">
                <Calendar className="w-3 h-3" /> Month:
              </span>
              <select
                value={
                  selectedPeriod === 'custom_month' && selectedMonth && selectedYear
                    ? `${selectedYear}-${selectedMonth}`
                    : ''
                }
                onChange={(e) => {
                  if (!e.target.value) return
                  const [y, m] = e.target.value.split('-').map(Number)
                  setSelectedPeriod('custom_month')
                  setSelectedMonth(m)
                  setSelectedYear(y)
                  setSearchParams({ year: String(y), month: String(m) })
                }}
                className="bg-card text-xs font-semibold text-foreground rounded-md px-2.5 py-1 border border-border/60 focus:outline-none cursor-pointer"
              >
                <option value="" disabled>Select statement month...</option>
                {analysis.availableMonths.map((m) => (
                  <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                    {m.label} ({m.count} txns)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ─── Base Currency Notice ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary font-medium">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span>
            Reporting Currency: <strong>{currency || preferredCurrency}</strong> • Multi-currency values converted at current rates.
          </span>
        </div>
        {preferredCurrency !== 'INR' && liveInrRate && (
          <span className="font-mono text-[11px] text-muted-foreground">
            1 {preferredCurrency} ≈ ₹{liveInrRate.toFixed(2)}
          </span>
        )}
      </div>

      {/* ─── Tab Navigation ─────────────────────────────────────────────────── */}
      <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border/60 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {!hasAnyData && selectedPeriod !== 'all' ? (
        <EmptyState
          icon={Calendar}
          title={`No Transactions in ${analysis.periodLabel || 'Selected Period'}`}
          description={
            analysis.availableMonths && analysis.availableMonths.length > 0
              ? `We couldn't find any financial activity in ${analysis.periodLabel || 'this period'}. You have statements recorded in ${analysis.availableMonths.map((m) => m.label).join(', ')}.`
              : `We couldn't find any financial activity in ${analysis.periodLabel || 'this period'}. Switch to All Time or upload a bank statement to populate analytics.`
          }
          action={{
            label: 'View All Time Analytics',
            onClick: () => {
              setSelectedPeriod('all')
              setSelectedMonth(null)
              setSelectedYear(null)
              setSearchParams({ period: 'all' })
            },
          }}
        />
      ) : !hasAnyData && selectedPeriod === 'all' ? (
        <EmptyState
          icon={Layers}
          title="No Financial Records Found"
          description="Import your bank statements (PDF, CSV, Excel) or manually log transactions to unlock real-time financial analytics."
          action={{
            label: 'Import Bank Statement',
            onClick: () => navigate('/statements'),
          }}
        />
      ) : (
        <>
          {/* ─── Overview Tab ──────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Matrix (4 Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Income */}
                <Card className="border border-border/80 shadow-sm bg-card hover:border-primary/40 transition-colors">
                  <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                        Total Inflow
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold">
                        Income
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <div className="font-sans text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                        +{format(totalIncome)}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs font-medium">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Income in {analysis.periodLabel || 'period'}</span>
                      </div>
                    </div>
                    <div className="w-full bg-secondary h-1 rounded-full mt-3 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }} />
                    </div>
                  </CardContent>
                </Card>

                {/* Total Expenses */}
                <Card className="border border-border/80 shadow-sm bg-card hover:border-primary/40 transition-colors">
                  <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                        Total Outflow
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px] font-semibold">
                        Expenses
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <div className="font-sans text-xl font-bold tracking-tight text-foreground tabular-nums">
                        -{format(totalExpenses)}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs font-medium">
                        <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
                        <span>Expenses in {analysis.periodLabel || 'period'}</span>
                      </div>
                    </div>
                    <div className="w-full bg-secondary h-1 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, (totalExpenses / (totalIncome || 1)) * 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Net Savings */}
                <Card className="border border-border/80 shadow-sm bg-card hover:border-primary/40 transition-colors">
                  <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                        Net Savings
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold ${
                          netSavings >= 0
                            ? 'bg-primary/10 text-primary'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {netSavings >= 0 ? 'Surplus' : 'Deficit'}
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <div
                        className={`font-sans text-xl font-bold tracking-tight tabular-nums ${
                          netSavings >= 0 ? 'text-primary' : 'text-destructive'
                        }`}
                      >
                        {netSavings >= 0 ? '+' : ''}
                        {format(netSavings)}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs font-medium">
                        <PiggyBank className={`h-3.5 w-3.5 ${netSavings >= 0 ? 'text-primary' : 'text-destructive'}`} />
                        <span>{netSavings >= 0 ? 'Net retained surplus' : 'Net cashflow deficit'}</span>
                      </div>
                    </div>
                    <div className="w-full bg-secondary h-1 rounded-full mt-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${netSavings >= 0 ? 'bg-primary' : 'bg-destructive'}`}
                        style={{ width: `${Math.min(100, Math.max(10, Math.abs(savingsRate)))}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Savings Rate */}
                <Card className="border border-border/80 shadow-sm bg-card hover:border-primary/40 transition-colors">
                  <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                        Savings Rate
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px] font-semibold">
                        {savingsRate >= 0 ? 'Target: ≥40%' : 'Deficit'}
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <div
                        className={`font-sans text-xl font-bold tracking-tight tabular-nums ${
                          savingsRate >= 0 ? 'text-foreground' : 'text-destructive'
                        }`}
                      >
                        {savingsRate}%
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs font-medium">
                        <Percent className="h-3.5 w-3.5 text-primary" />
                        <span>
                          {savingsRate >= 0
                            ? 'Of gross inflow retained'
                            : `Outflows exceeded inflows by ${Math.abs(savingsRate)}%`}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-secondary h-1 rounded-full mt-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${savingsRate >= 0 ? 'bg-primary' : 'bg-destructive'}`}
                        style={{ width: `${Math.max(0, Math.min(100, savingsRate >= 0 ? savingsRate : 100))}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Month-over-Month Comparison Matrix */}
              <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
                <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="font-serif text-base font-bold text-foreground">
                        Monthly Comparison
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        Performance variance: {comparison.previousMonth.label} vs {comparison.currentMonth.label}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/40" /> {comparison.previousMonth.label}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary" /> {comparison.currentMonth.label}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-muted/30 text-muted-foreground font-mono uppercase tracking-wider text-[10px] border-b border-border">
                          <th className="py-2.5 px-4 font-semibold">Metric</th>
                          <th className="py-2.5 px-4 text-right font-semibold">{comparison.previousMonth.label}</th>
                          <th className="py-2.5 px-4 text-right font-semibold">{comparison.currentMonth.label}</th>
                          <th className="py-2.5 px-4 text-right font-semibold">Difference</th>
                          <th className="py-2.5 px-4 text-right font-semibold">Change (%)</th>
                          <th className="py-2.5 px-4 font-semibold">Trend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {/* Income Row */}
                        <tr className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 font-medium text-foreground">Total Income</td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                            {format(comparison.previousMonth.income)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                            {format(comparison.currentMonth.income)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                            {comparison.comparison.incomeDiff >= 0 ? '+' : ''}
                            {format(comparison.comparison.incomeDiff)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {comparison.comparison.incomeChangePercent >= 0 ? '+' : ''}
                            {comparison.comparison.incomeChangePercent}%
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {comparison.comparison.incomeChangePercent >= 0 ? 'Increase' : 'Decrease'}
                            </span>
                          </td>
                        </tr>

                        {/* Expense Row */}
                        <tr className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 font-medium text-foreground">Total Expenses</td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                            {format(comparison.previousMonth.expenses)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                            {format(comparison.currentMonth.expenses)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400 font-medium">
                            {comparison.comparison.expenseDiff >= 0 ? '+' : ''}
                            {format(comparison.comparison.expenseDiff)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-mono font-bold ${
                              comparison.comparison.expenseChangePercent <= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {comparison.comparison.expenseChangePercent >= 0 ? '+' : ''}
                            {comparison.comparison.expenseChangePercent}%
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold bg-muted text-muted-foreground border border-border">
                              {comparison.comparison.expenseChangePercent <= 0 ? 'Decrease' : 'Increase'}
                            </span>
                          </td>
                        </tr>

                        {/* Savings Row */}
                        <tr className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 font-medium text-foreground">Net Savings</td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                            {format(comparison.previousMonth.savings)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-primary">
                            {format(comparison.currentMonth.savings)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-primary font-medium">
                            {comparison.comparison.savingsDiff >= 0 ? '+' : ''}
                            {format(comparison.comparison.savingsDiff)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-primary">
                            {comparison.comparison.savingsChangePercent >= 0 ? '+' : ''}
                            {comparison.comparison.savingsChangePercent}%
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20">
                              {comparison.currentMonth.savings >= 0 ? 'Surplus' : 'Deficit'}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Top Merchants & Income Sources Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Top Spending Merchants */}
                <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
                  <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
                    <CardTitle className="font-serif text-base font-bold text-foreground">
                      Top Spending Merchants
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Merchants with the highest cumulative expense
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {analysis.topMerchants.length === 0 ? (
                      <p className="p-8 text-center text-xs text-muted-foreground">
                        No merchant transactions recorded in this period
                      </p>
                    ) : (
                      <div className="divide-y divide-border/60">
                        {analysis.topMerchants.map((m, i) => (
                          <div
                            key={m._id}
                            className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-mono font-semibold text-muted-foreground border border-border/80">
                                {i + 1}
                              </span>
                              <p className="text-xs font-semibold text-foreground truncate">{m._id}</p>
                            </div>
                            <div className="text-right shrink-0 ml-4 font-sans">
                              <p className="text-xs font-bold text-foreground tabular-nums">{format(m.total)}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {m.count} txn{m.count !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Income Sources */}
                <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
                  <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
                    <CardTitle className="font-serif text-base font-bold text-foreground">
                      Top Inflow Sources
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Primary sources of income and credits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {!analysis.topIncomeSources || analysis.topIncomeSources.length === 0 ? (
                      <p className="p-8 text-center text-xs text-muted-foreground">
                        No income sources recorded in this period
                      </p>
                    ) : (
                      <div className="divide-y divide-border/60">
                        {analysis.topIncomeSources.map((m, i) => (
                          <div
                            key={m._id}
                            className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                {i + 1}
                              </span>
                              <p className="text-xs font-semibold text-foreground truncate">{m._id}</p>
                            </div>
                            <div className="text-right shrink-0 ml-4 font-sans">
                              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                +{format(m.total)}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {m.count} credit{m.count !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ─── Expenses Tab ──────────────────────────────────────────────── */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
                <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
                  <CardTitle className="font-serif text-base font-bold text-foreground">
                    Monthly Spending Trend
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Historical expense velocity across all recorded statements
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {monthlyTrendData.length === 0 ? (
                    <div className="flex h-64 items-center justify-center">
                      <p className="text-xs text-muted-foreground">No spending trend data available</p>
                    </div>
                  ) : (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="expenseAreaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#E76F51" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#E76F51" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            axisLine={{ stroke: 'var(--border)' }}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => formatCompact(v)}
                          />
                          <Tooltip content={<CustomTooltip formatter={(v: number) => format(v)} />} />
                          <Area
                            type="monotone"
                            dataKey="expenses"
                            stroke="#E76F51"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#expenseAreaGrad)"
                            name="Expenses"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Largest Individual Expenses */}
              <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
                <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
                  <CardTitle className="font-serif text-base font-bold text-foreground">
                    Largest Individual Expenses
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Highest individual outflow transactions in {analysis.periodLabel || 'current period'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {analysis.highestExpenses.length === 0 ? (
                    <p className="p-8 text-center text-xs text-muted-foreground">No individual expenses recorded</p>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {analysis.highestExpenses.map((e, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors"
                        >
                          <div>
                            <p className="text-xs font-semibold text-foreground">{e.merchant}</p>
                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                              {e.category} • {new Date(e.date).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-xs font-bold text-foreground tabular-nums font-sans">
                            -{format(e.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Categories Tab ────────────────────────────────────────────── */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Category Donut Distribution */}
                <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
                  <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
                    <CardTitle className="font-serif text-base font-bold text-foreground">
                      Category Breakdown
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Spending distribution in {analysis.periodLabel || 'current period'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {categoryPieData.length === 0 ? (
                      <div className="flex h-64 items-center justify-center">
                        <p className="text-xs text-muted-foreground">No category data available</p>
                      </div>
                    ) : (
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryPieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={3}
                              stroke="var(--card)"
                              strokeWidth={2}
                            >
                              {categoryPieData.map((_e, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip formatter={(v: number) => format(v)} />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Category Volume Bars */}
                <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
                  <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
                    <CardTitle className="font-serif text-base font-bold text-foreground">
                      Spending by Category
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Total volume spent per category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {analysis.byCategory.length === 0 ? (
                      <div className="flex h-64 items-center justify-center">
                        <p className="text-xs text-muted-foreground">No category data</p>
                      </div>
                    ) : (
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={analysis.byCategory.map((c) => ({ name: c._id, amount: c.total }))}
                            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                              axisLine={{ stroke: 'var(--border)' }}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) => formatCompact(v)}
                            />
                            <Tooltip content={<CustomTooltip formatter={(v: number) => format(v)} />} />
                            <Bar dataKey="amount" fill="#176B52" radius={[4, 4, 0, 0]} name="Amount" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Category Comparison Table */}
              <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
                <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
                  <CardTitle className="font-serif text-base font-bold text-foreground">
                    Category Variance Comparison
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Comparison of category spending against the preceding period
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {analysis.categoryComparison.length === 0 ? (
                    <p className="p-8 text-center text-xs text-muted-foreground">No comparison data available</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/30 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                            <th className="px-4 py-2.5">Category</th>
                            <th className="px-4 py-2.5 text-right">Current Period</th>
                            <th className="px-4 py-2.5 text-right">Previous Period</th>
                            <th className="px-4 py-2.5 text-right">Variance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {analysis.categoryComparison.map((c) => (
                            <tr key={c.category} className="hover:bg-muted/20 transition-colors font-sans">
                              <td className="px-4 py-2.5 font-medium text-foreground">{c.category}</td>
                              <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{format(c.currentAmount)}</td>
                              <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                                {format(c.previousAmount)}
                              </td>
                              <td
                                className={`px-4 py-2.5 text-right font-bold tabular-nums font-mono ${
                                  c.changePercent <= 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {c.changePercent >= 0 ? '+' : ''}
                                {c.changePercent}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Cash Flow Tab ─────────────────────────────────────────────── */}
          {activeTab === 'cashflow' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-border/80 shadow-sm bg-card p-4 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <ArrowDownLeft className="w-4 h-4" />
                    <p className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                      Total Inflow (Income)
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums font-sans">
                    +{format(totalIncome)}
                  </p>
                </Card>
                <Card className="border border-border/80 shadow-sm bg-card p-4 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <ArrowUpRight className="w-4 h-4" />
                    <p className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                      Total Outflow (Expenses)
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-foreground tabular-nums font-sans">
                    -{format(totalExpenses)}
                  </p>
                </Card>
                <Card className="border border-border/80 shadow-sm bg-card p-4 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-primary">
                    <PiggyBank className="w-4 h-4" />
                    <p className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                      Net Cash Flow Surplus
                    </p>
                  </div>
                  <p
                    className={`text-2xl font-bold tabular-nums font-sans ${
                      netSavings >= 0 ? 'text-primary' : 'text-destructive'
                    }`}
                  >
                    {netSavings >= 0 ? '+' : ''}
                    {format(netSavings)}
                  </p>
                </Card>
              </div>

              {/* Inflow vs Outflow Multi-Bar Chart */}
              <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
                <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="font-serif text-base font-bold text-foreground">
                        Cash Flow Dynamics (Income vs Expenses)
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        Monthly Inflow vs Outflow over time
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Income
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Expenses
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {monthlyTrendData.length === 0 ? (
                    <div className="flex h-64 items-center justify-center">
                      <p className="text-xs text-muted-foreground">No historical records available</p>
                    </div>
                  ) : (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            axisLine={{ stroke: 'var(--border)' }}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => formatCompact(v)}
                          />
                          <Tooltip content={<CustomTooltip formatter={(v: number) => format(v)} />} />
                          <Legend />
                          <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                          <Bar dataKey="expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Expenses" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Analytics
