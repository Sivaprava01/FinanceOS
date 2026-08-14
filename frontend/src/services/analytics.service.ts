/**
 * Analytics Service
 * Handles all analytics-related API calls.
 * Reuses dashboard endpoints for analytics data.
 */

import api from './api';
import type {
  SpendingAnalysis,
  MonthlyComparison,
  HealthScore,
  Insights,
} from '@/types';

export const analyticsService = {
  /**
   * Get spending analysis
   * GET /api/v1/dashboard/spending-analysis
   */
  getSpendingAnalysis: async (): Promise<{ analysis: SpendingAnalysis }> => {
    const response = await api.get('/dashboard/spending-analysis');
    return response.data.data;
  },

  /**
   * Get monthly comparison
   * GET /api/v1/dashboard/monthly-comparison
   */
  getMonthlyComparison: async (): Promise<{ comparison: MonthlyComparison }> => {
    const response = await api.get('/dashboard/monthly-comparison');
    return response.data.data;
  },

  /**
   * Get health score
   * GET /api/v1/dashboard/health-score
   */
  getHealthScore: async (): Promise<{ healthScore: HealthScore }> => {
    const response = await api.get('/dashboard/health-score');
    return response.data.data;
  },

  /**
   * Get insights
   * GET /api/v1/dashboard/insights
   */
  getInsights: async (): Promise<Insights> => {
    const response = await api.get('/dashboard/insights');
    return response.data.data;
  },
};
