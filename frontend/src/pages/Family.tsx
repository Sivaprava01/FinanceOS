/**
 * Family Finance Page
 * Complete family workspace with management, members, and shared finances.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import FamilyDashboard from '@/components/family/FamilyDashboard';
import FamilyMembers from '@/components/family/FamilyMembers';
import FamilyInvitations from '@/components/family/FamilyInvitations';
import CreateFamilyDialog from '@/components/family/CreateFamilyDialog';
import { Plus } from 'lucide-react';

type FamilyTab = 'dashboard' | 'members' | 'invitations';

const Family: React.FC = () => {
  const { data: user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<FamilyTab>('dashboard');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // For now, show a simple placeholder
  // When family API is integrated, this will display actual family data
  const hasFamily = false; // This will be determined by fetching user's family

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Family Finance</h1>
          <p className="text-muted-foreground">
            Collaborate with family members on household finances
          </p>
        </div>
      </div>

      {!hasFamily ? (
        // No family setup yet
        <Card>
          <CardContent className="pt-12">
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
                <h2 className="text-xl font-semibold">Create a Family Workspace</h2>
                <p className="text-muted-foreground">
                  Invite family members to share and manage household finances together
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-6 text-left space-y-3">
                <p className="text-sm font-medium">Benefits:</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>✓ View combined household income and expenses</li>
                  <li>✓ Share financial goals with family members</li>
                  <li>✓ Collaborate on budgeting and financial planning</li>
                  <li>✓ Manage roles and permissions</li>
                  <li>✓ View shared transaction history</li>
                  <li>✓ Generate family financial reports</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Family
                </Button>
                <Button
                  variant="outline"
                  className="sm:w-auto"
                  disabled
                >
                  Join Existing Family
                </Button>
              </div>

              <p className="text-xs text-muted-foreground italic">
                Joining existing families coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Family exists - show workspace
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-border">
            {(['dashboard', 'members', 'invitations'] as FamilyTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-4 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'dashboard' && 'Overview'}
                {tab === 'members' && 'Members'}
                {tab === 'invitations' && 'Invitations'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'dashboard' && <FamilyDashboard />}
          {activeTab === 'members' && <FamilyMembers />}
          {activeTab === 'invitations' && <FamilyInvitations />}
        </div>
      )}

      {/* Create Family Dialog */}
      {showCreateDialog && (
        <CreateFamilyDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            // Refresh family data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default Family;
