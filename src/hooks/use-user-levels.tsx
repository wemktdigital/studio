'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/components/providers/auth-provider'
import { supabase } from '@/lib/supabase'

export interface RolePermission {
  id: string
  roleName: string
  canCreateChannels: boolean
  canDeleteChannels: boolean
  canManageUsers: boolean
  canBanUsers: boolean
  canViewAnalytics: boolean
  canManageWorkspace: boolean
  canSendMessages: boolean
  canDeleteMessages: boolean
  canPinMessages: boolean
  createdAt: string
  updatedAt: string
}

export interface UserWorkspaceRole {
  id: string
  userId: string
  workspaceId: string
  roleName: string
  assignedBy: string
  assignedAt: string
  expiresAt?: string
}

export interface UserLevel {
  id: string
  handle: string
  displayName: string
  userLevel: 'super_admin' | 'admin' | 'manager' | 'member' | 'guest' | 'banned'
  status: string
  avatarUrl?: string
}

export function useUserLevels() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  // Get current user's level
  const {
    data: currentUserLevel,
    isLoading: isLoadingUserLevel,
    error: userLevelError
  } = useQuery({
    queryKey: ['user-level', user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, display_name, status, avatar_url, user_level')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching user level:', error)
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          
          // ✅ TENTAR CRIAR USUÁRIO: Se o erro for que o usuário não existe
          if (error.code === 'PGRST116' || error.message?.includes('No rows returned')) {
            console.log('User not found in users table, attempting to create...')
            
            try {
                              const { error: insertError } = await supabase
                  .from('users')
                  .insert({
                    id: user.id,
                    display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User',
                    avatar_url: user.user_metadata?.avatar_url || null,
                    status: 'online',
                    user_level: 'member'
                  })
              
              if (insertError) {
                console.error('Error creating user:', insertError)
              } else {
                console.log('User created successfully, retrying fetch...')
                // Retry the fetch after creating the user
                const { data: retryData, error: retryError } = await supabase
                  .from('users')
                  .select('id, display_name, status, avatar_url, user_level')
                  .eq('id', user.id)
                  .single()
                
                if (!retryError && retryData) {
                  return {
                    id: retryData.id,
                    handle: user.email?.split('@')[0] || 'user', // Generate handle from email
                    displayName: retryData.display_name,
                    userLevel: retryData.user_level as 'super_admin' | 'admin' | 'manager' | 'member' | 'guest' | 'banned',
                    status: retryData.status,
                    avatarUrl: retryData.avatar_url
                  } as UserLevel
                }
              }
            } catch (createErr) {
              console.error('Exception creating user:', createErr)
            }
          }
          
          // ✅ FALLBACK: Retornar dados mock em caso de erro
          return {
            id: user.id,
            handle: user.email?.split('@')[0] || 'user',
            displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            userLevel: 'member' as const,
            status: 'online',
            avatarUrl: user.user_metadata?.avatar_url || null
          } as UserLevel
        }

        return {
          id: data.id,
          handle: user.email?.split('@')[0] || 'user', // Generate handle from email
          displayName: data.display_name,
          userLevel: data.user_level as 'super_admin' | 'admin' | 'manager' | 'member' | 'guest' | 'banned',
          status: data.status,
          avatarUrl: data.avatar_url
        } as UserLevel
      } catch (err) {
        console.error('Exception in user level query:', err)
        // ✅ FALLBACK: Retornar dados mock em caso de exceção
        return {
          id: user.id,
          handle: user.email?.split('@')[0] || 'user',
          displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          userLevel: 'member' as const,
          status: 'online',
          avatarUrl: user.user_metadata?.avatar_url || null
        } as UserLevel
      }
    },
    enabled: !!user?.id,
    retry: 1, // Tentar apenas uma vez
    refetchOnWindowFocus: false // Não refazer query ao focar na janela
  })

  // Get all role permissions
  const {
    data: rolePermissions = [],
    isLoading: isLoadingPermissions,
    error: permissionsError
  } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('*')
          .order('role_name')

        if (error) {
          console.error('Error fetching role permissions:', error)
          // Return default permissions instead of throwing error
          return [
            {
              id: 'default-member',
              roleName: 'member',
              canCreateChannels: false,
              canDeleteChannels: false,
              canManageUsers: false,
              canBanUsers: false,
              canViewAnalytics: false,
              canManageWorkspace: false,
              canSendMessages: true,
              canDeleteMessages: false,
              canPinMessages: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        }

        return data?.map(role => ({
          id: role.id,
          roleName: role.role_name,
          canCreateChannels: role.can_create_channels,
          canDeleteChannels: role.can_delete_channels,
          canManageUsers: role.can_manage_users,
          canBanUsers: role.can_ban_users,
          canViewAnalytics: role.can_view_analytics,
          canManageWorkspace: role.can_manage_workspace,
          canSendMessages: role.can_send_messages,
          canDeleteMessages: role.can_delete_messages,
          canPinMessages: role.can_pin_messages,
          createdAt: role.created_at,
          updatedAt: role.updated_at
        })) || []
      } catch (err) {
        console.error('Exception fetching role permissions:', err)
        // Return default permissions on any error
        return [
          {
            id: 'default-member',
            roleName: 'member',
            canCreateChannels: false,
            canDeleteChannels: false,
            canManageUsers: false,
            canBanUsers: false,
            canViewAnalytics: false,
            canManageWorkspace: false,
            canSendMessages: true,
            canDeleteMessages: false,
            canPinMessages: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }
    }
  })

  // Get user's workspace roles (SIMPLIFIED)
  const {
    data: userWorkspaceRoles = [],
    isLoading: isLoadingWorkspaceRoles,
    error: workspaceRolesError
  } = useQuery({
    queryKey: ['user-workspace-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      try {
        const { data, error } = await supabase
          .from('user_workspace_roles')
          .select('*')  // ✅ SIMPLIFICADO: apenas dados básicos
          .eq('user_id', user.id)

        if (error) {
          console.error('Error fetching workspace roles:', error)
          // Return empty array instead of throwing error
          return []
        }

        return data || []
      } catch (err) {
        console.error('Exception fetching workspace roles:', err)
        // Return empty array on any error
        return []
      }
    },
    enabled: !!user?.id
  })

  // Check if user has specific permission
  const hasPermission = (permission: keyof Omit<RolePermission, 'id' | 'roleName' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUserLevel) {
      console.log('🔍 useUserLevels.hasPermission:', { permission, result: false, reason: 'No currentUserLevel' });
      return false;
    }

    const role = rolePermissions.find(r => r.roleName === currentUserLevel.userLevel);
    if (!role) {
      console.log('🔍 useUserLevels.hasPermission:', { permission, result: false, reason: 'No role found', userLevel: currentUserLevel.userLevel });
      return false;
    }

    const result = role[permission];
    console.log('🔍 useUserLevels.hasPermission:', { permission, result, userLevel: currentUserLevel.userLevel, roleName: role.roleName });
    return result;
  }

  // Check if user can perform action
  const can = {
    createChannels: () => {
      const result = hasPermission('canCreateChannels');
      console.log('🔍 useUserLevels.can.createChannels:', { result, userLevel: currentUserLevel?.userLevel });
      return result;
    },
    deleteChannels: () => {
      const result = hasPermission('canDeleteChannels');
      console.log('🔍 useUserLevels.can.deleteChannels:', { result, userLevel: currentUserLevel?.userLevel });
      return result;
    },
    manageUsers: () => hasPermission('canManageUsers'),
    banUsers: () => hasPermission('canBanUsers'),
    viewAnalytics: () => hasPermission('canViewAnalytics'),
    manageWorkspace: () => hasPermission('canManageWorkspace'),
    sendMessages: () => hasPermission('canSendMessages'),
    deleteMessages: () => hasPermission('canDeleteMessages'),
    pinMessages: () => hasPermission('canPinMessages'),
    // Super admin can do everything
    isSuperAdmin: () => {
      const result = currentUserLevel?.userLevel === 'super_admin';
      console.log('🔍 useUserLevels.can.isSuperAdmin:', { result, userLevel: currentUserLevel?.userLevel });
      return result;
    },
    isAdmin: () => ['super_admin', 'admin'].includes(currentUserLevel?.userLevel || ''),
    isManager: () => ['super_admin', 'admin', 'manager'].includes(currentUserLevel?.userLevel || ''),
    isMember: () => ['super_admin', 'admin', 'manager', 'member'].includes(currentUserLevel?.userLevel || ''),
    isGuest: () => currentUserLevel?.userLevel === 'guest',
    isBanned: () => currentUserLevel?.userLevel === 'banned'
  }

  // Update user level (only super admins)
  const updateUserLevel = useMutation({
    mutationFn: async ({ userId, newLevel }: { userId: string; newLevel: string }) => {
      if (!can.isSuperAdmin()) {
        throw new Error('Only super admins can update user levels')
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
      queryClient.invalidateQueries({ queryKey: ['user-level'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })

  // Assign workspace role
  const assignWorkspaceRole = useMutation({
    mutationFn: async ({ 
      userId, 
      workspaceId, 
      roleName, 
      expiresAt 
    }: { 
      userId: string
      workspaceId: string
      roleName: string
      expiresAt?: string
    }) => {
      if (!can.manageUsers()) {
        throw new Error('You do not have permission to assign roles')
      }

      const { error } = await supabase
        .from('user_workspace_roles')
        .upsert({
          user_id: userId,
          workspace_id: workspaceId,
          role_name: roleName,
          assigned_by: user?.id,
          expires_at: expiresAt
        })

      if (error) {
        console.error('Error assigning workspace role:', error)
        throw error
      }

      return { userId, workspaceId, roleName }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-workspace-roles'] })
    }
  })

  return {
    // Data
    currentUserLevel,
    rolePermissions,
    userWorkspaceRoles,

    // Loading states
    isLoadingUserLevel,
    isLoadingPermissions,
    isLoadingWorkspaceRoles,

    // Error states
    userLevelError,
    permissionsError,
    workspaceRolesError,

    // Permission checks
    can,
    hasPermission,

    // Actions
    updateUserLevel,
    assignWorkspaceRole
  }
}
