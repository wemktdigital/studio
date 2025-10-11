/**
 * 👑 ADMIN SERVICE
 * Serviço para gerenciamento de sistema (Super Admin apenas)
 * 
 * Funcionalidades:
 * - Listar todos os usuários do sistema
 * - Criar usuários manualmente
 * - Listar todos os workspaces
 * - Vincular/desvincular usuários a workspaces
 * - Gerenciar níveis de acesso
 */

import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'

export interface SystemUser {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  status: 'online' | 'offline' | 'away'
  user_level: 'super_admin' | 'admin' | 'moderator' | 'member' | 'guest' | 'viewer'
  created_at: string
  updated_at: string
  workspaces?: WorkspaceLink[]
}

export interface WorkspaceLink {
  workspace_id: string
  workspace_name: string
  role: 'admin' | 'member' | 'guest'
  joined_at: string
  is_active: boolean
}

export interface SystemWorkspace {
  id: string
  name: string
  logo_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  members_count: number
  channels_count: number
}

export interface CreateUserData {
  email: string
  password: string
  display_name: string
  user_level?: 'admin' | 'moderator' | 'member' | 'guest' | 'viewer'
}

export interface LinkUserToWorkspaceData {
  user_id: string
  workspace_id: string
  role: 'admin' | 'member' | 'guest'
}

class AdminService {
  private static instance: AdminService
  
