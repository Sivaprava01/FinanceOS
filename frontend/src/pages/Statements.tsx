/**
 * Statements Page
 * Upload bank statements, view import history, and manage statement details.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Loader } from '@components/ui/Loader';
import { PasswordDialog } from '@components/PasswordDialog';
import { useUploadStatement, useGetImportHistory } from '@/hooks/useStatements';
import { useExtractTransactions, useImportTransactions } from '@/hooks/useTransactions';
import type { UploadStatementResponse } from '@/types';

const Statements: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pendingStatementData, setPendingStatementData] = useState<{
    uploadedStatement: UploadStatementResponse;
    fileType: 'PDF' | 'CSV' | 'XLSX';
  } | null>(null);

  const uploadMutation = useUploadStatement();
  const extractMutation = useExtractTransactions();
  const importMutation = useImportTransactions();
  const [processingStatementId, setProcessingStatementId] = useState<string | null>(null);

  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
  } = useGetImportHistory({
    limit: 10,
    skip: 0,
  });

  const history = historyData?.statements || [];

  // Extract transactions after successful upload
  const startExtraction = (uploadedStatement: UploadStatementResponse) => {
    const statementId = uploadedStatement._id;
    const fileType = uploadedStatement.fileType as 'PDF' | 'CSV' | 'XLSX';

    setProcessingStatementId(statementId);
    setPendingStatementData({ uploadedStatement, fileType });

    // First extraction attempt (no password)
    extractMutation.mutate(
      {
        statementId,
        filePath: uploadedStatement.filePath || '',
        fileType,
        password: undefined,
      },
      {
        onSuccess: (extractedData) => {
          // Success: proceed to import
          if (extractedData.transactions && extractedData.transactions.length > 0) {
            importMutation.mutate({
              statementId,
              filePath: uploadedStatement.filePath || '',
              transactions: extractedData.transactions,
            });
          } else {
            setProcessingStatementId(null);
            setPendingStatementData(null);
          }
        },
        onError: (error: any) => {
          // Check if it's a password-related error
          const errorMessage = error?.response?.data?.message || error?.message || '';
          if (errorMessage === 'PDF_PASSWORD_REQUIRED') {
            // Show password dialog
            setPasswordDialogOpen(true);
            setPasswordError(null);
          } else if (errorMessage === 'PDF_PASSWORD_INCORRECT') {
            // Show password dialog with error
            setPasswordDialogOpen(true);
            setPasswordError('PDF_PASSWORD_INCORRECT');
          } else {
            // Other error
            setProcessingStatementId(null);
            setPendingStatementData(null);
          }
        },
      }
    );
  };

  // Automatically extract and import transactions after successful upload
  useEffect(() => {
    if (uploadMutation.isSuccess && uploadMutation.data && !processingStatementId) {
      startExtraction(uploadMutation.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadMutation.isSuccess, uploadMutation.data]);

  // Clear processing state when import completes
  useEffect(() => {
    if (importMutation.isSuccess) {
      setProcessingStatementId(null);
      setPendingStatementData(null);
      setPasswordDialogOpen(false);
      setPasswordError(null);
      uploadMutation.reset();
      extractMutation.reset();
      importMutation.reset();
    }
  }, [importMutation.isSuccess]);

  const handlePasswordSubmit = (password: string) => {
    if (!pendingStatementData) return;

    const { uploadedStatement, fileType } = pendingStatementData;

    // Retry extraction with password
    extractMutation.mutate(
      {
        statementId: uploadedStatement._id,
        filePath: uploadedStatement.filePath || '',
        fileType,
        password,
      },
      {
        onSuccess: (extractedData) => {
          // Success: close dialog and proceed to import
          setPasswordDialogOpen(false);
          setPasswordError(null);
          if (extractedData.transactions && extractedData.transactions.length > 0) {
            importMutation.mutate({
              statementId: uploadedStatement._id,
              filePath: uploadedStatement.filePath || '',
              transactions: extractedData.transactions,
            });
          }
        },
        onError: (error: any) => {
          // Wrong password - show error but keep dialog open for retry
          const errorMessage = error?.response?.data?.message || error?.message || '';
          if (errorMessage === 'PDF_PASSWORD_INCORRECT') {
            setPasswordError('PDF_PASSWORD_INCORRECT');
          } else {
            setPasswordError(errorMessage || 'Failed to extract transactions with this password');
          }
        },
      }
    );
  };

  const handlePasswordCancel = () => {
    setPasswordDialogOpen(false);
    setPasswordError(null);
    setProcessingStatementId(null);
    setPendingStatementData(null);
    extractMutation.reset();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Uploaded':
        return 'bg-blue-100 text-blue-800';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadMutation.mutate(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      uploadMutation.mutate(files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Dialog */}
      <PasswordDialog
        isOpen={passwordDialogOpen}
        isLoading={extractMutation.isPending}
        error={passwordError}
        onSubmit={handlePasswordSubmit}
        onCancel={handlePasswordCancel}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Statements</h1>
        <p className="text-muted-foreground">Upload and manage your bank statements</p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Statement</CardTitle>
          <CardDescription>Drag and drop your bank statement or click to select</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-lg border-2 border-dashed p-8 text-center transition ${
              dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.csv,.xlsx"
              onChange={handleFileInput}
              disabled={!!(uploadMutation.isPending || (processingStatementId && (extractMutation.isPending || importMutation.isPending)))}
            />
            {uploadMutation.isPending || (processingStatementId && (extractMutation.isPending || importMutation.isPending)) ? (
              <div className="flex flex-col items-center justify-center">
                <Loader size="lg" className="mb-4" />
                <p className="text-sm text-muted-foreground">
                  {uploadMutation.isPending
                    ? 'Uploading...'
                    : extractMutation.isPending
                      ? 'Extracting transactions...'
                      : 'Importing transactions...'}
                </p>
              </div>
            ) : (
              <>
                <label
                  htmlFor="file-upload"
                  className="flex cursor-pointer flex-col items-center justify-center"
                >
                  <svg
                    className="mb-4 h-12 w-12 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-base font-medium">Drag and drop your file</p>
                  <p className="text-sm text-muted-foreground">or click to select</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Supported formats: PDF, CSV, XLSX
                  </p>
                </label>
              </>
            )}
          </div>
          {uploadMutation.error && (
            <p className="mt-4 text-sm text-red-600">Upload failed. Please try again.</p>
          )}
          {uploadMutation.isSuccess && !processingStatementId && (
            <p className="mt-4 text-sm text-green-600">File uploaded successfully! Processing...</p>
          )}
        </CardContent>
      </Card>

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>Your previously uploaded statements</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader size="lg" />
            </div>
          ) : historyError ? (
            <p className="text-red-600">Failed to load import history.</p>
          ) : history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left">File Name</th>
                    <th className="py-3 px-4 text-left">Type</th>
                    <th className="py-3 px-4 text-left">Size</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Transactions</th>
                    <th className="py-3 px-4 text-left">Uploaded</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((stmt) => (
                    <tr key={stmt._id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">
                        <div>{stmt.originalFileName}</div>
                        {stmt.status === 'Failed' && stmt.failureReason && (
                          <p className="text-xs text-red-600 mt-1">{stmt.failureReason}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">{stmt.fileType}</td>
                      <td className="py-3 px-4">{(stmt.fileSize / 1024).toFixed(2)} KB</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(stmt.status)}>{stmt.status}</Badge>
                      </td>
                      <td className="py-3 px-4">{stmt.transactionCount}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {new Date(stmt.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              No statements uploaded yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Statements;
