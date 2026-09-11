import React, { useState, useEffect } from 'react'
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
  Lock,
  FileSpreadsheet,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { EmptyState } from '@components/ui/EmptyState'
import {
  useStatements,
  useUploadStatement,
  useRetryWithPassword,
  useDeleteStatement,
  useClearFailedStatements,
  useRetryStatement,
  useImportTransactions,
} from '@hooks/useStatements'
import { useAuth } from '@hooks/useAuth'
import { SUPPORTED_CURRENCIES, formatCurrency } from '@lib/utils'
import type { Statement, ExtractedTransaction } from '@/types'

const COMMON_CURRENCIES = [
  'INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'JPY', 'AED', 'NZD',
  'CHF', 'CNY', 'MYR', 'THB', 'PHP', 'ZAR', 'BRL', 'TRY', 'KRW', 'SEK',
]

const STATUS_STYLES: Record<Statement['status'], { badge: string; icon: React.ReactNode }> = {
  Uploaded: {
    badge: 'bg-primary/10 text-primary border border-primary/20',
    icon: <Clock className="h-3.5 w-3.5 mr-1 animate-pulse" />,
  },
  Processing: {
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
    icon: <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-muted border-t-sky-500" />,
  },
  'Password Required': {
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    icon: <KeyRound className="h-3.5 w-3.5 mr-1" />,
  },
  Completed: {
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    icon: <CheckCircle2 className="h-3.5 w-3.5 mr-1" />,
  },
  Failed: {
    badge: 'bg-destructive/10 text-destructive border border-destructive/20',
    icon: <AlertCircle className="h-3.5 w-3.5 mr-1" />,
  },
}

const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B'
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Delete Statement Import?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This will remove <strong className="text-foreground">{statement.originalFileName}</strong>
              {statement.transactionCount > 0 ? (
                <> and its <strong className="text-foreground">{statement.transactionCount}</strong> imported transactions from the ledger.</>
              ) : (
                <> record permanently.</>
              )}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2.5 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} isLoading={isDeleting}>
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
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    onClick={onCancel}
  >
    <div
      className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
          <Trash2 className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Clear Failed Imports?
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This will remove all <strong className="text-foreground">{count}</strong> failed and pending-password statement import records.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2.5 pt-2 border-t border-border">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isClearing}>
          Cancel
        </Button>
        <Button variant="destructive" size="sm" onClick={onConfirm} isLoading={isClearing}>
          Clear All Failed
        </Button>
      </div>
    </div>
  </div>
)

// ─── Statement Import Preview Dialog ──────────────────────────────────────────

