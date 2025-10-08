'use client'

import { useState, useEffect, useCallback } from 'react'
import { getInviteService, InviteStatus } from '@/lib/services/invite-service'
import { useToast } from '@/hooks/use-toast'

interface UseInvitesReturn {
  invites: InviteStatus[]
  isLoading: boolean
  error: string | null
  refreshInvites: () => Promise<void>
  cancelInvite: (inviteId: string) => Promise<boolean>
  inviteStats: {
    pending: number
    accepted: number
    expired: number
    cancelled: number
    total: number
  }
}

export function useInvites(workspaceId: string): UseInvitesReturn {
  const [invites, setInvites] = useState<InviteStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const inviteService = getInviteService()

  const refreshInvites = useCallback(async () => {
    if (!workspaceId) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await inviteService.getWorkspaceInvites(workspaceId)

      if (result.success && result.data) {
        setInvites(result.data)
      } else {
        setError(result.error || 'Erro ao carregar convites')
        console.error('Error loading invites:', result.error)
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao carregar convites')
      console.error('Error in refreshInvites:', error)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, inviteService])

  const cancelInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    try {
      const result = await inviteService.cancelInvite(inviteId)

      if (result.success) {
        // Atualizar lista local
        setInvites(prev => 
          prev.map(invite => 
            invite.id === inviteId 
              ? { ...invite, status: 'cancelled' as const }
              : invite
          )
        )

        toast({
          title: "Convite cancelado",
          description: "O convite foi cancelado com sucesso.",
        })

        return true
      } else {
        toast({
          title: "Erro",
          description: result.error || "Não foi possível cancelar o convite.",
          variant: "destructive"
        })
        return false
      }
    } catch (error: any) {
      console.error('Error cancelling invite:', error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao cancelar convite.",
        variant: "destructive"
      })
      return false
    }
  }, [inviteService, toast])

  // Calcular estatísticas
  const inviteStats = {
    pending: invites.filter(invite => invite.status === 'pending').length,
    accepted: invites.filter(invite => invite.status === 'accepted').length,
    expired: invites.filter(invite => invite.status === 'expired').length,
    cancelled: invites.filter(invite => invite.status === 'cancelled').length,
    total: invites.length
  }

  // Carregar convites quando o workspace mudar
  useEffect(() => {
    refreshInvites()
  }, [refreshInvites])

  return {
    invites,
    isLoading,
    error,
    refreshInvites,
    cancelInvite,
    inviteStats
  }
}

// Hook para um convite específico por token
export function useInviteByToken(token: string) {
  const [invite, setInvite] = useState<InviteStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inviteService = getInviteService()

  const loadInvite = useCallback(async () => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await inviteService.getInviteByToken(token)

      if (result.success && result.data) {
        setInvite(result.data)
      } else {
        setError(result.error || 'Convite não encontrado')
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao carregar convite')
      console.error('Error loading invite by token:', error)
    } finally {
      setIsLoading(false)
    }
  }, [token, inviteService])

  useEffect(() => {
    loadInvite()
  }, [loadInvite])

  return {
    invite,
    isLoading,
    error,
    refresh: loadInvite
  }
}

// Hook para aceitar convite
export function useAcceptInvite() {
  const [isAccepting, setIsAccepting] = useState(false)
  const { toast } = useToast()

  const inviteService = getInviteService()

  const acceptInvite = useCallback(async (
    token: string,
    userData: {
      email: string
      password: string
      displayName?: string
      handle?: string
    }
  ) => {
    setIsAccepting(true)

    try {
      const result = await inviteService.acceptInvite(token, userData)

      if (result.success && result.data) {
        toast({
          title: "Convite aceito!",
          description: `Bem-vindo ao workspace ${result.data.workspaceName}!`,
        })
        return result.data
      } else {
        throw new Error(result.error || 'Erro ao aceitar convite')
      }
    } catch (error: any) {
      console.error('Error accepting invite:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível aceitar o convite.",
        variant: "destructive"
      })
      throw error
    } finally {
      setIsAccepting(false)
    }
  }, [inviteService, toast])

  return {
    acceptInvite,
    isAccepting
  }
}

// Hook para estatísticas de convites
export function useInviteStats(workspaceId: string) {
  const { invites, isLoading } = useInvites(workspaceId)

  const stats = {
    pending: invites.filter(invite => invite.status === 'pending').length,
    accepted: invites.filter(invite => invite.status === 'accepted').length,
    expired: invites.filter(invite => invite.status === 'expired').length,
    cancelled: invites.filter(invite => invite.status === 'cancelled').length,
    total: invites.length,
    acceptanceRate: invites.length > 0 
      ? Math.round((invites.filter(invite => invite.status === 'accepted').length / invites.length) * 100)
      : 0
  }

  return {
    stats,
    isLoading
  }
}
