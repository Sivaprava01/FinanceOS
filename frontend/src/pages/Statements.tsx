import React, { useState } from 'react'
import { Upload } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { useStatements, useUploadStatement } from '@hooks/useStatements'
import type { Statement } from '@/types'

const STATUS_STYLES: Record<Statement['status'], string> = {
  Uploaded: 'bg-yellow-100 text-yellow-800',
  Processing: 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
  Failed: 'bg-red-100 text-red-800',
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const Statements: React.FC = () => {
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string>('')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null)

  const { data, isLoading, error } = useStatements()
  const uploadStatement = useUploadStatement()

  const statements = data?.statements ?? []

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
    e.target.value = ''
  }

  const handleFileUpload = async (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ]

    setUploadError('')
    setUploadSuccess(false)

    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a valid file (PDF, Excel, or CSV)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB')
      return
    }

    try {
      await uploadStatement.mutateAsync(file)
      setUploadSuccess(true)
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Upload failed. Please try again.'
      setUploadError(message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Statements</h1>
        <p className="text-muted-foreground">Upload bank statements to import transactions</p>
      </div>

      <Card
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`cursor-pointer border-2 border-dashed transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-border'
        }`}
      >
        <CardContent className="p-12">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Upload Statement</h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop your file here, or click to browse
            </p>

            <div className="mt-6">
              <input
                type="file"
                id="file-input"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.xls,.xlsx,.csv"
              />
              <Button asChild disabled={uploadStatement.isPending}>
                <label htmlFor="file-input" className="cursor-pointer">
                  Browse Files
                </label>
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Supported formats: PDF, Excel, CSV (Max 10MB)
            </p>

            {uploadStatement.isPending && (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
                Uploading...
              </div>
            )}

            {uploadError && (
              <p className="mt-4 text-sm text-destructive">{uploadError}</p>
            )}

            {uploadSuccess && !uploadStatement.isPending && (
              <p className="mt-4 text-sm text-green-600">Statement uploaded successfully!</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>Recent statement uploads and processing status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg bg-destructive/10 p-4">
              <p className="text-sm text-destructive">Failed to load statements. Please refresh.</p>
            </div>
          ) : statements.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No statements uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {statements.map((statement: Statement) => (
                <div
                  key={statement._id}
                  onClick={() => setSelectedStatement(selectedStatement?._id === statement._id ? null : statement)}
                  className="cursor-pointer rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{statement.originalFileName}</p>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            STATUS_STYLES[statement.status]
                          }`}
                        >
                          {statement.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{statement.fileType}</span>
                        <span>{formatFileSize(statement.fileSize)}</span>
                        <span>{statement.transactionCount} transactions</span>
                        <span>{new Date(statement.uploadedAt).toLocaleDateString()}</span>
                      </div>
                      {statement.failureReason && (
                        <p className="mt-2 text-xs text-destructive">{statement.failureReason}</p>
                      )}
                    </div>
                  </div>

                  {selectedStatement?._id === statement._id && (
                    <div className="mt-4 border-t border-border pt-4 text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID</span>
                        <span className="font-mono text-xs">{statement._id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span>{statement.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transactions</span>
                        <span>{statement.transactionCount}</span>
                      </div>
                      {statement.processedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Processed</span>
                          <span>{new Date(statement.processedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Statements
