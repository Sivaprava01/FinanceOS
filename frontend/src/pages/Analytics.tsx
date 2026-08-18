import React, { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { useSpendingAnalysis, useMonthlyComparison } from '@hooks/useDashboard'
import { useCurrency } from '@hooks/useCurrency'

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type Tab = 'overview' | 'expenses' | 'categories' | 'cashflow'

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-muted ${className}`} />
)

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { data: analysis, isLoading: aLoading, error: aError, refetch: refetchA } = useSpendingAnalysis()
  const { data: comparison, isLoading: cLoading, error: cError, refetch: refetchC } = useMonthlyComparison()
  const { format } = useCurrency()

  const isLoading = aLoading || cLoading
  const hasError = aError || cError

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-32" />
            </div>
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-destructive">Failed to load analytics data.</p>
        <Button variant="outline" onClick={() => { refetchA(); refetchC() }}>Retry</Button>
      </div>
    )
  }

  if (!analysis || !comparison) return null

  const monthlyTrendData = analysis.monthlyTrend.map((p) => ({
    label: `${MONTH_NAMES[p.month - 1]} ${p.year}`,
    total: p.total,
  }))

  const categoryPieData = analysis.byCategory.map((c) => ({ name: c._id, value: c.total }))

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'categories', label: 'Categories' },
    { id: 'cashflow', label: 'Cash Flow' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Detailed breakdown of your financial activity</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Income</p>
                    <p className="text-xl font-bold">{format(analysis.incomeVsExpense.income)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-100 p-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expenses</p>
                    <p className="text-xl font-bold">{format(analysis.incomeVsExpense.expenses)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <PiggyBank className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Savings</p>
                    <p className="text-xl font-bold">{format(analysis.incomeVsExpense.savings)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Savings Rate</p>
                    <p className="text-xl font-bold">
                      {analysis.incomeVsExpense.income > 0
                        ? `${Math.round((analysis.incomeVsExpense.savings / analysis.incomeVsExpense.income) * 100)}%`
                        : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Month Comparison</CardTitle>
              <CardDescription>{comparison.previousMonth.label} vs {comparison.currentMonth.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: 'Income', current: comparison.currentMonth.income, prev: comparison.previousMonth.income, diff: comparison.comparison.incomeDiff, pct: comparison.comparison.incomeChangePercent },
                  { label: 'Expenses', current: comparison.currentMonth.expenses, prev: comparison.previousMonth.expenses, diff: comparison.comparison.expenseDiff, pct: comparison.comparison.expenseChangePercent },
                  { label: 'Savings', current: comparison.currentMonth.savings, prev: comparison.previousMonth.savings, diff: comparison.comparison.savingsDiff, pct: comparison.comparison.savingsChangePercent },
                ].map((row) => (
                  <div key={row.label} className="rounded-lg border border-border p-4 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{row.label}</p>
                    <p className="text-2xl font-bold">{format(row.current)}</p>
                    <p className="text-xs text-muted-foreground">Prev: {format(row.prev)}</p>
                    <p className={`text-sm font-medium ${row.pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {row.pct >= 0 ? '+' : ''}{row.pct}% ({row.diff >= 0 ? '+' : ''}{format(row.diff)})
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top merchants */}
          <Card>
            <CardHeader>
              <CardTitle>Top Merchants</CardTitle>
              <CardDescription>Highest frequency merchants this month</CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.topMerchants.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No merchant data available</p>
              ) : (
                <div className="space-y-3">
                  {analysis.topMerchants.map((m, i) => (
                    <div key={m._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">{i + 1}</span>
                        <span className="text-sm font-medium">{m._id}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{format(m.total)}</p>
                        <p className="text-xs text-muted-foreground">{m.count} txn{m.count !== 1 ? 's' : ''}</p>
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
            <CardHeader>
              <CardTitle>Monthly Spending Trend</CardTitle>
              <CardDescription>Total spending per month</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyTrendData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No trend data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => format(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} dot={false} name="Expenses" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Highest Expenses</CardTitle>
              <CardDescription>Largest individual expenses this month</CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.highestExpenses.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No expense data</p>
              ) : (
                <div className="space-y-3">
                  {analysis.highestExpenses.map((e, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="text-sm font-medium">{e.merchant}</p>
                        <p className="text-xs text-muted-foreground">{e.category} · {new Date(e.date).toLocaleDateString()}</p>
                      </div>
                      <p className="font-semibold text-red-600">{format(e.amount)}</p>
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
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>Distribution this month</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryPieData.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No category data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={categoryPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name }) => name}>
                        {categoryPieData.map((_e, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => format(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Bar Chart</CardTitle>
                <CardDescription>Total spend per category</CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.byCategory.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={analysis.byCategory.map((c) => ({ name: c._id, amount: c.total }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => format(v)} />
                      <Bar dataKey="amount" fill="#10b981" name="Amount" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Category comparison table */}
          <Card>
            <CardHeader>
              <CardTitle>Category Comparison</CardTitle>
              <CardDescription>Current vs previous month</CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.categoryComparison.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No comparison data</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 font-medium">Category</th>
                        <th className="pb-2 text-right font-medium">This Month</th>
                        <th className="pb-2 text-right font-medium">Last Month</th>
                        <th className="pb-2 text-right font-medium">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.categoryComparison.map((c) => (
                        <tr key={c.category} className="border-b border-border/50">
                          <td className="py-2">{c.category}</td>
                          <td className="py-2 text-right">{format(c.currentAmount)}</td>
                          <td className="py-2 text-right text-muted-foreground">{format(c.previousAmount)}</td>
                          <td className={`py-2 text-right font-medium ${c.changePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
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
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Money In</p>
                <p className="text-3xl font-bold text-green-600">{format(analysis.incomeVsExpense.income)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Money Out</p>
                <p className="text-3xl font-bold text-red-600">{format(analysis.incomeVsExpense.expenses)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Net Flow</p>
                <p className={`text-3xl font-bold ${analysis.incomeVsExpense.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.incomeVsExpense.savings >= 0 ? '+' : ''}{format(analysis.incomeVsExpense.savings)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Expense Trend</CardTitle>
              <CardDescription>Spending trend over last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyTrendData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => format(v)} />
                    <Bar dataKey="total" fill="#3b82f6" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Analytics
