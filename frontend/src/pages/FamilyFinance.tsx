import React, { useState } from 'react'
import { Users, UserPlus, LogOut, Trash2, Mail } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { SkeletonLoader, ErrorState } from '@components/ui'
import {
  useFamilies,
  useFamilyMembers,
  usePendingInvitations,
  useCreateFamily,
  useSendInvitation,
  useAcceptInvitation,
  useRejectInvitation,
  useRemoveMember,
  useLeaveFamily,
  useFamilyDashboard,
  useMySharing,
  useUpdateSharing,
} from '@hooks/useFamily'
import { useAuth } from '@hooks/useAuth'
import { useCurrency } from '@hooks/useCurrency'
import type { Family } from '@services/family.service'

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-primary/10 text-primary',
  admin: 'bg-info/10 text-info',
  member: 'bg-muted text-muted-foreground',
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

const DashboardTab: React.FC<{ familyId: string }> = ({ familyId }) => {
  const { format } = useCurrency()
  const { data: dashboard, isLoading, error } = useFamilyDashboard(familyId)

  if (isLoading) {
    return <div className="space-y-3">{[0, 1, 2].map((i) => <SkeletonLoader key={i} type="row" />)}</div>
  }

  if (error) {
    return <ErrorState title="Error" message="Failed to load family dashboard. Please try again." />
  }

  if (!dashboard) return null

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Members Sharing</p>
            <p className="text-2xl font-bold">{dashboard.membersSharing}</p>
            <p className="text-xs text-muted-foreground">of {dashboard.memberCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Combined Assets</p>
            <p className="text-2xl font-bold">{format(dashboard.sharedCombined.totalAssets)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Combined Liabilities</p>
            <p className="text-2xl font-bold">{format(dashboard.sharedCombined.totalLiabilities)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Family Net Worth</p>
            <p className={`text-2xl font-bold ${dashboard.sharedCombined.netWorth >= 0 ? 'text-success' : 'text-destructive'}`}>
              {format(dashboard.sharedCombined.netWorth)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Shared expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Total Shared Expenses</CardTitle>
          <CardDescription>Combined spending from all members</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{format(dashboard.sharedExpenses)}</p>
        </CardContent>
      </Card>

      {/* Member spending */}
      <Card>
        <CardHeader>
          <CardTitle>Member Spending</CardTitle>
          <CardDescription>Breakdown by member</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard.spendingByMember.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No spending data shared</p>
          ) : (
            <div className="space-y-3">
              {dashboard.spendingByMember.map((member) => (
                <div key={member.user} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">Income: {format(member.income)}</p>
                    <p className="text-sm text-muted-foreground">Expenses: {format(member.expenses)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{member.transactionCount} transactions</p>
                    <p className={`text-sm ${member.income - member.expenses >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {format(member.income - member.expenses)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Shared Transactions Tab ────────────────────────────────────────────────

const SharedTransactionsTab: React.FC<{ familyId: string }> = ({ familyId }) => {
  const { data: members = [], isLoading: loadingMembers } = useFamilyMembers(familyId)

  if (loadingMembers) {
    return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Shared transactions and financial activity from family members</p>
      
      {members.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No members to display</p>
      ) : (
        <div className="space-y-6">
          {members.map((member) => (
            <Card key={member._id}>
              <CardHeader>
                <CardTitle className="text-lg">{member.user.name}</CardTitle>
                <CardDescription>{member.role} · Joined {new Date(member.joinedAt).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="mt-2 font-semibold capitalize">{member.role}</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="mt-2 font-semibold text-sm break-all">{member.user.email}</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="mt-2 font-semibold text-success">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Permissions Tab ──────────────────────────────────────────────────────────

const PermissionsTab: React.FC<{ familyId: string; ownerId: string }> = ({ familyId, ownerId }) => {
  const { user } = useAuth()
  const { data: members = [], isLoading: loadingMembers } = useFamilyMembers(familyId)
  const { data: mySharing, isLoading: loadingSharing } = useMySharing(familyId)
  const updateSharing = useUpdateSharing(familyId)
  const [sharingPreferences, setSharingPreferences] = useState({
    shareTransactions: true,
    shareAccounts: true,
    shareAnalytics: true,
  })

  React.useEffect(() => {
    if (mySharing) {
      setSharingPreferences({
        shareTransactions: mySharing.shareTransactions,
        shareAccounts: mySharing.shareAccounts,
        shareAnalytics: mySharing.shareAnalytics,
      })
    }
  }, [mySharing])

  const isOwner = user?._id === ownerId

  const handleSharingChange = async (key: keyof typeof sharingPreferences, value: boolean) => {
    const updated = { ...sharingPreferences, [key]: value }
    setSharingPreferences(updated)
    try {
      await updateSharing.mutateAsync(updated)
    } catch (error) {
      console.error('Failed to update sharing preferences:', error)
    }
  }

  if (loadingMembers || loadingSharing) {
    return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
  }

  return (
    <div className="space-y-6">
      {/* My Sharing Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>My Sharing Preferences</CardTitle>
          <CardDescription>Control what financial data you share with family members</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Share Transactions</p>
              <p className="text-sm text-muted-foreground">Allow family to see my transactions</p>
            </div>
            <button
              role="switch"
              aria-checked={sharingPreferences.shareTransactions}
              onClick={() => handleSharingChange('shareTransactions', !sharingPreferences.shareTransactions)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                sharingPreferences.shareTransactions ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                sharingPreferences.shareTransactions ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="font-medium">Share Accounts</p>
              <p className="text-sm text-muted-foreground">Allow family to see my account balances</p>
            </div>
            <button
              role="switch"
              aria-checked={sharingPreferences.shareAccounts}
              onClick={() => handleSharingChange('shareAccounts', !sharingPreferences.shareAccounts)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                sharingPreferences.shareAccounts ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                sharingPreferences.shareAccounts ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="font-medium">Share Analytics</p>
              <p className="text-sm text-muted-foreground">Allow family to see my spending analytics</p>
            </div>
            <button
              role="switch"
              aria-checked={sharingPreferences.shareAnalytics}
              onClick={() => handleSharingChange('shareAnalytics', !sharingPreferences.shareAnalytics)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                sharingPreferences.shareAnalytics ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                sharingPreferences.shareAnalytics ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Member Roles - Only visible to owner */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Member Roles & Permissions</CardTitle>
            <CardDescription>Manage family member access levels (Owner only)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member._id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">{member.user.name}</p>
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-sm font-medium ${ROLE_COLORS[member.role]}`}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Role management will be available in a future update. Current roles: Owner (full access), Admin (manage family), Member (view only).
            </p>
          </CardContent>
        </Card>
      )}

      {/* Family Members Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Family Members</CardTitle>
          <CardDescription>Members currently in this family</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No members in this family</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member._id} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                  <div>
                    <p className="text-sm font-medium">{member.user.name}</p>
                    <p className="text-xs text-muted-foreground">Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Members Tab ──────────────────────────────────────────────────────────────// ─── Members Tab ───────────────────────────────────────────────────────────────

const MembersTab: React.FC<{ familyId: string; ownerId: string }> = ({ familyId, ownerId }) => {
  const { user } = useAuth()
  const { data: members = [], isLoading, error } = useFamilyMembers(familyId)
  const removeMember = useRemoveMember(familyId)
  const leaveFamily = useLeaveFamily()

  if (isLoading) {
    return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
  }

  if (error) {
    return <p className="text-sm text-destructive">Failed to load members.</p>
  }

  const isOwner = user?._id === ownerId

  return (
    <div className="space-y-3">
      {members.map((m) => (
        <div key={m._id} className="flex items-center justify-between rounded-lg border border-border p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">
              {m.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{m.user.name}</p>
              <p className="text-xs text-muted-foreground">{m.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ROLE_COLORS[m.role] ?? ROLE_COLORS.member}`}>
              {m.role}
            </span>
            {isOwner && m.user._id !== ownerId && (
              <button
                onClick={() => removeMember.mutate(m.user._id)}
                disabled={removeMember.isPending}
                className="rounded p-1 text-destructive hover:bg-destructive/10"
                aria-label="Remove member"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            {!isOwner && m.user._id === user?._id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => leaveFamily.mutate(familyId)}
                isLoading={leaveFamily.isPending}
              >
                <LogOut className="mr-1 h-3 w-3" /> Leave
              </Button>
            )}
          </div>
        </div>
      ))}
      {members.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">No members found.</p>
      )}
    </div>
  )
}

// ─── Invite Tab ─────────────────────────────────────────────────────────────

const InviteTab: React.FC<{ familyId: string }> = ({ familyId }) => {
  const [email, setEmail] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const sendInvitation = useSendInvitation(familyId)

  const handleSend = async () => {
    if (!email.trim()) return
    setSuccessMsg('')
    setErrorMsg('')
    try {
      await sendInvitation.mutateAsync(email.trim())
      setSuccessMsg(`Invitation sent to ${email}`)
      setEmail('')
    } catch (err) {
      setErrorMsg(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to send invitation.'
      )
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Email Address</label>
        <div className="mt-1 flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@example.com"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} isLoading={sendInvitation.isPending} disabled={!email.trim()} className="w-full sm:w-auto">
            <Mail className="mr-2 h-4 w-4" /> Invite
          </Button>
        </div>
      </div>
      {successMsg && <p className="rounded-lg bg-success/10 px-4 py-2 text-sm text-success">{successMsg}</p>}
      {errorMsg && <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{errorMsg}</p>}
    </div>
  )
}

// ─── Pending Invitations ──────────────────────────────────────────────────────

const PendingInvitations: React.FC = () => {
  const { data: invitations = [], isLoading } = usePendingInvitations()
  const accept = useAcceptInvitation()
  const reject = useRejectInvitation()

  if (isLoading) return null
  if (invitations.length === 0) return null

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base">Pending Invitations</CardTitle>
        <CardDescription>You have been invited to join a family</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitations.map((inv) => (
          <div key={inv._id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
            <div>
              <p className="text-sm font-medium">{inv.familyId.name}</p>
              <p className="text-xs text-muted-foreground">Invited by {inv.invitedBy.name}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => accept.mutate(inv._id)} isLoading={accept.isPending}>Accept</Button>
              <Button size="sm" variant="outline" onClick={() => reject.mutate(inv._id)} isLoading={reject.isPending}>Decline</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ─── Create Family ────────────────────────────────────────────────────────────

const CreateFamilyForm: React.FC = () => {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const createFamily = useCreateFamily()

  const handleCreate = async () => {
    if (!name.trim()) return
    setError('')
    try {
      await createFamily.mutateAsync(name.trim())
      setName('')
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to create family.'
      )
    }
  }

  return (
    <Card>
      <CardContent className="py-10">
        <div className="mx-auto max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Create a Family</h2>
          <p className="text-sm text-muted-foreground">
            Start managing your household finances together.
          </p>
          <div className="space-y-2 text-left">
            <label className="block text-sm font-medium">Family Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., The Smiths"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <Button onClick={handleCreate} isLoading={createFamily.isPending} disabled={!name.trim()} className="w-full">
            <UserPlus className="mr-2 h-4 w-4" /> Create Family
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type FamilyTab = 'dashboard' | 'members' | 'invite' | 'shared' | 'permissions'

const FamilyFinance: React.FC = () => {
  useAuth()
  const { data: familiesData, isLoading, error } = useFamilies()
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<FamilyTab>('dashboard')

  const families: Family[] = familiesData?.families ?? []
  const activeFamilyId = selectedFamilyId ?? families[0]?._id ?? null
  const activeFamily = families.find((f) => f._id === activeFamilyId) ?? null

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-destructive">Failed to load family data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Family Finance</h1>
        <p className="text-muted-foreground text-sm">Manage shared finances with your household</p>
      </div>

      <PendingInvitations />

      {families.length === 0 ? (
        <CreateFamilyForm />
      ) : (
        <div className="space-y-6">
          {/* Family selector */}
          {families.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {families.map((f) => (
                <button
                  key={f._id}
                  onClick={() => { setSelectedFamilyId(f._id); setActiveTab('members') }}
                  className={`rounded-lg border-2 px-3 sm:px-4 py-2 text-sm font-medium transition-all ${
                    activeFamilyId === f._id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
                  }`}
                >
                  {f.familyName}
                </button>
              ))}
            </div>
          )}

          {activeFamily && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{activeFamily.familyName}</CardTitle>
                    <CardDescription>Manage members and send invitations</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tabs */}
                <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-full sm:w-fit overflow-x-auto">
                  {(['dashboard', 'shared', 'members', 'permissions', 'invite'] as FamilyTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-md px-3 sm:px-4 py-1.5 text-sm font-medium capitalize transition-all whitespace-nowrap ${
                        activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab === 'dashboard' ? 'Dashboard' : tab === 'shared' ? 'Shared' : tab === 'members' ? 'Members' : tab === 'permissions' ? 'Permissions' : 'Invite'}
                    </button>
                  ))}
                </div>

                {activeTab === 'dashboard' && (
                  <DashboardTab familyId={activeFamily._id} />
                )}
                {activeTab === 'shared' && (
                  <SharedTransactionsTab familyId={activeFamily._id} />
                )}
                {activeTab === 'members' && (
                  <MembersTab
                    familyId={activeFamily._id}
                    ownerId={activeFamily.familyHead}
                  />
                )}
                {activeTab === 'permissions' && (
                  <PermissionsTab
                    familyId={activeFamily._id}
                    ownerId={activeFamily.familyHead}
                  />
                )}
                {activeTab === 'invite' && <InviteTab familyId={activeFamily._id} />}
              </CardContent>
            </Card>
          )}

          {/* Create another family */}
          <div className="text-center">
            <p className="mb-2 text-sm text-muted-foreground">Want to manage another household?</p>
            <Button
              variant="outline"
              onClick={() => {
                const name = window.prompt('Family name:')
                if (name?.trim()) {
                  // Trigger create family mutation via a quick inline approach
                }
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" /> Create Another Family
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FamilyFinance
