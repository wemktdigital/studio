import { createClient } from '@/lib/supabase/client'
import { sendBulkInviteEmails } from './email-service'
import { toast } from '@/hooks/use-toast'

export interface InviteData {
  email: string
  workspaceId: string
  workspaceName: string
  inviterId: string
  inviterName: string
  role?: 'owner' | 'admin' | 'member'
  message?: string
}

export interface InviteResult {
  success: boolean
  data?: {
    invites: any[]
    emailStats: {
      totalSent: number
      totalFailed: number
      successful: string[]
      failed: { email: string; error: string }[]
    }
  }
  error?: string
}

export interface InviteStatus {
  id: string
  email: string
  workspaceId: string
  workspaceName: string
  inviterName: string
  role: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  message?: string
  expiresAt: string
  createdAt: string
  acceptedAt?: string
}

class InviteService {
  private supabase = createClient()

  constructor() {
    if (!this.supabase) {
      console.error('InviteService: Supabase client not initialized.')
    }
  }

  /**
   * Create workspace invites with unique tokens
   */
  async createInvites(inviteData: InviteData[]): Promise<InviteResult> {
    if (!this.supabase) {
      throw new Error('Supabase client is not available.')
    }

    try {
      console.log('🎯 InviteService: Creating invites for', inviteData.length, 'recipients')

      // Prepare invite records
      const inviteRecords = inviteData.map(data => ({
        email: data.email.toLowerCase().trim(),
        workspace_id: data.workspaceId,
        inviter_id: data.inviterId,
        role: data.role || 'member',
        message: data.message || null,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      }))

      // Insert invites into database
      const { data: invites, error: insertError } = await this.supabase
        .from('workspace_invites')
        .insert(inviteRecords)
        .select('*')

      if (insertError) {
        console.error('❌ Error creating invites:', insertError)
        throw new Error(`Failed to create invites: ${insertError.message}`)
      }

      console.log('✅ InviteService: Created', invites.length, 'invite records')

      // Generate invite links with tokens
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://talk.we.marketing:9002'
      const inviteLinks = invites.map(invite => ({
        ...invite,
        inviteLink: `${baseUrl}/invite/${invite.token}`
      }))

      // Send emails
      const emailResults = await sendBulkInviteEmails(
        inviteLinks.map(invite => invite.email),
        inviteData[0].workspaceName,
        inviteData[0].inviterName,
        `${baseUrl}/invite`,
        inviteData[0].message,
        inviteLinks.map(invite => invite.token)
      )

      console.log('📧 InviteService: Email results:', {
        totalSent: emailResults.totalSent,
        totalFailed: emailResults.totalFailed
      })

      return {
        success: true,
        data: {
          invites: inviteLinks,
          emailStats: emailResults
        }
      }

    } catch (error: any) {
      console.error('❌ InviteService error:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      }
    }
  }

  /**
   * Get invite by token
   */
  async getInviteByToken(token: string): Promise<{
    success: boolean
    data?: InviteStatus
    error?: string
  }> {
    if (!this.supabase) {
      throw new Error('Supabase client is not available.')
    }

    try {
      const { data: invite, error } = await this.supabase
        .from('workspace_invites')
        .select(`
          id,
          email,
          workspace_id,
          inviter_id,
          token,
          status,
          role,
          message,
          expires_at,
          created_at,
          accepted_at,
          workspaces!inner(name),
          users!workspace_invites_inviter_id_fkey(display_name)
        `)
        .eq('token', token)
        .single()

      if (error) {
        console.error('❌ Error fetching invite:', error)
        return {
          success: false,
          error: error.message
        }
      }

      if (!invite) {
        return {
          success: false,
          error: 'Invite not found'
        }
      }

      // Check if invite is expired
      const now = new Date()
      const expiresAt = new Date(invite.expires_at)
      
      if (invite.status === 'pending' && now > expiresAt) {
        // Auto-expire the invite
        await this.expireInvite(invite.id)
        return {
          success: false,
          error: 'Invite has expired'
        }
      }

      const inviteData: InviteStatus = {
        id: invite.id,
        email: invite.email,
        workspaceId: invite.workspace_id,
        workspaceName: invite.workspaces.name,
        inviterName: invite.users?.display_name || 'Unknown',
        role: invite.role,
        status: invite.status,
        message: invite.message,
        expiresAt: invite.expires_at,
        createdAt: invite.created_at,
        acceptedAt: invite.accepted_at
      }

      return {
        success: true,
        data: inviteData
      }

    } catch (error: any) {
      console.error('❌ Error in getInviteByToken:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      }
    }
  }

  /**
   * Accept an invite (create user account and add to workspace)
   */
  async acceptInvite(
    token: string, 
    userData: {
      email: string
      password: string
      displayName?: string
      handle?: string
    }
  ): Promise<{
    success: boolean
    data?: {
      workspaceId: string
      workspaceName: string
      role: string
    }
    error?: string
  }> {
    if (!this.supabase) {
      throw new Error('Supabase client is not available.')
    }

    try {
      console.log('🎯 InviteService: Accepting invite for token:', token)

      // Get invite details
      const inviteResult = await this.getInviteByToken(token)
      
      if (!inviteResult.success || !inviteResult.data) {
        return {
          success: false,
          error: inviteResult.error || 'Invite not found'
        }
      }

      const invite = inviteResult.data

      // Check if invite is still valid
      if (invite.status !== 'pending') {
        return {
          success: false,
          error: 'Invite is no longer valid'
        }
      }

      // Check if user already exists
      const { data: existingUser } = await this.supabase.auth.admin.getUserByEmail(userData.email)
      
      let userId: string

      if (existingUser.user) {
        // User exists, just add to workspace
        userId = existingUser.user.id
        console.log('👤 User exists, adding to workspace')
      } else {
        // Create new user account
        const { data: newUser, error: signUpError } = await this.supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              display_name: userData.displayName || userData.email.split('@')[0],
              handle: userData.handle || `user_${Date.now()}`,
              avatar_url: null
            }
          }
        })

        if (signUpError || !newUser.user) {
          console.error('❌ Error creating user:', signUpError)
          return {
            success: false,
            error: signUpError?.message || 'Failed to create user account'
          }
        }

        userId = newUser.user.id
        console.log('✅ Created new user account:', userId)
      }

