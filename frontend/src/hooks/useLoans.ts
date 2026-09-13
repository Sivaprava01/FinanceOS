import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { loanService } from '@services/loan.service'
import type { CreateLoanInput, UpdateLoanInput } from '@/types'

export const useLoans = (status?: string) => {
  const queryClient = useQueryClient()

  const loansQuery = useQuery({
    queryKey: ['loans', status || 'all'],
    queryFn: () => loanService.getLoans(status ? { status } : undefined),
    staleTime: 2 * 60 * 1000,
  })

  const summaryQuery = useQuery({
    queryKey: ['loans', 'summary'],
    queryFn: () => loanService.getLoanSummary(),
    staleTime: 2 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateLoanInput) => loanService.createLoan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['assets', 'net-worth'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLoanInput }) =>
      loanService.updateLoan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['assets', 'net-worth'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => loanService.deleteLoan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['assets', 'net-worth'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
    },
  })

  return {
    loans: loansQuery.data || [],
    isLoadingLoans: loansQuery.isLoading,
    loansError: loansQuery.error,
    refetchLoans: loansQuery.refetch,

    summary: summaryQuery.data,
    isLoadingSummary: summaryQuery.isLoading,
    summaryError: summaryQuery.error,

    createLoan: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    updateLoan: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    deleteLoan: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  }
}