  private constructor() {}
  
  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService()
    }
    return AdminService.instance
  }

  // ============================================
  // VERIFICAÇÕES DE PERMISSÃO
  // ============================================

  /**
   * Verifica se o usuário atual é Super Admin
   */
  async isSuperAdmin(): Promise<boolean> {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return false

      const { data, error } = await supabase
        .from('users')
        .select('user_level')
        .eq('id', user.id)
        .single()

      if (error || !data) return false

      return data.user_level === 'super_admin'
    } catch (error) {
      console.error('Error checking super admin status:', error)
      return false
    }
  }

  /**
   * Middleware para proteger rotas de admin
   */
  async requireSuperAdmin(): Promise<void> {
    const isSuperAdmin = await this.isSuperAdmin()
    if (!isSuperAdmin) {
      throw new Error('Acesso negado: Apenas Super Admins podem acessar esta funcionalidade')
    }
  }

  // ============================================
  // GERENCIAMENTO DE USUÁRIOS
  // ============================================

  /**
   * Lista todos os usuários do sistema
   */
  async getAllUsers(): Promise<SystemUser[]> {
    await this.requireSuperAdmin()

    try {
      const supabase = createClient()

      // Buscar usuários
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      // Para cada usuário, buscar seus workspaces
      const usersWithWorkspaces = await Promise.all(
        (users || []).map(async (user) => {
          const { data: workspaceLinks } = await supabase
            .from('workspace_users')
            .select(`
              workspace_id,
              role,
              joined_at,
              is_active,
              workspaces (
                name
              )
            `)
            .eq('user_id', user.id)

          const workspaces = (workspaceLinks || []).map((link: any) => ({
            workspace_id: link.workspace_id,
            workspace_name: link.workspaces?.name || 'Unknown',
            role: link.role,
            joined_at: link.joined_at,
            is_active: link.is_active
          }))

          return {
            ...user,
            workspaces
          }
        })
      )

      return usersWithWorkspaces
    } catch (error) {
      console.error('Error fetching all users:', error)
      throw error
    }
  }

  /**
   * Cria um usuário manualmente (sem convite)
   */
  async createUserManually(userData: CreateUserData): Promise<SystemUser> {
    await this.requireSuperAdmin()

    try {
      const supabase = createClient()

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            display_name: userData.display_name
          },
          emailRedirectTo: undefined // Não enviar email de confirmação
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Falha ao criar usuário')

      // 2. Atualizar nível do usuário (se fornecido)
      if (userData.user_level) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            user_level: userData.user_level,
            display_name: userData.display_name
          })
          .eq('id', authData.user.id)

        if (updateError) {
          console.error('Error updating user level:', updateError)
        }
      }

      // 3. Buscar usuário completo
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (userError) throw userError

      console.log('✅ Usuário criado manualmente:', user.email)

      return {
        ...user,
        workspaces: []
      }
    } catch (error) {
      console.error('Error creating user manually:', error)
      throw error
    }
  }

  /**
   * Atualiza informações de um usuário
   */
  async updateUser(userId: string, updates: Partial<SystemUser>): Promise<void> {
    await this.requireSuperAdmin()

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)

      if (error) throw error

      console.log('✅ Usuário atualizado:', userId)
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  /**
   * Deleta um usuário do sistema
   */
  async deleteUser(userId: string): Promise<void> {
    await this.requireSuperAdmin()

    try {
      const supabase = createClient()

      // 1. Remover de todos os workspaces
      await supabase
        .from('workspace_users')
        .delete()
        .eq('user_id', userId)

      // 2. Deletar usuário
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      console.log('✅ Usuário deletado:', userId)
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  // ============================================
  // GERENCIAMENTO DE WORKSPACES
  // ============================================

  /**
   * Lista todos os workspaces do sistema
   */
  async getAllWorkspaces(): Promise<SystemWorkspace[]> {
    await this.requireSuperAdmin()

    try {
      const supabase = createClient()

      const { data: workspaces, error: workspacesError } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false })

      if (workspacesError) throw workspacesError

      // Contar membros e canais de cada workspace
      const workspacesWithCounts = await Promise.all(
        (workspaces || []).map(async (workspace) => {
          // Contar membros
          const { count: membersCount } = await supabase
            .from('workspace_users')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspace.id)

          // Contar canais
          const { count: channelsCount } = await supabase
            .from('channels')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspace.id)

          return {
            ...workspace,
            members_count: membersCount || 0,
            channels_count: channelsCount || 0
          }
        })
      )

      return workspacesWithCounts
    } catch (error) {
      console.error('Error fetching all workspaces:', error)
      throw error
    }
  }

  // ============================================
  // VINCULAÇÃO USUÁRIO ↔ WORKSPACE
  // ============================================

  /**
   * Vincula um usuário a um workspace
   */
  async linkUserToWorkspace(data: LinkUserToWorkspaceData): Promise<void> {
    await this.requireSuperAdmin()

    try {
      const supabase = createClient()

      // Verificar se já existe vínculo
      const { data: existing } = await supabase
        .from('workspace_users')
        .select('*')
        .eq('user_id', data.user_id)
        .eq('workspace_id', data.workspace_id)
        .single()

      if (existing) {
        throw new Error('Usuário já está vinculado a este workspace')
      }

      // Criar vínculo
      const { error } = await supabase
        .from('workspace_users')
        .insert({
          user_id: data.user_id,
          workspace_id: data.workspace_id,
          role: data.role,
          joined_at: new Date().toISOString(),
          is_active: true
        })

      if (error) throw error

      console.log('✅ Usuário vinculado ao workspace')
    } catch (error) {
      console.error('Error linking user to workspace:', error)
      throw error
    }
  }

  /**
   * Remove vínculo de usuário com workspace
   */
  async unlinkUserFromWorkspace(userId: string, workspaceId: string): Promise<void> {
    await this.requireSuperAdmin()

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('workspace_users')
        .delete()
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)

      if (error) throw error

      console.log('✅ Usuário desvinculado do workspace')
    } catch (error) {
      console.error('Error unlinking user from workspace:', error)
      throw error
    }
  }

  /**
   * Atualiza o cargo de um usuário em um workspace
   */
  async updateUserRoleInWorkspace(
    userId: string, 
    workspaceId: string, 
    newRole: 'admin' | 'member' | 'guest'
  ): Promise<void> {
    await this.requireSuperAdmin()

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('workspace_users')
        .update({ role: newRole })
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)

      if (error) throw error

      console.log('✅ Cargo do usuário atualizado no workspace')
    } catch (error) {
      console.error('Error updating user role in workspace:', error)
      throw error
    }
  }

  /**
   * Lista usuários de um workspace específico
   */
  async getWorkspaceUsers(workspaceId: string): Promise<SystemUser[]> {
    await this.requireSuperAdmin()

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('workspace_users')
        .select(`
          user_id,
          role,
          joined_at,
          is_active,
          users (
            id,
            email,
            display_name,
            avatar_url,
            status,
            user_level,
            created_at,
            updated_at
          )
        `)
        .eq('workspace_id', workspaceId)

      if (error) throw error

      const users = (data || []).map((link: any) => ({
        ...link.users,
        workspaces: [{
          workspace_id: workspaceId,
          workspace_name: '',
          role: link.role,
          joined_at: link.joined_at,
          is_active: link.is_active
        }]
      }))

      return users
    } catch (error) {
      console.error('Error fetching workspace users:', error)
      throw error
    }
  }

  // ============================================
  // ESTATÍSTICAS DO SISTEMA
  // ============================================

  /**
   * Retorna estatísticas gerais do sistema
   */
  async getSystemStats(): Promise<{
    totalUsers: number
    totalWorkspaces: number
    totalChannels: number
    totalMessages: number
    activeUsers: number
  }> {
    await this.requireSuperAdmin()

    try {
      const supabase = createClient()

      const [
        { count: totalUsers },
        { count: totalWorkspaces },
        { count: totalChannels },
        { count: totalMessages },
        { count: activeUsers }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('workspaces').select('*', { count: 'exact', head: true }),
        supabase.from('channels').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'online')
      ])

      return {
        totalUsers: totalUsers || 0,
        totalWorkspaces: totalWorkspaces || 0,
        totalChannels: totalChannels || 0,
        totalMessages: totalMessages || 0,
        activeUsers: activeUsers || 0
      }
    } catch (error) {
      console.error('Error fetching system stats:', error)
      throw error
    }
  }
}

// Exportar instância singleton
export const adminService = AdminService.getInstance()

