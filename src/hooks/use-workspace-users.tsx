'use client'

import { useQuery } from '@tanstack/react-query'
import { userService } from '@/lib/services'
import { useAuthContext } from '@/components/providers/auth-provider'

export function useWorkspaceUsers(workspaceId: string) {
  const { user } = useAuthContext()

  const {
    data: users = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['workspace-users', workspaceId, user?.id],
    queryFn: () => userService.getWorkspaceUsers(workspaceId),
    enabled: !!workspaceId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    users,
    isLoading,
    error,
    refetch
  }
}
