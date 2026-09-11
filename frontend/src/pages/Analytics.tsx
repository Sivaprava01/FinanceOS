import React, { useState } from 'react'
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
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  Globe,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/Card'
import { SkeletonLoader, ErrorState } from '@components/ui'
import { useSpendingAnalysis, useMonthlyComparison } from '@hooks/useDashboard'
import { useCurrency } from '@hooks/useCurrency'

const CHART_COLORS = ['#176B52', '#2A9D8F', '#E76F51', '#F4A261', '#E9C46A', '#6B7280', '#8B5CF6', '#EC4899']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type Tab = 'overview' | 'expenses' | 'categories' | 'cashflow'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name?: string; value: number; color?: string }>
  label?: string
  formatter?: (value: number) => string
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1">
        <p className="font-serif font-bold text-foreground">{label || payload[0]?.name}</p>
        <p className="text-primary font-mono font-bold text-sm tabular-nums">
          {formatter ? formatter(payload[0].value) : payload[0].value}
        </p>
      </div>
    )
  }
  return null
}

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { data: analysis, isLoading: aLoading, error: aError, refetch: refetchA } = useSpendingAnalysis()
  const { data: comparison, isLoading: cLoading, error: cError, refetch: refetchC } = useMonthlyComparison()
  const { currency, format, formatCompact } = useCurrency()

  const isLoading = aLoading || cLoading
  const hasError = aError || cError

  if (isLoading) {
    return (
      <div className="space-y-6">
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
      <div className="space-y-6">
        <div className="pb-2 border-b border-border">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
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
    total: p.total || 0,
    expenses: p.total || 0,
  }))

  const categoryPieData = (analysis.byCategory || []).map((c) => ({
    name: c._id || 'Uncategorized',
    value: c.total || 0,
  }))

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'expenses', label: 'Expense Analysis' },
    { id: 'categories', label: 'Categories' },
    { id: 'cashflow', label: 'Cash Flow' },
  ]

  const totalIncome = analysis.incomeVsExpense.income || 0
  const totalExpenses = analysis.incomeVsExpense.expenses || 0
  const netSavings = analysis.incomeVsExpense.savings || 0
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Control Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-wider font-semibold">
              Financial Intelligence
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-primary font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Realtime Aggregation
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Analytics
          </h1>
          <p className="text-xs text-muted-foreground">
            Multi-period financial trajectory, category dispersion, and month-over-month variances.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Settlement Currency Notice ────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary font-medium">
        <Globe className="h-3.5 w-3.5 shrink-0" />
        <span>
          Settlement Base Currency: <strong>{currency}</strong> • Cross-currency transactions converted at current market rates.
        </span>
      </div>

      {/* ─── Overview Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Matrix (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Inflow */}
            <Card className="border border-border/80 shadow-sm bg-card hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                    Total Income
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold">
                    Inflow
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="font-sans text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +{format(totalIncome)}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs font-medium">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Current period revenue</span>
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
                    Total Expenses
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px] font-semibold">
                    Outflow
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="font-sans text-xl font-bold tracking-tight text-foreground tabular-nums">
                    -{format(totalExpenses)}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs font-medium">
                    <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
                    <span>Current period debits</span>
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
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] font-semibold">
                    Surplus
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className={`font-sans text-xl font-bold tracking-tight tabular-nums ${netSavings >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {netSavings >= 0 ? '+' : ''}{format(netSavings)}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs font-medium">
                    <PiggyBank className="h-3.5 w-3.5 text-primary" />
                    <span>Income minus expenses</span>
                  </div>
                </div>
                <div className="w-full bg-secondary h-1 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
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
                    Target: ≥40%
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="font-sans text-xl font-bold tracking-tight text-foreground tabular-nums">
                    {savingsRate}%
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs font-medium">
                    <Percent className="h-3.5 w-3.5 text-primary" />
                    <span>Of total income saved</span>
                  </div>
                </div>
                <div className="w-full bg-secondary h-1 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
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
                    Variance: {comparison.previousMonth.label} vs {comparison.currentMonth.label}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40" /> Previous Month
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" /> Current Month
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
                      <th className="py-2.5 px-4 text-right font-semibold">Previous Month</th>
                      <th className="py-2.5 px-4 text-right font-semibold">Current Month</th>
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
                        {comparison.comparison.incomeDiff >= 0 ? '+' : ''}{format(comparison.comparison.incomeDiff)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {comparison.comparison.incomeChangePercent >= 0 ? '+' : ''}{comparison.comparison.incomeChangePercent}%
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
                        {comparison.comparison.expenseDiff >= 0 ? '+' : ''}{format(comparison.comparison.expenseDiff)}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${comparison.comparison.expenseChangePercent <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {comparison.comparison.expenseChangePercent >= 0 ? '+' : ''}{comparison.comparison.expenseChangePercent}%
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
                        {comparison.comparison.savingsDiff >= 0 ? '+' : ''}{format(comparison.comparison.savingsDiff)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-primary">
                        {comparison.comparison.savingsChangePercent >= 0 ? '+' : ''}{comparison.comparison.savingsChangePercent}%
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

          {/* Top Counterparties / Merchants Leaderboard */}
          <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
              <CardTitle className="font-serif text-base font-bold text-foreground">
                Top Merchants & Counterparties
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Highest total spending by merchant across your accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {analysis.topMerchants.length === 0 ? (
                <p className="p-8 text-center text-xs text-muted-foreground">
                  No merchant transactions recorded in current period
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
                          {m.count} transaction{m.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Expenses Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
              <CardTitle className="font-serif text-base font-bold text-foreground">
                Monthly Spending Trend
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Total monthly expenses over time
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
                          <stop offset="5%" stopColor="#176B52" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#176B52" stopOpacity={0.0} />
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
                        dataKey="total"
                        stroke="#176B52"
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

          <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
              <CardTitle className="font-serif text-base font-bold text-foreground">
                Largest Individual Expenses
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Highest individual transactions in current period
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

      {/* ─── Categories Tab ────────────────────────────────────────────────── */}
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
                  Spending distribution by category
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
                  Total amount spent per category
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
                Category Period Comparison
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Comparison of category spending against prior period
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
                        <th className="px-4 py-2.5 text-right">This Month</th>
                        <th className="px-4 py-2.5 text-right">Last Month</th>
                        <th className="px-4 py-2.5 text-right">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {analysis.categoryComparison.map((c) => (
                        <tr key={c.category} className="hover:bg-muted/20 transition-colors font-sans">
                          <td className="px-4 py-2.5 font-medium text-foreground">{c.category}</td>
                          <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{format(c.currentAmount)}</td>
                          <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">{format(c.previousAmount)}</td>
                          <td className={`px-4 py-2.5 text-right font-bold tabular-nums font-mono ${
                            c.changePercent <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {c.changePercent >= 0 ? '+' : ''}{c.changePercent}%
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

      {/* ─── Cash Flow Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-border/80 shadow-sm bg-card p-4 text-center space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Total Inflow
              </p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums font-sans">
                +{format(totalIncome)}
              </p>
            </Card>
            <Card className="border border-border/80 shadow-sm bg-card p-4 text-center space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Total Outflow
              </p>
              <p className="text-2xl font-bold text-foreground tabular-nums font-sans">
                -{format(totalExpenses)}
              </p>
            </Card>
            <Card className="border border-border/80 shadow-sm bg-card p-4 text-center space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Net Savings
              </p>
              <p className={`text-2xl font-bold tabular-nums font-sans ${netSavings >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {netSavings >= 0 ? '+' : ''}{format(netSavings)}
              </p>
            </Card>
          </div>

          <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
              <CardTitle className="font-serif text-base font-bold text-foreground">
                Monthly Spending Trend
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Monthly expenses across statement records
              </CardDescription>
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
                      <Bar dataKey="total" fill="#176B52" radius={[4, 4, 0, 0]} name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Analytics
