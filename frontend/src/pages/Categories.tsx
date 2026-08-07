import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card'
import { useCategories } from '@hooks/useCategories'

const CATEGORY_COLORS = [
  '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1',
]

const Categories: React.FC = () => {
  const { data: categories = [], isLoading, error } = useCategories()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-muted-foreground">Categories from your imported transactions</p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        Categories are derived from your imported transactions. They cannot be created, edited, or deleted manually.
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Failed to load categories. Please refresh.</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No categories yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Categories will appear once you have imported transactions
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((name, index) => (
            <Card key={name}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 flex-shrink-0 rounded-lg"
                    style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                  />
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">Transaction category</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">About Categories</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Categories are derived from your imported transactions. You can assign categories when
          creating or editing individual transactions.
        </CardContent>
      </Card>
    </div>
  )
}

export default Categories
