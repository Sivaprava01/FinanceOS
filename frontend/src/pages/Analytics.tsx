import React, { useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { SkeletonLoader, ErrorState } from '@components/ui'
import { useSpendingAnalysis, useMonthlyComparison } from '@hooks/useDashboard'
import { useCurrency } from '@hooks/useCurrency'

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#ec4899', '#f97316']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type Tab = 'overview' | 'expenses' | 'categories' | 'cashflow'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name?: string; value: number }>
  label?: string
  formatter?: (value: number) => string
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card/95 p-2.5 shadow-md backdrop-blur-xs text-xs">
        <p className="font-semibold text-foreground mb-1">{label || payload[0]?.name}</p>
        <p className="text-primary font-medium font-numeric tabular-nums">
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
        <div className="space-y-1">
          <SkeletonLoader type="text" height="h-6" width="w-40" />
          <SkeletonLoader type="text" height="h-4" width="w-64" />
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
    return (
      <div className="space-y-6">
        <div className="pb-2 border-b border-border">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Detailed breakdown of your financial activity</p>
        </div>
        <ErrorState
          title="Failed to Load Analytics"
          message="There was an error loading your analytics data. Please try again."
          onRetry={() => { refetchA(); refetchC() }}
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

  const savingsRate = analysis.incomeVsExpense.income > 0
    ? Math.round((analysis.incomeVsExpense.savings / analysis.incomeVsExpense.income) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Financial trends, spending distribution, and comparative analysis
          </p>
        </div>

        {/* Tab Selector */}
        <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-1 w-full sm:w-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all whitespace-nowrap flex-1 sm:flex-none ${
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

      {/* Currency Context Notice */}
      <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs font-medium text-primary">
        <Globe className="h-3.5 w-3.5 shrink-0" />
        <span>All analytics totals & charts are converted to <strong>{currency}</strong> using live market exchange rates.</span>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Income</p>
                    <p className="mt-1.5 text-xl font-bold text-success tabular-nums font-numeric">
                      {format(analysis.incomeVsExpense.income)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Current period inflow</p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Expenses</p>
                    <p className="mt-1.5 text-xl font-bold text-destructive tabular-nums font-numeric">
                      {format(analysis.incomeVsExpense.expenses)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Current period outflow</p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Savings</p>
                    <p className={`mt-1.5 text-xl font-bold tabular-nums font-numeric ${
                      analysis.incomeVsExpense.savings >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {format(analysis.incomeVsExpense.savings)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Income minus expenses</p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <PiggyBank className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Savings Rate</p>
                    <p className="mt-1.5 text-xl font-bold text-foreground tabular-nums font-numeric">
                      {savingsRate}%
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Of gross income saved</p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-foreground">
                    <Percent className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Month comparison */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Month-over-Month Comparison</CardTitle>
              <CardDescription>{comparison.previousMonth.label} vs {comparison.currentMonth.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Income', current: comparison.currentMonth.income, prev: comparison.previousMonth.income, diff: comparison.comparison.incomeDiff, pct: comparison.comparison.incomeChangePercent },
                  { label: 'Expenses', current: comparison.currentMonth.expenses, prev: comparison.previousMonth.expenses, diff: comparison.comparison.expenseDiff, pct: comparison.comparison.expenseChangePercent },
                  { label: 'Net Savings', current: comparison.currentMonth.savings, prev: comparison.previousMonth.savings, diff: comparison.comparison.savingsDiff, pct: comparison.comparison.savingsChangePercent },
                ].map((row) => (
                  <div key={row.label} className="rounded-lg border border-border/80 bg-secondary/20 p-4 space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{row.label}</p>
                    <p className="text-xl font-bold text-foreground tabular-nums font-numeric">{format(row.current)}</p>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                      <span className="text-muted-foreground text-[11px]">Previous: {format(row.prev)}</span>
                      <span className={`font-semibold tabular-nums text-[11px] ${
                        row.pct >= 0 ? (row.label === 'Expenses' ? 'text-destructive' : 'text-success') : (row.label === 'Expenses' ? 'text-success' : 'text-destructive')
                      }`}>
                        {row.pct >= 0 ? '+' : ''}{row.pct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top merchants */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Top Merchants & Payees</CardTitle>
              <CardDescription>Highest volume transaction partners this month</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {analysis.topMerchants.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">No merchant activity recorded</p>
              ) : (
                <div className="divide-y divide-border border-t border-border">
                  {analysis.topMerchants.map((m, i) => (
                    <div key={m._id} className="flex items-center justify-between px-5 py-3 hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-muted-foreground">
                          {i + 1}
                        </span>
                        <p className="text-xs font-medium text-foreground truncate">{m._id}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4 font-numeric">
                        <p className="text-xs font-bold text-foreground tabular-nums">{format(m.total)}</p>
                        <p className="text-[10px] text-muted-foreground">{m.count} transaction{m.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Monthly Spending Outflow</CardTitle>
              <CardDescription>Total historical expenditures per monthly period</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {monthlyTrendData.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-xs text-muted-foreground">No spending trend data available</p>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} />
                      <Tooltip content={<CustomTooltip formatter={(v: number) => format(v)} />} />
                      <Line type="monotone" dataKey="total" stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(var(--destructive))' }} activeDot={{ r: 5 }} name="Expenses" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Largest Individual Expenses</CardTitle>
              <CardDescription>Highest individual transactions this month</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {analysis.highestExpenses.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">No expense data found</p>
              ) : (
                <div className="divide-y divide-border border-t border-border">
                  {analysis.highestExpenses.map((e, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-secondary/30 transition-colors">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{e.merchant}</p>
                        <p className="text-[11px] text-muted-foreground">{e.category} · {new Date(e.date).toLocaleDateString()}</p>
                      </div>
                      <p className="text-xs font-bold text-destructive tabular-nums font-numeric">-{format(e.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Share of spending across categories</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
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
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          stroke="hsl(var(--card))"
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

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Spending by Volume</CardTitle>
                <CardDescription>Absolute amount spent per category</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {analysis.byCategory.length === 0 ? (
                  <div className="flex h-64 items-center justify-center">
                    <p className="text-xs text-muted-foreground">No category data</p>
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analysis.byCategory.map((c) => ({ name: c._id, amount: c.total }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} />
                        <Tooltip content={<CustomTooltip formatter={(v: number) => format(v)} />} />
                        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Amount" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Category comparison table */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle>Category Period Comparison</CardTitle>
              <CardDescription>Comparison of category spending against prior period</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {analysis.categoryComparison.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">No comparison data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5 text-right">This Month</th>
                        <th className="px-4 py-2.5 text-right">Last Month</th>
                        <th className="px-4 py-2.5 text-right">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {analysis.categoryComparison.map((c) => (
                        <tr key={c.category} className="hover:bg-secondary/30 transition-colors font-numeric">
                          <td className="px-4 py-2.5 font-medium text-foreground">{c.category}</td>
                          <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{format(c.currentAmount)}</td>
                          <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">{format(c.previousAmount)}</td>
                          <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${
                            c.changePercent >= 0 ? 'text-destructive' : 'text-success'
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

      {/* Cash Flow Tab */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4 sm:p-5 text-center space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Inflow</p>
                <p className="text-2xl font-bold text-success tabular-nums font-numeric">{format(analysis.incomeVsExpense.income)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-5 text-center space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Outflow</p>
                <p className="text-2xl font-bold text-destructive tabular-nums font-numeric">{format(analysis.incomeVsExpense.expenses)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-5 text-center space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Position</p>
                <p className={`text-2xl font-bold tabular-nums font-numeric ${
                  analysis.incomeVsExpense.savings >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {analysis.incomeVsExpense.savings >= 0 ? '+' : ''}{format(analysis.incomeVsExpense.savings)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Cash Flow Distribution</CardTitle>
              <CardDescription>Monthly expense bars vs overall trend</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {monthlyTrendData.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-xs text-muted-foreground">No historical data available</p>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} />
                      <Tooltip content={<CustomTooltip formatter={(v: number) => format(v)} />} />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Expenses" />
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
