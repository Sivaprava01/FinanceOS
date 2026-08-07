/**
 * Family Finance Page
 * Family financial management and sharing.
 * Note: Phase 02 placeholder - Family Finance covered in Phase 03.
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'

const FamilyFinance: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Family Finance</h1>
        <p className="text-muted-foreground">
          Manage shared finances with family members
        </p>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Family Finance coming in Phase 03</p>
            <p className="text-sm text-muted-foreground mb-6">
              Share expenses, track family budget, and manage permissions
            </p>
            <Button disabled>Coming Soon</Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Family Members</CardTitle>
            <CardDescription>Manage family members and roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Coming soon...
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shared Transactions</CardTitle>
            <CardDescription>Track shared expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Coming soon...
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Family Analytics</CardTitle>
            <CardDescription>Family spending analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Coming soon...
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>Manage access and permissions</CardDescription>
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

export default FamilyFinance
