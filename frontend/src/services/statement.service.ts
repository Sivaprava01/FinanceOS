import api from './api'
import type { Statement } from '@/types'

interface GetStatementsResult {
  statements: Statement[]
  limit: number
  skip: number
}

export const statementService = {
  uploadStatement: async (file: File): Promise<Statement> => {
    const formData = new FormData()
    formData.append('statement', file)
    const response = await api.post<{ success: boolean; message: string; data: Statement }>('/statements/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  getStatements: async (limit?: number, skip?: number): Promise<GetStatementsResult> => {
    const response = await api.get<{ success: boolean; message: string; data: GetStatementsResult }>('/statements', {
      params: { limit, skip },
    })
    return response.data.data
  },

  getStatement: async (id: string): Promise<Statement> => {
    const response = await api.get<{ success: boolean; message: string; data: Statement }>(`/statements/${id}`)
    return response.data.data
  },
}
