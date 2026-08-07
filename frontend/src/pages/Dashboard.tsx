import React from 'react'
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { KPICard } from '@components/dashboard/KPICard'
import { useOverview, useSpendingAnalysis } from '@hooks/useDashboard'
import { useNavigate } from 'react-router-dom'

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4']

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const SkeletonCard: React.FC = () => (
  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
    <div className="mt-3 h-8 w-32 animate-pulse rounded bg-muted" />
  </div>
)

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { data: overview, isLoading: overviewLoading, error: overviewError, refetch: refetchOverview } = useOverview()
  const { data: analysis, isLoading: analysisLoading, error: analysisError, refetch: refetchAnalysis } = useSpendingAnalysis()

  const isLoading = overviewLoading || analysisLoading
  const hasError = overviewError || analysisError

  const handleRetry = () => {
    refetchOverview()
    refetchAnalysis()
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-xl bg-muted" />
          <div className="h-80 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-destructive">Failed to load dashboard data.</p>
        <Button onClick={handleRetry} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  if (!overview || !analysis) {
    return null
  }

  const monthlyTrendData = analysis.monthlyTrend.map((point) => ({
    label: `${MONTH_NAMES[point.month - 1]} ${point.year}`,
    total: point.total,
  }))

  const categoryPieData = analysis.byCategory.map((cat) => ({
    name: cat._id,
    value: cat.total,
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your financial overview</p>
        </div>
        <Button onClick={() => navigate('/transactions')}>New Transaction</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Income"
          value={overview.totalIncome}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          trend="up"
        />
        <KPICard
          title="Total Expenses"
          value={overview.totalExpenses}
          icon={<TrendingDown className="h-5 w-5 text-red-600" />}
          trend="down"
        />
        <KPICard
          title="Net Balance"
          value={overview.netBalance}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
          trend={overview.netBalance >= 0 ? 'up' : 'down'}
        />
        <KPICard
          title="Net Worth"
          value={overview.netWorth.netWorth}
          icon={<Wallet className="h-5 w-5 text-blue-600" />}
          trend="neutral"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
            <CardDescription>Total spending over time</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyTrendData.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-muted-foreground">No trend data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Spending"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryPieData.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-muted-foreground">No category data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name }) => name}
                  >
                    {categoryPieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest activity</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/transactions')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {overview.recentTransactions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No recent transactions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overview.recentTransactions.map((txn) => (
                  <div
                    key={txn._id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{txn.merchant}</p>
                      <p className="text-xs text-muted-foreground">
                        {txn.category} · {new Date(txn.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p
                      className={`ml-4 text-sm font-semibold ${
                        txn.type === 'Credit' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {txn.type === 'Credit' ? '+' : '-'}${txn.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Spending Categories</CardTitle>
            <CardDescription>Highest spend categories</CardDescription>
          </CardHeader>
          <CardContent>
            {overview.topSpendingCategories.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No spending data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overview.topSpendingCategories.map((cat, index) => (
                  <div key={cat._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-sm">{cat._id}</span>
                    </div>
                    <span className="text-sm font-semibold">${cat.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
