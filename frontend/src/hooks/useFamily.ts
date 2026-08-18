/**
 * Family Finance Hooks
 * TanStack Query hooks for family management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { familyService } from '@services/family.service'

export const useFamilies = () =>
  useQuery({
    queryKey: ['families'],
    queryFn: familyService.listFamilies,
    staleTime: 5 * 60 * 1000,
  })

export const useFamily = (familyId: string | null) =>
  useQuery({
    queryKey: ['families', familyId],
    queryFn: () => familyService.getFamily(familyId!),
    enabled: !!familyId,
    staleTime: 5 * 60 * 1000,
  })

export const useFamilyMembers = (familyId: string | null) =>
  useQuery({
    queryKey: ['families', familyId, 'members'],
    queryFn: () => familyService.listMembers(familyId!),
    enabled: !!familyId,
    staleTime: 5 * 60 * 1000,
  })

export const usePendingInvitations = () =>
  useQuery({
    queryKey: ['invitations', 'pending'],
    queryFn: familyService.listPendingInvitations,
    staleTime: 2 * 60 * 1000,
  })

export const useFamilyDashboard = (familyId: string | null) =>
  useQuery({
    queryKey: ['families', familyId, 'dashboard'],
    queryFn: () => familyService.getFamilyDashboard(familyId!),
    enabled: !!familyId,
    staleTime: 2 * 60 * 1000,
  })

export const useCreateFamily = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => familyService.createFamily(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['families'] }),
  })
}

export const useSendInvitation = (familyId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (email: string) => familyService.sendInvitation(familyId, email),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['families', familyId, 'members'] }),
  })
}

export const useAcceptInvitation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => familyService.acceptInvitation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invitations'] })
      qc.invalidateQueries({ queryKey: ['families'] })
    },
  })
}

export const useRejectInvitation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => familyService.rejectInvitation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations'] }),
  })
}

export const useRemoveMember = (familyId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => familyService.removeMember(familyId, memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['families', familyId, 'members'] }),
  })
}

export const useLeaveFamily = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (familyId: string) => familyService.leaveFamily(familyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['families'] }),
  })
}

export const useMySharing = (familyId: string | null) =>
  useQuery({
    queryKey: ['families', familyId, 'sharing', 'me'],
    queryFn: () => familyService.getMySharing(familyId!),
    enabled: !!familyId,
    staleTime: 5 * 60 * 1000,
  })

export const useUpdateSharing = (familyId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (preferences: Parameters<typeof familyService.updateSharing>[1]) =>
      familyService.updateSharing(familyId, preferences),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['families', familyId, 'sharing'] }),
  })
}
