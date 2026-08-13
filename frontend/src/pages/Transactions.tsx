import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@components/ui/Dialog';
import { Loader } from '@components/ui/Loader';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  useGetTransactions,
  useUpdateTransaction,
  useDeleteTransaction,
  useGetCategories,
  useCreateTransaction,
} from '@/hooks/useTransactions';
import { formatCurrencyFromUser } from '@/utils/formatCurrency';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Form validation schema
const transactionSchema = z.object({
  merchant: z.string().min(1, 'Merchant is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  notes: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  date: z.string(),
  type: z.enum(['Debit', 'Credit']),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const Transactions: React.FC = () => {
  const [searchMerchant, setSearchMerchant] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  const { data: user } = useCurrentUser();

  const {
    data: transactionsData,
    isLoading: transLoading,
    error: transError,
  } = useGetTransactions({
    merchant: searchMerchant || undefined,
    category: selectedCategory || undefined,
  });

  const { data: categoriesData } = useGetCategories();

  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();
  const createMutation = useCreateTransaction();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'Debit',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const transactions = transactionsData?.transactions || [];
  const categories = categoriesData?.categories || [];

  const handleCreateTransaction = async (data: TransactionFormData) => {
    try {
      await createMutation.mutateAsync({
        date: data.date,
        amount: data.amount,
        type: data.type,
        merchant: data.merchant,
        description: data.description,
        category: data.category,
        notes: data.notes,
      });
      setIsCreating(false);
      reset();
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  };

  const handleEditTransaction = async (data: TransactionFormData) => {
    if (!editingId) return;
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        payload: {
          merchant: data.merchant,
          description: data.description,
          category: data.category,
          notes: data.notes,
          amount: data.amount,
          date: data.date,
        },
      });
      // Only close dialog on successful mutation
      setEditingId(null);
      reset();
    } catch (error) {
      // Error is handled by mutation's error state
      // Dialog stays open so user can fix the issue
      console.error('Failed to update transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (transLoading) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">View and manage your transactions</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  if (transError) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Transactions</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Failed to load transactions. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">View and manage your transactions</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Search Merchant</label>
              <Input
                placeholder="Search by merchant..."
                value={searchMerchant}
                onChange={(e) => setSearchMerchant(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="date">Date (Newest)</option>
                <option value="amount">Amount (Highest)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions ({transactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left">Date</th>
                    <th className="py-3 px-4 text-left">Merchant</th>
                    <th className="py-3 px-4 text-left">Category</th>
                    <th className="py-3 px-4 text-left">Description</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Type</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p>{tx.merchant}</p>
                          {tx.isEdited && (
                            <Badge variant="secondary" className="mt-1">
                              Edited
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{tx.category}</td>
                      <td className="py-3 px-4 truncate max-w-xs">{tx.description}</td>
                      <td
                        className={`py-3 px-4 text-right font-medium ${tx.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {tx.type === 'Credit' ? '+' : '-'}
                        {formatCurrencyFromUser(tx.amount, user).substring(1)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={tx.type === 'Credit' ? 'default' : 'destructive'}>
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button size="sm" variant="outline" onClick={() => setEditingId(tx._id)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="ml-2"
                          onClick={() => handleDeleteTransaction(tx._id)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              No transactions found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Transaction Modal - NUCLEAR TEST: Use conditional rendering instead of Radix */}
      {isCreating && (
        <div
          role="dialog"
          aria-labelledby="create-tx-title"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setIsCreating(false)} />
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-xl rounded-xl">
            <div className="flex flex-col space-y-1.5 text-left">
              <h2 id="create-tx-title" className="text-lg font-semibold leading-none tracking-tight">Add Transaction</h2>
              <p className="text-sm text-muted-foreground">Create a new manual transaction</p>
            </div>
            <form onSubmit={handleSubmit(handleCreateTransaction)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  {...register('type')}
                  className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Debit">Expense</option>
                  <option value="Credit">Income</option>
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input
                  {...register('amount', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="mt-1"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input {...register('date')} type="date" className="mt-1" />
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Merchant</label>
              <Input
                {...register('merchant')}
                placeholder="e.g., Amazon, Coffee Shop"
                className="mt-1"
              />
              {errors.merchant && (
                <p className="mt-1 text-sm text-red-600">{errors.merchant.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Input
                {...register('category')}
                placeholder="e.g., Food, Transport, Shopping"
                list="categories-list"
                className="mt-1"
              />
              <datalist id="categories-list">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input {...register('description')} placeholder="Optional" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input {...register('notes')} placeholder="Optional" className="mt-1" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Transaction'}
              </Button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingId && (
        <Dialog open={!!editingId} onOpenChange={(open) => { if (!open) setEditingId(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
              <DialogDescription>Update the transaction details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleEditTransaction)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="mt-1"
                  />
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input {...register('date')} type="date" className="mt-1" />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Merchant</label>
                <Input {...register('merchant')} className="mt-1" />
                {errors.merchant && (
                  <p className="mt-1 text-sm text-red-600">{errors.merchant.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input {...register('description')} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  {...register('category')}
                  placeholder="e.g., Food, Transport, Shopping"
                  list="categories-list-edit"
                  className="mt-1"
                />
                <datalist id="categories-list-edit">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input {...register('notes')} className="mt-1" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Transactions;
