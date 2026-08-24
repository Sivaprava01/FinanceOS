import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  Eye,
  AlertCircle,
  Trash2,
  RefreshCw,
  KeyRound,
  FileText,
  CheckCircle2,
  Clock,
  Search,
  X,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import {
  useStatements,
  useUploadStatement,
  useRetryWithPassword,
  useDeleteStatement,
  useClearFailedStatements,
  useRetryStatement,
} from '@hooks/useStatements'
import { useAuth } from '@hooks/useAuth'
import type { Statement } from '@/types'

const COMMON_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'JPY', 'AED', 'NZD',
  'CHF', 'CNY', 'MYR', 'THB', 'PHP', 'ZAR', 'BRL', 'TRY', 'KRW', 'SEK',
]

const STATUS_STYLES: Record<Statement['status'], { badge: string; icon: React.ReactNode }> = {
  Uploaded: {
    badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    icon: <Clock className="h-3.5 w-3.5 mr-1 animate-pulse" />,
  },
  Processing: {
    badge: 'bg-info/10 text-info border-info/20',
    icon: <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-muted border-t-info" />,
  },
  'Password Required': {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    icon: <KeyRound className="h-3.5 w-3.5 mr-1" />,
  },
  Completed: {
    badge: 'bg-success/10 text-success border-success/20',
    icon: <CheckCircle2 className="h-3.5 w-3.5 mr-1" />,
  },
  Failed: {
    badge: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <AlertCircle className="h-3.5 w-3.5 mr-1" />,
  },
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Delete Statement Dialog ──────────────────────────────────────────────────

const DeleteStatementDialog: React.FC<{
  statement: Statement | null
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}> = ({ statement, onConfirm, onCancel, isDeleting }) => {
  if (!statement) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Delete Import?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This will remove <strong className="text-foreground">{statement.originalFileName}</strong>
              {statement.transactionCount > 0 ? (
                <> and its <strong className="text-foreground">{statement.transactionCount}</strong> imported transactions.</>
              ) : (
                <> record.</>
              )}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} isLoading={isDeleting}>
            Delete Import
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Clear Failed Dialog ──────────────────────────────────────────────────────

const ClearFailedDialog: React.FC<{
  count: number
  onConfirm: () => void
  onCancel: () => void
  isClearing: boolean
}> = ({ count, onConfirm, onCancel, isClearing }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    onClick={onCancel}
  >
    <div
      className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10">
          <Trash2 className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Clear Failed Imports?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This will remove all <strong className="text-foreground">{count}</strong> failed and pending-password statement import records.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={isClearing}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm} isLoading={isClearing}>
          Clear Failed
        </Button>
      </div>
    </div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

const Statements: React.FC = () => {
  const navigate = useNavigate()
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string>('')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [statementCurrency, setStatementCurrency] = useState<string>('')
  const [passwordStatementId, setPasswordStatementId] = useState<string | null>(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal dialog states
  const [deleteTarget, setDeleteTarget] = useState<Statement | null>(null)
  const [showClearFailedModal, setShowClearFailedModal] = useState(false)

  const { user } = useAuth()
  const { data, isLoading, error } = useStatements(activeTab)
  const uploadStatement = useUploadStatement()
  const retryWithPassword = useRetryWithPassword()
  const deleteStatement = useDeleteStatement()
  const clearFailedStatements = useClearFailedStatements()
  const retryStatement = useRetryStatement()

  // Default to user's preferred currency
  React.useEffect(() => {
    if (user?.preferredCurrency && !statementCurrency) {
      setStatementCurrency(user.preferredCurrency)
    }
  }, [user?.preferredCurrency, statementCurrency])

  const statements = data?.statements ?? []

  // Count failed / password-required statements for active view
  const failedCount = statements.filter(
    (s: Statement) => s.status === 'Failed' || s.status === 'Password Required'
  ).length

  // Filter completed statements by search query
  const filteredStatements = statements.filter((s: Statement) =>
    s.originalFileName.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      await uploadStatement.mutateAsync({
        file,
        currency: statementCurrency || user?.preferredCurrency || 'USD',
      })
      setUploadSuccess(true)
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Upload failed. Please try again.'
      setUploadError(message)
    }
  }

  const handlePasswordSubmit = async (statementId: string) => {
    if (!passwordInput.trim()) {
      setPasswordError('Password is required')
      return
    }

    setPasswordError('')
    try {
      await retryWithPassword.mutateAsync({ statementId, password: passwordInput })
      setPasswordInput('')
      setPasswordStatementId(null)
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to process password'
      setPasswordError(message)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    await deleteStatement.mutateAsync(deleteTarget._id)
    setDeleteTarget(null)
  }

  const handleClearFailedConfirm = async () => {
    await clearFailedStatements.mutateAsync()
    setShowClearFailedModal(false)
  }

  const handleViewTransactions = (statementId: string) => {
    navigate(`/transactions?statementId=${statementId}`)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Delete confirmation modal */}
      <DeleteStatementDialog
        statement={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={deleteStatement.isPending}
      />

      {/* Clear failed confirmation modal */}
      {showClearFailedModal && (
        <ClearFailedDialog
          count={failedCount}
          onConfirm={handleClearFailedConfirm}
          onCancel={() => setShowClearFailedModal(false)}
          isClearing={clearFailedStatements.isPending}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statements</h1>
        <p className="text-muted-foreground mt-1">Upload and manage your bank statement imports.</p>
      </div>

      {/* Upload Dropzone Card */}
      <Card
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative overflow-hidden transition-all duration-200 border-2 border-dashed ${
          dragActive ? 'border-primary bg-primary/5 scale-[1.005]' : 'border-border hover:border-primary/50'
        }`}
      >
        <CardContent className="p-8 sm:p-10">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Upload Bank Statement</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Drag and drop your file here, or click browse below
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Currency Selector */}
              <div className="flex items-center gap-2 rounded-lg border border-input bg-background/80 px-3 py-1.5 text-sm">
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Currency:</span>
                <select
                  value={statementCurrency}
                  onChange={(e) => setStatementCurrency(e.target.value)}
                  className="bg-transparent font-medium focus:outline-none cursor-pointer"
                >
                  {COMMON_CURRENCIES.map((c) => (
                    <option key={c} value={c} className="bg-card text-foreground">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Input Trigger */}
              <div>
                <input
                  type="file"
                  id="file-input"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.xls,.xlsx,.csv"
                />
                <Button asChild disabled={uploadStatement.isPending} size="default">
                  <label htmlFor="file-input" className="cursor-pointer">
                    Browse Files
                  </label>
                </Button>
              </div>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Supported formats: PDF (password-protected supported), Excel (.xls, .xlsx), CSV (Max 10MB)
            </p>

            {uploadStatement.isPending && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs text-primary font-medium">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Uploading & queuing for processing...
              </div>
            )}

            {uploadError && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium">
                <AlertCircle className="h-4 w-4" />
                {uploadError}
              </div>
            )}

            {uploadSuccess && !uploadStatement.isPending && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2 text-xs text-success font-medium">
                <Sparkles className="h-4 w-4" />
                Statement uploaded successfully!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Section - Import Management */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Import Management</CardTitle>
              <CardDescription>
                {activeTab === 'active'
                  ? 'Active imports requiring processing or attention'
                  : 'Successfully processed statement imports'}
              </CardDescription>
            </div>

            {/* Tab Navigation */}
            <div className="flex rounded-lg border border-border bg-muted/30 p-1 self-start sm:self-auto">
              <button
                onClick={() => setActiveTab('active')}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
                  activeTab === 'active'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Active Imports
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
                  activeTab === 'completed'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Completed History
              </button>
            </div>
          </div>

          {/* Secondary Header Row: Search & Bulk Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border/50">
            {activeTab === 'completed' ? (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search statements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Showing pending, failed, or password-required statement imports
              </p>
            )}

            {activeTab === 'active' && failedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-destructive hover:bg-destructive hover:text-white self-end sm:self-auto gap-1.5"
                onClick={() => setShowClearFailedModal(true)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear Failed Imports ({failedCount})
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/50" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg bg-destructive/10 p-4 text-center">
              <p className="text-sm text-destructive">Failed to load statements. Please refresh.</p>
            </div>
          ) : filteredStatements.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-2 font-medium text-sm text-muted-foreground">
                {activeTab === 'active'
                  ? 'No active or failed statement imports'
                  : searchQuery
                  ? 'No statements match your search'
                  : 'No completed statement imports yet'}
              </p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                {activeTab === 'active'
                  ? 'Upload a bank statement above to get started.'
                  : 'Completed imports will appear here once processed.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStatements.map((statement: Statement) => {
                const statusInfo = STATUS_STYLES[statement.status] || STATUS_STYLES.Uploaded
                const isPasswordModalOpen = passwordStatementId === statement._id

                return (
                  <div
                    key={statement._id}
                    className="rounded-lg border border-border bg-card p-4 hover:border-border/80 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Metadata */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm truncate">{statement.originalFileName}</p>
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusInfo.badge}`}
                            >
                              {statusInfo.icon}
                              {statement.status}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>{statement.fileType}</span>
                            <span>•</span>
                            <span>{formatFileSize(statement.fileSize)}</span>
                            {statement.status === 'Completed' && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-foreground">
                                  {statement.transactionCount} transaction{statement.transactionCount !== 1 ? 's' : ''}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(statement.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                        {statement.status === 'Completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs"
                            onClick={() => handleViewTransactions(statement._id)}
                          >
                            <Eye className="h-3.5 w-3.5" /> View Transactions
                          </Button>
                        )}

                        {(statement.status === 'Password Required' ||
                          (statement.status === 'Failed' && statement.failureReason?.toLowerCase().includes('password'))) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            onClick={() => {
                              setPasswordStatementId(isPasswordModalOpen ? null : statement._id)
                              setPasswordInput('')
                              setPasswordError('')
                            }}
                          >
                            <KeyRound className="h-3.5 w-3.5" /> Provide Password
                          </Button>
                        )}

                        {statement.status === 'Failed' &&
                          !statement.failureReason?.toLowerCase().includes('password') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-xs"
                              disabled={retryStatement.isPending}
                              onClick={() => retryStatement.mutate(statement._id)}
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${retryStatement.isPending ? 'animate-spin' : ''}`} />
                              Retry
                            </Button>
                          )}

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(statement)}
                          title="Delete statement import"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Error Summary Banner if present */}
                    {statement.failureReason && (
                      <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{statement.failureReason}</span>
                      </div>
                    )}

                    {/* Password Input Modal / Inline Form */}
                    {isPasswordModalOpen && (
                      <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                          <KeyRound className="h-4 w-4" />
                          <span>This PDF is password protected</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="password"
                            placeholder="Enter PDF password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit(statement._id)}
                            className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="text-xs bg-amber-500 hover:bg-amber-600 text-black font-medium"
                              onClick={() => handlePasswordSubmit(statement._id)}
                              disabled={retryWithPassword.isPending || !passwordInput.trim()}
                            >
                              {retryWithPassword.isPending ? 'Unlocking...' : 'Submit Password'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                setPasswordStatementId(null)
                                setPasswordInput('')
                                setPasswordError('')
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                        {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Statements
