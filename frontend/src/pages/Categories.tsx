import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card'

const Categories: React.FC = () => (
  <div>
    <h1 className="mb-6 text-3xl font-bold">Categories</h1>
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Coming in Phase 02</p>
      </CardContent>
    </Card>
  </div>
)

export default Categories
