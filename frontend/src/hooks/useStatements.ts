import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { statementService } from '@services/statement.service'
import type { Statement } from '@/types'

const STATEMENTS_KEY = ['statements']

export const useStatements = (status: string = 'active') => {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: [...STATEMENTS_KEY, status],
    queryFn: async () => {
      const result = await statementService.getStatements(status)
      // Check if any statement just completed and invalidate transactions & dashboard caches
      const completedCount = result.statements.filter((s: Statement) => s.status === 'Completed').length
      if (completedCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }
      return result
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    // Poll every 2 seconds while any statement is in "Uploaded" or "Processing" status
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data?.statements) return false
      const hasPending = data.statements.some(
        (s: Statement) => s.status === 'Processing' || s.status === 'Uploaded'
      )
      return hasPending ? 2000 : false
    },
  })
}

export const useUploadStatement = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, currency }: { file: File; currency?: string }) =>
      statementService.uploadStatement(file, currency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATEMENTS_KEY })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export const useRetryWithPassword = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ statementId, password }: { statementId: string; password: string }) =>
      statementService.retryWithPassword(statementId, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATEMENTS_KEY })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export const useDeleteStatement = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => statementService.deleteStatement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATEMENTS_KEY })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export const useClearFailedStatements = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => statementService.clearFailedStatements(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATEMENTS_KEY })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export const useRetryStatement = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => statementService.retryStatement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATEMENTS_KEY })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export const useStatement = (id: string | null) => {
  return useQuery({
    queryKey: ['statement', id],
    queryFn: () => (id ? statementService.getStatement(id) : null),
    enabled: !!id,
  })
}
