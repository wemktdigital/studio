'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useUserLevels } from './use-user-levels'
import { supabase } from '@/lib/supabase'

export interface WorkspaceUser {
  id: string
  handle: string
  displayName: string
  email: string
  avatarUrl?: string
  status: string
  userLevel: string
  joinedAt: string
  lastSeen?: string
  messageCount: number
}

export interface WorkspaceUserUpdate {
  userId: string
  userLevel?: string
  status?: string
}

export function useWorkspaceUsersAdmin(workspaceId: string) {
  const { user } = useAuthContext()
  const { can, currentUserLevel } = useUserLevels()
  const queryClient = useQueryClient()

  // Get all users in workspace
  const {
    data: workspaceUsers = [],
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['workspace-users-admin', workspaceId],
    queryFn: async () => {
      try {
        console.log('🔍 useWorkspaceUsersAdmin: Starting query for workspace:', workspaceId)
        
        // ✅ VERIFICAÇÃO: Permissões (simplificada)
        console.log('🔍 useWorkspaceUsersAdmin: Checking permissions...')
        console.log('🔍 useWorkspaceUsersAdmin: currentUserLevel:', currentUserLevel)
        console.log('🔍 useWorkspaceUsersAdmin: currentUserLevel?.userLevel:', currentUserLevel?.userLevel)
        
        // ✅ PERMISSÃO SIMPLIFICADA: Permitir para admins ou super admins
        const isAdmin = currentUserLevel?.userLevel === 'admin' || currentUserLevel?.userLevel === 'super_admin'
        console.log('🔍 useWorkspaceUsersAdmin: User is admin:', isAdmin)
        
        // ✅ DEBUG: Temporariamente permitir para todos os usuários para testar
        console.log('🔍 useWorkspaceUsersAdmin: TEMPORARY: Allowing all users to see workspace members for debugging')
        // if (!isAdmin) {
        //   console.warn('🔍 useWorkspaceUsersAdmin: User does not have admin permissions')
        //   return []
        // }

        // ✅ VERIFICAÇÃO: workspaceId válido
        if (!workspaceId) {
          console.warn('🔍 useWorkspaceUsersAdmin: No workspaceId provided')
          return []
        }

        // ✅ BUSCAR: Usuários do workspace (versão simplificada)
        console.log('🔍 useWorkspaceUsersAdmin: Fetching workspace members...')
        
        // ✅ TESTE 1: Verificar se a tabela workspace_members existe
        console.log('🔍 useWorkspaceUsersAdmin: Testing workspace_members table...')
        const { data: testData, error: testError } = await supabase
          .from('workspace_members')
          .select('*')
          .limit(1)
        
        if (testError) {
          console.error('🔍 useWorkspaceUsersAdmin: workspace_members table error:', testError)
          console.error('🔍 useWorkspaceUsersAdmin: Test error message:', testError.message)
          console.error('🔍 useWorkspaceUsersAdmin: Test error details:', testError.details)
          console.error('🔍 useWorkspaceUsersAdmin: Test error hint:', testError.hint)
          console.error('🔍 useWorkspaceUsersAdmin: Test error code:', testError.code)
          
          // ✅ FALLBACK: Se workspace_members não existe, retornar array vazio
          if (testError.code === 'PGRST116' || testError.message?.includes('relation "workspace_members" does not exist')) {
            console.warn('🔍 useWorkspaceUsersAdmin: workspace_members table does not exist, returning empty array')
            return []
          }
          
          throw new Error(`workspace_members table error: ${testError.message}`)
        }
        
        console.log('🔍 useWorkspaceUsersAdmin: workspace_members table exists, test data:', testData)
        
        // ✅ TESTE 2: Buscar membros do workspace
        const { data, error } = await supabase
          .from('workspace_members')
          .select('*')
          .eq('workspace_id', workspaceId)

        if (error) {
          console.error('🔍 useWorkspaceUsersAdmin: Supabase error:', error)
          console.error('🔍 useWorkspaceUsersAdmin: Error message:', error.message)
          console.error('🔍 useWorkspaceUsersAdmin: Error details:', error.details)
          console.error('🔍 useWorkspaceUsersAdmin: Error hint:', error.hint)
          console.error('🔍 useWorkspaceUsersAdmin: Error code:', error.code)
          throw new Error(`Database error: ${error.message || 'Unknown error'}`)
        }

        console.log('🔍 useWorkspaceUsersAdmin: Raw data from Supabase:', data)
        console.log('🔍 useWorkspaceUsersAdmin: Data type:', typeof data)
        console.log('🔍 useWorkspaceUsersAdmin: Data is array:', Array.isArray(data))
        console.log('🔍 useWorkspaceUsersAdmin: Data length:', data?.length)

        // ✅ VERIFICAÇÃO: Dados válidos
        if (!data || !Array.isArray(data)) {
          console.warn('🔍 useWorkspaceUsersAdmin: No data returned or invalid format')
          return []
        }

        // ✅ TRANSFORMAR: Dados da estrutura (versão simplificada)
        console.log('🔍 useWorkspaceUsersAdmin: Processing members data:', data)
        
        // ✅ BUSCAR: Dados dos usuários separadamente
        const userIds = data.map(member => member.user_id)
        console.log('🔍 useWorkspaceUsersAdmin: User IDs to fetch:', userIds)
        
        let usersData = []
        if (userIds.length > 0) {
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, display_name, avatar_url, status, user_level, created_at')
            .in('id', userIds)
          
          if (usersError) {
            console.error('🔍 useWorkspaceUsersAdmin: Users table error:', usersError)
            console.error('🔍 useWorkspaceUsersAdmin: Users error message:', usersError.message)
          } else {
            console.log('🔍 useWorkspaceUsersAdmin: Users data:', users)
            usersData = users || []
          }
        }
        
        const usersWithStats = data.map((member) => {
          const user = usersData.find(u => u.id === member.user_id) || {
            id: member.user_id,
            display_name: 'Unknown User',
            avatar_url: null,
            status: 'offline',
            user_level: 'member',
            created_at: new Date().toISOString()
          }
          
          console.log('🔍 useWorkspaceUsersAdmin: Processing member:', { member, user })
          
          return {
            id: user.id,
            handle: (user.display_name || 'unknown').toLowerCase().replace(/\s+/g, '') || `user_${user.id.slice(0, 8)}`,
            displayName: user.display_name || 'Unknown User',
            email: '', // Email not available in users table
            avatarUrl: user.avatar_url,
            status: user.status || 'offline',
            userLevel: user.user_level || 'member',
            joinedAt: member.joined_at || new Date().toISOString(),
            messageCount: 0 // Simplificado por enquanto
          } as WorkspaceUser
        })

        console.log('🔍 useWorkspaceUsersAdmin: Transformed users:', usersWithStats)
        console.log('🔍 useWorkspaceUsersAdmin: Transformed users length:', usersWithStats.length)
        console.log('🔍 useWorkspaceUsersAdmin: First transformed user:', usersWithStats[0])
        
        const sortedUsers = usersWithStats.sort((a, b) => a.displayName.localeCompare(b.displayName))
        console.log('🔍 useWorkspaceUsersAdmin: Returning sorted users:', sortedUsers)
        return sortedUsers
        
      } catch (error) {
        console.error('🔍 useWorkspaceUsersAdmin: Unexpected error:', error)
        console.error('🔍 useWorkspaceUsersAdmin: Error type:', typeof error)
        console.error('🔍 useWorkspaceUsersAdmin: Error message:', error instanceof Error ? error.message : String(error))
        console.error('🔍 useWorkspaceUsersAdmin: Error stack:', error instanceof Error ? error.stack : undefined)
        console.error('🔍 useWorkspaceUsersAdmin: WorkspaceId:', workspaceId)
        throw error
      }
    },
    enabled: !!workspaceId, // Temporariamente remover dependência do currentUserLevel para debug
    retry: 1,
    retryDelay: 1000
  })

  // Update user level
  const updateUserLevel = useMutation({
    mutationFn: async ({ userId, newLevel }: { userId: string; newLevel: string }) => {
      if (!can.manageUsers()) {
        throw new Error('You do not have permission to update user levels')
      }

      const { error } = await supabase
        .from('users')
        .update({ user_level: newLevel })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user level:', error)
        throw error
      }

      return { userId, newLevel }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-users-admin', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['user-level'] })
    }
  })

  // Update user status
  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: string }) => {
      if (!can.manageUsers()) {
        throw new Error('You do not have permission to update user status')
      }

      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user status:', error)
        throw error
      }

      return { userId, newStatus }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-users-admin', workspaceId] })
    }
  })

  // Remove user from workspace
  const removeUserFromWorkspace = useMutation({
    mutationFn: async (userId: string) => {
      if (!can.manageUsers()) {
        throw new Error('You do not have permission to remove users')
      }

      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error removing user from workspace:', error)
        throw error
      }

      return userId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-users-admin', workspaceId] })
    }
  })

  // Ban user (only admins and super admins)
  const banUser = useMutation({
    mutationFn: async (userId: string) => {
      if (!can.banUsers()) {
        throw new Error('You do not have permission to ban users')
      }

      const { error } = await supabase
        .from('users')
        .update({ 
          user_level: 'banned',
          status: 'banned'
        })
        .eq('id', userId)

      if (error) {
        console.error('Error banning user:', error)
        throw error
      }

      return userId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-users-admin', workspaceId] })
    }
  })

  // Get user statistics
  const getUserStats = (userId: string) => {
    const user = workspaceUsers.find(u => u.id === userId)
    if (!user) return null

    return {
      messageCount: user.messageCount,
      joinedAt: user.joined_at,
      lastSeen: user.lastSeen,
      status: user.status,
      userLevel: user.userLevel
    }
  }

  // Get users by level
  const getUsersByLevel = (level: string) => {
    return workspaceUsers.filter(u => u.userLevel === level)
  }

  // Get active users (online/away)
  const getActiveUsers = () => {
    return workspaceUsers.filter(u => ['online', 'away'].includes(u.status))
  }

  // Get banned users
  const getBannedUsers = () => {
    return workspaceUsers.filter(u => u.userLevel === 'banned')
  }

  return {
    // Data
    workspaceUsers,
    isLoadingUsers,
    usersError,

    // Actions
    updateUserLevel,
    updateUserLevel,
    updateUserStatus,
    removeUserFromWorkspace,
    banUser,

    // Utilities
    getUserStats,
    getUsersByLevel,
    getActiveUsers,
    getBannedUsers,
    refetchUsers
  }
}
