/**
 * Net Worth & Wealth Management Page
 * Dedicated hub for tracking Assets, Bank Balances, Investments, Loans, and Liabilities.
 */

import React, { useState } from 'react'
import {
  TrendingUp,
  Plus,
  Landmark,
  ShieldAlert,
  Percent,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  PieChart as PieChartIcon,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { SkeletonLoader, ErrorState, EmptyState } from '@components/ui'
import { AssetModal, LoanModal } from '@components/modals'
import { useAssets } from '@hooks/useAssets'
import { useLoans } from '@hooks/useLoans'
import { useDualCurrencyConversion } from '@hooks/useCurrencyConversion'
import { CATEGORY_ICONS } from '@components/modals/AssetModal'
import { LOAN_TYPE_ICONS } from '@components/modals/LoanModal'
import type { Asset, AssetCategory, Loan } from '@/types'

const ASSET_FILTER_CATEGORIES: Array<{ label: string; value: string }> = [
  { label: 'All Assets', value: 'all' },
  { label: 'Bank Accounts', value: 'Bank Account' },
  { label: 'Cash', value: 'Cash' },
  { label: 'Mutual Funds', value: 'Mutual Funds' },
  { label: 'Stocks', value: 'Stocks' },
  { label: 'Gold', value: 'Gold' },
  { label: 'Real Estate', value: 'Real Estate' },
  { label: 'Vehicles', value: 'Vehicle' },
  { label: 'Crypto', value: 'Cryptocurrency' },
  { label: 'Others', value: 'Others' },
]

const NetWorth: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assets' | 'loans'>('assets')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLoanStatus, setSelectedLoanStatus] = useState<string>('all')

  // Modals state
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false)
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null)

  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false)
  const [loanToEdit, setLoanToEdit] = useState<Loan | null>(null)

  // Notification feedback
  const [toastMessage, setToastMessage] = useState<string>('')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 4000)
  }

  // Data fetching hooks
  const {
    assets,
    isLoadingAssets,
    assetsError,
    netWorth,
    isLoadingNetWorth,
    netWorthError,
    deleteAsset,
    refetchAssets,
    refetchNetWorth,
  } = useAssets(selectedCategory === 'all' ? undefined : selectedCategory)

  const {
    loans,
    isLoadingLoans,
    loansError,
    summary: loanSummary,
    isLoadingSummary: isLoadingLoanSummary,
    deleteLoan,
    refetchLoans,
  } = useLoans(selectedLoanStatus === 'all' ? undefined : selectedLoanStatus)

  const {
    preferredCurrency,
    getDualAmount,
    rateStatus,
    liveInrRate,
  } = useDualCurrencyConversion()

  const isLoading = isLoadingAssets || isLoadingNetWorth || isLoadingLoans || isLoadingLoanSummary
  const hasError = assetsError || netWorthError || loansError

  const handleRetry = () => {
    refetchAssets()
    refetchNetWorth()
    refetchLoans()
  }

  const handleDeleteAsset = async (asset: Asset) => {
    if (window.confirm(`Are you sure you want to delete "${asset.assetName}"?`)) {
      try {
        await deleteAsset(asset._id)
        showToast('Asset deleted successfully')
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to delete asset')
      }
    }
  }

  const handleDeleteLoan = async (loan: Loan) => {
    if (window.confirm(`Are you sure you want to delete "${loan.loanName}"?`)) {
      try {
        await deleteLoan(loan._id)
        showToast('Loan deleted successfully')
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to delete loan')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <SkeletonLoader type="text" width="w-56" height="h-7" />
            <SkeletonLoader type="text" width="w-72" height="h-4" />
          </div>
          <div className="flex gap-2">
            <SkeletonLoader type="text" width="w-28" height="h-9" />
            <SkeletonLoader type="text" width="w-28" height="h-9" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonLoader key={i} type="stat" />
          ))}
        </div>
        <SkeletonLoader type="chart" />
      </div>
    )
  }

  if (hasError) {
    const errorObj = assetsError || netWorthError || loansError
    return (
      <ErrorState
        title="Failed to Load Net Worth"
        message={(errorObj as { message?: string })?.message || 'There was an error loading wealth data.'}
        onRetry={handleRetry}
      />
    )
  }

  const totalAssetsVal = netWorth?.totalAssets ?? 0
  const totalLiabilitiesVal = netWorth?.totalLiabilities ?? 0
  const netWorthVal = netWorth?.netWorth ?? 0

  const netWorthDual = getDualAmount(netWorthVal)
  const assetsDual = getDualAmount(totalAssetsVal)
  const liabilitiesDual = getDualAmount(totalLiabilitiesVal)
  const emiTotalDual = getDualAmount(loanSummary?.monthlyEmiTotal ?? 0)

  const debtRatio =
    totalAssetsVal > 0 ? ((totalLiabilitiesVal / totalAssetsVal) * 100).toFixed(1) : '0.0'
  const debtRatioNum = parseFloat(debtRatio)

  return (
    <div className="space-y-6 max-w-7xl w-full min-w-0">
      {/* ─── Toast Feedback ──────────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-3 shadow-lg text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── Header & Actions ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-foreground">
            Net Worth &amp; Wealth
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage your assets, bank accounts, investments, and track active loans &amp; EMIs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoanToEdit(null)
              setIsLoanModalOpen(true)
            }}
            className="gap-1.5 text-xs h-9"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Loan / EMI
          </Button>
          <Button
            onClick={() => {
              setAssetToEdit(null)
              setIsAssetModalOpen(true)
            }}
            size="sm"
            className="gap-1.5 text-xs h-9 font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* ─── Multi-Currency Exchange Notice ─────────────────────────────────── */}
      {rateStatus !== 'none' && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs font-medium text-primary">
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span>
            Wealth metrics converted to <strong>{preferredCurrency}</strong>
            {preferredCurrency !== 'INR' && liveInrRate ? ` (1 ${preferredCurrency} ≈ ₹${liveInrRate.toFixed(2)})` : ''}.
          </span>
        </div>
      )}

      {/* ─── Net Worth Hero & Pillar Strip ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Net Worth
            </span>
            <span className="p-1.5 rounded-md bg-primary/10 text-primary">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold font-serif tabular-nums text-foreground">
              {netWorthDual.primary}
            </p>
            {netWorthDual.secondary && (
              <p className="text-xs text-muted-foreground tabular-nums mt-0.5">≈ {netWorthDual.secondary}</p>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Total Assets minus Total Liabilities
          </p>
        </div>

        {/* Total Assets */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Total Assets
            </span>
            <span className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Landmark className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-serif tabular-nums text-primary">
              {assetsDual.primary}
            </p>
            {assetsDual.secondary && (
              <p className="text-xs text-muted-foreground tabular-nums mt-0.5">≈ {assetsDual.secondary}</p>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            {netWorth?.assetCount || 0} registered assets &amp; savings
          </p>
        </div>

        {/* Total Liabilities */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Total Liabilities
            </span>
            <span className="p-1.5 rounded-md bg-destructive/10 text-destructive">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-serif tabular-nums text-destructive">
              {liabilitiesDual.primary}
            </p>
            {liabilitiesDual.secondary && (
              <p className="text-xs text-muted-foreground tabular-nums mt-0.5">≈ {liabilitiesDual.secondary}</p>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            {loanSummary?.totalActiveLoans || 0} active loans ({emiTotalDual.primary}/mo EMI)
          </p>
        </div>

        {/* Debt-to-Asset Ratio */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Debt Ratio
            </span>
            <span className="p-1.5 rounded-md bg-secondary text-foreground">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {debtRatio}%
            </p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              {debtRatioNum < 30 ? (
                <span className="text-primary font-semibold">Healthy (&lt;30%)</span>
              ) : debtRatioNum < 50 ? (
                <span className="text-amber-500 font-semibold">Moderate (30-50%)</span>
              ) : (
                <span className="text-destructive font-semibold">Elevated (&gt;50%)</span>
              )}
            </p>
          </div>
          <div className="w-full bg-secondary h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                debtRatioNum < 30 ? 'bg-primary' : debtRatioNum < 50 ? 'bg-amber-500' : 'bg-destructive'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, debtRatioNum))}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs & Filters ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        {/* Main Tab Pill Toggle */}
        <div className="inline-flex rounded-lg bg-secondary/80 p-1 border border-border/60">
          <button
            onClick={() => setActiveTab('assets')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'assets'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            Assets Portfolio ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'loans'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Loans &amp; Liabilities ({loans.length})
          </button>
        </div>

        {/* Sub-Filters */}
        {activeTab === 'assets' ? (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {ASSET_FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0 ${
                  selectedCategory === cat.value
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {['all', 'Active', 'Closed'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedLoanStatus(status)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  selectedLoanStatus === status
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {status === 'all' ? 'All Loans' : `${status} Loans`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── TAB CONTENT 1: ASSETS PORTFOLIO ──────────────────────────────────── */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          {/* Asset Category Distribution Bar */}
          {netWorth?.assetBreakdown && Object.keys(netWorth.assetBreakdown).length > 0 && (
            <Card className="border-border shadow-xs">
              <CardHeader className="pb-2 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold font-serif flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4 text-primary" />
                      Asset Allocation Breakdown
                    </CardTitle>
                    <CardDescription className="text-xs">Distribution across asset classes</CardDescription>
                  </div>
                  <span className="text-xs font-bold text-foreground font-serif tabular-nums">
                    {assetsDual.primary}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {Object.entries(netWorth.assetBreakdown).map(([category, amount]) => {
                    const catDual = getDualAmount(amount)
                    const Icon = CATEGORY_ICONS[category as AssetCategory] || Landmark
                    const pct = totalAssetsVal > 0 ? ((amount / totalAssetsVal) * 100).toFixed(1) : '0.0'
                    return (
                      <div
                        key={category}
                        className="p-3 rounded-lg bg-secondary/30 border border-border/70 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-muted-foreground">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                            <Icon className="w-3.5 h-3.5 text-primary" />
                            <span className="truncate">{category}</span>
                          </div>
                          <span className="text-[10px] font-mono font-semibold">{pct}%</span>
                        </div>
                        <p className="text-xs font-bold text-foreground font-serif tabular-nums">
                          {catDual.primary}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assets Grid */}
          {assets.length === 0 ? (
            <Card className="border-border shadow-xs">
              <CardContent className="p-8">
                <EmptyState
                  icon={Landmark}
                  title="No assets recorded yet"
                  description="Add your primary bank account balance, fixed deposits, mutual funds, gold, or real estate to track your total net worth."
                  action={{
                    label: 'Add First Asset',
                    onClick: () => {
                      setAssetToEdit(null)
                      setIsAssetModalOpen(true)
                    },
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => {
                const Icon = CATEGORY_ICONS[asset.assetCategory] || Landmark
                const currentDual = getDualAmount(asset.currentValue)
                const purchaseDual = asset.purchaseValue ? getDualAmount(asset.purchaseValue) : null
                const hasGainLoss = asset.gainLoss !== null && asset.gainLoss !== undefined

                return (
                  <Card
                    key={asset._id}
                    className="border-border shadow-xs hover:border-border/80 transition-all flex flex-col justify-between"
                  >
                    <div className="p-4 space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-foreground truncate">{asset.assetName}</h3>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                              {asset.assetCategory}
                            </span>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setAssetToEdit(asset)
                              setIsAssetModalOpen(true)
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Edit Asset"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Values */}
                      <div className="pt-1">
                        <span className="text-[10px] text-muted-foreground font-medium block">Current Market Value</span>
                        <p className="text-xl font-bold font-serif text-foreground tabular-nums">
                          {currentDual.primary}
                        </p>
                        {currentDual.secondary && (
                          <p className="text-[11px] text-muted-foreground tabular-nums">
                            ≈ {currentDual.secondary}
                          </p>
                        )}
                      </div>

                      {/* Gain / Loss or Purchase reference */}
                      {purchaseDual && (
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
                          <div>
                            <span className="text-[10px] text-muted-foreground block">Purchase Cost</span>
                            <span className="font-semibold text-foreground tabular-nums">
                              {purchaseDual.primary}
                            </span>
                          </div>
                          {hasGainLoss && (
                            <div className="text-right">
                              <span className="text-[10px] text-muted-foreground block">Gain / Loss</span>
                              <span
                                className={`font-semibold inline-flex items-center gap-0.5 tabular-nums ${
                                  asset.gainLoss! >= 0 ? 'text-primary' : 'text-destructive'
                                }`}
                              >
                                {asset.gainLoss! >= 0 ? (
                                  <ArrowUpRight className="w-3 h-3" />
                                ) : (
                                  <ArrowDownRight className="w-3 h-3" />
                                )}
                                {asset.gainLossPercent !== null ? `${asset.gainLossPercent}%` : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {asset.notes && (
                        <p className="text-[11px] text-muted-foreground bg-secondary/40 p-2 rounded border border-border/50 line-clamp-2">
                          {asset.notes}
                        </p>
                      )}
                    </div>

                    <div className="px-4 py-2 bg-secondary/20 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Updated {new Date(asset.updatedAt || asset.createdAt).toLocaleDateString()}</span>
                      {asset.purchaseDate && (
                        <span>Acquired {new Date(asset.purchaseDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB CONTENT 2: LOANS & LIABILITIES ───────────────────────────────── */}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          {loans.length === 0 ? (
            <Card className="border-border shadow-xs">
              <CardContent className="p-8">
                <EmptyState
                  icon={CreditCard}
                  title="No active loans or EMIs recorded"
                  description="Track your home loan, car loan, education loan, or credit obligations to automatically calculate monthly EMI liabilities and debt ratios."
                  action={{
                    label: 'Add First Loan',
                    onClick: () => {
                      setLoanToEdit(null)
                      setIsLoanModalOpen(true)
                    },
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loans.map((loan) => {
                const Icon = LOAN_TYPE_ICONS[loan.loanType] || CreditCard
                const principalDual = getDualAmount(loan.principalAmount)
                const outstandingDual = getDualAmount(loan.outstandingBalance)
                const emiDual = getDualAmount(loan.emiAmount)
                const isClosed = loan.loanStatus === 'Closed'

                return (
                  <Card
                    key={loan._id}
                    className="border-border shadow-xs hover:border-border/80 transition-all flex flex-col justify-between"
                  >
                    <div className="p-4 space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              isClosed ? 'bg-secondary text-muted-foreground' : 'bg-destructive/10 text-destructive'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-foreground truncate">{loan.loanName}</h3>
                            <span className="text-[10px] text-muted-foreground font-medium truncate block">
                              {loan.lenderName} · {loan.loanType}
                            </span>
                          </div>
                        </div>

                        {/* Actions & Badge */}
                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              isClosed
                                ? 'bg-secondary text-muted-foreground'
                                : 'bg-destructive/10 text-destructive'
                            }`}
                          >
                            {loan.loanStatus}
                          </span>
                          <button
                            onClick={() => {
                              setLoanToEdit(loan)
                              setIsLoanModalOpen(true)
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Edit Loan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLoan(loan)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete Loan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Outstanding Balance */}
                      <div className="pt-1">
                        <span className="text-[10px] text-muted-foreground font-medium block">
                          Outstanding Balance
                        </span>
                        <p className="text-xl font-bold font-serif text-destructive tabular-nums">
                          {outstandingDual.primary}
                        </p>
                        {outstandingDual.secondary && (
                          <p className="text-[11px] text-muted-foreground tabular-nums">
                            ≈ {outstandingDual.secondary}
                          </p>
                        )}
                      </div>

                      {/* Repayment Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground font-medium">Repayment Tenure</span>
                          <span className="font-semibold text-foreground font-mono">
                            {loan.progressPercent || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, loan.progressPercent || 0)}%` }}
                          />
                        </div>
                        {loan.remainingTenure && (
                          <span className="text-[10px] text-muted-foreground block text-right">
                            {loan.remainingTenure} remaining
                          </span>
                        )}
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
                        <div className="p-2 rounded bg-secondary/30">
                          <span className="text-[10px] text-muted-foreground block">Monthly EMI</span>
                          <span className="font-bold text-foreground font-serif tabular-nums">
                            {emiDual.primary}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-secondary/30">
                          <span className="text-[10px] text-muted-foreground block">Interest Rate</span>
                          <span className="font-bold text-foreground font-mono">
                            {loan.interestRate}% p.a.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 bg-secondary/20 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due on {loan.emiDueDay}th of month
                      </span>
                      <span>Original: {principalDual.primary}</span>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Modals ──────────────────────────────────────────────────────────── */}
      <AssetModal
        isOpen={isAssetModalOpen}
        onClose={() => {
          setIsAssetModalOpen(false)
          setAssetToEdit(null)
        }}
        assetToEdit={assetToEdit}
        onSuccess={(msg) => {
          showToast(msg || 'Asset saved successfully!')
          refetchAssets()
          refetchNetWorth()
        }}
      />

      <LoanModal
        isOpen={isLoanModalOpen}
        onClose={() => {
          setIsLoanModalOpen(false)
          setLoanToEdit(null)
        }}
        loanToEdit={loanToEdit}
        onSuccess={(msg) => {
          showToast(msg || 'Loan saved successfully!')
          refetchLoans()
          refetchNetWorth()
        }}
      />
    </div>
  )
}

export default NetWorth
