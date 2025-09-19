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
  const { can } = useUserLevels()
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
      if (!can.manageUsers()) {
        throw new Error('You do not have permission to view workspace users')
      }

      // Simplesmente buscar todos os usuários por enquanto
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          display_name,
          avatar_url,
          status,
          user_level,
          created_at
        `)
        .limit(10)

      if (error) {
        console.error('Error fetching workspace users:', error)
        throw error
      }

      // Transformar dados para o formato esperado
      const usersWithStats = (data || []).map((user) => {
        return {
          id: user.id,
          handle: user.display_name?.toLowerCase().replace(/\s+/g, '') || `user_${user.id.slice(0, 8)}`,
          displayName: user.display_name,
          email: '', // Email not available in users table
          avatarUrl: user.avatar_url,
          status: user.status,
          userLevel: user.user_level || 'member',
          joinedAt: user.created_at,
          messageCount: 0 // Simplificado por enquanto
        } as WorkspaceUser
      })

      return usersWithStats.sort((a, b) => a.displayName.localeCompare(b.displayName))
    },
    enabled: !!workspaceId && can.manageUsers()
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
