import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';

const Settings: React.FC = () => (
  <div>
    <h1 className="mb-6 text-3xl font-bold">Settings</h1>
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Coming in Phase 03</p>
      </CardContent>
    </Card>
  </div>
);

export default Settings;
