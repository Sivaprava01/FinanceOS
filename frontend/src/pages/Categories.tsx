import React, { useState } from 'react'
import { FolderOpen, Plus, Trash2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card'
import { SkeletonLoader, ErrorState, EmptyState } from '@components/ui'
import { Button } from '@components/ui/Button'
import { useCategories } from '@hooks/useCategories'
import CreateCategoryModal from '@components/modals/CreateCategoryModal'
import type { CreateCategoryInput } from '@/types'

const CATEGORY_COLORS = [
  '#264DE4', '#8B5CF6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#f97316', '#84cc16', '#d946ef',
]

const Categories: React.FC = () => {
  const { data: categories = [], isLoading, error, createCategory, createIsLoading, deleteCategory, deleteIsLoading } = useCategories()
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
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground">Organize your transactions</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Category
          </Button>
        </div>

        {successMessage && (
          <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950/20 p-3 text-sm text-green-700 dark:text-green-400">
            {successMessage}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
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
          title="No Categories Yet"
          description="Create a new category to get started."
        />
      ) : (
        <div className="space-y-12">
          {/* Custom Categories */}
          {customCategories.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-widest font-semibold">Custom Categories</h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {customCategories.map((cat) => (
                  <div key={cat._id} className="group">
                    <Card className="h-full hover:shadow-sm transition-shadow border border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className="h-12 w-12 flex-shrink-0 rounded-md"
                            style={{ backgroundColor: cat.color || CATEGORY_COLORS[0] }}
                          />
                          <button
                            onClick={() => handleDeleteClick(cat._id)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-destructive hover:bg-destructive/10 rounded transition-all"
                            disabled={deleteIsLoading}
                            aria-label={`Delete ${cat.name} category`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="font-semibold text-sm">{cat.name}</p>
                        <p className="text-xs text-muted-foreground">{cat.type}</p>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{cat.description}</p>
                        )}

                        {/* Delete Confirmation */}
                        {deleteConfirm === cat._id && (
                          <div className="mt-3 pt-3 border-t border-border space-y-2">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-destructive">Delete this category?</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleConfirmDelete(cat._id)}
                                disabled={deletingId === cat._id}
                                className="flex-1 text-xs"
                              >
                                {deletingId === cat._id ? 'Deleting...' : 'Delete'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deletingId === cat._id}
                                className="flex-1 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default Categories */}
          {defaultCategories.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-widest font-semibold text-muted-foreground">Default Categories</h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {defaultCategories.map((cat) => (
                  <div key={cat._id}>
                    <Card className="h-full opacity-60 pointer-events-none border border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className="h-12 w-12 flex-shrink-0 rounded-md"
                            style={{ backgroundColor: cat.color || CATEGORY_COLORS[0] }}
                          />
                        </div>
                        <p className="font-semibold text-sm">{cat.name}</p>
                        <p className="text-xs text-muted-foreground">{cat.type}</p>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{cat.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Card */}
      <Card className="border border-border/50 bg-secondary/30">
        <CardHeader>
          <CardTitle className="text-base">About Categories</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Create custom categories to organize your transactions. Default categories are read-only and cannot be deleted.
        </CardContent>
      </Card>

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
