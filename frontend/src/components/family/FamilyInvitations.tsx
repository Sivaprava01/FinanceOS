/**
 * Family Invitations
 * Manage pending family invitations.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Check, X, Clock } from 'lucide-react';

const FamilyInvitations: React.FC = () => {
  const [invitations, setInvitations] = useState<any[]>([]);

  const handleAccept = (id: string) => {
    // API call would go here
    setInvitations(invitations.filter((inv) => inv.id !== id));
  };

  const handleReject = (id: string) => {
    setInvitations(invitations.filter((inv) => inv.id !== id));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Pending Invitations</h2>

      {invitations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              No pending invitations
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <Card key={invitation.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{invitation.familyName}</p>
                    <p className="text-sm text-muted-foreground">
                      Invited by {invitation.invitedBy}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invitation.invitedAt}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(invitation.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(invitation.id)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            How Invitations Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Family heads can invite members via email</p>
          <p>• Invitations expire after 30 days</p>
          <p>• Accept to join the family workspace</p>
          <p>• Reject to dismiss the invitation</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyInvitations;
