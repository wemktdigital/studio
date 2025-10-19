'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface SimpleUser {
  id: string
  displayName: string
  avatarUrl?: string
  status: string
}

export function useWorkspaceUsersSimple(workspaceId: string) {
  const {
    data: users = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['workspace-users-simple', workspaceId],
    queryFn: async () => {
      console.log('🔍 useWorkspaceUsersSimple: Starting query for workspace:', workspaceId)
      
      try {
        // Buscar membros do workspace
        const { data: members, error: membersError } = await supabase
          .from('workspace_members')
          .select('user_id')
          .eq('workspace_id', workspaceId)
        
        if (membersError) {
          console.error('🔍 useWorkspaceUsersSimple: Members error:', membersError)
          return []
        }
        
        console.log('🔍 useWorkspaceUsersSimple: Found members:', members)
        
        if (!members || members.length === 0) {
          console.log('🔍 useWorkspaceUsersSimple: No members found')
          return []
        }
        
        // Buscar dados dos usuários
        const userIds = members.map(m => m.user_id)
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, display_name, avatar_url, status')
          .in('id', userIds)
        
        if (usersError) {
          console.error('🔍 useWorkspaceUsersSimple: Users error:', usersError)
          return []
        }
        
        console.log('🔍 useWorkspaceUsersSimple: Found users:', usersData)
        
        // Transformar dados
        const transformedUsers = (usersData || []).map(user => ({
          id: user.id,
          displayName: user.display_name || 'Unknown User',
          avatarUrl: user.avatar_url,
          status: user.status || 'offline'
        }))
        
        console.log('🔍 useWorkspaceUsersSimple: Transformed users:', transformedUsers)
        return transformedUsers
        
      } catch (error) {
        console.error('🔍 useWorkspaceUsersSimple: Error:', error)
        return []
      }
    },
    enabled: !!workspaceId,
    retry: 1
  })

  return {
    users,
    isLoading,
    error,
    refetch
  }
}
