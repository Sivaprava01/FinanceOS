import api from './api'
import type { Transaction, CreateTransactionInput } from '@/types'

export interface GetTransactionsParams {
  limit?: number
  skip?: number
  fromDate?: string
  toDate?: string
  merchant?: string
  category?: string
  type?: 'Debit' | 'Credit'
  search?: string
  minAmount?: number
  maxAmount?: number
}

export interface GetTransactionsResult {
  transactions: Transaction[]
  count: number
}

export interface UpdateTransactionInput {
  merchant?: string
  description?: string
  category?: string
  notes?: string
  amount?: number
  date?: string
}

export interface BulkUpdateInput {
  transactionIds: string[]
  updateData: {
    category?: string
    notes?: string
    merchant?: string
    description?: string
  }
}

export const transactionService = {
  getTransactions: async (params?: GetTransactionsParams): Promise<GetTransactionsResult> => {
    const response = await api.get<{ success: boolean; message: string; data: GetTransactionsResult }>(
      '/transactions',
      { params }
    )
    return response.data.data
  },

  createTransaction: async (input: CreateTransactionInput): Promise<Transaction> => {
    const response = await api.post<{ success: boolean; message: string; data: Transaction }>('/transactions', input)
    return response.data.data
  },

  updateTransaction: async (id: string, data: UpdateTransactionInput): Promise<Transaction> => {
    const response = await api.put<{ success: boolean; message: string; data: Transaction }>(`/transactions/${id}`, data)
    return response.data.data
  },

  deleteTransaction: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`)
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get<{ success: boolean; message: string; data: { categories: string[]; count: number } }>(
      '/transactions/categories/list'
    )
    return response.data.data.categories
  },

  bulkUpdate: async (input: BulkUpdateInput): Promise<{ matched: number; modified: number }> => {
    const response = await api.post<{
      success: boolean
      message: string
      data: { matched: number; modified: number }
    }>('/transactions/bulk-update', input)
    return response.data.data
  },
}
