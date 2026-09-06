import React from 'react'
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  FileText,
  Plus,
  Calendar,
  ChevronRight,
  CreditCard,
  Globe,
} from 'lucide-react'
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/Card'
import { SkeletonLoader, ErrorState, EmptyState } from '@components/ui'
import { useOverview, useSpendingAnalysis } from '@hooks/useDashboard'
import { useCurrency } from '@hooks/useCurrency'
import { useDualCurrencyConversion, type DualAmountResult } from '@hooks/useCurrencyConversion'
import { useNavigate } from 'react-router-dom'
import { normalizeTransactionType } from '@lib/utils'

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#ec4899', '#f97316']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface CustomChartTooltipProps {
  active?: boolean
  payload?: Array<{ name?: string; value: number }>
  label?: string
  getDualAmount: (value: number) => DualAmountResult
}

const CustomChartTooltip: React.FC<CustomChartTooltipProps> = ({
  active,
  payload,
  label,
  getDualAmount,
}) => {
  if (active && payload && payload.length) {
    const dual = getDualAmount(payload[0].value)
    return (
      <div className="rounded-md border border-border bg-card/95 p-2.5 shadow-md backdrop-blur-xs text-xs">
        <p className="font-semibold text-foreground mb-1">{label || payload[0]?.name}</p>
        <p className="text-primary font-semibold font-numeric tabular-nums">{dual.primary}</p>
        {dual.secondary && (
          <p className="text-muted-foreground text-[11px] font-numeric tabular-nums mt-0.5">
            ≈ {dual.secondary}
          </p>
        )}
      </div>
    )
  }
  return null
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { data: overview, isLoading: overviewLoading, error: overviewError, refetch: refetchOverview } = useOverview()
  const { data: analysis, isLoading: analysisLoading, error: analysisError, refetch: refetchAnalysis } = useSpendingAnalysis()
  const { formatCompact } = useCurrency()
  const {
    preferredCurrency,
    getDualAmount,
    getDualSignedAmount,
    convertTransaction,
    rateStatus,
    liveInrRate,
  } = useDualCurrencyConversion()

  const isLoading = overviewLoading || analysisLoading
  const hasError = overviewError || analysisError

  const handleRetry = () => {
    refetchOverview()
    refetchAnalysis()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <SkeletonLoader type="text" width="w-48" height="h-6" />
            <SkeletonLoader type="text" width="w-64" height="h-4" />
          </div>
          <div className="flex gap-2">
            <SkeletonLoader type="text" width="w-28" height="h-8" />
            <SkeletonLoader type="text" width="w-28" height="h-8" />
          </div>
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
    const errorObj = overviewError || analysisError
    const errorMessage =
      (errorObj as { message?: string })?.message ||
      'There was an error loading your dashboard financial metrics.'

    return (
      <ErrorState
        title="Failed to Load Dashboard"
        message={errorMessage}
        onRetry={handleRetry}
      />
    )
  }

  if (!overview || !analysis) {
    return null
  }

  const netWorthValue = overview.netWorth?.netWorth ?? 0
  const totalAssetsValue = overview.netWorth?.totalAssets ?? 0
  const totalLiabilitiesValue = overview.netWorth?.totalLiabilities ?? 0

  const netWorthDual = getDualAmount(netWorthValue)
  const assetsDual = getDualAmount(totalAssetsValue)
  const liabilitiesDual = getDualAmount(totalLiabilitiesValue)

  const incomeDual = getDualSignedAmount(overview.totalIncome ?? 0, '+')
  const expensesDual = getDualSignedAmount(overview.totalExpenses ?? 0, '-')
  const cashflowDual = getDualSignedAmount(
    overview.netBalance ?? 0,
    (overview.netBalance ?? 0) >= 0 ? '+' : '-'
  )
  const emiDual = getDualAmount(overview.monthlyEmi ?? 0)

  const monthlyTrendData = (analysis.monthlyTrend || []).map((point) => ({
    label: `${MONTH_NAMES[(point.month || 1) - 1]} ${point.year}`,
    total: point.total || 0,
  }))

  const categoryPieData = (analysis.byCategory || []).map((cat) => ({
    name: cat._id || 'Uncategorized',
    value: cat.total || 0,
  }))

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 max-w-7xl w-full min-w-0">
      {/* ─── Header Row ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Financial Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Active Statement Context: {currentDateFormatted}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/statements')}
            className="gap-1.5 text-xs h-8"
          >
            <FileText className="w-3.5 h-3.5" />
            Import Statement
          </Button>
          <Button
            onClick={() => navigate('/transactions')}
            size="sm"
            className="gap-1.5 text-xs h-8 font-medium shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* ─── Currency Context Notice — hidden when INR is the selected currency ── */}
      {rateStatus !== 'none' && (
        <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs font-medium text-primary">
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span>
            {rateStatus === 'live' ? (
              <>
                All dashboard totals &amp; charts are converted to <strong>{preferredCurrency}</strong> using live market exchange rates
                {preferredCurrency !== 'INR' && liveInrRate ? ` (1 ${preferredCurrency} ≈ ₹${liveInrRate.toFixed(2)})` : ''}.
              </>
            ) : rateStatus === 'cached' ? (
              <>
                Dashboard totals are using recently cached market exchange rates
                {preferredCurrency !== 'INR' && liveInrRate ? ` (1 ${preferredCurrency} ≈ ₹${liveInrRate.toFixed(2)})` : ''}.
              </>
            ) : rateStatus === 'loading' ? (
              <>Updating <strong>{preferredCurrency}</strong> totals with latest market exchange rates...</>
            ) : rateStatus === 'fallback' ? (
              <>
                Dashboard totals are displayed in <strong>{preferredCurrency}</strong>. INR reference values use fallback rates while live exchange data is unavailable.
              </>
            ) : (
              <>
                Dashboard totals are displayed in <strong>{preferredCurrency}</strong>. Live INR conversion is currently unavailable.
              </>
            )}
          </span>
        </div>
      )}

      {/* ─── Primary Financial Command Card + Metric Strip ─────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Primary Hero: Net Worth */}
        <Card className="lg:col-span-1 border-primary/30 bg-card overflow-hidden relative">
          <div className="absolute top-0 right-0 h-16 w-16 bg-primary/10 rounded-bl-full pointer-events-none" />
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Net Worth
                </span>
                <span className="p-1.5 rounded-md bg-primary/10 text-primary">
                  <Wallet className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-numeric tabular-nums">
                {netWorthDual.primary}
              </p>
              {netWorthDual.secondary && (
                <p className="text-xs font-medium text-muted-foreground font-numeric tabular-nums mt-1">
                  ≈ {netWorthDual.secondary}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-border space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>Total Assets</span>
                <div className="text-right">
                  <span className="font-semibold text-foreground font-numeric tabular-nums block">
                    {assetsDual.primary}
                  </span>
                  {assetsDual.secondary && (
                    <span className="text-[11px] font-medium text-muted-foreground font-numeric tabular-nums block">
                      ≈ {assetsDual.secondary}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Liabilities</span>
                <div className="text-right">
                  <span className="font-semibold text-foreground font-numeric tabular-nums block">
                    {liabilitiesDual.primary}
                  </span>
                  {liabilitiesDual.secondary && (
                    <span className="text-[11px] font-medium text-muted-foreground font-numeric tabular-nums block">
                      ≈ {liabilitiesDual.secondary}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Metrics Strip */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5 h-full flex flex-col justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Monthly Cashflow Context
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Income */}
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                  <span>Monthly Income</span>
                </div>
                <p className="text-lg font-bold text-success font-numeric tabular-nums">
                  {incomeDual.primary}
                </p>
                {incomeDual.secondary && (
                  <p className="text-xs font-medium text-muted-foreground font-numeric tabular-nums mt-0.5">
                    ≈ {incomeDual.secondary}
                  </p>
                )}
              </div>

              {/* Expenses */}
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <ArrowDownLeft className="h-3.5 w-3.5 text-destructive" />
                  <span>Monthly Expenses</span>
                </div>
                <p className="text-lg font-bold text-foreground font-numeric tabular-nums">
                  {expensesDual.primary}
                </p>
                {expensesDual.secondary && (
                  <p className="text-xs font-medium text-muted-foreground font-numeric tabular-nums mt-0.5">
                    ≈ {expensesDual.secondary}
                  </p>
                )}
              </div>

              {/* Net Cashflow */}
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span>Net Cashflow</span>
                </div>
                <p
                  className={`text-lg font-bold font-numeric tabular-nums ${
                    overview.netBalance >= 0 ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {cashflowDual.primary}
                </p>
                {cashflowDual.secondary && (
                  <p className="text-xs font-medium text-muted-foreground font-numeric tabular-nums mt-0.5">
                    ≈ {cashflowDual.secondary}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 text-xs text-muted-foreground min-w-0">
              <span className="shrink-0">Active Liabilities: {overview.activeLoans} Loans</span>
              <div className="sm:text-right min-w-0">
                <span className="block">
                  Monthly EMI Commitments:{' '}
                  <strong className="text-foreground font-numeric tabular-nums">{emiDual.primary}</strong>
                </span>
                {emiDual.secondary && (
                  <span className="block text-muted-foreground font-numeric text-[11px] tabular-nums">
                    (≈ {emiDual.secondary})
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Visual Analytics Grid ────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending Trend Line Chart */}
        <Card>
          <CardHeader className="pb-2 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Spending Trend</CardTitle>
                <CardDescription className="text-xs">6-month expense trajectory ({preferredCurrency})</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => navigate('/analytics')}
                className="text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                Analytics <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {monthlyTrendData.length === 0 ? (
              <div className="flex h-56 items-center justify-center">
                <p className="text-xs text-muted-foreground">No historical trend data available</p>
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis
                      dataKey="label"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatCompact(v)}
                    />
                    <Tooltip content={<CustomChartTooltip getDualAmount={getDualAmount} />} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown Chart */}
        <Card>
          <CardHeader className="pb-2 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Spending by Category</CardTitle>
                <CardDescription className="text-xs">Top expense allocation breakdown ({preferredCurrency})</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => navigate('/categories')}
                className="text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                Categories <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {categoryPieData.length === 0 ? (
              <div className="flex h-56 items-center justify-center">
                <p className="text-xs text-muted-foreground">No category breakdown data available</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-56">
                <div className="h-52 w-52 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                        stroke="hsl(var(--card))"
                        strokeWidth={2}
                      >
                        {categoryPieData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip getDualAmount={getDualAmount} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 w-full max-h-52 overflow-y-auto space-y-1 pr-1 divide-y divide-border/40">
                  {categoryPieData.slice(0, 5).map((cat, idx) => {
                    const catDual = getDualAmount(cat.value)
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs py-1.5 first:pt-0">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                          />
                          <span className="font-medium text-foreground truncate">{cat.name}</span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="font-semibold text-foreground font-numeric tabular-nums">
                            {catDual.primary}
                          </p>
                          {catDual.secondary && (
                            <p className="text-[10px] text-muted-foreground font-numeric tabular-nums">
                              ≈ {catDual.secondary}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Recent Activity Feed ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Recent Financial Activity</CardTitle>
              <CardDescription className="text-xs">Latest recorded transactions</CardDescription>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={() => navigate('/transactions')}
              className="gap-1 text-xs"
            >
              View All <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {overview.recentTransactions.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={CreditCard}
                title="No recent activity"
                description="Your recent transactions will appear here."
                action={{
                  label: 'Add Transaction',
                  onClick: () => navigate('/transactions'),
                }}
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(overview.recentTransactions || []).slice(0, 6).map((txn) => {
                const normType = normalizeTransactionType(txn.type)
                const isIncome = normType === 'income'
                const isAsset = normType === 'asset'
                const isLiability = normType === 'liability'
                const { primaryFormatted, preferredFormatted, inrFormatted, isForeign } = convertTransaction(
                  txn.amount || 0,
                  txn.currency
                )
                return (
                  <div
                    key={txn._id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isIncome
                            ? 'bg-success/15 text-success'
                            : isAsset
                            ? 'bg-primary/15 text-primary'
                            : isLiability
                            ? 'bg-amber-500/15 text-amber-500'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {txn.merchant ? txn.merchant.charAt(0).toUpperCase() : 'T'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-foreground truncate">{txn.merchant || 'Transaction'}</p>
                          <span
                            className={`rounded px-1 py-0.2 text-[9px] font-semibold uppercase tracking-wider ${
                              isIncome
                                ? 'bg-success/15 text-success'
                                : isAsset
                                ? 'bg-primary/15 text-primary'
                                : isLiability
                                ? 'bg-amber-500/15 text-amber-500'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {normType}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {txn.category || 'General'} · {txn.date ? new Date(txn.date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-4">
                      {/* Primary Amount */}
                      <p
                        className={`text-xs font-bold tabular-nums font-numeric ${
                          isIncome
                            ? 'text-success'
                            : isLiability
                            ? 'text-amber-500'
                            : isAsset
                            ? 'text-primary'
                            : 'text-foreground'
                        }`}
                      >
                        {isIncome ? '+' : '-'}{primaryFormatted}
                      </p>

                      {/* Preferred Currency Conversion */}
                      {isForeign && preferredFormatted && (
                        <p
                          className="text-[11px] font-medium text-muted-foreground tabular-nums font-numeric"
                          title="Converted to your preferred currency"
                        >
                          ≈ {isIncome ? '+' : ''}{preferredFormatted}
                        </p>
                      )}

                      {/* Secondary INR Reference */}
                      {inrFormatted && (
                        <p
                          className="text-[10px] font-normal text-muted-foreground/80 tabular-nums font-numeric"
                          title="Secondary INR reference amount"
                        >
                          ≈ {isIncome ? '+' : ''}{inrFormatted}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard

