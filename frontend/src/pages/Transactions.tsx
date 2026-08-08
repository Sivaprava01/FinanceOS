/**
 * Transactions Page
 * View and manage transactions.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';

const Transactions: React.FC = () => {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Transactions</h1>
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming in Phase 02</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
