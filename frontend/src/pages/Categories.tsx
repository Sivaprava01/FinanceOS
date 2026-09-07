
import React, { useState } from 'react'
import { FolderOpen, Plus, Trash2, AlertCircle, Lock, Check } from 'lucide-react'
import { Card, CardContent } from '@components/ui/Card'
import { SkeletonLoader, ErrorState, EmptyState } from '@components/ui'
import { Button } from '@components/ui/Button'
import { useCategories } from '@hooks/useCategories'
import CreateCategoryModal from '@components/modals/CreateCategoryModal'
import type { CreateCategoryInput } from '@/types'

const CATEGORY_COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#f97316', '#84cc16', '#d946ef',
]

const Categories: React.FC = () => {
  const { data: categories = [], isLoading, error, createCategory, createIsLoading, deleteCategory } = useCategories()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleCreateCategory = async (data: CreateCategoryInput) => {
    await createCategory(data)
    setIsCreateModalOpen(false)
  }

  const handleSuccessMessage = (message?: string) => {
    setSuccessMessage(message || 'Category created successfully!')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleDeleteClick = (categoryId: string) => {
    setDeleteConfirm(categoryId)
  }

  const handleConfirmDelete = async (categoryId: string) => {
    setDeletingId(categoryId)
    try {
      await deleteCategory(categoryId)
      setSuccessMessage('Category deleted successfully!')
      setDeleteConfirm(null)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch {
      setSuccessMessage('Failed to delete category')
      setTimeout(() => setSuccessMessage(''), 3000)
    } finally {
      setDeletingId(null)
    }
  }

  const customCategories = categories.filter((cat) => !cat.isDefault)
  const defaultCategories = categories.filter((cat) => cat.isDefault)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Categories</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize transactions into custom and system categories
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="gap-1.5 text-xs shadow-xs">
          <Plus className="h-3.5 w-3.5" />
          Create Category
        </Button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3.5 py-2 text-xs font-medium text-success">
          <Check className="h-4 w-4 shrink-0" />
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <SkeletonLoader key={i} type="card" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to Load Categories"
          message="There was an error loading your categories."
          onRetry={() => window.location.reload()}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No Categories Configured"
          description="Create your first custom category to organize transactions."
          action={{
            label: 'Create Category',
            onClick: () => setIsCreateModalOpen(true),
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Custom Categories */}
          {customCategories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Custom Categories ({customCategories.length})
                </h2>
              </div>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {customCategories.map((cat) => (
                  <Card key={cat._id} className="group overflow-hidden hover:border-border/80 transition-all">
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3.5 w-3.5 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: cat.color || CATEGORY_COLORS[0] }}
                            />
                            <span className="font-semibold text-xs text-foreground truncate">{cat.name}</span>
                          </div>
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                              (cat.type || '').toLowerCase() === 'income'
                                ? 'bg-success/15 text-success'
                                : (cat.type || '').toLowerCase() === 'asset'
                                ? 'bg-primary/15 text-primary'
                                : (cat.type || '').toLowerCase() === 'liability'
                                ? 'bg-amber-500/15 text-amber-500'
                                : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            {cat.type || 'Expense'}
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {cat.description}
                          </p>
                        )}
                      </div>

                      {/* Delete Confirmation / Trigger */}
                      <div className="mt-3 pt-2.5 border-t border-border/50">
                        {deleteConfirm === cat._id ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[11px] text-destructive font-medium">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              <span>Delete this category?</span>
                            </div>
                            <div className="flex gap-1.5">
                              <Button
                                variant="destructive"
                                size="xs"
                                onClick={() => handleConfirmDelete(cat._id)}
                                disabled={deletingId === cat._id}
                                className="flex-1"
                              >
                                {deletingId === cat._id ? 'Deleting…' : 'Confirm'}
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deletingId === cat._id}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleDeleteClick(cat._id)}
                              className="text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                              aria-label={`Delete ${cat.name} category`}
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Default Categories */}
          {defaultCategories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Default System Categories ({defaultCategories.length})
                </h2>
              </div>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {defaultCategories.map((cat) => (
                  <Card key={cat._id} className="bg-card/70 border-border/60">
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="h-3.5 w-3.5 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: cat.color || CATEGORY_COLORS[0] }}
                            />
                            <span className="font-semibold text-xs text-foreground truncate">{cat.name}</span>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shrink-0">
                            <Lock className="h-2.5 w-2.5" /> System
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {cat.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 pt-2 border-t border-border/30 text-[10px] text-muted-foreground capitalize">
                        {cat.type} Category
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <CreateCategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleSuccessMessage}
        isLoading={createIsLoading}
        onSubmit={handleCreateCategory}
      />
    </div>
  )
}

export default Categories
