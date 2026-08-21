import React from 'react'
import { TrendingUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
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
  ResponsiveContainer,
} from 'recharts'
import { Button } from '@components/ui/Button'
import { SkeletonLoader, ErrorState } from '@components/ui'
import { KPICard } from '@components/dashboard/KPICard'
import { useOverview, useSpendingAnalysis } from '@hooks/useDashboard'
import { useCurrency } from '@hooks/useCurrency'
import { useNavigate } from 'react-router-dom'

const CHART_COLORS = ['#264DE4', '#8B5CF6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { data: overview, isLoading: overviewLoading, error: overviewError, refetch: refetchOverview } = useOverview()
  const { data: analysis, isLoading: analysisLoading, error: analysisError, refetch: refetchAnalysis } = useSpendingAnalysis()
  const { format } = useCurrency()

  const isLoading = overviewLoading || analysisLoading
  const hasError = overviewError || analysisError

  const handleRetry = () => {
    refetchOverview()
    refetchAnalysis()
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonLoader key={i} type="card" />
          ))}
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <ErrorState
        title="Failed to Load Dashboard"
        message="There was an error loading your dashboard data."
        onRetry={handleRetry}
      />
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
    <div className="space-y-16">
      {/* Editorial Header */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
            Your Finances,
            <br />
            at a Glance.
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg">
            A real-time overview of your financial position and spending patterns.
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => navigate('/transactions')} size="sm" className="gap-2">
            <ArrowUpRight className="w-4 h-4" />
            New Transaction
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/analytics')}>
            View Analytics
          </Button>
        </div>
      </div>

      {/* Primary Metrics - Clean Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 pb-4 border-b border-border">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Net Worth</p>
          <p className="text-4xl font-bold">{format(overview.netWorth.netWorth)}</p>
          <p className="text-sm text-green-600">+6.4% this month</p>
        </div>

        <KPICard
          title="Monthly Income"
          value={overview.totalIncome}
          icon={<ArrowDownLeft className="h-5 w-5 text-green-600" />}
          trend="up"
        />
        <KPICard
          title="Monthly Expenses"
          value={overview.totalExpenses}
          icon={<ArrowUpRight className="h-5 w-5 text-red-600" />}
          trend="down"
        />
        <KPICard
          title="Net Balance"
          value={overview.netBalance}
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          trend={overview.netBalance >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Spending Trend */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm uppercase tracking-wide font-semibold">Spending Trend</h2>
            <p className="text-sm text-muted-foreground">Monthly spending over time</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            {monthlyTrendData.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-muted-foreground">No trend data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm uppercase tracking-wide font-semibold">Category Breakdown</h2>
            <p className="text-sm text-muted-foreground">Where your money goes</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            {categoryPieData.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-muted-foreground">No category data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categoryPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                    {categoryPieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => format(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-sm uppercase tracking-wide font-semibold">Recent Activity</h2>
            <p className="text-sm text-muted-foreground">Your latest transactions</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/transactions')}>
            View All
          </Button>
        </div>

        <div className="space-y-px border border-border rounded-lg divide-y divide-border overflow-hidden">
          {overview.recentTransactions.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No transactions</p>
            </div>
          ) : (
            overview.recentTransactions.slice(0, 5).map((txn) => (
              <div key={txn._id} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{txn.merchant}</p>
                  <p className="text-xs text-muted-foreground">{txn.category} · {new Date(txn.date).toLocaleDateString()}</p>
                </div>
                <p className={`text-sm font-semibold ml-4 flex items-center gap-1 ${txn.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {txn.type === 'Credit' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                  {txn.type === 'Credit' ? '+' : '-'}{format(txn.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

