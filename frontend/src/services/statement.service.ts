import api from './api'
import type { Statement } from '@/types'

interface GetStatementsResult {
  statements: Statement[]
  limit: number
  skip: number
}

export const statementService = {
  uploadStatement: async (file: File, currency?: string): Promise<Statement> => {
    const formData = new FormData()
    formData.append('statement', file)
    if (currency) {
      formData.append('currency', currency.toUpperCase())
    }
    const response = await api.post<{ success: boolean; message: string; data: Statement }>('/statements/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  getStatements: async (status?: string, limit?: number, skip?: number): Promise<GetStatementsResult> => {
    const response = await api.get<{ success: boolean; message: string; data: GetStatementsResult }>('/statements', {
      params: { status, limit, skip },
    })
    return response.data.data
  },

  getStatement: async (id: string): Promise<Statement> => {
    const response = await api.get<{ success: boolean; message: string; data: Statement }>(`/statements/${id}`)
    return response.data.data
  },

  retryWithPassword: async (statementId: string, password: string): Promise<{ _id: string; status: string }> => {
    const response = await api.post<{ success: boolean; message: string; data: { _id: string; status: string } }>(
      `/statements/${statementId}/retry-with-password`,
      { password }
    )
    return response.data.data
  },

  deleteStatement: async (id: string): Promise<{ _id: string; deletedTransactionsCount: number }> => {
    const response = await api.delete<{ success: boolean; message: string; data: { _id: string; deletedTransactionsCount: number } }>(
      `/statements/${id}`
    )
    return response.data.data
  },

  clearFailedStatements: async (): Promise<{ count: number; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string; data: { count: number; message: string } }>(
      '/statements/failed'
    )
    return response.data.data
  },

  retryStatement: async (id: string): Promise<Statement> => {
    const response = await api.post<{ success: boolean; message: string; data: Statement }>(
      `/statements/${id}/retry`
    )
    return response.data.data
  },
}
