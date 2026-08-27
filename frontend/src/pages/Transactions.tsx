import React, { useState, useCallback, useRef, useMemo } from 'react'
import { Plus, Search, X, Tag, Trash2, SlidersHorizontal, CreditCard } from 'lucide-react'
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
import { useCurrency } from '@hooks/useCurrency'
import CreateCategoryModal from '@components/modals/CreateCategoryModal'
import type {
  Transaction,
  CreateTransactionInput,
  CreateCategoryInput,
  PaymentMethod,
} from '@/types'

// ─── Types & Constants ────────────────────────────────────────────────────────

interface FilterState {
  search: string
  type: '' | 'income' | 'expense' | 'asset' | 'liability'
  category: string
  fromDate: string
  toDate: string
  minAmount: string
  maxAmount: string
}

const emptyFilters = (): FilterState => ({
  search: '',
  type: '',
  category: '',
  fromDate: '',
  toDate: '',
  minAmount: '',
  maxAmount: '',
})

const emptyForm = (): CreateTransactionInput => ({
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  type: 'expense',
  merchant: '',
  category: '',
  paymentMethod: '',
  description: '',
  notes: '',
})

const TRANSACTION_TYPES: { value: 'income' | 'expense' | 'asset' | 'liability'; label: string }[] = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
]

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
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
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </div>
  </div>
)

// ─── BulkActionBar ────────────────────────────────────────────────────────────

