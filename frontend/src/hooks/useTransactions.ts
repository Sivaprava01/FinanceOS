import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateTransactionInput } from '@/types'
import { transactionService } from '@services/transaction.service'

interface GetTransactionsParams {
  limit?: number
  skip?: number
  fromDate?: string
  toDate?: string
  merchant?: string
  category?: string
}

interface UpdateTransactionInput {
  merchant?: string
  description?: string
  category?: string
  notes?: string
  amount?: number
  date?: string
}

const TRANSACTIONS_KEY = ['transactions']

export const useTransactions = (params?: GetTransactionsParams) => {
  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, params],
    queryFn: () => transactionService.getTransactions(params),
    staleTime: 5 * 60 * 1000,
  })
}

export const useCreateTransaction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => transactionService.createTransaction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
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
    },
  })
}

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => transactionService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
    },
  })
}
