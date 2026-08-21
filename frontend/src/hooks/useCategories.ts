import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categories as categoryAPI } from '@services/api'
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types'

export const useCategories = () => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoryAPI.list()
      return response.data.data.categories as Category[]
    },
    staleTime: 5 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const response = await categoryAPI.create(input)
      return response.data.data as Category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryInput }) => {
      const response = await categoryAPI.update(id, data)
      return response.data.data as Category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await categoryAPI.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createCategory: createMutation.mutateAsync,
    createIsLoading: createMutation.isPending,
    createError: createMutation.error,
    updateCategory: updateMutation.mutateAsync,
    updateIsLoading: updateMutation.isPending,
    updateError: updateMutation.error,
    deleteCategory: deleteMutation.mutateAsync,
    deleteIsLoading: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  }
}