interface BulkActionBarProps {
  selectedCount: number
  categories: Array<{ _id: string; name: string; type?: string }>
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
      <span className="text-sm font-medium text-primary">{selectedCount} selected</span>
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
              <option value="" disabled>
                Select category…
              </option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name} {c.type ? `(${c.type})` : ''}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCategoryPicker(false)}
              className="w-full sm:w-auto"
            >
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
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          aria-label="Clear selection"
          className="w-full sm:w-auto"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const Transactions: React.FC = () => {
  const { format } = useCurrency()

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateTransactionInput>(emptyForm())
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Filter state
  const [filters, setFilters] = useState<FilterState>(emptyFilters())

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; ids: string[] }>({
    open: false,
    ids: [],
  })

  // Hooks
  const { data: categories = [], isLoading: categoriesLoading, createCategory, createIsLoading } = useCategories()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()
  const bulkUpdate = useBulkUpdate()

  // Dynamic category filtering based on selected form type
  const formType = (formData.type || 'expense').toLowerCase()
  const formCategories = useMemo(() => {
    return categories.filter((cat) => cat.type?.toLowerCase() === formType)
  }, [categories, formType])

  // Build query params — only pass non-empty values to avoid polluting cache key
  const queryParams = {
    search: filters.search || undefined,
    type: filters.type || undefined,
    category: filters.category || undefined,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
    minAmount: filters.minAmount ? parseFloat(filters.minAmount) : undefined,
    maxAmount: filters.maxAmount ? parseFloat(filters.maxAmount) : undefined,
  }

  const { data, isLoading, error } = useTransactions(queryParams)
  const transactions = data?.transactions ?? []
  const count = data?.count ?? 0

  const hasActiveFilters = Object.values(filters).some(Boolean)

  // ─── Type change handler (Dynamic Category + Payment Method Reset) ──────────

  const handleTypeChange = (newType: 'income' | 'expense' | 'asset' | 'liability') => {
    const validCategoriesForNewType = categories.filter(
      (c) => c.type?.toLowerCase() === newType.toLowerCase()
    )
    const currentCategoryValid = validCategoriesForNewType.some(
      (c) => c.name.toLowerCase() === formData.category.toLowerCase()
    )

    setFormData((prev) => ({
      ...prev,
      type: newType,
      // Clear category if it does not belong to the new type
      category: currentCategoryValid ? prev.category : '',
      // Clear payment method if new type is not expense
      paymentMethod: newType === 'expense' ? prev.paymentMethod || '' : undefined,
    }))
    setFormError(null)
  }

  // ─── Form handlers ───────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const isExpense = formData.type?.toLowerCase() === 'expense'
    if (isExpense && (!formData.paymentMethod || !formData.paymentMethod.trim())) {
      setFormError('Payment method is required for Expense transactions')
      return
    }

    try {
      if (editingId) {
        await updateTransaction.mutateAsync({
          id: editingId,
          data: {
            date: formData.date,
            merchant: formData.merchant,
            type: formData.type?.toLowerCase(),
            category: formData.category,
            paymentMethod: isExpense ? formData.paymentMethod?.toLowerCase() : null,
            amount: formData.amount,
            description: formData.description,
            notes: formData.notes,
          },
        })
        setEditingId(null)
      } else {
        await createTransaction.mutateAsync({
          ...formData,
          type: formData.type?.toLowerCase(),
          paymentMethod: isExpense ? formData.paymentMethod?.toLowerCase() : null,
        })
      }
      setFormData(emptyForm())
      setShowForm(false)
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to save transaction'
      setFormError(errorMsg)
    }
  }

  const handleEdit = (t: Transaction) => {
    const rawType = (t.type || 'expense').toLowerCase()
    const normType =
      rawType === 'debit' ? 'expense' : rawType === 'credit' ? 'income' : rawType

    setFormData({
      date: t.date ? t.date.split('T')[0] : new Date().toISOString().split('T')[0],
      amount: t.amount,
      type: normType,
      merchant: t.merchant,
      category: t.category,
      paymentMethod: t.paymentMethod || '',
      description: t.description || '',
      notes: t.notes || '',
    })
    setEditingId(t._id)
    setFormError(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData(emptyForm())
    setFormError(null)
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

  // Helper for type styling in mobile card layout
  const getTypeBadge = (type?: string) => {
    const t = (type || '').toLowerCase()
    if (t === 'income' || t === 'credit') {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Income
        </span>
      )
    }
    if (t === 'expense' || t === 'debit') {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Expense
        </span>
      )
    }
    if (t === 'asset') {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          Asset
        </span>
      )
    }
    if (t === 'liability') {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          Liability
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {type}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground text-sm">View and manage your transactions</p>
        </div>
        <Button
          onClick={() => (showForm ? handleCancel() : setShowForm(true))}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Cancel' : 'Add Transaction'}
        </Button>
      </div>

      {/* ─── Add / Edit Form ────────────────────────────────────────────────── */}
      {showForm && (
        <Card className="border-primary/20 shadow-md">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Transaction' : 'New Transaction'}</CardTitle>
            <CardDescription>
              {editingId
                ? 'Update your transaction details below.'
                : 'Enter the transaction details. Categories will dynamically filter based on the transaction type.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formError && (
              <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                {/* 1. Date */}
                <div>
                  <label className="block text-sm font-medium">Date *</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>

                {/* 2. Merchant / Payee */}
                <div>
                  <label className="block text-sm font-medium">Merchant / Payee *</label>
                  <Input
                    value={formData.merchant}
                    onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                    placeholder="e.g., Amazon, Salary Corp, Landlord"
                    className="mt-1"
                    required
                  />
                </div>

                {/* 3. Transaction Type */}
                <div>
                  <label className="block text-sm font-medium">Transaction Type *</label>
                  <select
                    id="transaction-type-select"
                    value={formData.type}
                    onChange={(e) =>
                      handleTypeChange(
                        e.target.value as 'income' | 'expense' | 'asset' | 'liability'
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    {TRANSACTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Category (Dynamically Filtered) */}
                <div>
                  <label className="block text-sm font-medium">
                    Category *{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({TRANSACTION_TYPES.find((t) => t.value === formData.type)?.label} categories)
                    </span>
                  </label>
                  <div className="mt-1 space-y-2">
                    <select
                      id="transaction-category-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    >
                      <option value="">
                        {categoriesLoading
                          ? 'Loading categories…'
                          : formCategories.length === 0
                            ? 'No categories found for this type'
                            : 'Select a category'}
                      </option>
                      {formCategories.map((cat) => (
                        <option key={cat._id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setShowCreateCategoryModal(true)}
                    >
                      + Create New Category
                    </Button>
                  </div>
                </div>

                {/* 5. Payment Method (Shown ONLY for Expenses) */}
                {formType === 'expense' && (
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-medium">
                      Payment Method *{' '}
                      <span className="text-xs text-muted-foreground font-normal">
                        (How was this paid?)
                      </span>
                    </label>
                    <div className="mt-1 relative">
                      <select
                        id="transaction-payment-method-select"
                        value={formData.paymentMethod || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })
                        }
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        required={formType === 'expense'}
                      >
                        <option value="">Select payment method</option>
                        {PAYMENT_METHODS.map((pm) => (
                          <option key={pm.value} value={pm.value}>
                            {pm.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* 6. Amount */}
                <div className={formType !== 'expense' ? '' : ''}>
                  <label className="block text-sm font-medium">Amount *</label>
                  <Input
                    type="number"
                    value={formData.amount === 0 ? '' : formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    className="mt-1"
                    required
                  />
                </div>

                {/* 7. Description */}
                <div className={formType === 'expense' ? 'sm:col-span-2 col-span-1' : ''}>
                  <label className="block text-sm font-medium">Description</label>
                  <Input
                    value={formData.description ?? ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional item or transaction details"
                    className="mt-1"
                  />
                </div>

                {/* 8. Notes */}
                <div className="sm:col-span-2 col-span-1">
                  <label className="block text-sm font-medium">Notes</label>
                  <Input
                    value={formData.notes ?? ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional personal notes"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isMutating}>
                  {editingId ? 'Update' : 'Create'} Transaction
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ─── Filters ────────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          {/* Search + toggle row */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="transaction-search"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search merchant or description…"
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              className="gap-2 w-full sm:w-auto sm:shrink-0"
              onClick={() => setShowFilters((v) => !v)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && <span className="flex h-2 w-2 rounded-full bg-primary" />}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto sm:shrink-0 gap-1 text-muted-foreground"
                onClick={() => setFilters(emptyFilters())}
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>

          {/* Expanded filter panel */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 border-t border-border pt-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Type
                </label>
                <select
                  id="filter-type-select"
                  value={filters.type}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      type: e.target.value as FilterState['type'],
                    }))
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Category
                </label>
                <select
                  id="filter-category-select"
                  value={filters.category}
                  onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Categories</option>
                  {categories
                    .filter((c) => !filters.type || c.type?.toLowerCase() === filters.type.toLowerCase())
                    .map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  From Date
                </label>
                <Input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  To Date
                </label>
                <Input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Min Amount
                </label>
                <Input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => setFilters((f) => ({ ...f, minAmount: e.target.value }))}
                  placeholder="0"
                  min="0"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Max Amount
                </label>
                <Input
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters((f) => ({ ...f, maxAmount: e.target.value }))}
                  placeholder="Any"
                  min="0"
                  className="text-sm"
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                {isLoading
                  ? 'Loading…'
                  : `${count} transaction${count !== 1 ? 's' : ''}${hasActiveFilters ? ' (filtered)' : ''}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <SkeletonLoader key={i} type="row" />
              ))}
            </div>
          ) : error ? (
            <ErrorState
              title="Failed to Load Transactions"
              message="There was an error loading your transactions. Please try again."
              onRetry={() => window.location.reload()}
            />
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={Tag}
              title={hasActiveFilters ? 'No Transactions Found' : 'No Transactions Yet'}
              description={
                hasActiveFilters
                  ? 'Try adjusting your filters to find transactions.'
                  : 'Upload a statement or create a transaction to get started.'
              }
              action={
                hasActiveFilters
                  ? {
                      label: 'Clear Filters',
                      onClick: () => setFilters(emptyFilters()),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {/* Desktop table - hidden on mobile */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-3">
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
                          className="rounded border-border accent-primary cursor-pointer"
                          aria-label="Select all"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Merchant / Payee
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
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
              <div className="md:hidden space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === transactions.length && transactions.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-border accent-primary cursor-pointer"
                      aria-label="Select all"
                    />
                    <span className="text-sm font-medium">Select all</span>
                  </label>
                </div>
                {transactions.map((transaction: Transaction) => {
                  const t = (transaction.type || '').toLowerCase()
                  const isIncome = t === 'income' || t === 'credit'
                  const isExpense = t === 'expense' || t === 'debit'

                  return (
                    <div
                      key={transaction._id}
                      className="rounded-lg border border-border bg-card p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(transaction._id)}
                          onChange={() => toggleSelect(transaction._id)}
                          className="rounded border-border accent-primary cursor-pointer mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{transaction.merchant}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                        <p
                          className={`text-sm font-semibold whitespace-nowrap ${
                            isIncome
                              ? 'text-green-600 dark:text-green-400'
                              : isExpense
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-foreground'
                          }`}
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''}
                          {format(transaction.amount)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground border-t border-border pt-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded-full bg-muted px-2 py-0.5">
                            {transaction.category || '—'}
                          </span>
                          {transaction.paymentMethod && isExpense && (
                            <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                              <CreditCard className="h-3 w-3" />
                              {transaction.paymentMethod.replace('_', ' ').toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>{getTypeBadge(transaction.type)}</div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleEdit(transaction)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive hover:text-white"
                          onClick={() => handleDeleteRequest(transaction._id)}
                        >
                          Delete
                        </Button>
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
      />
    </div>
  )
}

export default Transactions
