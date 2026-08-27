import React, { useState, useCallback, useRef, useMemo } from 'react'
import { Plus, Search, X, Tag, Trash2, SlidersHorizontal } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { TransactionRow } from '@components/transactions/TransactionRow'
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
  notes: '',
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
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    onClick={onCancel}
  >
    <div
      className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10">
          <Trash2 className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h3 className="font-semibold">
            Delete {count > 1 ? `${count} transactions` : 'transaction'}?
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">This action cannot be undone.</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="destructive" onClick={onConfirm}>Delete</Button>
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
    <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 sm:p-4 sm:flex-row sm:items-center">
      <span className="text-sm font-medium text-primary">
        {selectedCount} selected
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {showCategoryPicker ? (
          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2">
            <select
              ref={selectRef}
              autoFocus
              defaultValue=""
              onChange={(e) => handleCategorize(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option value="" disabled>Select category…</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => setShowCategoryPicker(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto gap-1.5"
            onClick={() => setShowCategoryPicker(true)}
          >
            <Tag className="h-3.5 w-3.5" />
            Categorize
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto gap-1.5 text-destructive hover:bg-destructive hover:text-white"
          onClick={onDeleteSelected}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear} aria-label="Clear selection" className="w-full sm:w-auto">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const Transactions: React.FC = () => {
  const formRef = useRef<HTMLDivElement>(null)
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

  // Load statementId from URL on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('statementId')
    if (id) {
      setStatementId(id)
      // Note: statementId alone is sufficient to isolate transactions
      // No need to also filter by source, as that may exclude old transactions
      // that don't have the source field set
    }
  }, [])

  // Hooks
  const { data: categories = [], createCategory, createIsLoading } = useCategories()
  const { convertTransaction } = useCurrencyConversion()
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

  // Build query params — only pass non-empty values to avoid polluting cache key
  const queryParams = {
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
  const transactions = data?.transactions ?? []
  const count = data?.count ?? 0

  const hasActiveFilters = Object.values(filters).some(Boolean) || !!statementId

  // ─── Form handlers ───────────────────────────────────────────────────────────

  const handleTypeChange = (newType: TransactionType) => {
    const normNewType = normalizeTransactionType(newType)
    const isNewExpense = normNewType === 'expense'

    // Check if currently selected category is valid for new type
    const isCatValid = categories.some(
      (c) => c.name === formData.category && normalizeTransactionType(c.type) === normNewType
    )

    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: isCatValid ? prev.category : '',
      paymentMethod: isNewExpense ? (prev.paymentMethod || 'upi') : null,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const submissionData = {
      ...formData,
      type: formData.type,
      paymentMethod: isExpense ? (formData.paymentMethod || 'other') : null,
    }

    if (editingId) {
      await updateTransaction.mutateAsync({
        id: editingId,
        data: {
          merchant: submissionData.merchant,
          description: submissionData.description,
          category: submissionData.category,
          type: submissionData.type,
          paymentMethod: submissionData.paymentMethod,
          notes: submissionData.notes,
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
      paymentMethod: normType === 'expense' ? (t.paymentMethod || 'other') : null,
      description: t.description || '',
      notes: t.notes || '',
    })
    setEditingId(t._id)
    setShowForm(true)
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      const mainContent = document.getElementById('main-content')
      if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' })
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
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Transactions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isLoading ? 'Loading records…' : `${count} total recorded transaction${count !== 1 ? 's' : ''}${hasActiveFilters ? ' (filtered)' : ''}`}
          </p>
        </div>
        <Button
          onClick={() => (showForm ? handleCancel() : setShowForm(true))}
          size="sm"
          className="gap-1.5 text-xs shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          {showForm ? 'Cancel' : 'Add Transaction'}
        </Button>
      </div>

      {/* ─── Statement View Banner ────────────────────────────────────────────── */}
      {statementId && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold bg-primary text-primary-foreground">
                  Statement Filter
                </span>
                {statement?._id && (
                  <span className="text-[11px] text-muted-foreground font-mono">{statement._id}</span>
                )}
              </div>
              <h2 className="mt-1 text-sm font-bold text-foreground">
                From: {statement?.originalFileName || 'Statement Import'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Viewing {count} transactions imported from this statement file
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
              <X className="h-3 w-3" /> Clear Statement View
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Add / Edit Form ────────────────────────────────────────────────── */}
      {showForm && (
        <div ref={formRef}>
          <Card className="border-primary/30 shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle>{editingId ? 'Edit Transaction' : 'Create Transaction'}</CardTitle>
              <CardDescription>
                Select transaction type, category, and enter transaction details below
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form fields arranged in recommended order */}
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {/* 1. Date */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Date *</label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  {/* 2. Merchant / Payee */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Merchant / Payee *</label>
                    <Input
                      value={formData.merchant}
                      onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                      placeholder="e.g., Apple Store, Payroll, Bank"
                      required
                    />
                  </div>

                  {/* 3. Transaction Type */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Transaction Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleTypeChange(e.target.value as TransactionType)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                      required
                    >
                      {TRANSACTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Category (Dynamic Filtering) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-muted-foreground">Category *</label>
                      <button
                        type="button"
                        onClick={() => setShowCreateCategoryModal(true)}
                        className="text-[11px] text-primary hover:underline"
                      >
                        + New
                      </button>
                    </div>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">
                        {filteredCategories.length > 0 ? 'Select a category' : 'No categories found for this type'}
                      </option>
                      {filteredCategories.map((cat) => (
                        <option key={cat._id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 5. Payment Method (Shown only for Expense) */}
                  {isExpense && (
                    <div className="animate-in fade-in duration-200">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Payment Method * <span className="text-[10px] text-muted-foreground/80 font-normal">(Expense only)</span>
                      </label>
                      <select
                        value={formData.paymentMethod || 'upi'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentMethod: e.target.value as PaymentMethod,
                          })
                        }
                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
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
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Amount *</label>
                    <Input
                      type="number"
                      value={formData.amount === 0 ? '' : formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      required
                    />
                  </div>

                  {/* 7. Description */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                    <Input
                      value={formData.description ?? ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional memo"
                    />
                  </div>

                  {/* 8. Notes */}
                  <div className={isExpense ? "sm:col-span-2 lg:col-span-2" : "sm:col-span-2 lg:col-span-2"}>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                    <Input
                      value={formData.notes ?? ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" type="button" onClick={handleCancel}>Cancel</Button>
                  <Button size="sm" type="submit" isLoading={isMutating}>
                    {editingId ? 'Update' : 'Save'} Transaction
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Filter Bar ────────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="transaction-search"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search merchant or description…"
                className="pl-8 text-xs h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? 'secondary' : 'outline'}
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => setShowFilters((v) => !v)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {hasActiveFilters && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs h-8 text-muted-foreground hover:text-foreground"
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

          {/* Expanded filter options */}
          {showFilters && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 border-t border-border pt-3">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as FilterState['type'] }))}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Types</option>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Source</label>
                <select
                  value={filters.source}
                  onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value as FilterState['source'] }))}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Sources</option>
                  <option value="manual">Manual</option>
                  <option value="statement">Imported</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">From Date</label>
                <Input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
                  className="text-xs h-7"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">To Date</label>
                <Input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
                  className="text-xs h-7"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Min Amount</label>
                <Input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => setFilters((f) => ({ ...f, minAmount: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  className="text-xs h-7"
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
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <SkeletonLoader key={i} type="table-row" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorState
                title="Failed to Load Transactions"
                message="There was an error loading your transactions. Please try again."
                onRetry={() => window.location.reload()}
              />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Tag}
                title={hasActiveFilters ? 'No Transactions Found' : 'No Transactions Recorded'}
                description={
                  hasActiveFilters
                    ? 'Try adjusting your search query or filters to find records.'
                    : 'Add a manual transaction or import a statement to get started.'
                }
                action={
                  hasActiveFilters
                    ? {
                        label: 'Clear Filters',
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
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="w-10 px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === transactions.length && transactions.length > 0}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = selectedIds.size > 0 && selectedIds.size < transactions.length
                            }
                          }}
                          onChange={toggleSelectAll}
                          className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer align-middle"
                          aria-label="Select all"
                        />
                      </th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Merchant / Description</th>
                      <th className="px-3 py-2.5">Category</th>
                      <th className="px-3 py-2.5 text-right">Amount</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
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
                  </tbody>
                </table>
              </div>

              {/* Mobile card layout - shown on mobile */}
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
                    <div key={transaction._id} className="p-3.5 space-y-2.5 hover:bg-secondary/30 transition-colors">
                      <div className="flex items-start justify-between gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(transaction._id)}
                          onChange={() => toggleSelect(transaction._id)}
                          className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-xs text-foreground truncate">{transaction.merchant}</p>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider ${
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
                          <p className="text-[11px] text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <p
                            className={`text-xs font-bold tabular-nums font-numeric ${
                              isIncome ? 'text-success' : 'text-foreground'
                            }`}
                          >
                            {isIncome ? '+' : '-'}{primaryFormatted}
                          </p>
                          {isForeign && preferredFormatted && (
                            <p className="text-[11px] font-medium text-muted-foreground tabular-nums font-numeric" title="Converted using the latest available exchange rate">
                              ≈ {isIncome ? '+' : ''}{preferredFormatted}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pl-6">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium">{transaction.category || 'General'}</span>
                          {transaction.paymentMethod && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground uppercase">
                              {transaction.paymentMethod.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
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
        initialType={normalizedFormType as any}
      />
    </div>
  )
}

export default Transactions
