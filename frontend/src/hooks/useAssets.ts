import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assetService } from '@services/asset.service'
import type { CreateAssetInput, UpdateAssetInput } from '@/types'

export const useAssets = (category?: string) => {
  const queryClient = useQueryClient()

  const assetsQuery = useQuery({
    queryKey: ['assets', category || 'all'],
    queryFn: () => assetService.getAssets(category ? { category } : undefined),
    staleTime: 2 * 60 * 1000,
  })

  const summaryQuery = useQuery({
    queryKey: ['assets', 'summary'],
    queryFn: () => assetService.getAssetSummary(),
    staleTime: 2 * 60 * 1000,
  })

  const netWorthQuery = useQuery({
    queryKey: ['assets', 'net-worth'],
    queryFn: () => assetService.getNetWorth(),
    staleTime: 2 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateAssetInput) => assetService.createAsset(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetInput }) =>
      assetService.updateAsset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetService.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
    },
  })

  return {
    assets: assetsQuery.data || [],
    isLoadingAssets: assetsQuery.isLoading,
    assetsError: assetsQuery.error,
    refetchAssets: assetsQuery.refetch,

    summary: summaryQuery.data,
    isLoadingSummary: summaryQuery.isLoading,
    summaryError: summaryQuery.error,

    netWorth: netWorthQuery.data,
    isLoadingNetWorth: netWorthQuery.isLoading,
    netWorthError: netWorthQuery.error,
    refetchNetWorth: netWorthQuery.refetch,

    createAsset: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    updateAsset: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    deleteAsset: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  }
}
