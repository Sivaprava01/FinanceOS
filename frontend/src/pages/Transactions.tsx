import React, { useState, useCallback, useRef } from 'react'
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
import CreateCategoryModal from '@components/modals/CreateCategoryModal'
import type { Transaction, CreateTransactionInput, CreateCategoryInput } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterState {
  search: string
  type: '' | 'Debit' | 'Credit'
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
  type: 'Debit',
  merchant: '',
  category: '',
  description: '',
  notes: '',
})

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
  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateTransactionInput>(emptyForm())
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false)

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
  const { data: categories = [], createCategory, createIsLoading } = useCategories()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()
  const bulkUpdate = useBulkUpdate()

  // Build query params — only pass non-empty values to avoid polluting cache key
  const queryParams = {
    search: filters.search || undefined,
    type: (filters.type || undefined) as 'Debit' | 'Credit' | undefined,
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

  // ─── Form handlers ───────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await updateTransaction.mutateAsync({
        id: editingId,
        data: {
          merchant: formData.merchant,
          description: formData.description,
          category: formData.category,
          notes: formData.notes,
          amount: formData.amount,
          date: formData.date,
        },
      })
      setEditingId(null)
    } else {
      await createTransaction.mutateAsync(formData)
    }
    setFormData(emptyForm())
    setShowForm(false)
  }

  const handleEdit = (t: Transaction) => {
    setFormData({
      date: t.date.split('T')[0],
      amount: t.amount,
      type: t.type,
      merchant: t.merchant,
      category: t.category,
      description: t.description,
      notes: t.notes,
    })
    setEditingId(t._id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground text-sm">View and manage your transactions</p>
        </div>
        <Button onClick={() => (showForm ? handleCancel() : setShowForm(true))} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Cancel' : 'Add Transaction'}
        </Button>
      </div>

      {/* ─── Add / Edit Form ────────────────────────────────────────────────── */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Transaction' : 'New Transaction'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
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

                <div>
                  <label className="block text-sm font-medium">Amount *</label>
                  <Input
                    type="number"
                    value={formData.amount === 0 ? '' : formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Debit' | 'Credit' })}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="Debit">Expense (Debit)</option>
                    <option value="Credit">Income (Credit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">Merchant *</label>
                  <Input
                    value={formData.merchant}
                    onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                    placeholder="e.g., Amazon"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Category *</label>
                  <div className="mt-1 space-y-2">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat.name}>{cat.name}</option>
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

                <div>
                  <label className="block text-sm font-medium">Description</label>
                  <Input
                    value={formData.description ?? ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional"
                    className="mt-1"
                  />
                </div>

                <div className="sm:col-span-2 col-span-1">
                  <label className="block text-sm font-medium">Notes</label>
                  <Input
                    value={formData.notes ?? ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={handleCancel}>Cancel</Button>
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
              {hasActiveFilters && (
                <span className="flex h-2 w-2 rounded-full bg-primary" />
              )}
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
                <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as FilterState['type'] }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="Credit">Income</option>
                  <option value="Debit">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">From Date</label>
                <Input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">To Date</label>
                <Input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Min Amount</label>
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
                <label className="block text-xs font-medium text-muted-foreground mb-1">Max Amount</label>
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
                {isLoading ? 'Loading…' : `${count} transaction${count !== 1 ? 's' : ''}${hasActiveFilters ? ' (filtered)' : ''}`}
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
                              el.indeterminate = selectedIds.size > 0 && selectedIds.size < transactions.length
                            }
                          }}
                          onChange={toggleSelectAll}
                          className="rounded border-border accent-primary cursor-pointer"
                          aria-label="Select all"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Merchant</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Category</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
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
                {transactions.map((transaction: Transaction) => (
                  <div key={transaction._id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(transaction._id)}
                        onChange={() => toggleSelect(transaction._id)}
                        className="rounded border-border accent-primary cursor-pointer mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{transaction.merchant}</p>
                        <p className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                      <p className={`text-sm font-semibold whitespace-nowrap ${transaction.type === 'Credit' ? 'text-success' : 'text-destructive'}`}>
                        {transaction.type === 'Credit' ? '+' : '-'}{transaction.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
                      <span className="rounded-full bg-muted px-2 py-0.5">{transaction.category || '—'}</span>
                      <span className="capitalize">{transaction.type}</span>
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
                ))}
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
