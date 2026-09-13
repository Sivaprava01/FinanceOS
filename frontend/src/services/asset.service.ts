/**
 * Asset Service
 * Handles all HTTP requests for user assets and net worth calculations.
 */

import api from './api'
import type {
  ApiResponse,
  Asset,
  CreateAssetInput,
  UpdateAssetInput,
  AssetSummary,
  NetWorthData,
} from '../types'

export const assetService = {
  /**
   * Get all assets for current user with optional category filter
   */
  async getAssets(params?: { category?: string }): Promise<Asset[]> {
    const response = await api.get<ApiResponse<{ assets: Asset[] }>>('/assets', {
      params,
    })
    return response.data.data.assets
  },

  /**
   * Get aggregated asset summary by category
   */
  async getAssetSummary(): Promise<AssetSummary> {
    const response = await api.get<ApiResponse<{ summary: AssetSummary }>>('/assets/summary')
    return response.data.data.summary
  },

  /**
   * Get calculated Net Worth (Assets - Active Liabilities)
   */
  async getNetWorth(): Promise<NetWorthData> {
    const response = await api.get<ApiResponse<{ netWorth: NetWorthData }>>('/assets/net-worth')
    return response.data.data.netWorth
  },

  /**
   * Get single asset by ID
   */
  async getAssetById(id: string): Promise<Asset> {
    const response = await api.get<ApiResponse<{ asset: Asset }>>(`/assets/${id}`)
    return response.data.data.asset
  },

  /**
   * Create a new asset
   */
  async createAsset(data: CreateAssetInput): Promise<Asset> {
    const response = await api.post<ApiResponse<{ asset: Asset }>>('/assets', data)
    return response.data.data.asset
  },

  /**
   * Update an existing asset
   */
  async updateAsset(id: string, data: UpdateAssetInput): Promise<Asset> {
    const response = await api.put<ApiResponse<{ asset: Asset }>>(`/assets/${id}`, data)
    return response.data.data.asset
  },

  /**
   * Delete an asset
   */
  async deleteAsset(id: string): Promise<void> {
    await api.delete<ApiResponse<null>>(`/assets/${id}`)
  },
}
