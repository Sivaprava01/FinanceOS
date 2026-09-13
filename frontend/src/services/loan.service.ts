/**
 * Loan Service
 * Handles all HTTP requests for user loans, EMIs, and debt obligations.
 */

import api from './api'
import type {
  ApiResponse,
  Loan,
  CreateLoanInput,
  UpdateLoanInput,
  LoanSummary,
} from '../types'

export const loanService = {
  /**
   * Get all loans for current user with optional status filter
   */
  async getLoans(params?: { status?: string }): Promise<Loan[]> {
    const response = await api.get<ApiResponse<{ loans: Loan[] }>>('/loans', {
      params,
    })
    return response.data.data.loans
  },

  /**
   * Get aggregated loan summary
   */
  async getLoanSummary(): Promise<LoanSummary> {
    const response = await api.get<ApiResponse<{ summary: LoanSummary }>>('/loans/summary')
    return response.data.data.summary
  },

  /**
   * Get single loan by ID
   */
  async getLoanById(id: string): Promise<Loan> {
    const response = await api.get<ApiResponse<{ loan: Loan }>>(`/loans/${id}`)
    return response.data.data.loan
  },

  /**
   * Create a new loan
   */
  async createLoan(data: CreateLoanInput): Promise<Loan> {
    const response = await api.post<ApiResponse<{ loan: Loan }>>('/loans', data)
    return response.data.data.loan
  },

  /**
   * Update an existing loan
   */
  async updateLoan(id: string, data: UpdateLoanInput): Promise<Loan> {
    const response = await api.put<ApiResponse<{ loan: Loan }>>(`/loans/${id}`, data)
    return response.data.data.loan
  },

  /**
   * Delete a loan
   */
  async deleteLoan(id: string): Promise<void> {
    await api.delete<ApiResponse<null>>(`/loans/${id}`)
  },
}
