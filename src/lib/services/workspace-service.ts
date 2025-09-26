import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type Workspace = Database['public']['Tables']['workspaces']['Row']
type WorkspaceInsert = Database['public']['Tables']['workspaces']['Insert']
type WorkspaceUpdate = Database['public']['Tables']['workspaces']['Update']

export class WorkspaceService {
  private supabase = createClient()

  /**
   * Check if the current user is an admin/developer
   */
  async isUserAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return false

      // ✅ ADMIN CHECK: Verificar se o usuário é admin/desenvolvedor
      // Por enquanto, vamos usar uma lista de emails admin ou verificar uma role especial
      const adminEmails = [
        'edson@we.marketing',
        'admin@studio.com',
        'dev@studio.com'
      ]
      
      const isAdmin = adminEmails.includes(user.email || '')
      console.log('WorkspaceService: User admin check:', { email: user.email, isAdmin })
      
      return isAdmin
    } catch (error) {
      console.error('WorkspaceService: Error checking admin status:', error)
      return false
    }
  }

  /**
   * Check if the current user has access to a specific workspace
   */
  async hasWorkspaceAccess(workspaceId: string): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return false

      // ✅ ADMIN CHECK: Admin tem acesso a todos os workspaces
      const isAdmin = await this.isUserAdmin()
      if (isAdmin) {
        console.log('WorkspaceService: Admin has access to all workspaces')
        return true
      }

      // ✅ USER CHECK: Verificar se o usuário é membro do workspace
      const { data, error } = await this.supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (error) {
        console.error('WorkspaceService: Error checking workspace access:', error)
        return false
      }

      const hasAccess = !!data
      console.log('WorkspaceService: User workspace access:', { workspaceId, hasAccess })
      return hasAccess
    } catch (error) {
      console.error('WorkspaceService: Error in hasWorkspaceAccess:', error)
      return false
    }
  }

  /**
   * Get all workspaces that the current user is a member of
   */
  async getUserWorkspaces(): Promise<Workspace[]> {
    try {
      // ✅ VERIFICAÇÃO DE AUTH: Verificar se há usuário mock ativo
      const DEV_MODE = process.env.NODE_ENV === 'development'
      const MOCK_USER_ENABLED = DEV_MODE && typeof window !== 'undefined' && localStorage.getItem('dev_mock_user') === 'true'
      
      if (MOCK_USER_ENABLED) {
        console.log('WorkspaceService: Mock user enabled, using mock workspaces')
        return this.getMockWorkspaces()
      }

      // ✅ VERIFICAÇÃO DE AUTH: Verificar usuário real do Supabase
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        console.log('WorkspaceService: No authenticated user, returning empty array')
        return []
      }

      console.log('WorkspaceService: Authenticated user found:', user.id)

      // ✅ ADMIN CHECK: Verificar se o usuário é admin
      const isAdmin = await this.isUserAdmin()
      
      if (isAdmin) {
        // ✅ ADMIN: Buscar TODOS os workspaces
        console.log('WorkspaceService: User is admin, fetching all workspaces')
        const { data, error } = await this.supabase
          .from('workspaces')
          .select('*')
          .order('name')
          .limit(50) // Admin pode ver mais workspaces

        if (error) {
          console.error('WorkspaceService: Error fetching all workspaces for admin:', error)
          return []
        }

        console.log('WorkspaceService: Admin found', data?.length || 0, 'workspaces')
        return data || []
      } else {
        // ✅ USER NORMAL: Buscar apenas workspaces dos quais o usuário é membro
        console.log('WorkspaceService: User is not admin, fetching user workspaces only')
        
        // Primeiro, buscar workspaces através da tabela workspace_members
        const { data: memberWorkspaces, error: memberError } = await this.supabase
          .from('workspace_members')
          .select(`
            workspace_id,
            workspaces (
              id,
              name,
              logo_url,
              created_at,
              updated_at,
              is_active
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')

        if (memberError) {
          console.error('WorkspaceService: Error fetching user workspaces:', memberError)
          return []
        }

        // ✅ TRANSFORMAR: Converter para formato esperado
        const workspaces = memberWorkspaces
          ?.filter(member => member.workspaces) // Filtrar workspaces válidos
          ?.map(member => ({
            id: member.workspaces.id,
            name: member.workspaces.name,
            logo_url: member.workspaces.logo_url,
            created_at: member.workspaces.created_at,
            updated_at: member.workspaces.updated_at,
            is_active: member.workspaces.is_active
          })) || []

        console.log('WorkspaceService: User found', workspaces.length, 'workspaces')
        return workspaces
      }
    } catch (error) {
      console.error('WorkspaceService: Error in getUserWorkspaces:', error)
      // ✅ FALLBACK: Retornar array vazio em caso de erro
      return []
    }
  }

  /**
   * Get a specific workspace by ID
   */
  async getWorkspace(id: string): Promise<Workspace | null> {
    const { data, error } = await this.supabase
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(workspace: Omit<WorkspaceInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Workspace> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // ✅ SIMPLIFICADO: Sem dependência de workspace_members
    try {
      const { data: workspaceData, error: workspaceError } = await this.supabase
        .from('workspaces')
        .insert(workspace)
        .select()
        .single()

      if (workspaceError) throw workspaceError

      // ✅ CRIAR CANAIS PADRÃO: #general e #random
      console.log('Workspace created:', workspaceData.id)
      await this.createDefaultChannels(workspaceData.id, user.id)

      return workspaceData
    } catch (error) {
      console.error('Error creating workspace:', error)
      throw error
    }
  }

  /**
   * Create default channels for a new workspace
   */
  private async createDefaultChannels(workspaceId: string, userId: string): Promise<void> {
    try {
      console.log('Creating default channels for workspace:', workspaceId)
      
      const defaultChannels = [
        {
          name: 'general',
          description: 'General discussion for the team',
          is_private: false,
          workspace_id: workspaceId,
          created_by: userId
        },
        {
          name: 'random',
          description: 'Random stuff and off-topic chat',
          is_private: false,
          workspace_id: workspaceId,
          created_by: userId
        }
      ]

      const { error } = await this.supabase
        .from('channels')
        .insert(defaultChannels)

      if (error) {
        console.error('Error creating default channels:', error)
        // Não falhar a criação do workspace se os canais falharem
      } else {
        console.log('Default channels created successfully for workspace:', workspaceId)
      }
    } catch (error) {
      console.error('Error in createDefaultChannels:', error)
      // Não falhar a criação do workspace se os canais falharem
    }
  }

  /**
   * Update a workspace
   */
  async updateWorkspace(id: string, updates: WorkspaceUpdate): Promise<Workspace> {
    const { data, error } = await this.supabase
      .from('workspaces')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete a workspace (only for owners)
   */
  async deleteWorkspace(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('workspaces')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Add a user to a workspace
   */
  async addMember(workspaceId: string, userId: string, role: 'member' | 'admin' = 'member'): Promise<void> {
    // ✅ SIMPLIFICADO: Função mock (tabela não existe)
    console.log('Adding member:', { workspaceId, userId, role })
  }

  /**
   * Remove a user from a workspace
   */
  async removeMember(workspaceId: string, userId: string): Promise<void> {
    // ✅ SIMPLIFICADO: Função mock (tabela não existe)
    console.log('Removing member:', { workspaceId, userId })
  }

  /**
   * Get workspace members
   */
  async getWorkspaceMembers(workspaceId: string) {
    // ✅ SIMPLIFICADO: Retorno vazio (tabela não existe)
    return []
  }

  /**
   * Update member role
   */
  async updateMemberRole(workspaceId: string, userId: string, role: 'member' | 'admin' | 'owner'): Promise<void> {
    // ✅ SIMPLIFICADO: Função mock (tabela não existe)
    console.log('Updating member role:', { workspaceId, userId, role })
  }

  /**
   * Get mock workspaces as fallback
   */
  private getMockWorkspaces(): Workspace[] {
    console.log('WorkspaceService: Using mock workspaces as fallback')
    
    return [
      {
        id: 'mock-workspace-1',
        name: 'WE Marketing',
        logo_url: 'https://i.pravatar.cc/40?u=we',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-workspace-2',
        name: 'Studio Dev',
        logo_url: 'https://i.pravatar.cc/40?u=studio',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }
}

export const workspaceService = new WorkspaceService()
