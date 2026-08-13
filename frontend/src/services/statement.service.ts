/**
 * Statement Service
 * Handles all statement-related API calls.
 */

import api from './api';
import type { Statement, UploadStatementResponse, ImportHistoryResponse } from '@/types';

interface GetImportHistoryParams {
  limit?: number;
  skip?: number;
}

export const statementService = {
  /**
   * Upload a bank statement
   * POST /api/v1/statements/upload
   * Multipart form-data with file field named "statement"
   */
  uploadStatement: async (file: File): Promise<UploadStatementResponse> => {
    const formData = new FormData();
    formData.append('statement', file);

    const response = await api.post('/statements/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * Get import history
   * GET /api/v1/statements
   */
  getImportHistory: async (params?: GetImportHistoryParams): Promise<ImportHistoryResponse> => {
    const response = await api.get('/statements', { params });
    return response.data.data;
  },

  /**
   * Get a single statement
   * GET /api/v1/statements/:id
   */
  getStatement: async (id: string): Promise<Statement> => {
    const response = await api.get(`/statements/${id}`);
    return response.data.data;
  },
};
