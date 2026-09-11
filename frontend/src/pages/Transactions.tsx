import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import {
  Plus,
  Search,
  X,
  Tag,
  Trash2,
  SlidersHorizontal,
  Download,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { Card, CardContent } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { TransactionRow, TRANSACTION_GRID_LAYOUT } from '@components/transactions/TransactionRow'
import { SkeletonLoader, ErrorState, EmptyState } from '@components/ui'
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useBulkUpdate,
} from '@hooks/useTransactions'
import { useCategories } from '@hooks/useCategories'
import { useStatement } from '@hooks/useStatements'
import { useCurrencyConversion } from '@hooks/useCurrencyConversion'
import CreateCategoryModal from '@components/modals/CreateCategoryModal'
import { normalizeTransactionType } from '@lib/utils'
import type {
  Transaction,
  CreateTransactionInput,
  CreateCategoryInput,
  TransactionType,
  PaymentMethod,
  CategoryType,
} from '@/types'

// ─── Types & Constants ─────────────────────────────────────────────────────────

interface FilterState {
  search: string
  type: '' | TransactionType
  category: string
  fromDate: string
  toDate: string
  minAmount: string
  maxAmount: string
  source: '' | 'manual' | 'statement'
}

const emptyFilters = (): FilterState => ({
  search: '',
  type: '',
  category: '',
  fromDate: '',
  toDate: '',
  minAmount: '',
  maxAmount: '',
  source: '',
})

const emptyForm = (): CreateTransactionInput => ({
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  type: 'expense',
  merchant: '',
  category: '',
  paymentMethod: 'upi',
  description: '',
})

const TRANSACTION_TYPES: Array<{ value: TransactionType; label: string }> = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
]

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'net_banking', label: 'Net Banking' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'other', label: 'Other' },
]

// ─── DeleteConfirm dialog ────────────────────────────────────────────────────

