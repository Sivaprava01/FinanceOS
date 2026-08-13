/**
 * useTransactions Hooks
 * TanStack Query hooks for transaction CRUD and search.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/services/transaction.service';
import type { Transaction, ExtractedTransaction } from '@/types';

interface GetTransactionsParams {
  limit?: number;
  skip?: number;
  fromDate?: string;
  toDate?: string;
  merchant?: string;
  category?: string;
}

export const useGetTransactions = (params?: GetTransactionsParams) => {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => transactionService.getUserTransactions(params),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useGetTransaction = (id: string) => {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionService.getTransaction(id),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: !!id,
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Transaction> }) =>
      transactionService.updateTransaction(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      queryClient.invalidateQueries({ queryKey: ['spending-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-all'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      queryClient.invalidateQueries({ queryKey: ['spending-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-all'] });
    },
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      date: string;
      amount: number;
      type: 'Debit' | 'Credit';
      merchant: string;
      description?: string;
      category?: string;
      notes?: string;
    }) => transactionService.createTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      queryClient.invalidateQueries({ queryKey: ['spending-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-all'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useExtractTransactions = () => {
  return useMutation({
    mutationFn: (payload: {
      statementId: string;
      filePath: string;
      fileType: 'PDF' | 'CSV' | 'XLSX';
      password?: string;
    }) => transactionService.extractTransactions(payload),
  });
};

export const useImportTransactions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      statementId: string;
      filePath: string;
      transactions: ExtractedTransaction[];
    }) => transactionService.importTransactions(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      queryClient.invalidateQueries({ queryKey: ['spending-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-all'] });
    },
  });
};

export const useLearnMerchantMapping = () => {
  return useMutation({
    mutationFn: (payload: { originalMerchant: string; correctedMerchant: string }) =>
      transactionService.learnMerchantMapping(payload),
  });
};

export const useGetTransactionStats = (params?: { fromDate?: string; toDate?: string }) => {
  return useQuery({
    queryKey: ['transaction-stats', params],
    queryFn: () => transactionService.getTransactionStats(params),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useGetCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => transactionService.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes (categories don't change often)
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
};

export const useBulkUpdateTransactions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { transactionIds: string[]; updateData: Partial<Transaction> }) =>
      transactionService.bulkUpdateTransactions(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      queryClient.invalidateQueries({ queryKey: ['spending-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-all'] });
    },
  });
};
