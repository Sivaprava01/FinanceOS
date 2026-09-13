import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@services/dashboard.service'

import type { SpendingAnalysisParams, MonthlyComparisonParams } from '@services/dashboard.service'

export const useOverview = () => {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => dashboardService.getOverview(),
    staleTime: 2 * 60 * 1000,
  })
}

export const useSpendingAnalysis = (params?: SpendingAnalysisParams) => {
  return useQuery({
    queryKey: ['dashboard', 'spending-analysis', params],
    queryFn: () => dashboardService.getSpendingAnalysis(params),
    staleTime: 2 * 60 * 1000,
  })
}

export const useMonthlyComparison = (params?: MonthlyComparisonParams) => {
  return useQuery({
    queryKey: ['dashboard', 'monthly-comparison', params],
    queryFn: () => dashboardService.getMonthlyComparison(params),
    staleTime: 2 * 60 * 1000,
  })
}
