import api from './api'
import type { DashboardOverview, SpendingAnalysis, MonthlyComparison } from '@/types'

export const dashboardService = {
  getOverview: async (): Promise<DashboardOverview> => {
    const response = await api.get<{ success: boolean; message: string; data: { overview: DashboardOverview } }>('/dashboard/overview')
    return response.data.data.overview
  },

  getSpendingAnalysis: async (): Promise<SpendingAnalysis> => {
    const response = await api.get<{ success: boolean; message: string; data: { analysis: SpendingAnalysis } }>('/dashboard/spending-analysis')
    return response.data.data.analysis
  },

  getMonthlyComparison: async (): Promise<MonthlyComparison> => {
    const response = await api.get<{ success: boolean; message: string; data: { comparison: MonthlyComparison } }>('/dashboard/monthly-comparison')
    return response.data.data.comparison
  },
}

