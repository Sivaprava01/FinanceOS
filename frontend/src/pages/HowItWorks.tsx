import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';

const HowItWorks: React.FC = () => (
  <div>
    <h1 className="mb-6 text-3xl font-bold">How FinanceOS Works</h1>
    <Card>
      <CardHeader>
        <CardTitle>How FinanceOS Works</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Interactive walkthrough coming soon</p>
      </CardContent>
    </Card>
  </div>
);

export default HowItWorks;