      // Use the database function to accept invite and add user to workspace
      const { data: acceptResult, error: acceptError } = await this.supabase
        .rpc('accept_workspace_invite', {
          invite_token: token,
          user_id: userId
        })

      if (acceptError) {
        console.error('❌ Error accepting invite:', acceptError)
        return {
          success: false,
          error: acceptError.message
        }
      }

      if (!acceptResult?.success) {
        return {
          success: false,
          error: acceptResult?.error || 'Failed to accept invite'
        }
      }

      console.log('✅ Successfully accepted invite and added user to workspace')

      return {
        success: true,
        data: {
          workspaceId: invite.workspaceId,
          workspaceName: invite.workspaceName,
          role: invite.role
        }
      }

    } catch (error: any) {
      console.error('❌ Error in acceptInvite:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      }
    }
  }

  /**
   * Get invites for a workspace
   */
  async getWorkspaceInvites(workspaceId: string): Promise<{
    success: boolean
    data?: InviteStatus[]
    error?: string
  }> {
    if (!this.supabase) {
      throw new Error('Supabase client is not available.')
    }

    try {
      const { data: invites, error } = await this.supabase
        .from('workspace_invites')
        .select(`
          id,
          email,
          workspace_id,
          token,
          status,
          role,
          message,
          expires_at,
          created_at,
          accepted_at,
          users!workspace_invites_inviter_id_fkey(display_name)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching workspace invites:', error)
        return {
          success: false,
          error: error.message
        }
      }

      const inviteData: InviteStatus[] = invites.map(invite => ({
        id: invite.id,
        email: invite.email,
        workspaceId: invite.workspace_id,
        workspaceName: '', // Will be filled by workspace context
        inviterName: invite.users?.display_name || 'Unknown',
        role: invite.role,
        status: invite.status,
        message: invite.message,
        expiresAt: invite.expires_at,
        createdAt: invite.created_at,
        acceptedAt: invite.accepted_at
      }))

      return {
        success: true,
        data: inviteData
      }

    } catch (error: any) {
      console.error('❌ Error in getWorkspaceInvites:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      }
    }
  }

  /**
   * Cancel an invite
   */
  async cancelInvite(inviteId: string): Promise<{
    success: boolean
    error?: string
  }> {
    if (!this.supabase) {
      throw new Error('Supabase client is not available.')
    }

    try {
      const { error } = await this.supabase
        .from('workspace_invites')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', inviteId)

      if (error) {
        console.error('❌ Error cancelling invite:', error)
        return {
          success: false,
          error: error.message
        }
      }

      return { success: true }

    } catch (error: any) {
      console.error('❌ Error in cancelInvite:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      }
    }
  }

  /**
   * Expire an invite
   */
  async expireInvite(inviteId: string): Promise<{
    success: boolean
    error?: string
  }> {
    if (!this.supabase) {
      throw new Error('Supabase client is not available.')
    }

    try {
      const { error } = await this.supabase
        .from('workspace_invites')
        .update({ 
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', inviteId)

      if (error) {
        console.error('❌ Error expiring invite:', error)
        return {
          success: false,
          error: error.message
        }
      }

      return { success: true }

    } catch (error: any) {
      console.error('❌ Error in expireInvite:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      }
    }
  }

  /**
   * Clean up expired invites
   */
  async cleanupExpiredInvites(): Promise<{
    success: boolean
    data?: { updatedCount: number }
    error?: string
  }> {
    if (!this.supabase) {
      throw new Error('Supabase client is not available.')
    }

    try {
      const { data, error } = await this.supabase
        .rpc('cleanup_expired_invites')

      if (error) {
        console.error('❌ Error cleaning up expired invites:', error)
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: { updatedCount: data || 0 }
      }

    } catch (error: any) {
      console.error('❌ Error in cleanupExpiredInvites:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      }
    }
  }
}

// Singleton instance
let inviteServiceInstance: InviteService | null = null

export function getInviteService(): InviteService {
  if (!inviteServiceInstance) {
    inviteServiceInstance = new InviteService()
  }
  return inviteServiceInstance
}

// Export types
export type { InviteData, InviteResult, InviteStatus }
