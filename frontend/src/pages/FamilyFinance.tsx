import React, { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  LogOut,
  Trash2,
  Mail,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/Card'
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonLoader key={i} type="stat" />
          ))}
        </div>
        <SkeletonLoader type="card" />
      </div>
    )
  }

  if (error) {
    return <ErrorState title="Error" message="Failed to load family dashboard metrics." />
  }

  if (!dashboard) return null

  const netWorth = dashboard.sharedCombined?.netWorth || 0
  const totalAssets = dashboard.sharedCombined?.totalAssets || 0
  const totalLiabilities = dashboard.sharedCombined?.totalLiabilities || 0
  const sharedExpenses = dashboard.sharedExpenses || 0

  return (
    <div className="space-y-6">
      {/* ─── Hero Consolidated Ledger Position ──────────────────────────────── */}
      <div className="bg-card border border-border/80 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Household Financial Position
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-primary/10 text-primary font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Household Sync
              </span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-serif text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                {format(netWorth)}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold">
                <TrendingUp className="h-3.5 w-3.5" />
                Combined Net Worth
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Aggregate net balance across {dashboard.membersSharing} contributing household members.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-2 lg:pt-0">
            <div className="flex flex-col text-left lg:text-right">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                Monthly Shared Expenses
              </span>
              <span className="font-sans text-lg font-bold text-foreground tabular-nums">
                {format(sharedExpenses)}
              </span>
              <span className="text-[11px] text-muted-foreground">Aggregated household total</span>
            </div>
          </div>
        </div>

        {/* 4 Metric Sub-grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          <div className="bg-muted/30 border border-border/60 rounded-xl p-4 flex flex-col justify-between">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Members Sharing
            </span>
            <div className="mt-2">
              <div className="font-sans text-xl font-bold text-foreground tabular-nums">
                {dashboard.membersSharing}{' '}
                <span className="text-xs font-normal text-muted-foreground font-mono">
                  / {dashboard.memberCount} members
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active data contributors</p>
            </div>
          </div>

          <div className="bg-muted/30 border border-border/60 rounded-xl p-4 flex flex-col justify-between">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Combined Assets
            </span>
            <div className="mt-2">
              <div className="font-sans text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {format(totalAssets)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Liquid & investments</p>
            </div>
          </div>

          <div className="bg-muted/30 border border-border/60 rounded-xl p-4 flex flex-col justify-between">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Combined Liabilities
            </span>
            <div className="mt-2">
              <div className="font-sans text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {format(totalLiabilities)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Total household debt</p>
            </div>
          </div>

          <div className="bg-muted/30 border border-border/60 rounded-xl p-4 flex flex-col justify-between">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Household Net Worth
            </span>
            <div className="mt-2">
              <div className={`font-sans text-xl font-bold tabular-nums ${netWorth >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {netWorth >= 0 ? '+' : ''}{format(netWorth)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Assets minus liabilities</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Member Breakdown & Expenses Section ─────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
            <CardTitle className="font-serif text-base font-bold text-foreground">
              Total Shared Expenses
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Combined household expenses recorded this cycle
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="font-sans text-3xl font-bold text-foreground tabular-nums">
                {format(sharedExpenses)}
              </p>
              <p className="text-xs text-muted-foreground">
                Sum of all expenses shared across participating family members.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono text-[11px]">Status: Synced</span>
              <span className="font-mono text-[11px] text-primary flex items-center gap-1 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Sharing Active
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
            <CardTitle className="font-serif text-base font-bold text-foreground">
              Member Spending Contributions
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Expenses by household member
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {dashboard.spendingByMember.length === 0 ? (
              <p className="p-8 text-center text-xs text-muted-foreground">
                No member spending data shared yet. Enable sharing in Permissions.
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {dashboard.spendingByMember.map((member) => (
                  <div
                    key={member.user}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Member #{member.user.slice(-4)}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        Inflow: {format(member.income)} • Outflow: {format(member.expenses)}
                      </p>
                    </div>
                    <div className="text-right font-sans">
                      <p className="text-xs font-bold text-foreground tabular-nums">
                        {member.transactionCount} entries
                      </p>
                      <p
                        className={`text-[11px] font-semibold font-mono ${
                          member.income - member.expenses >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
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

// ─── Shared Members Tab ───────────────────────────────────────────────────────

const SharedTransactionsTab: React.FC<{ familyId: string }> = ({ familyId }) => {
  const { data: members = [], isLoading: loadingMembers } = useFamilyMembers(familyId)

  if (loadingMembers) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <SkeletonLoader key={i} type="table-row" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-sm font-bold text-foreground">Household Members Directory</h3>
          <p className="text-xs text-muted-foreground">
            Family member profiles and sharing settings
          </p>
        </div>
        <span className="font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-md font-semibold">
          {members.length} Registered Members
        </span>
      </div>

      {members.length === 0 ? (
        <EmptyState title="No Members" description="No family members found." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member._id} className="border border-border/80 shadow-sm bg-card hover:border-primary/40 transition-colors overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">{member.user.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-2.5 border-t border-border/60">
                  <Badge variant={ROLE_BADGE_VARIANTS[member.role] || 'secondary'} size="sm">
                    {member.role.toUpperCase()}
                  </Badge>
                  <span className="text-muted-foreground font-mono text-[10px]">
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

  useEffect(() => {
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
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <SkeletonLoader key={i} type="row" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* My Sharing Preferences */}
      <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
          <CardTitle className="font-serif text-base font-bold text-foreground">
            Privacy & Sharing Preferences
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Decide exactly what data is visible to other members of your family group.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border/60 p-0">
          <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/20 transition-colors">
            <div>
              <p className="text-xs font-bold text-foreground">Share Transactions</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Allow family members to view your transaction records
              </p>
            </div>
            <button
              role="switch"
              aria-checked={sharingPreferences.shareTransactions}
              onClick={() =>
                handleSharingChange('shareTransactions', !sharingPreferences.shareTransactions)
              }
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                sharingPreferences.shareTransactions ? 'bg-primary' : 'bg-muted border border-border'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform mt-0.5 ${
                  sharingPreferences.shareTransactions ? 'translate-x-4.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/20 transition-colors">
            <div>
              <p className="text-xs font-bold text-foreground">Share Accounts & Balances</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Allow family members to view your account balances
              </p>
            </div>
            <button
              role="switch"
              aria-checked={sharingPreferences.shareAccounts}
              onClick={() =>
                handleSharingChange('shareAccounts', !sharingPreferences.shareAccounts)
              }
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                sharingPreferences.shareAccounts ? 'bg-primary' : 'bg-muted border border-border'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform mt-0.5 ${
                  sharingPreferences.shareAccounts ? 'translate-x-4.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/20 transition-colors">
            <div>
              <p className="text-xs font-bold text-foreground">Share Spending Analytics</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Include your expenses in aggregated household analytics
              </p>
            </div>
            <button
              role="switch"
              aria-checked={sharingPreferences.shareAnalytics}
              onClick={() =>
                handleSharingChange('shareAnalytics', !sharingPreferences.shareAnalytics)
              }
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                sharingPreferences.shareAnalytics ? 'bg-primary' : 'bg-muted border border-border'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform mt-0.5 ${
                  sharingPreferences.shareAnalytics ? 'translate-x-4.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Member Roles Directory */}
      {isOwner && (
        <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
            <CardTitle className="font-serif text-base font-bold text-foreground">
              Member Roles & Permissions
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Household roles and permissions (Admin only)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                >
                  <div>
                    <p className="text-xs font-semibold text-foreground">{member.user.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{member.user.email}</p>
                  </div>
                  <Badge variant={ROLE_BADGE_VARIANTS[member.role] || 'secondary'} size="sm">
                    {member.role.toUpperCase()}
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
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <SkeletonLoader key={i} type="table-row" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-xs text-destructive">Failed to load family members.</p>
  }

  const isOwner = user?._id === ownerId

  return (
    <div className="space-y-4">
      <div className="divide-y divide-border/60 rounded-xl border border-border/80 overflow-hidden bg-card shadow-sm">
        {members.map((m) => (
          <div
            key={m._id}
            className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                {m.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{m.user.name}</p>
                <p className="text-[11px] text-muted-foreground font-mono truncate">{m.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Badge variant={ROLE_BADGE_VARIANTS[m.role] || 'secondary'} size="sm">
                {m.role.toUpperCase()}
              </Badge>
              {isOwner && m.user._id !== ownerId && (
                <button
                  onClick={() => removeMember.mutate(m.user._id)}
                  disabled={removeMember.isPending}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  aria-label="Remove member"
                  title="Remove member"
                >
                  <Trash2 className="h-4 w-4" />
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
                  <LogOut className="h-3 w-3" /> Leave Group
                </Button>
              )}
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <p className="p-8 text-center text-xs text-muted-foreground">No members found.</p>
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
      setSuccessMsg(`Invitation dispatched to ${email}`)
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
      <Card className="border border-border/80 shadow-sm bg-card p-5 space-y-3">
        <div>
          <label className="block text-xs font-serif font-bold text-foreground mb-1">
            Invite Family Member by Email
          </label>
          <p className="text-xs text-muted-foreground leading-relaxed">
            They will receive an invitation to join your shared family group.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="household.member@example.com"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="text-xs"
          />
          <Button
            onClick={handleSend}
            isLoading={sendInvitation.isPending}
            disabled={!email.trim()}
            size="sm"
            className="gap-1.5 text-xs shrink-0"
          >
            <Mail className="h-3.5 w-3.5" /> Send Invite
          </Button>
        </div>
      </Card>
      {successMsg && (
        <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {successMsg}
        </p>
      )}
      {errorMsg && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive">
          {errorMsg}
        </p>
      )}
    </div>
  )
}

// ─── Pending Invitations ──────────────────────────────────────────────────────

const PendingInvitations: React.FC = () => {
  const { data: invitations = [], isLoading } = usePendingInvitations()
  const accept = useAcceptInvitation()
  const reject = useRejectInvitation()

  if (isLoading || invitations.length === 0) return null

  return (
    <Card className="border border-primary/40 bg-primary/5 shadow-xs">
      <CardHeader className="p-4 border-b border-primary/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <CardTitle className="font-serif text-sm font-bold text-foreground">
            Pending Household Invitations
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          You have been invited to join a family finance group
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        {invitations.map((inv) => (
          <div
            key={inv._id}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-xs"
          >
            <div>
              <p className="text-xs font-bold text-foreground">{inv.familyId.name}</p>
              <p className="text-[11px] text-muted-foreground font-mono">
                Invited by {inv.invitedBy.name}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="xs"
                onClick={() => accept.mutate(inv._id)}
                isLoading={accept.isPending}
                className="text-xs"
              >
                Accept
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => reject.mutate(inv._id)}
                isLoading={reject.isPending}
                className="text-xs"
              >
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ─── Create Family Form ───────────────────────────────────────────────────────

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
    <Card className="max-w-md mx-auto border border-border/80 shadow-md bg-card">
      <CardContent className="p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
          <Users className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-serif text-lg font-bold text-foreground">
            Initialize Family Finance
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Manage shared budgets, combined net worth, and household accounts together.
          </p>
        </div>
        <div className="space-y-2 text-left">
          <label className="block text-xs font-mono font-medium text-muted-foreground">
            Household Group Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. The Reynolds Household"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
        </div>
        <Button
          onClick={handleCreate}
          isLoading={createFamily.isPending}
          disabled={!name.trim()}
          className="w-full text-xs"
        >
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
        <SkeletonLoader type="text" height="h-7" width="w-48" />
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono text-[10px] uppercase tracking-wider font-semibold">
              Household Finance
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-primary font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Shared Accounts
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Family Finance
          </h1>
          <p className="text-xs text-muted-foreground">
            Household group:{' '}
            <span className="font-semibold text-foreground">
              {activeFamily?.familyName || 'Family Group'}
            </span>{' '}
            • Shared household finance
          </p>
        </div>

        {families.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab('invite')}
              className="gap-1.5 text-xs shadow-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite Member
            </Button>
          </div>
        )}
      </div>

      <PendingInvitations />

      {families.length === 0 ? (
        <CreateFamilyForm />
      ) : (
        <div className="space-y-6">
          {/* Family Group Selector if multiple */}
          {families.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {families.map((f) => (
                <button
                  key={f._id}
                  onClick={() => {
                    setSelectedFamilyId(f._id)
                    setActiveTab('dashboard')
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeFamilyId === f._id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.familyName}
                </button>
              ))}
            </div>
          )}

          {activeFamily && (
            <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
              <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="font-serif text-base font-bold text-foreground">
                      {activeFamily.familyName}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Household collaboration and shared accounts
                    </CardDescription>
                  </div>

                  {/* Sub-Tabs */}
                  <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60 overflow-x-auto">
                    {(['dashboard', 'shared', 'members', 'permissions', 'invite'] as FamilyTab[]).map(
                      (tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-all whitespace-nowrap ${
                            activeTab === tab
                              ? 'bg-card text-foreground shadow-xs font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {tab === 'dashboard'
                            ? 'Overview'
                            : tab === 'shared'
                            ? 'Directory'
                            : tab === 'members'
                            ? 'Members'
                            : tab === 'permissions'
                            ? 'Privacy'
                            : 'Invite'}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                {activeTab === 'dashboard' && <DashboardTab familyId={activeFamily._id} />}
                {activeTab === 'shared' && <SharedTransactionsTab familyId={activeFamily._id} />}
                {activeTab === 'members' && (
                  <MembersTab familyId={activeFamily._id} ownerId={activeFamily.familyHead} />
                )}
                {activeTab === 'permissions' && (
                  <PermissionsTab familyId={activeFamily._id} ownerId={activeFamily.familyHead} />
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
