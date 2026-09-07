import React, { useState } from 'react'
import { Users, UserPlus, LogOut, Trash2, Mail } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Badge } from '@components/ui/Badge'
import { SkeletonLoader, ErrorState, EmptyState } from '@components/ui'
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

const ROLE_BADGE_VARIANTS: Record<string, 'default' | 'info' | 'secondary'> = {
  owner: 'default',
  admin: 'info',
  member: 'secondary',
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

const DashboardTab: React.FC<{ familyId: string }> = ({ familyId }) => {
  const { format } = useCurrency()
  const { data: dashboard, isLoading, error } = useFamilyDashboard(familyId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <SkeletonLoader key={i} type="stat" />)}
        </div>
        <SkeletonLoader type="card" />
      </div>
    )
  }

  if (error) {
    return <ErrorState title="Error" message="Failed to load family dashboard metrics." />
  }

  if (!dashboard) return null

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Members Sharing</p>
            <p className="mt-1.5 text-xl font-bold text-foreground tabular-nums font-numeric">
              {dashboard.membersSharing} <span className="text-xs font-normal text-muted-foreground">/ {dashboard.memberCount} members</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Combined Assets</p>
            <p className="mt-1.5 text-xl font-bold text-success tabular-nums font-numeric">
              {format(dashboard.sharedCombined.totalAssets)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Combined Liabilities</p>
            <p className="mt-1.5 text-xl font-bold text-destructive tabular-nums font-numeric">
              {format(dashboard.sharedCombined.totalLiabilities)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Family Net Worth</p>
            <p className={`mt-1.5 text-xl font-bold tabular-nums font-numeric ${
              dashboard.sharedCombined.netWorth >= 0 ? 'text-primary' : 'text-destructive'
            }`}>
              {format(dashboard.sharedCombined.netWorth)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Shared Expenses & Member Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle>Total Shared Expenses</CardTitle>
            <CardDescription>Combined household expenditures this month</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-foreground tabular-nums font-numeric">{format(dashboard.sharedExpenses)}</p>
            <p className="text-xs text-muted-foreground mt-1">Aggregated across all sharing accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle>Member Spending Contributions</CardTitle>
            <CardDescription>Breakdown by household member</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {dashboard.spendingByMember.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted-foreground">No member spending data shared yet</p>
            ) : (
              <div className="divide-y divide-border">
                {dashboard.spendingByMember.map((member) => (
                  <div key={member.user} className="flex items-center justify-between px-5 py-3 hover:bg-secondary/30 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Member {member.user.slice(-4)}</p>
                      <p className="text-[11px] text-muted-foreground font-numeric">
                        In: {format(member.income)} · Out: {format(member.expenses)}
                      </p>
                    </div>
                    <div className="text-right font-numeric">
                      <p className="text-xs font-bold text-foreground tabular-nums">{member.transactionCount} txns</p>
                      <p className={`text-[11px] font-semibold ${
                        member.income - member.expenses >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        Net: {format(member.income - member.expenses)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Shared Transactions Tab ────────────────────────────────────────────────

const SharedTransactionsTab: React.FC<{ familyId: string }> = ({ familyId }) => {
  const { data: members = [], isLoading: loadingMembers } = useFamilyMembers(familyId)

  if (loadingMembers) {
    return <div className="space-y-3">{[0, 1, 2].map((i) => <SkeletonLoader key={i} type="table-row" />)}</div>
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Overview of sharing status and member profiles</p>
      
      {members.length === 0 ? (
        <EmptyState title="No Members" description="No family members found." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member._id} className="overflow-hidden">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{member.user.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-border">
                  <Badge variant={ROLE_BADGE_VARIANTS[member.role] || 'secondary'} size="sm">
                    {member.role}
                  </Badge>
                  <span className="text-muted-foreground">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </span>
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
    return <div className="space-y-3">{[0, 1, 2].map((i) => <SkeletonLoader key={i} type="row" />)}</div>
  }

  return (
    <div className="space-y-6">
      {/* My Sharing Preferences */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle>My Data Sharing Preferences</CardTitle>
          <CardDescription>Control exactly what financial data you share with other family members</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          <div className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
            <div>
              <p className="text-xs font-semibold text-foreground">Share Transactions</p>
              <p className="text-[11px] text-muted-foreground">Allow household members to view transaction ledger</p>
            </div>
            <button
              role="switch"
              aria-checked={sharingPreferences.shareTransactions}
              onClick={() => handleSharingChange('shareTransactions', !sharingPreferences.shareTransactions)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                sharingPreferences.shareTransactions ? 'bg-primary' : 'bg-secondary border border-border'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform mt-0.5 ${
                sharingPreferences.shareTransactions ? 'translate-x-4.5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
            <div>
              <p className="text-xs font-semibold text-foreground">Share Accounts & Balances</p>
              <p className="text-[11px] text-muted-foreground">Allow household members to view aggregate balances</p>
            </div>
            <button
              role="switch"
              aria-checked={sharingPreferences.shareAccounts}
              onClick={() => handleSharingChange('shareAccounts', !sharingPreferences.shareAccounts)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                sharingPreferences.shareAccounts ? 'bg-primary' : 'bg-secondary border border-border'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform mt-0.5 ${
                sharingPreferences.shareAccounts ? 'translate-x-4.5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
            <div>
              <p className="text-xs font-semibold text-foreground">Share Spending Analytics</p>
              <p className="text-[11px] text-muted-foreground">Include your spending in family aggregate charts</p>
            </div>
            <button
              role="switch"
              aria-checked={sharingPreferences.shareAnalytics}
              onClick={() => handleSharingChange('shareAnalytics', !sharingPreferences.shareAnalytics)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                sharingPreferences.shareAnalytics ? 'bg-primary' : 'bg-secondary border border-border'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform mt-0.5 ${
                sharingPreferences.shareAnalytics ? 'translate-x-4.5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Member Roles */}
      {isOwner && (
        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle>Member Access Levels</CardTitle>
            <CardDescription>Household permissions directory (Admin only)</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {members.map((member) => (
                <div key={member._id} className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{member.user.name}</p>
                    <p className="text-[11px] text-muted-foreground">{member.user.email}</p>
                  </div>
                  <Badge variant={ROLE_BADGE_VARIANTS[member.role] || 'secondary'} size="sm">
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Members Tab ─────────────────────────────────────────────────────────────

const MembersTab: React.FC<{ familyId: string; ownerId: string }> = ({ familyId, ownerId }) => {
  const { user } = useAuth()
  const { data: members = [], isLoading, error } = useFamilyMembers(familyId)
  const removeMember = useRemoveMember(familyId)
  const leaveFamily = useLeaveFamily()

  if (isLoading) {
    return <div className="space-y-2">{[0, 1, 2].map((i) => <SkeletonLoader key={i} type="table-row" />)}</div>
  }

  if (error) {
    return <p className="text-xs text-destructive">Failed to load family members.</p>
  }

  const isOwner = user?._id === ownerId

  return (
    <div className="space-y-3">
      <div className="divide-y divide-border rounded-lg border border-border overflow-hidden bg-card">
        {members.map((m) => (
          <div key={m._id} className="flex items-center justify-between p-3.5 hover:bg-secondary/30 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                {m.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{m.user.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{m.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={ROLE_BADGE_VARIANTS[m.role] || 'secondary'} size="sm">
                {m.role}
              </Badge>
              {isOwner && m.user._id !== ownerId && (
                <button
                  onClick={() => removeMember.mutate(m.user._id)}
                  disabled={removeMember.isPending}
                  className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Remove member"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              {!isOwner && m.user._id === user?._id && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => leaveFamily.mutate(familyId)}
                  isLoading={leaveFamily.isPending}
                  className="gap-1 text-xs"
                >
                  <LogOut className="h-3 w-3" /> Leave
                </Button>
              )}
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <p className="p-6 text-center text-xs text-muted-foreground">No members found.</p>
        )}
      </div>
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
    <div className="space-y-4 max-w-lg">
      <div>
        <label className="block text-xs font-semibold text-foreground mb-1">Invite Member by Email</label>
        <p className="text-xs text-muted-foreground mb-3">They will receive an invitation to join your shared family group.</p>
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="household.member@example.com"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="text-xs"
          />
          <Button onClick={handleSend} isLoading={sendInvitation.isPending} disabled={!email.trim()} size="sm" className="gap-1.5 text-xs">
            <Mail className="h-3.5 w-3.5" /> Invite
          </Button>
        </div>
      </div>
      {successMsg && <p className="rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success">{successMsg}</p>}
      {errorMsg && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{errorMsg}</p>}
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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Pending Household Invitations</CardTitle>
        <CardDescription>You have been invited to join a family group</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {invitations.map((inv) => (
          <div key={inv._id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <div>
              <p className="text-xs font-semibold text-foreground">{inv.familyId.name}</p>
              <p className="text-[11px] text-muted-foreground">Invited by {inv.invitedBy.name}</p>
            </div>
            <div className="flex gap-2">
              <Button size="xs" onClick={() => accept.mutate(inv._id)} isLoading={accept.isPending}>Accept</Button>
              <Button size="xs" variant="outline" onClick={() => reject.mutate(inv._id)} isLoading={reject.isPending}>Decline</Button>
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
    <Card className="max-w-md mx-auto">
      <CardContent className="p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Set Up Family Finance</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage shared expenses, budgets, and net worth together.
          </p>
        </div>
        <div className="space-y-2 text-left">
          <label className="block text-xs font-medium text-muted-foreground">Family Group Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., The Reynolds Household"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <Button onClick={handleCreate} isLoading={createFamily.isPending} disabled={!name.trim()} className="w-full text-xs">
          <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Create Family Group
        </Button>
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
        <SkeletonLoader type="text" height="h-6" width="w-48" />
        <SkeletonLoader type="chart" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorState title="Family Finance Error" message="Failed to load family data. Please refresh." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Family Finance</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Shared budgets, combined net worth, and household finance tracking
          </p>
        </div>
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
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeFamilyId === f._id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.familyName}
                </button>
              ))}
            </div>
          )}

          {activeFamily && (
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle>{activeFamily.familyName}</CardTitle>
                    <CardDescription>Household collaboration and shared accounts</CardDescription>
                  </div>

                  {/* Tabs */}
                  <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-1">
                    {(['dashboard', 'shared', 'members', 'permissions', 'invite'] as FamilyTab[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-all ${
                          activeTab === tab ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {tab === 'dashboard' ? 'Overview' : tab === 'shared' ? 'Shared' : tab === 'members' ? 'Members' : tab === 'permissions' ? 'Permissions' : 'Invite'}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
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
        </div>
      )}
    </div>
  )
}

export default FamilyFinance
