/**
 * useStatements Hooks
 * TanStack Query hooks for statement upload and history.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { statementService } from '@/services/statement.service';

interface GetImportHistoryParams {
  limit?: number;
  skip?: number;
}

export const useGetImportHistory = (params?: GetImportHistoryParams) => {
  return useQuery({
    queryKey: ['statements', params],
    queryFn: () => statementService.getImportHistory(params),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useGetStatement = (id: string) => {
  return useQuery({
    queryKey: ['statement', id],
    queryFn: () => statementService.getStatement(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: !!id,
  });
};

export const useUploadStatement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => statementService.uploadStatement(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statements'] });
    },
  });
};
