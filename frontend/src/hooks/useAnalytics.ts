/**
 * useAnalytics Hooks
 * TanStack Query hooks for analytics endpoints with automatic refetch.
 */

import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';

export const useSpendingAnalytics = () => {
  return useQuery({
    queryKey: ['analytics-spending'],
    queryFn: () => analyticsService.getSpendingAnalysis(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

export const useMonthlyAnalytics = () => {
  return useQuery({
    queryKey: ['analytics-monthly'],
    queryFn: () => analyticsService.getMonthlyComparison(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

export const useHealthAnalytics = () => {
  return useQuery({
    queryKey: ['analytics-health'],
    queryFn: () => analyticsService.getHealthScore(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

export const useInsightsAnalytics = () => {
  return useQuery({
    queryKey: ['analytics-insights'],
    queryFn: () => analyticsService.getInsights(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

/**
 * Hook to refetch all analytics data
 */
export const useAnalyticsRefetch = () => {
  return useQuery({
    queryKey: ['analytics-all'],
    queryFn: async () => {
      const [spending, monthly, health, insights] = await Promise.all([
        analyticsService.getSpendingAnalysis(),
        analyticsService.getMonthlyComparison(),
        analyticsService.getHealthScore(),
        analyticsService.getInsights(),
      ]);
      return { spending, monthly, health, insights };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};
