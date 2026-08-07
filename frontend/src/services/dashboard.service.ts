import api from './api'
import type { DashboardOverview, SpendingAnalysis } from '@/types'

export const dashboardService = {
  getOverview: async (): Promise<DashboardOverview> => {
    const response = await api.get<{ success: boolean; message: string; data: { overview: DashboardOverview } }>('/dashboard/overview')
    return response.data.data.overview
  },

  getSpendingAnalysis: async (): Promise<SpendingAnalysis> => {
    const response = await api.get<{ success: boolean; message: string; data: { analysis: SpendingAnalysis } }>('/dashboard/spending-analysis')
    return response.data.data.analysis
  },
}
