'use client'

import { createClient } from '@/lib/supabase/client'
import { DirectMessage } from '@/lib/types'

export class DirectMessageService {
  private supabase = createClient()
  private connectionTestFailed = false
  
  constructor() {
    console.log('🚀 DirectMessageService: Constructor called - NEW INSTANCE CREATED')
    this.testSupabaseConnection()
    console.log('🚀 DirectMessageService: Using real Supabase connection for production')
  }

  /**
   * Test Supabase connection and permissions
   */
  private async testSupabaseConnection() {
    try {
      console.log('DirectMessageService: Testing Supabase connection...')
      
      // Test basic connection
      const { data, error } = await this.supabase
        .from('direct_messages')
        .select('id')
        .limit(1)
      
      if (error) {
        console.error('DirectMessageService: Connection test failed:', error)
        this.connectionTestFailed = true
        return
      }
      
      console.log('DirectMessageService: Supabase connection test successful')
      this.connectionTestFailed = false
    } catch (error) {
      console.error('DirectMessageService: Connection test error:', error)
      this.connectionTestFailed = true
    }
  }

  /**
   * Get all direct messages for a user in a workspace
   */
  async getUserDirectMessages(userId: string, workspaceId: string): Promise<DirectMessage[]> {
    console.log('DirectMessageService.getUserDirectMessages: Called with:', { userId, workspaceId })
    
    if (this.connectionTestFailed) {
      console.log('DirectMessageService.getUserDirectMessages: Using mock data due to connection failure')
      return this.getMockDirectMessages(userId, workspaceId)
    }
    
    try {
      console.log('DirectMessageService.getUserDirectMessages: Fetching from Supabase...')
      console.log('DirectMessageService.getUserDirectMessages: userId:', userId)
      console.log('DirectMessageService.getUserDirectMessages: workspaceId:', workspaceId)
      
      const { data, error } = await this.supabase
        .from('direct_messages')
        .select(`
          id,
          user1_id,
          user2_id,
          created_at
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false })
      
      console.log('DirectMessageService.getUserDirectMessages: Raw response:', { data, error })
      
      if (error) {
        console.error('DirectMessageService.getUserDirectMessages: Error details:', error)
        console.error('DirectMessageService.getUserDirectMessages: Error message:', error.message)
        console.error('DirectMessageService.getUserDirectMessages: Error code:', error.code)
        console.error('DirectMessageService.getUserDirectMessages: Error details:', error.details)
        return this.getMockDirectMessages(userId, workspaceId)
      }
      
      console.log('DirectMessageService.getUserDirectMessages: Data received:', data)
      console.log('DirectMessageService.getUserDirectMessages: Data length:', data?.length)
      
      const directMessages: DirectMessage[] = (data || []).map(dm => ({
        id: dm.id,
        userId: dm.user1_id === userId ? dm.user2_id : dm.user1_id,
        lastMessageAt: dm.created_at,
        unreadCount: 0 // TODO: Calculate actual unread count
      }))
      
      console.log('DirectMessageService.getUserDirectMessages: Successfully fetched:', directMessages)
      return directMessages
      
    } catch (error) {
      console.error('DirectMessageService.getUserDirectMessages: Caught error:', error)
      return this.getMockDirectMessages(userId, workspaceId)
    }
  }

  /**
   * Create a new direct message conversation
   */
  async createDirectMessage(user1Id: string, user2Id: string): Promise<DirectMessage> {
    console.log('DirectMessageService.createDirectMessage: Called with:', { user1Id, user2Id })
    
    if (this.connectionTestFailed) {
      console.log('DirectMessageService.createDirectMessage: Using mock data due to connection failure')
      return this.getMockDirectMessage(user1Id, user2Id)
    }
    
    try {
      console.log('DirectMessageService.createDirectMessage: Creating in Supabase...')
      console.log('DirectMessageService.createDirectMessage: user1Id:', user1Id)
      console.log('DirectMessageService.createDirectMessage: user2Id:', user2Id)
      
      // Ensure user1_id is always the smaller ID to avoid duplicates
      const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id]
      console.log('DirectMessageService.createDirectMessage: smallerId:', smallerId)
      console.log('DirectMessageService.createDirectMessage: largerId:', largerId)
      
      const { data, error } = await this.supabase
        .from('direct_messages')
        .insert({
          user1_id: smallerId,
          user2_id: largerId
        })
        .select()
        .single()
      
      console.log('DirectMessageService.createDirectMessage: Raw response:', { data, error })
      
      if (error) {
        console.error('DirectMessageService.createDirectMessage: Error details:', error)
        console.error('DirectMessageService.createDirectMessage: Error message:', error.message)
        console.error('DirectMessageService.createDirectMessage: Error code:', error.code)
        console.error('DirectMessageService.createDirectMessage: Error details:', error.details)
        return this.getMockDirectMessage(user1Id, user2Id)
      }
      
      const directMessage: DirectMessage = {
        id: data.id,
        userId: user1Id === smallerId ? largerId : smallerId,
        lastMessageAt: data.created_at,
        unreadCount: 0
      }
      
      console.log('DirectMessageService.createDirectMessage: Successfully created:', directMessage)
      return directMessage
      
    } catch (error) {
      console.error('DirectMessageService.createDirectMessage: Caught error:', error)
      return this.getMockDirectMessage(user1Id, user2Id)
    }
  }

  /**
   * Get messages for a direct message conversation
   */
  async getDirectMessageMessages(dmId: string): Promise<any[]> {
    console.log('🚀 DirectMessageService.getDirectMessageMessages: Called with dmId:', dmId)
    
    if (this.connectionTestFailed) {
      console.log('🚀 DirectMessageService.getDirectMessageMessages: Connection failed, returning empty array')
      return []
    }
    
    try {
      console.log('🚀 DirectMessageService.getDirectMessageMessages: Fetching from Supabase...')
      
      const { data, error } = await this.supabase
        .from('messages')
        .select(`
          *,
          author:users!messages_author_id_fkey(
            id,
            display_name,
            username,
            handle,
            avatar_url,
            status
          )
        `)
        .eq('dm_id', dmId)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('DirectMessageService.getDirectMessageMessages: Error:', error)
        console.log('DirectMessageService.getDirectMessageMessages: Returning empty array due to error')
        return []
      }
      
      console.log('DirectMessageService.getDirectMessageMessages: Successfully fetched:', data)
      return data || []
      
    } catch (error) {
      console.error('DirectMessageService.getDirectMessageMessages: Caught error:', error)
      console.log('DirectMessageService.getDirectMessageMessages: Returning empty array due to caught error')
      return []
    }
  }

  /**
   * Send a message to a direct message conversation
   */
  async sendDirectMessage(dmId: string, content: string, authorId: string): Promise<any> {
    console.log('DirectMessageService.sendDirectMessage: Called with:', { dmId, content, authorId })
    
    if (this.connectionTestFailed) {
      console.log('DirectMessageService.sendDirectMessage: Using mock data due to connection failure')
      return this.getMockDMMessage(dmId, content, authorId)
    }
    
    try {
      console.log('DirectMessageService.sendDirectMessage: Sending to Supabase...')
      
      const { data, error } = await this.supabase
        .from('messages')
        .insert({
          content,
          type: 'text',
          author_id: authorId,
          dm_id: dmId,
          channel_id: null
        })
        .select(`
          *,
          author:users!messages_author_id_fkey(
            id,
            display_name,
            username,
            avatar_url
          )
        `)
        .single()
      
      if (error) {
        console.error('DirectMessageService.sendDirectMessage: Error:', error)
        return this.getMockDMMessage(dmId, content, authorId)
      }
      
      console.log('DirectMessageService.sendDirectMessage: Successfully sent:', data)
      return data
      
    } catch (error) {
      console.error('DirectMessageService.sendDirectMessage: Caught error:', error)
      return this.getMockDMMessage(dmId, content, authorId)
    }
  }

  /**
   * Get mock direct messages for fallback
   */
  private getMockDirectMessages(userId: string, workspaceId: string): DirectMessage[] {
    console.log('DirectMessageService.getMockDirectMessages: Creating mock DMs for user:', userId)
    
    // ✅ CORRIGIDO: Retornar array vazio para workspaces novos
    // Não mostrar conversas mock em workspaces limpos
    console.log('DirectMessageService.getMockDirectMessages: Returning empty array for clean workspace')
    return []
  }

  /**
   * Get mock direct message for fallback
   */
  private getMockDirectMessage(user1Id: string, user2Id: string): DirectMessage {
    console.log('DirectMessageService.getMockDirectMessage: Creating mock DM for:', { user1Id, user2Id })
    
    const mockDM: DirectMessage = {
      id: `mock-dm-${user1Id}-${user2Id}-${Date.now()}`,
      userId: user2Id,
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0
    }
    
    console.log('DirectMessageService.getMockDirectMessage: Created mock DM:', mockDM)
    return mockDM
  }


  /**
   * Get mock DM message for fallback
   */
  private getMockDMMessage(dmId: string, content: string, authorId: string): any {
    console.log('DirectMessageService.getMockDMMessage: Creating mock message:', { dmId, content, authorId })
    
    const mockMessage = {
      id: `mock-dm-message-${dmId}-${Date.now()}`,
      content,
      type: 'text',
      author_id: authorId,
      dm_id: dmId,
      channel_id: null,
      attachment_name: null,
      attachment_url: null,
      data_ai_hint: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        id: authorId,
        display_name: 'Edson',
        handle: 'edson',
        avatar_url: 'https://i.pravatar.cc/40?u=edson'
      }
    }
    
    console.log('DirectMessageService.getMockDMMessage: Created mock message:', mockMessage)
    return mockMessage
  }

  /**
   * Calculate unread count for a direct message conversation
   */
  private async calculateUnreadCount(dmId: string, userId: string): Promise<number> {
    console.log('DirectMessageService.calculateUnreadCount: Called with:', { dmId, userId })
    
    // Always return 0 for mock data (no unread messages)
    console.log('DirectMessageService.calculateUnreadCount: Using mock data - returning 0 unread count')
    return 0
  }

  /**
   * Mark messages as read for a direct message conversation
   */
  async markDirectMessageAsRead(dmId: string, userId: string): Promise<void> {
    try {
      console.log('DirectMessageService.markDirectMessageAsRead: Marking as read for dmId:', dmId, 'userId:', userId)
      
      const storageKey = `lastRead_${userId}_dm-${dmId}`
      const currentTime = new Date().toISOString()
      
      localStorage.setItem(storageKey, currentTime)
      
      console.log('DirectMessageService.markDirectMessageAsRead: Marked as read at:', currentTime)
    } catch (err) {
      console.error('DirectMessageService.markDirectMessageAsRead: Error marking as read:', err)
    }
  }
}

export const directMessageService = new DirectMessageService()
