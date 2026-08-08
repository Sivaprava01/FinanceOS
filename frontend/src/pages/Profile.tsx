import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';

const Profile: React.FC = () => (
  <div>
    <h1 className="mb-6 text-3xl font-bold">Profile</h1>
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Coming in Phase 03</p>
      </CardContent>
    </Card>
  </div>
);

export default Profile;
