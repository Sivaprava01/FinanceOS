/**
 * Family Service
 * Handles all family-related API calls.
 */

import api from './api'

export interface Family {
  _id: string
  familyName: string
  familyHead: string
  description?: string
  members: { user: string; role: string; joinedAt: string; _id: string }[]
  createdAt: string
  updatedAt: string
}

export interface FamilyMember {
  _id: string
  user: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
}

export interface FamilyInvitation {
  _id: string
  familyId: { _id: string; name: string }
  invitedBy: { _id: string; name: string; email: string }
  invitedEmail: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export interface FamilyDashboard {
  familyName: string
  memberCount: number
  sharedCombined: {
    totalAssets: number
    totalLiabilities: number
    netWorth: number
  }
  sharedExpenses: number
  spendingByMember: Array<{
    user: string
    income: number
    expenses: number
    transactionCount: number
  }>
  membersSharing: number
}

export interface FamilySharing {
  _id: string
  userId: string
  familyId: string
  shareTransactions: boolean
  shareAccounts: boolean
  shareAnalytics: boolean
  createdAt: string
  updatedAt: string
}

export const familyService = {
  listFamilies: async (): Promise<{ families: Family[]; count: number }> => {
    const r = await api.get<{ success: boolean; message: string; data: { families: Family[]; count: number } }>('/families')
    return r.data.data
  },

  createFamily: async (name: string): Promise<Family> => {
    const r = await api.post<{ success: boolean; message: string; data: { family: Family } }>('/families', { name })
    return r.data.data.family
  },

  getFamily: async (familyId: string): Promise<Family> => {
    const r = await api.get<{ success: boolean; message: string; data: { family: Family } }>(`/families/${familyId}`)
    return r.data.data.family
  },

  listMembers: async (familyId: string): Promise<FamilyMember[]> => {
    const r = await api.get<{ success: boolean; message: string; data: { members: FamilyMember[]; count: number } }>(`/families/${familyId}/members`)
    return r.data.data.members
  },

  removeMember: async (familyId: string, memberId: string): Promise<void> => {
    await api.delete(`/families/${familyId}/members/${memberId}`)
  },

  leaveFamily: async (familyId: string): Promise<void> => {
    await api.post(`/families/${familyId}/leave`)
  },

  sendInvitation: async (familyId: string, invitedEmail: string): Promise<FamilyInvitation> => {
    const r = await api.post<{ success: boolean; message: string; data: { invitation: FamilyInvitation } }>(
      `/families/${familyId}/invitations`,
      { invitedEmail }
    )
    return r.data.data.invitation
  },

  listPendingInvitations: async (): Promise<FamilyInvitation[]> => {
    const r = await api.get<{ success: boolean; message: string; data: { invitations: FamilyInvitation[]; count: number } }>(
      '/families/invitations/pending'
    )
    return r.data.data.invitations
  },

  acceptInvitation: async (invitationId: string): Promise<void> => {
    await api.post(`/families/invitations/${invitationId}/accept`)
  },

  rejectInvitation: async (invitationId: string): Promise<void> => {
    await api.post(`/families/invitations/${invitationId}/reject`)
  },

  getFamilyDashboard: async (familyId: string): Promise<FamilyDashboard> => {
    const r = await api.get<{ success: boolean; message: string; data: { dashboard: FamilyDashboard } }>(
      `/families/${familyId}/dashboard`
    )
    return r.data.data.dashboard
  },

  // ─── Sharing Preferences ──────────────────────────────────────────────────

  getMySharing: async (familyId: string): Promise<FamilySharing> => {
    const r = await api.get<{ success: boolean; message: string; data: { sharing: FamilySharing } }>(
      `/families/${familyId}/sharing`
    )
    return r.data.data.sharing
  },

  updateSharing: async (familyId: string, preferences: Partial<FamilySharing>): Promise<FamilySharing> => {
    const r = await api.put<{ success: boolean; message: string; data: { sharing: FamilySharing } }>(
      `/families/${familyId}/sharing`,
      preferences
    )
    return r.data.data.sharing
  },

  getMemberSharing: async (familyId: string, userId: string): Promise<FamilySharing> => {
    const r = await api.get<{ success: boolean; message: string; data: { sharing: FamilySharing } }>(
      `/families/${familyId}/sharing/${userId}`
    )
    return r.data.data.sharing
  },
}
