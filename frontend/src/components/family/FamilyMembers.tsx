/**
 * Family Members
 * Manage family members, roles, and permissions.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Trash2, Edit, UserPlus } from 'lucide-react';

const ROLES = ['Owner', 'Admin', 'Member'] as const;

const FamilyMembers: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Owner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Member':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Members Management</h2>
        <Button
          onClick={() => setShowInviteDialog(true)}
          size="sm"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              No members yet. Invite family members to collaborate.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <Card key={member.id}>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getRoleColor(member.role)}>
                    {member.role}
                  </Badge>
                  <Button size="sm" variant="ghost" disabled>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="text-base">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">Owner</p>
            <p className="text-muted-foreground">Full family management</p>
          </div>
          <div>
            <p className="font-medium">Admin</p>
            <p className="text-muted-foreground">Can invite members, manage permissions</p>
          </div>
          <div>
            <p className="font-medium">Member</p>
            <p className="text-muted-foreground">Can view shared transactions and analytics</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyMembers;
