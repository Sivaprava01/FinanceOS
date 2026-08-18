import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { statementService } from '@services/statement.service'

const STATEMENTS_KEY = ['statements']

export const useStatements = () => {
  return useQuery({
    queryKey: STATEMENTS_KEY,
    queryFn: () => statementService.getStatements(),
    staleTime: 5 * 60 * 1000,
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
