import api from './api'
import type { DashboardOverview, SpendingAnalysis, MonthlyComparison } from '@/types'

export interface SpendingAnalysisParams {
  period?: 'all' | 'current_month' | 'last_month' | '3_months' | '6_months' | '1_year' | 'custom'
  fromDate?: string
  toDate?: string
  month?: number
  year?: number
}

export interface MonthlyComparisonParams {
  month?: number
  year?: number
}

export const dashboardService = {
  getOverview: async (): Promise<DashboardOverview> => {
    const response = await api.get<{ success: boolean; message: string; data: { overview: DashboardOverview } }>(
      '/dashboard/overview'
    )
    return response.data.data.overview
  },

  getSpendingAnalysis: async (params?: SpendingAnalysisParams): Promise<SpendingAnalysis> => {
    const response = await api.get<{ success: boolean; message: string; data: { analysis: SpendingAnalysis } }>(
      '/dashboard/spending-analysis',
      { params }
    )
    return response.data.data.analysis
  },

  getMonthlyComparison: async (params?: MonthlyComparisonParams): Promise<MonthlyComparison> => {
    const response = await api.get<{ success: boolean; message: string; data: { comparison: MonthlyComparison } }>(
      '/dashboard/monthly-comparison',
      { params }
    )
    return response.data.data.comparison
  },
}

