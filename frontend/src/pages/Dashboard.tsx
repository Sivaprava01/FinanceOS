import React from 'react'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  FileText,
  Plus,
  ChevronRight,
  CreditCard,
  Globe,
  Landmark,
} from 'lucide-react'
import {
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
import { Button } from '@components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/Card'
import { SkeletonLoader, ErrorState, EmptyState } from '@components/ui'
import { useOverview, useSpendingAnalysis } from '@hooks/useDashboard'
import { useCurrency } from '@hooks/useCurrency'
import { useDualCurrencyConversion, type DualAmountResult } from '@hooks/useCurrencyConversion'
import { useNavigate } from 'react-router-dom'
import { normalizeTransactionType } from '@lib/utils'

const STITCH_CHART_COLORS = [
  '#176B52', // Pine Green
  '#3b82f6', // Sapphire
  '#8A806B', // Gold-Slate
  '#B84A4A', // Ledger Crimson
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
]

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
        <p className="font-semibold text-foreground mb-1 font-serif">{label || payload[0]?.name}</p>
        <p className="text-primary font-semibold tabular-nums">{dual.primary}</p>
        {dual.secondary && (
          <p className="text-muted-foreground text-[11px] tabular-nums mt-0.5">
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
  const netWorthDual = getDualAmount(netWorthValue)

  const incomeDual = getDualSignedAmount(overview.totalIncome ?? 0, '+')
  const expensesDual = getDualSignedAmount(overview.totalExpenses ?? 0, '-')
  const cashflowDual = getDualSignedAmount(
    overview.netBalance ?? 0,
    (overview.netBalance ?? 0) >= 0 ? '+' : '-'
  )

  const monthlyTrendData = (analysis.monthlyTrend || []).map((point) => ({
    label: `${MONTH_NAMES[(point.month || 1) - 1]} ${point.year}`,
    total: point.total || 0,
  }))

  const categoryPieData = (analysis.byCategory || []).map((cat) => ({
    name: cat._id || 'Uncategorized',
    value: cat.total || 0,
  }))

  const activeMonthText =
    overview.activeMonthLabel ||
    new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' })


  return (
    <div className="space-y-6 max-w-7xl w-full min-w-0">
      {/* ─── Context Ribbon & Header Action Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-foreground">
            Financial Overview
          </h1>
          <p className="text-xs text-muted-foreground">
            Period: {activeMonthText}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/transactions')}
            className="gap-1.5 text-xs h-9"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Transaction
          </Button>
          <Button
            onClick={() => navigate('/statements')}
            size="sm"
            className="gap-1.5 text-xs h-9 font-semibold shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            Import Statement
          </Button>
        </div>
      </div>

      {/* ─── Multi-Currency Exchange Notice ─────────────────────────────────── */}
      {rateStatus !== 'none' && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs font-medium text-primary">
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span>
            {rateStatus === 'live' ? (
              <>
                All totals are converted to <strong>{preferredCurrency}</strong> using live market rates
                {preferredCurrency !== 'INR' && liveInrRate ? ` (1 ${preferredCurrency} ≈ ₹${liveInrRate.toFixed(2)})` : ''}.
              </>
            ) : rateStatus === 'cached' ? (
              <>
                Dashboard totals are using cached exchange rates
                {preferredCurrency !== 'INR' && liveInrRate ? ` (1 ${preferredCurrency} ≈ ₹${liveInrRate.toFixed(2)})` : ''}.
              </>
            ) : (
              <>
                Dashboard totals are displayed in <strong>{preferredCurrency}</strong>.
              </>
            )}
          </span>
        </div>
      )}

      {/* ─── Cashflow Overview Strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Monthly Income
            </span>
            <span className="p-1.5 rounded-md bg-primary/10 text-primary">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-primary font-serif tabular-nums">{incomeDual.primary}</p>
            {incomeDual.secondary && (
              <p className="text-xs text-muted-foreground tabular-nums mt-0.5">≈ {incomeDual.secondary}</p>
            )}
          </div>
          <div className="w-full bg-secondary h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Expenses */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Monthly Expenses
            </span>
            <span className="p-1.5 rounded-md bg-destructive/10 text-destructive">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-foreground font-serif tabular-nums">{expensesDual.primary}</p>
            {expensesDual.secondary && (
              <p className="text-xs text-muted-foreground tabular-nums mt-0.5">≈ {expensesDual.secondary}</p>
            )}
          </div>
          <div className="w-full bg-secondary h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-destructive/80 h-full rounded-full"
              style={{
                width:
                  overview.totalIncome > 0
                    ? `${Math.min(100, (overview.totalExpenses / overview.totalIncome) * 100)}%`
                    : '50%',
              }}
            />
          </div>
        </div>

        {/* Net Savings */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Net Savings
            </span>
            <span className="p-1.5 rounded-md bg-secondary text-foreground">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p
              className={`text-2xl font-bold font-serif tabular-nums ${
                overview.netBalance >= 0 ? 'text-primary' : 'text-destructive'
              }`}
            >
              {cashflowDual.primary}
            </p>
            {cashflowDual.secondary && (
              <p className="text-xs text-muted-foreground tabular-nums mt-0.5">≈ {cashflowDual.secondary}</p>
            )}
          </div>
          <div className="w-full bg-secondary h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${overview.netBalance >= 0 ? 'bg-primary' : 'bg-destructive'}`}
              style={{ width: overview.netBalance >= 0 ? '70%' : '30%' }}
            />
          </div>
        </div>

        {/* Net Worth Peek Card */}
        <div
          onClick={() => navigate('/net-worth')}
          className="rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-5 shadow-2xs flex flex-col justify-between cursor-pointer hover:border-primary/40 hover:shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Net Worth
            </span>
            <span className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Landmark className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-serif tabular-nums text-foreground">{netWorthDual.primary}</p>
            {netWorthDual.secondary && (
              <p className="text-xs text-muted-foreground tabular-nums mt-0.5">≈ {netWorthDual.secondary}</p>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-primary font-medium mt-3 pt-2 border-t border-border/50">
            <span>Manage Assets &amp; Loans</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>


      {/* ─── Visual Analytics Grid ────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending Trends Area Chart */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-2 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold font-serif">Spending Trends</CardTitle>
                <CardDescription className="text-xs">6-month expense overview ({preferredCurrency})</CardDescription>
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
                  <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="spendColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
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
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#spendColor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending by Category Donut Chart */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-2 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold font-serif">Spending by Category</CardTitle>
                <CardDescription className="text-xs">Monthly expense distribution ({preferredCurrency})</CardDescription>
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
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                        stroke="hsl(var(--card))"
                        strokeWidth={2}
                      >
                        {categoryPieData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={STITCH_CHART_COLORS[index % STITCH_CHART_COLORS.length]} />
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
                            style={{ backgroundColor: STITCH_CHART_COLORS[idx % STITCH_CHART_COLORS.length] }}
                          />
                          <span className="font-medium text-foreground truncate">{cat.name}</span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="font-semibold text-foreground tabular-nums">
                            {catDual.primary}
                          </p>
                          {catDual.secondary && (
                            <p className="text-[10px] text-muted-foreground tabular-nums">
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
      <Card className="border border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold font-serif">Recent Transactions</CardTitle>
              <CardDescription className="text-xs">Your latest recorded transactions</CardDescription>
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
                    className="flex items-center justify-between px-5 py-3 hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold font-serif ${
                          isIncome
                            ? 'bg-primary/10 text-primary'
                            : isAsset
                            ? 'bg-primary/10 text-primary'
                            : isLiability
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-secondary text-foreground'
                        }`}
                      >
                        {txn.merchant ? txn.merchant.charAt(0).toUpperCase() : 'T'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-foreground truncate">{txn.merchant || 'Transaction'}</p>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider ${
                              isIncome
                                ? 'bg-primary/10 text-primary'
                                : isAsset
                                ? 'bg-primary/10 text-primary'
                                : isLiability
                                ? 'bg-amber-500/10 text-amber-600'
                                : 'bg-secondary text-muted-foreground'
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
                        className={`text-xs font-bold tabular-nums ${
                          isIncome
                            ? 'text-primary'
                            : isLiability
                            ? 'text-amber-600'
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
                          className="text-[11px] font-medium text-muted-foreground tabular-nums"
                          title="Converted to your preferred currency"
                        >
                          ≈ {isIncome ? '+' : ''}{preferredFormatted}
                        </p>
                      )}

                      {/* Secondary INR Reference */}
                      {inrFormatted && (
                        <p
                          className="text-[10px] font-normal text-muted-foreground/80 tabular-nums"
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