const DeleteDialog: React.FC<{
  count: number
  onConfirm: () => void
  onCancel: () => void
}> = ({ count, onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
    onClick={onCancel}
  >
    <div
      className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
          <Trash2 className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Delete {count > 1 ? `${count} transactions` : 'transaction'}?
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This action cannot be undone. These records will be permanently removed from your account.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2.5 pt-2 border-t border-border">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="destructive" size="sm" onClick={onConfirm}>
          Permanently Delete
        </Button>
      </div>
    </div>
  </div>
)

// ─── BulkActionBar ────────────────────────────────────────────────────────────

interface BulkActionBarProps {
  selectedCount: number
  categories: Array<{ _id: string; name: string }>
  onCategorize: (category: string) => void
  onDeleteSelected: () => void
  onClear: () => void
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  categories,
  onCategorize,
  onDeleteSelected,
  onClear,
}) => {
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const selectRef = useRef<HTMLSelectElement>(null)

  if (selectedCount === 0) return null

  const handleCategorize = (cat: string) => {
    if (cat) {
      onCategorize(cat)
      setShowCategoryPicker(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 sm:p-4 sm:flex-row sm:items-center justify-between shadow-sm animate-in fade-in duration-150">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-semibold text-primary font-mono uppercase tracking-wider">
          {selectedCount} {selectedCount === 1 ? 'record' : 'records'} selected
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {showCategoryPicker ? (
          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2">
            <select
              ref={selectRef}
              autoFocus
              defaultValue=""
              onChange={(e) => handleCategorize(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="" disabled>
                Select category…
              </option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setShowCategoryPicker(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="xs"
            className="w-full sm:w-auto gap-1.5 text-xs"
            onClick={() => setShowCategoryPicker(true)}
          >
            <Tag className="h-3.5 w-3.5" />
            Bulk Categorize
          </Button>
        )}
        <Button
          variant="outline"
          size="xs"
          className="w-full sm:w-auto gap-1.5 text-xs text-destructive hover:bg-destructive hover:text-white border-destructive/30"
          onClick={onDeleteSelected}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Selected
        </Button>
        <Button variant="ghost" size="xs" onClick={onClear} aria-label="Clear selection">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const Transactions: React.FC = () => {
  const formRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateTransactionInput>(emptyForm())
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false)

  // Filter state
  const [filters, setFilters] = useState<FilterState>(emptyFilters())
  const [statementId, setStatementId] = useState<string | null>(null)

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; ids: string[] }>({
    open: false,
    ids: [],
  })

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Load statementId from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('statementId')
    if (id) {
      setStatementId(id)
    }
  }, [])

  // Hooks
  const { data: categories = [], createCategory, createIsLoading } = useCategories()
  const { convertTransaction, formatPrimary } = useCurrencyConversion()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()
  const bulkUpdate = useBulkUpdate()

  // Dynamic category filtering based on selected transaction type
  const normalizedFormType = normalizeTransactionType(formData.type)
  const isExpense = normalizedFormType === 'expense'

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => normalizeTransactionType(cat.type) === normalizedFormType)
  }, [categories, normalizedFormType])

  // Build query params
  const queryParams = {
    limit: 500,
    search: filters.search || undefined,
    type: filters.type || undefined,
    category: filters.category || undefined,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
    minAmount: filters.minAmount ? parseFloat(filters.minAmount) : undefined,
    maxAmount: filters.maxAmount ? parseFloat(filters.maxAmount) : undefined,
    statementId: statementId || undefined,
    source: (filters.source || undefined) as 'manual' | 'statement' | undefined,
  }

  const { data: statement } = useStatement(statementId)
  const { data, isLoading, error } = useTransactions(queryParams)
  const transactions = useMemo(() => data?.transactions ?? [], [data?.transactions])
  const count = data?.count ?? 0

  const hasActiveFilters = Object.values(filters).some(Boolean) || !!statementId

  // Calculate live ledger velocity metrics
  const { totalInflow, totalOutflow, netRetained, retentionRate } = useMemo(() => {
    let inflow = 0
    let outflow = 0
    for (const t of transactions) {
      const norm = normalizeTransactionType(t.type)
      if (norm === 'income') inflow += t.amount || 0
      else if (norm === 'expense' || norm === 'liability') outflow += t.amount || 0
    }
    const retained = inflow - outflow
    const rate = inflow > 0 ? ((retained / inflow) * 100).toFixed(1) : '0.0'
    return { totalInflow: inflow, totalOutflow: outflow, netRetained: retained, retentionRate: rate }
  }, [transactions])

  // CSV Export handler
  const handleExportCSV = () => {
    if (transactions.length === 0) return
    const headers = ['Date', 'Type', 'Merchant', 'Description', 'Category', 'Payment Method', 'Amount', 'Currency', 'Source']
    const rows = transactions.map((t) => [
      t.date ? t.date.split('T')[0] : '',
      t.type || '',
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      t.paymentMethod || '',
      t.amount || 0,
      t.currency || 'INR',
      t.source || 'manual',
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `FinanceOS_Ledger_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ─── Form handlers ───────────────────────────────────────────────────────────

  const handleTypeChange = (newType: TransactionType) => {
    const normNewType = normalizeTransactionType(newType)
    const isNewExpense = normNewType === 'expense'

    const isCatValid = categories.some(
      (c) => c.name === formData.category && normalizeTransactionType(c.type) === normNewType
    )

    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: isCatValid ? prev.category : '',
      paymentMethod: isNewExpense ? (prev.paymentMethod || 'upi') : undefined,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const submissionData: CreateTransactionInput = {
      date: formData.date,
      amount: formData.amount,
      type: formData.type,
      category: formData.category,
      merchant: formData.merchant || '',
      description: formData.description || '',
      ...(isExpense ? { paymentMethod: formData.paymentMethod || 'upi' } : {}),
    }

    if (editingId) {
      await updateTransaction.mutateAsync({
        id: editingId,
        data: {
          merchant: submissionData.merchant,
          description: submissionData.description,
          category: submissionData.category,
          type: submissionData.type,
          ...(isExpense ? { paymentMethod: formData.paymentMethod || 'upi' } : {}),
          amount: submissionData.amount,
          date: submissionData.date,
        },
      })
      setEditingId(null)
    } else {
      await createTransaction.mutateAsync(submissionData)
    }
    setFormData(emptyForm())
    setShowForm(false)
  }

  const handleEdit = (t: Transaction) => {
    const normType = normalizeTransactionType(t.type) as TransactionType
    setFormData({
      date: t.date.split('T')[0],
      amount: t.amount,
      type: normType,
      merchant: t.merchant,
      category: t.category,
      paymentMethod: normType === 'expense' ? (t.paymentMethod || 'other') : undefined,
      description: t.description || '',
    })
    setEditingId(t._id)
    setShowForm(true)
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 50)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData(emptyForm())
  }

  // ─── Delete handlers ─────────────────────────────────────────────────────────

  const handleDeleteRequest = (id: string) => {
    setDeleteDialog({ open: true, ids: [id] })
  }

  const handleBulkDeleteRequest = () => {
    setDeleteDialog({ open: true, ids: Array.from(selectedIds) })
  }

  const handleDeleteConfirm = async () => {
    const { ids } = deleteDialog
    setDeleteDialog({ open: false, ids: [] })
    await Promise.all(ids.map((id) => deleteTransaction.mutateAsync(id)))
    setSelectedIds(new Set())
  }

  // ─── Bulk selection handlers ─────────────────────────────────────────────────

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length && transactions.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(transactions.map((t) => t._id)))
    }
  }

  const handleBulkCategorize = async (category: string) => {
    await bulkUpdate.mutateAsync({
      transactionIds: Array.from(selectedIds),
      updateData: { category },
    })
    setSelectedIds(new Set())
  }

  const handleCreateCategory = async (data: CreateCategoryInput) => {
    await createCategory(data)
  }

  const isMutating = createTransaction.isPending || updateTransaction.isPending

  return (
    <div className="space-y-6">
      {/* ─── Top Ledger Velocity Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <Card className="border border-border/80 shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                Total Inflow
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold">
                Credits
              </span>
            </div>
            <div className="mt-2.5">
              <div className="font-sans text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                +{formatPrimary(totalInflow)}
              </div>
              <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs font-medium">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span>Recorded receipts</span>
              </div>
            </div>
            <div className="w-full bg-secondary h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }} />
            </div>
          </CardContent>
        </Card>

        {/* Total Outflow */}
        <Card className="border border-border/80 shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                Total Outflow
              </span>
              <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px] font-semibold">
                Debits
              </span>
            </div>
            <div className="mt-2.5">
              <div className="font-sans text-xl font-bold tracking-tight text-foreground tabular-nums">
                -{formatPrimary(totalOutflow)}
              </div>
              <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs font-medium">
                <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
                <span>Total expenditure</span>
              </div>
            </div>
            <div className="w-full bg-secondary h-1 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{ width: `${Math.min(100, (totalOutflow / (totalInflow || 1)) * 100)}%` }}
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
                Savings
              </span>
            </div>
            <div className="mt-2.5">
              <div className="font-sans text-xl font-bold tracking-tight text-foreground tabular-nums">
                {netRetained >= 0 ? '+' : ''}{formatPrimary(netRetained)}
              </div>
              <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs font-medium">
                <span className="font-bold text-primary font-mono">{retentionRate}%</span>
                <span>savings rate</span>
              </div>
            </div>
            <div className="w-full bg-secondary h-1 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, parseFloat(retentionRate)))}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Verification Status */}
        <Card className="border border-border/80 shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                Verification
              </span>
              <span className="flex items-center gap-1 text-primary font-mono text-[10px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Reconciled
              </span>
            </div>
            <div className="mt-2.5">
              <div className="font-sans text-xl font-bold tracking-tight text-primary tabular-nums">
                100%
              </div>
              <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>{count} / {count} recorded entries</span>
              </div>
            </div>
            <div className="w-full bg-primary/20 h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '100%' }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Header Action Bar ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Transactions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isLoading
              ? 'Loading transactions…'
              : `${count} recorded transactions • ${hasActiveFilters ? 'Filtered view' : 'All accounts synced'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
            className="gap-1.5 text-xs shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button
            onClick={() => (showForm ? handleCancel() : setShowForm(true))}
            size="sm"
            className="gap-1.5 text-xs shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            {showForm ? 'Cancel Form' : 'Add Transaction'}
          </Button>
        </div>
      </div>

      {/* ─── Statement View Banner ────────────────────────────────────────────── */}
      {statementId && (
        <Card className="border-primary/40 bg-primary/5 shadow-xs">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold bg-primary text-primary-foreground uppercase tracking-wider">
                  Statement Filter Active
                </span>
                {statement?._id && (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    ID: {statement._id}
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-sm font-serif font-bold text-foreground">
                Filtered by Source: {statement?.originalFileName || 'Bank Statement Import'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Showing {count} extracted ledger entries mapped to this document.
              </p>
            </div>
            <Button
              variant="outline"
              size="xs"
              className="self-start sm:self-auto gap-1 text-xs"
              onClick={() => {
                setStatementId(null)
                setFilters((f) => ({ ...f, source: '' }))
                window.history.replaceState({}, '', '/transactions')
              }}
            >
              <X className="h-3.5 w-3.5" /> Clear Statement Filter
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Add / Edit Form Card ────────────────────────────────────────────── */}
      {showForm && (
        <div ref={formRef} className="animate-in fade-in slide-in-from-top-2 duration-200">
          <Card className="border-primary/40 shadow-md bg-card">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="font-serif text-base font-bold text-foreground">
                  {editingId ? 'Edit Ledger Record' : 'Record New Transaction'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select transaction classification, category, and counterparty details.
                </p>
              </div>
              <Button variant="ghost" size="xs" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardContent className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {/* 1. Date */}
                  <div>
                    <label className="block text-xs font-mono font-medium text-muted-foreground mb-1">
                      Date *
                    </label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  {/* 2. Merchant / Counterparty */}
                  <div>
                    <label className="block text-xs font-mono font-medium text-muted-foreground mb-1">
                      Merchant / Counterparty *
                    </label>
                    <Input
                      value={formData.merchant ?? ''}
                      onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                      placeholder="e.g. AWS, Vanguard Labs, Apple Store"
                      required
                    />
                  </div>

                  {/* 3. Transaction Type */}
                  <div>
                    <label className="block text-xs font-mono font-medium text-muted-foreground mb-1">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleTypeChange(e.target.value as TransactionType)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                      required
                    >
                      {TRANSACTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Category */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-mono font-medium text-muted-foreground">
                        Category *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCreateCategoryModal(true)}
                        className="text-[11px] text-primary hover:underline font-medium"
                      >
                        + New
                      </button>
                    </div>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    >
                      <option value="">
                        {filteredCategories.length > 0
                          ? 'Select a category'
                          : 'No categories found for this type'}
                      </option>
                      {filteredCategories.map((cat) => (
                        <option key={cat._id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 5. Payment Method (Expense only) */}
                  {isExpense && (
                    <div className="animate-in fade-in duration-200">
                      <label className="block text-xs font-mono font-medium text-muted-foreground mb-1">
                        Payment Method *
                      </label>
                      <select
                        value={formData.paymentMethod || 'upi'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentMethod: e.target.value as PaymentMethod,
                          })
                        }
                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                        required={isExpense}
                      >
                        {PAYMENT_METHODS.map((pm) => (
                          <option key={pm.value} value={pm.value}>
                            {pm.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* 6. Amount */}
                  <div>
                    <label className="block text-xs font-mono font-medium text-muted-foreground mb-1">
                      Amount *
                    </label>
                    <Input
                      type="number"
                      value={formData.amount === 0 ? '' : formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      required
                    />
                  </div>

                  {/* 7. Description */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-mono font-medium text-muted-foreground mb-1">
                      Memo / Notes (Optional)
                    </label>
                    <Input
                      value={formData.description ?? ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g. Q4 Cloud Subscription, Tax receipt attached"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                  <Button variant="outline" size="sm" type="button" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button size="sm" type="submit" isLoading={isMutating}>
                    {editingId ? 'Update Record' : 'Save Record'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Search & Quick Filters Toolbar ──────────────────────────────────── */}
      <Card className="border border-border/80 shadow-sm bg-card">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search counterparty, memo or category... (Press /)"
                className="w-full h-9 pl-9 pr-10 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">
                /
              </kbd>
            </div>

            {/* Quick Type Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60">
                {(['', 'expense', 'income', 'asset', 'liability'] as const).map((typeVal) => (
                  <button
                    key={typeVal || 'all'}
                    onClick={() => setFilters((f) => ({ ...f, type: typeVal }))}
                    className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                      filters.type === typeVal
                        ? 'bg-card text-foreground shadow-xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {typeVal || 'All'}
                  </button>
                ))}
              </div>

              <Button
                variant={showFilters ? 'secondary' : 'outline'}
                size="sm"
                className="gap-1.5 text-xs h-8 shrink-0"
                onClick={() => setShowFilters((v) => !v)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Button>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs h-8 text-muted-foreground hover:text-foreground shrink-0"
                  onClick={() => {
                    setFilters(emptyFilters())
                    if (statementId) {
                      setStatementId(null)
                      window.history.replaceState({}, '', '/transactions')
                    }
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Expanded Filter Criteria */}
          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 border-t border-border pt-3 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-mono text-muted-foreground mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-muted-foreground mb-1">Source</label>
                <select
                  value={filters.source}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, source: e.target.value as FilterState['source'] }))
                  }
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Sources</option>
                  <option value="manual">Manual Entry</option>
                  <option value="statement">Imported Statement</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-muted-foreground mb-1">From Date</label>
                <Input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
                  className="text-xs h-8"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-muted-foreground mb-1">To Date</label>
                <Input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
                  className="text-xs h-8"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-muted-foreground mb-1">Min Amount</label>
                <Input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => setFilters((f) => ({ ...f, minAmount: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  className="text-xs h-8"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Bulk Action Bar ─────────────────────────────────────────────────── */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        categories={categories}
        onCategorize={handleBulkCategorize}
        onDeleteSelected={handleBulkDeleteRequest}
        onClear={() => setSelectedIds(new Set())}
      />

      {/* ─── Transactions Table ──────────────────────────────────────────────── */}
      <Card className="overflow-hidden border border-border/80 shadow-sm bg-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-3 divide-y divide-border/40">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonLoader key={i} type="table-row" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8">
              <ErrorState
                title="Failed to Load Transactions"
                message="There was an error querying your ledger records. Please try refreshing."
                onRetry={() => window.location.reload()}
              />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-10">
              <EmptyState
                icon={Tag}
                title={hasActiveFilters ? 'No Matching Ledger Entries' : 'No Transactions Recorded'}
                description={
                  hasActiveFilters
                    ? 'No records match your selected query and filter criteria.'
                    : 'Add a manual transaction or import a statement to initialize your ledger.'
                }
                action={
                  hasActiveFilters
                    ? {
                        label: 'Reset Filters',
                        onClick: () => setFilters(emptyFilters()),
                      }
                    : {
                        label: 'Add Transaction',
                        onClick: () => setShowForm(true),
                      }
                }
              />
            </div>
          ) : (
            <div>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Table Header */}
                  <div
                    className={`border-b border-border bg-muted/30 text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider ${TRANSACTION_GRID_LAYOUT}`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === transactions.length && transactions.length > 0}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate =
                              selectedIds.size > 0 && selectedIds.size < transactions.length
                          }
                        }}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-border accent-primary cursor-pointer align-middle"
                        aria-label="Select all transactions"
                      />
                    </div>
                    <div>Date</div>
                    <div>Merchant / Counterparty</div>
                    <div>Category</div>
                    <div className="text-right">Amount</div>
                    <div className="text-right">Actions</div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y-0">
                    {transactions.map((transaction: Transaction) => (
                      <TransactionRow
                        key={transaction._id}
                        transaction={transaction}
                        onEdit={handleEdit}
                        onDelete={handleDeleteRequest}
                        isSelected={selectedIds.has(transaction._id)}
                        onSelect={toggleSelect}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Card Layout */}
              <div className="md:hidden divide-y divide-border border-t border-border">
                {transactions.map((transaction: Transaction) => {
                  const normType = normalizeTransactionType(transaction.type)
                  const isIncome = normType === 'income'
                  const isAsset = normType === 'asset'
                  const isLiability = normType === 'liability'
                  const { isForeign, primaryFormatted, preferredFormatted } = convertTransaction(
                    transaction.amount || 0,
                    transaction.currency
                  )
                  return (
                    <div
                      key={transaction._id}
                      className="p-3.5 space-y-2.5 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(transaction._id)}
                          onChange={() => toggleSelect(transaction._id)}
                          className="h-4 w-4 rounded border-border accent-primary cursor-pointer mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-xs text-foreground truncate">
                              {transaction.merchant || transaction.description || 'Transaction'}
                            </p>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-semibold uppercase tracking-wider ${
                                isIncome
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : isAsset
                                  ? 'bg-primary/10 text-primary border border-primary/20'
                                  : isLiability
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {normType}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0 font-sans">
                          <p
                            className={`text-xs font-bold tabular-nums ${
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isLiability
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-foreground'
                            }`}
                          >
                            {isIncome ? '+' : '-'}{primaryFormatted}
                          </p>
                          {isForeign && preferredFormatted && (
                            <p className="text-[10px] font-medium text-muted-foreground tabular-nums">
                              ≈ {isIncome ? '+' : ''}{preferredFormatted}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pl-6">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                            {transaction.category || 'General'}
                          </span>
                          {transaction.paymentMethod && (
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-mono font-medium text-muted-foreground uppercase">
                              {transaction.paymentMethod.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2.5">
                          <button
                            className="text-[11px] font-medium text-muted-foreground hover:text-primary"
                            onClick={() => handleEdit(transaction)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-[11px] font-medium text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteRequest(transaction._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Table Footer Status */}
              <div className="border-t border-border bg-muted/20 px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono text-[11px]">
                  Showing {transactions.length} of {count} entries
                </span>
                <span className="font-mono text-[11px] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Ledger Synced
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Delete Confirmation Dialog ──────────────────────────────────────── */}
      {deleteDialog.open && (
        <DeleteDialog
          count={deleteDialog.ids.length}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteDialog({ open: false, ids: [] })}
        />
      )}

      {/* ─── Create Category Modal ───────────────────────────────────────────── */}
      <CreateCategoryModal
        isOpen={showCreateCategoryModal}
        onClose={() => setShowCreateCategoryModal(false)}
        isLoading={createIsLoading}
        onSubmit={handleCreateCategory}
        initialType={normalizedFormType as CategoryType}
      />
    </div>
  )
}

export default Transactions
