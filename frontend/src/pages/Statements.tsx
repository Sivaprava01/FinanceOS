import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card'

const Statements: React.FC = () => (
  <div>
    <h1 className="mb-6 text-3xl font-bold">Statements</h1>
    <Card>
      <CardHeader>
        <CardTitle>Statements</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Coming in Phase 02</p>
      </CardContent>
    </Card>
  </div>
)

export default Statements
