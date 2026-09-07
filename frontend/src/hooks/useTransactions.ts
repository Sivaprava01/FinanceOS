import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateTransactionInput } from '@/types'
import { transactionService } from '@services/transaction.service'
import type { GetTransactionsParams, UpdateTransactionInput, BulkUpdateInput } from '@services/transaction.service'

export type { GetTransactionsParams, UpdateTransactionInput }

const TRANSACTIONS_KEY = ['transactions']
/** Invalidating this prefix covers overview, spending-analysis, and monthly-comparison */
const DASHBOARD_KEY = ['dashboard']

export const useTransactions = (params?: GetTransactionsParams) =>
  useQuery({
    queryKey: [...TRANSACTIONS_KEY, params],
    queryFn: () => transactionService.getTransactions(params),
    staleTime: 2 * 60 * 1000,
  })

export const useCreateTransaction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => transactionService.createTransaction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
    },
  })
}

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionInput }) =>
      transactionService.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
    },
  })
}

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => transactionService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
    },
  })
}

export const useBulkUpdate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BulkUpdateInput) => transactionService.bulkUpdate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
    },
  })
}
