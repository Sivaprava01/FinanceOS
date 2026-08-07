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
    mutationFn: (file: File) => statementService.uploadStatement(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATEMENTS_KEY })
    },
  })
}
