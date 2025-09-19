import { useQuery } from '@tanstack/react-query'
import { activityService, ActivityItem } from '@/lib/services/activity-service'
import { useAuthContext } from '@/components/providers/auth-provider'

export function useActivities(workspaceId: string) {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['activities', workspaceId, user?.id],
    queryFn: () => activityService.getWorkspaceActivities(workspaceId, user?.id || ''),
    enabled: !!workspaceId && !!user?.id,
    staleTime: 30000, // 30 segundos
    refetchInterval: 60000, // Refetch a cada minuto
  })
}

export function useActivitiesByType(
  workspaceId: string, 
  type: 'mentions' | 'reactions' | 'threads' | 'messages'
) {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['activities', workspaceId, user?.id, type],
    queryFn: () => activityService.getActivitiesByType(workspaceId, user?.id || '', type),
    enabled: !!workspaceId && !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000,
  })
}

export function useActivityStats(workspaceId: string) {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['activity-stats', workspaceId, user?.id],
    queryFn: () => activityService.getActivityStats(workspaceId, user?.id || ''),
    enabled: !!workspaceId && !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000,
  })
}
