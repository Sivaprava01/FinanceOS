/**
 * Categories Page
 * View all transaction categories used by the user.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Loader } from '@components/ui/Loader';
import { useGetCategories } from '@/hooks/useTransactions';

const Categories: React.FC = () => {
  const { data: categoriesData, isLoading, error } = useGetCategories();
  const categories = categoriesData?.categories || [];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">View all transaction categories</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Categories</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Failed to load categories. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-muted-foreground">All transaction categories you've used</p>
      </div>

      {/* Categories Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Categories ({categories.length})</CardTitle>
          <CardDescription>Categories used to organize your transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div
                  key={category}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                >
                  <span className="font-medium">{category}</span>
                  <Badge variant="secondary">{category.length} chars</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              No categories yet. Add a transaction to create categories.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base">About Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Categories are created automatically when you assign them to transactions</p>
          <p>• Use consistent category names for better spending analysis</p>
          <p>• Categories help organize and track your spending patterns</p>
          <p>• You can edit transaction categories from the Transactions page</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Categories;
