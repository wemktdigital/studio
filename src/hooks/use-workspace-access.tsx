'use client'

import { useQuery } from '@tanstack/react-query'
import { workspaceService } from '@/lib/services'

/**
 * Hook para verificar se o usuário tem acesso a um workspace específico
 */
export function useWorkspaceAccess(workspaceId: string) {
  const {
    data: hasAccess = false,
    isLoading,
    error
  } = useQuery({
    queryKey: ['workspace-access', workspaceId],
    queryFn: () => workspaceService.hasWorkspaceAccess(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  })

  return {
    hasAccess,
    isLoading,
    error
  }
}

/**
 * Hook para verificar se o usuário é admin
 */
export function useIsAdmin() {
  const {
    data: isAdmin = false,
    isLoading,
    error
  } = useQuery({
    queryKey: ['is-admin'],
    queryFn: () => workspaceService.isUserAdmin(),
    staleTime: 10 * 60 * 1000, // 10 minutes (admin status doesn't change often)
    retry: 1
  })

  return {
    isAdmin,
    isLoading,
    error
  }
}