const ImportPreviewDialog: React.FC<{
  statement: Statement | null
  onClose: () => void
  onSuccess: () => void
}> = ({ statement, onClose, onSuccess }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('')
  const [importError, setImportError] = useState<string>('')
  const importTransactions = useImportTransactions()
  const deleteStatement = useDeleteStatement()
  const { user } = useAuth()

  const preview = statement?.preview
  const transactions: ExtractedTransaction[] = preview?.transactions || []
  const detectedCurrency = preview?.detectedCurrency || statement?.currency || null
  const isAmbiguous = preview?.isAmbiguous ?? false
  const confidence = preview?.confidence ?? 'none'
  const detectedSources = preview?.detectedSources || []

  useEffect(() => {
    if (detectedCurrency && !selectedCurrency) {
      setSelectedCurrency(detectedCurrency)
    } else if (!selectedCurrency && user?.preferredCurrency) {
      setSelectedCurrency(user.preferredCurrency)
    } else if (!selectedCurrency) {
      setSelectedCurrency('INR')
    }
  }, [detectedCurrency, user?.preferredCurrency, selectedCurrency])

  if (!statement || !preview) return null

  const handleConfirmImport = async () => {
    if (!selectedCurrency) {
      setImportError('Please select a valid currency before importing.')
      return
    }

    setImportError('')
    try {
      await importTransactions.mutateAsync({
        statementId: statement._id,
        currency: selectedCurrency,
        transactions: transactions,
      })
      onSuccess()
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to import transactions. Please try again.'
      setImportError(message)
    }
  }

  const handleCancel = async () => {
    try {
      if (statement.status === 'Uploaded') {
        await deleteStatement.mutateAsync(statement._id)
      }
    } catch {
      // ignore
    } finally {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border p-5 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                Review & Confirm Ledger Import
              </h3>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {statement.originalFileName} • {statement.fileType} • {formatFileSize(statement.fileSize)} • {transactions.length} rows parsed
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Currency Detection Status Banner */}
          {detectedCurrency && !isAmbiguous && confidence !== 'none' ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>Detected Statement Currency: {detectedCurrency}</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono uppercase font-bold tracking-wider">
                  {confidence} confidence
                </span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Extracted currency <strong>{detectedCurrency}</strong>
                {detectedSources.length > 0 ? ` from statement ${detectedSources.join(', ')}` : ''}.
                You can override it below if needed.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold text-amber-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Currency Confirmation Required</span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {isAmbiguous
                  ? 'The currency symbol in this statement is ambiguous. Please confirm or select the target currency for all transactions in this statement.'
                  : 'Currency could not be automatically detected. Please select the currency below to proceed with importing.'}
              </p>
            </div>
          )}

          {/* Currency Dropdown Selector */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
            <label className="text-xs font-mono font-medium text-foreground flex items-center justify-between">
              <span>Target Currency for Imported Transactions:</span>
              <span className="text-[11px] text-muted-foreground font-normal">Applies to all entries</span>
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="" disabled>Select currency...</option>
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Extracted Transactions Preview List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Extracted Transactions Preview ({transactions.length})</span>
              <span className="font-mono text-[11px]">Formatted in {selectedCurrency || 'selected currency'}</span>
            </div>

            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/40 text-muted-foreground font-mono font-medium sticky top-0 uppercase tracking-wider text-[10px]">
                    <tr className="border-b border-border">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {transactions.slice(0, 15).map((tx, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground font-mono">
                          {tx.date ? new Date(tx.date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground max-w-[200px] truncate" title={tx.description}>
                          {tx.description || 'Transaction'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase ${
                              tx.type === 'income'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-muted text-muted-foreground border border-border'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {tx.category || 'General'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold whitespace-nowrap font-sans">
                          <span className={tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}>
                            {formatCurrency(tx.amount, selectedCurrency || 'INR')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {transactions.length > 15 && (
                <div className="bg-muted/30 py-2 px-3 text-center text-[11px] text-muted-foreground border-t border-border font-mono">
                  + {transactions.length - 15} more transactions will be imported
                </div>
              )}
            </div>
          </div>

          {importError && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive font-medium border border-destructive/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{importError}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border p-4 bg-muted/20">
          <Button variant="outline" size="sm" onClick={handleCancel} disabled={importTransactions.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmImport}
            isLoading={importTransactions.isPending}
            disabled={!selectedCurrency || transactions.length === 0}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirm & Import {transactions.length} Transactions
          </Button>
        </div>
      </div>
    </div>
  )
}

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
  const [previewStatement, setPreviewStatement] = useState<Statement | null>(null)

  const { user } = useAuth()
  const { data, isLoading, error } = useStatements(activeTab)
  const uploadStatement = useUploadStatement()
  const retryWithPassword = useRetryWithPassword()
  const deleteStatement = useDeleteStatement()
  const clearFailedStatements = useClearFailedStatements()
  const retryStatement = useRetryStatement()

  useEffect(() => {
    if (user?.preferredCurrency && !statementCurrency) {
      setStatementCurrency(user.preferredCurrency)
    }
  }, [user?.preferredCurrency, statementCurrency])

  const statements = data?.statements ?? []

  const failedCount = statements.filter(
    (s: Statement) => s.status === 'Failed' || s.status === 'Password Required'
  ).length

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

    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.pdf') && !file.name.endsWith('.xlsx')) {
      setUploadError('Please upload a valid file (PDF, Excel, or CSV)')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File size must be less than 15MB')
      return
    }

    try {
      const result = await uploadStatement.mutateAsync({
        file,
        currency: statementCurrency || user?.preferredCurrency || 'INR',
      })
      if (result?.preview?.transactions && result.preview.transactions.length > 0) {
        setPreviewStatement(result)
      } else {
        setUploadSuccess(true)
      }
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
      {/* Import Preview Modal */}
      <ImportPreviewDialog
        statement={previewStatement}
        onClose={() => setPreviewStatement(null)}
        onSuccess={() => {
          setPreviewStatement(null)
          setUploadSuccess(true)
        }}
      />

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

      {/* ─── Editorial Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-wider font-semibold">
              Statement Management
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-primary font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Import Center
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Statements
          </h1>
          <p className="text-xs text-muted-foreground">
            Upload and manage your bank statement imports. Processed safely into structured transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60">
            <button
              onClick={() => setActiveTab('active')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                activeTab === 'active'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Active Imports
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                activeTab === 'completed'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Completed History
            </button>
          </div>
        </div>
      </div>

      {/* ─── Institutional Upload Console ──────────────────────────────────── */}
      <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-serif text-sm font-bold text-foreground">
                Upload Bank Statement
              </h2>
              <p className="text-xs text-muted-foreground">
                Automatic table extraction for PDF, Excel (.xlsx, .xls), and CSV files
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-lg border border-border shadow-xs">
            <label className="text-xs font-mono font-medium text-muted-foreground whitespace-nowrap">
              Base Currency:
            </label>
            <select
              value={statementCurrency}
              onChange={(e) => setStatementCurrency(e.target.value)}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              {COMMON_CURRENCIES.map((c) => (
                <option key={c} value={c} className="bg-card text-foreground">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8">
          {/* Dropzone Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative group rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${
              dragActive
                ? 'border-primary bg-primary/5 scale-[1.005]'
                : 'border-border/80 hover:border-primary/50 bg-muted/10'
            }`}
          >
            <div className="flex flex-col items-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-card shadow-sm border border-border flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="font-serif text-base font-bold text-foreground">
                  Drag and drop bank statements here
                </p>
                <p className="text-xs text-muted-foreground">
                  or{' '}
                  <label
                    htmlFor="file-input"
                    className="text-primary font-semibold underline underline-offset-2 cursor-pointer hover:text-primary/80"
                  >
                    browse files
                  </label>{' '}
                  from your device
                </p>
              </div>

              <input
                type="file"
                id="file-input"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.xls,.xlsx,.csv"
              />

              {/* Supported Presets Badge */}
              <div className="pt-2">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block mb-2 font-medium">
                  Verified Format Presets:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {['HDFC Bank', 'ICICI Bank', 'SBI Retail', 'Axis Bank', 'Amex', 'Chase', 'HSBC', 'Zerodha'].map(
                    (bank) => (
                      <span
                        key={bank}
                        className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-foreground border border-border/60"
                      >
                        {bank}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Security Footnote */}
              <div className="flex items-center gap-1.5 text-muted-foreground pt-2 text-[11px]">
                <Lock className="h-3 w-3 text-primary" />
                <span>Secure document parsing. Your statement files are processed safely.</span>
              </div>
            </div>

            {uploadStatement.isPending && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs text-primary font-medium">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Parsing document structure...
              </div>
            )}

            {uploadError && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {uploadError}
              </div>
            )}

            {uploadSuccess && !uploadStatement.isPending && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
                <Sparkles className="h-4 w-4 shrink-0" />
                Statement uploaded and processed successfully!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Import Management Section ───────────────────────────────────────── */}
      <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="font-serif text-base font-bold text-foreground">
                {activeTab === 'active' ? 'Active Imports' : 'Completed Statements'}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {activeTab === 'active'
                  ? 'Imports currently parsing, pending verification, or requiring credentials'
                  : 'Processed bank statements linked to your transactions'}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {activeTab === 'completed' && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filter statements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 sm:w-56 rounded-lg border border-input bg-background pl-8 pr-7 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'active' && failedCount > 0 && (
                <Button
                  variant="outline"
                  size="xs"
                  className="text-xs text-destructive hover:bg-destructive hover:text-white border-destructive/30 gap-1.5"
                  onClick={() => setShowClearFailedModal(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear Failed ({failedCount})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-destructive font-medium">
                Failed to load statement ledger records. Please refresh.
              </p>
            </div>
          ) : filteredStatements.length === 0 ? (
            <div className="p-10">
              <EmptyState
                icon={FileText}
                title={
                  activeTab === 'active'
                    ? 'No Active Statements Pending'
                    : searchQuery
                    ? 'No Statements Found'
                    : 'No Completed Statements Yet'
                }
                description={
                  activeTab === 'active'
                    ? 'All uploaded bank statements have been successfully parsed and committed.'
                    : searchQuery
                    ? 'No archive records match your search filter.'
                    : 'Completed bank statements will appear here with audited row counts.'
                }
                action={
                  searchQuery
                    ? {
                        label: 'Clear Search',
                        onClick: () => setSearchQuery(''),
                      }
                    : {
                        label: 'Upload Statement',
                        onClick: () => {
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        },
                      }
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredStatements.map((statement: Statement) => {
                const statusInfo = STATUS_STYLES[statement.status] || STATUS_STYLES.Uploaded
                const isPasswordModalOpen = passwordStatementId === statement._id

                return (
                  <div
                    key={statement._id}
                    className="p-4 sm:p-5 hover:bg-muted/20 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Metadata */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground border border-border">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-xs text-foreground truncate">
                              {statement.originalFileName}
                            </p>
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider ${statusInfo.badge}`}
                            >
                              {statusInfo.icon}
                              {statement.status}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground font-mono text-[11px]">
                            <span>{statement.fileType}</span>
                            <span>•</span>
                            <span>{formatFileSize(statement.fileSize)}</span>
                            {statement.currency && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.2 font-semibold text-primary">
                                  {statement.currency}
                                </span>
                              </>
                            )}
                            {statement.status === 'Completed' && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-foreground">
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
                        {statement.status === 'Uploaded' && statement.preview && (
                          <Button
                            size="sm"
                            className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
                            onClick={() => setPreviewStatement(statement)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Review & Import
                          </Button>
                        )}

                        {statement.status === 'Completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs shadow-xs"
                            onClick={() => handleViewTransactions(statement._id)}
                          >
                            <Eye className="h-3.5 w-3.5" /> View Ledger
                          </Button>
                        )}

                        {(statement.status === 'Password Required' ||
                          (statement.status === 'Failed' && statement.failureReason?.toLowerCase().includes('password'))) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
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
                          title="Delete statement record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Error Summary Banner */}
                    {statement.failureReason && (
                      <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-2.5 text-xs text-destructive border border-destructive/20">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{statement.failureReason}</span>
                      </div>
                    )}

                    {/* Password Input Inline Drawer */}
                    {isPasswordModalOpen && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-500">
                          <KeyRound className="h-4 w-4" />
                          <span>Protected Document: Enter Unlock Password</span>
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
                              className="text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold"
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
                        {passwordError && <p className="text-xs text-destructive font-medium">{passwordError}</p>}
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
