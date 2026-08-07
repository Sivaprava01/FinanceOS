import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { TransactionRow } from '@components/transactions/TransactionRow'
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@hooks/useTransactions'
import { useCategories } from '@hooks/useCategories'
import type { Transaction, CreateTransactionInput } from '@/types'

const emptyForm = (): CreateTransactionInput => ({
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  type: 'Debit',
  merchant: '',
  category: '',
  description: '',
  notes: '',
})

const Transactions: React.FC = () => {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'Debit' | 'Credit'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [formData, setFormData] = useState<CreateTransactionInput>(emptyForm())

  const { data, isLoading, error } = useTransactions({
    category: filterCategory || undefined,
  })

  const { data: categories = [] } = useCategories()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()

  const transactions = (data?.transactions ?? []).filter((t) =>
    filterType === 'all' ? true : t.type === filterType
  )
  const count = data?.count ?? 0

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

  const handleEdit = (transaction: Transaction) => {
    setFormData({
      date: transaction.date.split('T')[0],
      amount: transaction.amount,
      type: transaction.type,
      merchant: transaction.merchant,
      category: transaction.category,
      description: transaction.description,
      notes: transaction.notes,
    })
    setEditingId(transaction._id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this transaction?')) {
      await deleteTransaction.mutateAsync(id)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData(emptyForm())
  }

  const isMutating = createTransaction.isPending || updateTransaction.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">View and manage your transactions</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); if (showForm) handleCancel() }}>
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Cancel' : 'Add Transaction'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Transaction' : 'New Transaction'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                  {categories.length > 0 ? (
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Food"
                      className="mt-1"
                      required
                    />
                  )}
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

                <div className="md:col-span-2">
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

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'Debit' | 'Credit')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="Credit">Income (Credit)</option>
                <option value="Debit">Expense (Debit)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {count} transaction{count !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg bg-destructive/10 p-4">
              <p className="text-sm text-destructive">Failed to load transactions. Please refresh.</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Merchant</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Type</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction: Transaction) => (
                    <TransactionRow
                      key={transaction._id}
                      transaction={transaction}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Transactions
