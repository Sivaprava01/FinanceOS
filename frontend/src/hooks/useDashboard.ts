/**
 * useDashboard Hooks
 * TanStack Query hooks for all dashboard endpoints with automatic refetch.
 */

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';

export const useDashboardOverview = () => {
  return useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => dashboardService.getOverview(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

export const useSpendingAnalysis = () => {
  return useQuery({
    queryKey: ['spending-analysis'],
    queryFn: () => dashboardService.getSpendingAnalysis(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

export const useMonthlyComparison = () => {
  return useQuery({
    queryKey: ['monthly-comparison'],
    queryFn: () => dashboardService.getMonthlyComparison(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

export const useHealthScore = () => {
  return useQuery({
    queryKey: ['health-score'],
    queryFn: () => dashboardService.getHealthScore(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

export const useInsights = () => {
  return useQuery({
    queryKey: ['insights'],
    queryFn: () => dashboardService.getInsights(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

/**
 * Hook to refetch all dashboard data
 */
export const useDashboardRefetch = () => {
  return useQuery({
    queryKey: ['dashboard-all'],
    queryFn: async () => {
      const [overview, analysis, comparison, healthScore, insights] = await Promise.all([
        dashboardService.getOverview(),
        dashboardService.getSpendingAnalysis(),
        dashboardService.getMonthlyComparison(),
        dashboardService.getHealthScore(),
        dashboardService.getInsights(),
      ]);
      return { overview, analysis, comparison, healthScore, insights };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};
