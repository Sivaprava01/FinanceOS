/**
 * Transaction Service
 * Handles all transaction-related API calls.
 */

import api from './api';
import type {
  Transaction,
  TransactionStats,
  MerchantMapping,
  ExtractedTransaction,
  ExtractTransactionsResponse,
  TransactionsForReviewResponse,
} from '@/types';

interface CreateTransactionPayload {
  date: string;
  amount: number;
  type: 'Debit' | 'Credit';
  merchant: string;
  description?: string;
  category?: string;
  notes?: string;
}

interface ExtractPayload {
  statementId: string;
  filePath: string;
  fileType: 'PDF' | 'CSV' | 'XLSX';
  password?: string;
}

interface LearnMerchantPayload {
  originalMerchant: string;
  correctedMerchant: string;
}

interface UpdateTransactionPayload {
  merchant?: string;
  description?: string;
  category?: string;
  notes?: string;
  amount?: number;
  date?: string;
}

interface ImportTransactionsPayload {
  statementId: string;
  filePath: string;
  transactions: ExtractedTransaction[];
}

interface BulkUpdatePayload {
  transactionIds: string[];
  updateData: Partial<Transaction>;
}

interface GetTransactionsParams {
  limit?: number;
  skip?: number;
  fromDate?: string;
  toDate?: string;
  merchant?: string;
  category?: string;
}

export const transactionService = {
  /**
   * Create a manual transaction
   * POST /api/v1/transactions
   */
  createTransaction: async (payload: CreateTransactionPayload): Promise<Transaction> => {
    const response = await api.post('/transactions', payload);
    return response.data.data;
  },

  /**
   * Extract transactions from a statement file
   * POST /api/v1/transactions/extract
   */
  extractTransactions: async (payload: ExtractPayload): Promise<ExtractTransactionsResponse> => {
    const response = await api.post('/transactions/extract', {
      statementId: payload.statementId,
      password: payload.password || undefined,
    });
    return response.data.data;
  },

  /**
   * Get transactions for review from a statement
   * GET /api/v1/transactions/review/:statementId
   */
  getTransactionsForReview: async (statementId: string): Promise<TransactionsForReviewResponse> => {
    const response = await api.get(`/transactions/review/${statementId}`);
    return response.data.data;
  },

  /**
   * Learn a merchant mapping
   * POST /api/v1/transactions/learn-merchant
   */
  learnMerchantMapping: async (payload: LearnMerchantPayload): Promise<MerchantMapping> => {
    const response = await api.post('/transactions/learn-merchant', payload);
    return response.data.data;
  },

  /**
   * Import reviewed transactions
   * POST /api/v1/transactions/import
   */
  importTransactions: async (
    payload: ImportTransactionsPayload
  ): Promise<{ statementId: string; transactionCount: number; message: string }> => {
    const response = await api.post('/transactions/import', payload);
    return response.data.data;
  },

  /**
   * Get all transactions for the current user
   * GET /api/v1/transactions
   */
  getUserTransactions: async (
    params?: GetTransactionsParams
  ): Promise<{ transactions: Transaction[]; count: number }> => {
    const response = await api.get('/transactions', { params });
    return response.data.data;
  },

  /**
   * Get a single transaction
   * GET /api/v1/transactions/:id
   */
  getTransaction: async (id: string): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`);
    return response.data.data;
  },

  /**
   * Update a transaction
   * PUT /api/v1/transactions/:id
   */
  updateTransaction: async (
    id: string,
    payload: UpdateTransactionPayload
  ): Promise<Transaction> => {
    const response = await api.put(`/transactions/${id}`, payload);
    return response.data.data;
  },

  /**
   * Delete a transaction (soft delete)
   * DELETE /api/v1/transactions/:id
   */
  deleteTransaction: async (id: string): Promise<{ message: string; deletedAt: string }> => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data.data;
  },

  /**
   * Get transaction statistics
   * GET /api/v1/transactions/stats/overview
   */
  getTransactionStats: async (params?: {
    fromDate?: string;
    toDate?: string;
  }): Promise<TransactionStats> => {
    const response = await api.get('/transactions/stats/overview', { params });
    return response.data.data;
  },

  /**
   * Get all categories used by the user
   * GET /api/v1/transactions/categories/list
   */
  getCategories: async (): Promise<{ categories: string[]; count: number }> => {
    const response = await api.get('/transactions/categories/list');
    return response.data.data;
  },

  /**
   * Bulk update transactions
   * POST /api/v1/transactions/bulk-update
   */
  bulkUpdateTransactions: async (
    payload: BulkUpdatePayload
  ): Promise<{ success: boolean; matched: number; modified: number; message: string }> => {
    const response = await api.post('/transactions/bulk-update', payload);
    return response.data.data;
  },
};
