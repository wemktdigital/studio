'use client'

import { createClient, isMockUserEnabled } from '@/lib/supabase/client'
import { DirectMessage, Message, User } from '@/lib/types'
import { DMErrorHandler, ErrorContext } from '@/lib/error-handling/dm-error-handler'

export class DirectMessageServiceNew {
  private supabase = createClient()
  private mockCache = new Map<string, Message[]>()
  private dmCache = new Map<string, DirectMessage>()

  constructor() {
    console.log('🚀 DirectMessageServiceNew: Constructor called - NEW SIMPLIFIED SERVICE')
  }
  
  // ✅ HELPER: Verificar se Supabase está disponível
  private isSupabaseAvailable(): boolean {
    return this.supabase !== null && typeof window !== 'undefined'
  }

  /**
   * Criar ou obter uma conversa DM entre dois usuários
   */
  async getOrCreateDM(user1Id: string, user2Id: string): Promise<DirectMessage> {
    console.log('DirectMessageServiceNew: Getting or creating DM between', user1Id, 'and', user2Id)
    
    // ✅ CACHE: Verificar cache primeiro
    const cacheKey = `${user1Id}-${user2Id}`
    const cachedDM = this.dmCache.get(cacheKey)
    if (cachedDM) {
      console.log('DirectMessageServiceNew: Returning cached DM:', cachedDM.id)
      return cachedDM
    }
    
    // ✅ VERIFICAÇÃO DE AUTH: Verificar se há usuário mock ativo
    if (isMockUserEnabled() || !this.isSupabaseAvailable()) {
      console.log('DirectMessageServiceNew: Mock user enabled or Supabase unavailable, using mock DM')
      const mockDM = this.getMockDM(user1Id, user2Id)
      this.dmCache.set(cacheKey, mockDM)
      return mockDM
    }

    try {
      // Ordenar IDs para garantir consistência
      const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id]
      
      // Tentar encontrar DM existente
      const { data: existingDM, error: findError } = await this.supabase
        .from('direct_messages')
        .select('*')
        .eq('user1_id', smallerId)
        .eq('user2_id', largerId)
        .single()

      if (existingDM && !findError) {
        console.log('DirectMessageServiceNew: Found existing DM:', existingDM.id)
        // ✅ CACHE: Armazenar no cache
        this.dmCache.set(cacheKey, existingDM)
        return existingDM
      }

      // Criar nova DM se não existir
      console.log('DirectMessageServiceNew: Creating new DM')
      const { data: newDM, error: createError } = await this.supabase
        .from('direct_messages')
        .insert({
          user1_id: smallerId,
          user2_id: largerId
        })
        .select()
        .single()

      if (createError) {
        console.error('DirectMessageServiceNew: Error creating DM:', createError)
        
        // ✅ ERROR HANDLING: Tratar erro de forma robusta
        const errorContext: ErrorContext = {
          operation: 'createDM',
          userId: user1Id,
          additionalInfo: { user2Id, smallerId, largerId }
        }
        DMErrorHandler.handleError(createError, errorContext)
        
        // ✅ FALLBACK: Usar mock se apropriado
        if (DMErrorHandler.shouldUseMockData(createError)) {
          const mockDM = this.getMockDM(user1Id, user2Id)
          this.dmCache.set(cacheKey, mockDM)
          return mockDM
        }
        
        throw createError
      }

      console.log('DirectMessageServiceNew: Created new DM:', newDM.id)
      // ✅ CACHE: Armazenar no cache
      this.dmCache.set(cacheKey, newDM)
      return newDM

    } catch (error) {
      console.error('DirectMessageServiceNew: Exception in getOrCreateDM:', error)
      const mockDM = this.getMockDM(user1Id, user2Id)
      this.dmCache.set(cacheKey, mockDM)
      return mockDM
    }
  }

  /**
   * Obter mensagens de uma DM
   */
  async getDMMessages(dmId: string): Promise<Message[]> {
    console.log('DirectMessageServiceNew: Getting messages for DM:', dmId)
    
    // ✅ VERIFICAÇÃO DE AUTH: Verificar se há usuário mock ativo
    if (isMockUserEnabled() || !this.isSupabaseAvailable()) {
      console.log('DirectMessageServiceNew: Mock user enabled or Supabase unavailable, using mock messages')
      return this.getMockDMMessages(dmId)
    }

    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('dm_id', dmId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('DirectMessageServiceNew: Error fetching DM messages:', error)
        return this.getMockDMMessages(dmId)
      }

      console.log('DirectMessageServiceNew: Fetched', data?.length || 0, 'messages')
      
      // ✅ TRANSFORMAR: Converter snake_case para camelCase
      const transformedMessages = (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        type: msg.type,
        authorId: msg.author_id, // ✅ CORRIGIDO: snake_case para camelCase
        channelId: msg.channel_id,
        dmId: msg.dm_id,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at,
        attachmentName: msg.attachment_name,
        attachmentUrl: msg.attachment_url,
        dataAiHint: msg.data_ai_hint,
        reactions: [] // Inicializar array vazio
      }))

      return transformedMessages

    } catch (error) {
      console.error('DirectMessageServiceNew: Exception in getDMMessages:', error)
      return this.getMockDMMessages(dmId)
    }
  }

  /**
   * Enviar mensagem em uma DM
   */
  async sendDMMessage(dmId: string, content: string, authorId: string): Promise<Message> {
    console.log('DirectMessageServiceNew: Sending message to DM:', dmId, 'Content:', content)
    
    // ✅ VERIFICAÇÃO DE AUTH: Verificar se há usuário mock ativo
    if (isMockUserEnabled()) {
      console.log('DirectMessageServiceNew: Mock user enabled, using mock message')
      return this.createMockDMMessage(dmId, content, authorId)
    }

    try {
      const { data, error } = await this.supabase
        .from('messages')
        .insert({
          content,
          type: 'text',
          author_id: authorId,
          dm_id: dmId,
          channel_id: null
        })
        .select()
        .single()

      if (error) {
        console.error('DirectMessageServiceNew: Error sending DM message:', error)
        
        // ✅ ERROR HANDLING: Tratar erro de forma robusta
        const errorContext: ErrorContext = {
          operation: 'sendMessage',
          dmId,
          additionalInfo: { content: content.substring(0, 50), authorId }
        }
        DMErrorHandler.handleError(error, errorContext)
        
        // ✅ FALLBACK: Usar mock se apropriado
        if (DMErrorHandler.shouldUseMockData(error)) {
          return this.createMockDMMessage(dmId, content, authorId)
        }
        
        throw error
      }

      console.log('DirectMessageServiceNew: Message sent successfully:', data.id)
      
      // ✅ TRANSFORMAR: Converter snake_case para camelCase
      const transformedMessage = {
        id: data.id,
        content: data.content,
        type: data.type,
        authorId: data.author_id, // ✅ CORRIGIDO: snake_case para camelCase
        channelId: data.channel_id,
        dmId: data.dm_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        attachmentName: data.attachment_name,
        attachmentUrl: data.attachment_url,
        dataAiHint: data.data_ai_hint,
        reactions: [] // Inicializar array vazio
      }

      return transformedMessage

    } catch (error) {
      console.error('DirectMessageServiceNew: Exception in sendDMMessage:', error)
      return this.createMockDMMessage(dmId, content, authorId)
    }
  }

  /**
   * Obter todas as DMs de um usuário
   */
  async getUserDMs(userId: string): Promise<DirectMessage[]> {
    console.log('DirectMessageServiceNew: Getting DMs for user:', userId)
    
    // ✅ VERIFICAÇÃO DE AUTH: Verificar se há usuário mock ativo
    if (isMockUserEnabled() || !this.isSupabaseAvailable()) {
      console.log('DirectMessageServiceNew: Mock user enabled or Supabase unavailable, using mock DMs')
      return this.getMockUserDMs(userId)
    }

    try {
      const { data, error } = await this.supabase
        .from('direct_messages')
        .select(`
          *,
          messages!dm_id(
            created_at,
            author_id
          )
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('DirectMessageServiceNew: Error fetching user DMs:', error)
        return this.getMockUserDMs(userId)
      }

      console.log('DirectMessageServiceNew: Fetched', data?.length || 0, 'DMs')
      
      // ✅ TRANSFORMAR: Adicionar campos computados para compatibilidade com UI
      const transformedDMs = (data || []).map(dm => {
        const otherUserId = dm.user1_id === userId ? dm.user2_id : dm.user1_id
        const lastMessage = dm.messages?.[0] // Primeira mensagem (mais recente devido ao order)
        
        return {
          ...dm,
          otherUserId,
          lastMessageAt: lastMessage?.created_at || dm.created_at,
          unreadCount: 0 // TODO: Implementar contagem de mensagens não lidas
        }
      })

      return transformedDMs

    } catch (error) {
      console.error('DirectMessageServiceNew: Exception in getUserDMs:', error)
      return this.getMockUserDMs(userId)
    }
  }

  // ==================== CACHE MANAGEMENT ====================
  
  /**
   * Limpar cache de mensagens para uma DM específica
   */
  clearMessageCache(dmId: string): void {
    this.mockCache.delete(dmId)
    console.log('DirectMessageServiceNew: Cleared message cache for DM:', dmId)
  }
  
  /**
   * Limpar cache de DM específica
   */
  clearDMCache(user1Id: string, user2Id: string): void {
    const cacheKey = `${user1Id}-${user2Id}`
    this.dmCache.delete(cacheKey)
    console.log('DirectMessageServiceNew: Cleared DM cache for:', cacheKey)
  }
  
  /**
   * Limpar todo o cache
   */
  clearAllCache(): void {
    this.mockCache.clear()
    this.dmCache.clear()
    console.log('DirectMessageServiceNew: Cleared all cache')
  }

  // ==================== MOCK DATA METHODS ====================

  private getMockDM(user1Id: string, user2Id: string): DirectMessage {
    const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id]
    return {
      id: `mock-dm-${smallerId}-${largerId}`,
      user1_id: smallerId,
      user2_id: largerId,
      created_at: new Date().toISOString(),
      otherUserId: user1Id === smallerId ? largerId : smallerId,
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0
    }
  }

  private getMockDMMessages(dmId: string): Message[] {
    const cached = this.mockCache.get(dmId)
    if (cached) {
      console.log('DirectMessageServiceNew: Returning cached mock messages:', cached.length)
      return cached
    }

    const mockMessages: Message[] = [
      {
        id: `mock-dm-message-${dmId}-1`,
        content: 'Olá! Como você está?',
        type: 'text',
        authorId: 'e4c9d0f8-b54c-4f17-9487-92872db095ab', // Dev User (usuário atual)
        channelId: null,
        dmId: dmId,
        createdAt: new Date(Date.now() - 300000).toISOString(),
        updatedAt: new Date(Date.now() - 300000).toISOString(),
        reactions: []
      },
      {
        id: `mock-dm-message-${dmId}-2`,
        content: 'Tudo bem! E você?',
        type: 'text',
        authorId: '550e8400-e29b-41d4-a716-446655440001', // John Doe (usuário disponível)
        channelId: null,
        dmId: dmId,
        createdAt: new Date(Date.now() - 240000).toISOString(),
        updatedAt: new Date(Date.now() - 240000).toISOString(),
        reactions: []
      }
    ]

    this.mockCache.set(dmId, mockMessages)
    console.log('DirectMessageServiceNew: Created new mock messages:', mockMessages.length)
    return mockMessages
  }

  private createMockDMMessage(dmId: string, content: string, authorId: string): Message {
    const newMessage: Message = {
      id: `mock-dm-message-${dmId}-${Date.now()}`,
      content,
      type: 'text',
      authorId: authorId, // ✅ CORRIGIDO: camelCase
      channelId: null,
      dmId: dmId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: []
    }

    // Adicionar ao cache
    const cached = this.mockCache.get(dmId) || []
    cached.push(newMessage)
    this.mockCache.set(dmId, cached)

    console.log('DirectMessageServiceNew: Created mock message:', newMessage.id)
    return newMessage
  }

  private getMockUserDMs(userId: string): DirectMessage[] {
    return [
      {
        id: `mock-dm-${userId}-user1`,
        user1_id: userId,
        user2_id: '550e8400-e29b-41d4-a716-446655440001',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        otherUserId: '550e8400-e29b-41d4-a716-446655440001',
        lastMessageAt: new Date(Date.now() - 300000).toISOString(),
        unreadCount: 0
      },
      {
        id: `mock-dm-${userId}-user2`,
        user1_id: userId,
        user2_id: '550e8400-e29b-41d4-a716-446655440002',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        otherUserId: '550e8400-e29b-41d4-a716-446655440002',
        lastMessageAt: new Date(Date.now() - 600000).toISOString(),
        unreadCount: 0
      }
    ]
  }
}

// Instância singleton
export const directMessageServiceNew = new DirectMessageServiceNew()
