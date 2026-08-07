/**
 * Analytics Page
 * Financial analytics and insights.
 * Note: Phase 02 placeholder - Advanced analytics covered in Phase 03.
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'

const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Analyze your financial trends and patterns
        </p>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">Advanced analytics coming in Phase 03</p>
            <p className="text-sm text-muted-foreground">
              Track spending patterns, income trends, and financial goals
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending Trends</CardTitle>
            <CardDescription>Compare spending across months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Coming soon...
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Analytics</CardTitle>
            <CardDescription>Detailed category breakdowns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Coming soon...
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income Analysis</CardTitle>
            <CardDescription>Track income sources and growth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Coming soon...
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Goals</CardTitle>
            <CardDescription>Monitor progress toward goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Coming soon...
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Analytics
