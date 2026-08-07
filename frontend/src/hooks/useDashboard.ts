import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@services/dashboard.service'

export const useOverview = () => {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => dashboardService.getOverview(),
    staleTime: 2 * 60 * 1000,
  })
}

export const useSpendingAnalysis = () => {
  return useQuery({
    queryKey: ['dashboard', 'spending-analysis'],
    queryFn: () => dashboardService.getSpendingAnalysis(),
    staleTime: 2 * 60 * 1000,
  })
}
