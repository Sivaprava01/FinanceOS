import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { statementService } from '@services/statement.service'
import type { Statement } from '@/types'

const STATEMENTS_KEY = ['statements']

export const useStatements = () => {
  return useQuery({
    queryKey: STATEMENTS_KEY,
    queryFn: () => statementService.getStatements(),
    staleTime: 5 * 60 * 1000,
    // Poll every 2 seconds while any statement is in "Processing" status
    // This ensures we detect completion as soon as it happens
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data?.statements) return false
      const hasProcessing = data.statements.some((s: Statement) => s.status === 'Processing')
      return hasProcessing ? 2000 : false // Poll every 2s if Processing, else stop
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
    },
  })
}
