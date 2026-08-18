import api from './api'

export interface SearchResult {
  transactions: Array<{ _id: string; merchant: string; amount: number; date: string; category?: string; description: string; type: string }>
  categories: string[]
}

export const searchService = {
  search: async (query: string, filters?: { category?: string; fromDate?: string; toDate?: string }): Promise<SearchResult> => {
    const params = new URLSearchParams()
    params.append('q', query)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.fromDate) params.append('fromDate', filters.fromDate)
    if (filters?.toDate) params.append('toDate', filters.toDate)

    const r = await api.get<{ success: boolean; message: string; data: SearchResult }>(`/transactions?${params}`)
    return r.data.data
  },
}
