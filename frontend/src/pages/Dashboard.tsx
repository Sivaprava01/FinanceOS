/**
 * Dashboard Page
 * Main dashboard page.
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'

const Dashboard: React.FC = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to FinanceOS</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Card key={item}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Metric {item}</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">$0.00</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
