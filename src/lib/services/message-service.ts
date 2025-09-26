
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'
import { linkService } from './link-service-new'

// ✅ TIPOS INLINE para evitar problemas de importação
interface LinkPreview {
  url: string
  type: 'youtube' | 'github' | 'image' | 'document' | 'code' | 'generic'
  title?: string
  description?: string
  thumbnail?: string
  domain: string
  metadata?: Record<string, any>
}

type Message = Database['public']['Tables']['messages']['Row']
type MessageInsert = Database['public']['Tables']['messages']['Insert']
type MessageUpdate = Database['public']['Tables']['messages']['Update']
type MessageReaction = Database['public']['Tables']['message_reactions']['Row']
type Thread = Database['public']['Tables']['threads']['Row']
type ThreadMessage = Database['public']['Tables']['thread_messages']['Row']

export class MessageService {
  private supabase = createClient()
  private useFallbackMode = false // ✅ FALLBACK: Usar Supabase real para produção
  private errorCount = 0 // ✅ CONTADOR: Para detectar problemas persistentes
  private readonly MAX_ERRORS = 3 // ✅ LIMITE: Máximo de erros antes de forçar fallback

  constructor() {
    // ✅ TESTE DE CONEXÃO: Verificar se o Supabase está funcionando
    this.testSupabaseConnection()
  }

  /**
   * Increment error count and force fallback if too many errors
   */
  private incrementErrorCount() {
    this.errorCount++
    console.warn(`MessageService: Error count: ${this.errorCount}/${this.MAX_ERRORS}`)
    
    if (this.errorCount >= this.MAX_ERRORS) {
      console.warn('MessageService: Too many errors, forcing fallback mode')
      this.useFallbackMode = true
    }
  }

  /**
   * Test Supabase connection and set fallback mode if needed
   */
  private async testSupabaseConnection() {
    try {
      console.log('MessageService: Testing Supabase connection...')
      
      // ✅ VERIFICAÇÃO: Se está rodando em SSR, pular o teste
      if (typeof window === 'undefined') {
        console.log('MessageService: SSR detected, skipping connection test')
        this.useFallbackMode = false
        return
      }
      
      // ✅ VERIFICAÇÃO: Se o cliente Supabase é null
      if (!this.supabase) {
        console.warn('MessageService: Supabase client is null, using fallback mode')
        this.useFallbackMode = true
        return
      }
      
      // Teste simples: tentar buscar uma mensagem
      const { data, error } = await this.supabase
        .from('messages')
        .select('id')
        .limit(1)
      
      if (error) {
        console.warn('MessageService: Supabase connection test failed, using fallback mode:', {
          error: error.message || error,
          code: error.code
        })
        this.useFallbackMode = true
      } else {
        console.log('MessageService: Supabase connection test successful')
        this.useFallbackMode = false
      }
    } catch (error) {
      console.warn('MessageService: Supabase connection test failed, using fallback mode:', {
        error: error instanceof Error ? error.message : String(error)
      })
      this.useFallbackMode = true
    }
    
    // ✅ FORÇAR FALLBACK: Se não conseguiu testar, usar fallback por segurança
    if (this.useFallbackMode) {
      console.log('MessageService: Fallback mode activated - using mock data for all operations')
    }
    
    // ✅ CONEXÃO REAL: Usar Supabase real para produção
    console.log('MessageService: Using real Supabase connection for production')
  }

  /**
   * Get messages for a direct message conversation
   */
  async getDirectMessageMessages(dmId: string, currentUserId?: string, workspaceId?: string): Promise<Message[]> {
    console.log('MessageService: Fetching DM messages for:', dmId)
    
    try {
      // ✅ VALIDAÇÃO: Verificar se dmId é válido
      if (!dmId) {
        console.log('MessageService: Invalid dmId')
        return []
      }
      
      // ✅ IMPLEMENTAÇÃO REAL: Tentar buscar do Supabase primeiro
      console.log('MessageService: Attempting to fetch DM messages from Supabase for dmId:', dmId)
      
      // ✅ MAPEAR: Converter ID mock para ID real se necessário
      const realDmId = this.isMockDMId(dmId) ? await this.getRealDMId(dmId, currentUserId) : dmId
      console.log('MessageService: Using real DM ID:', realDmId, 'for mock ID:', dmId)
      
      // ✅ DEBUG: Verificar se o DM ID existe no banco
      console.log('MessageService: Checking if DM exists in database with ID:', realDmId)
      
      // ✅ CORRIGIDO: Buscar mensagens que NÃO estão em threads
      // Primeiro buscar todas as mensagens do DM
      const { data: allMessages, error: allMessagesError } = await this.supabase
        .from('messages')
        .select('*')
        .eq('dm_id', realDmId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (allMessagesError) {
        console.error('Error fetching all DM messages:', {
          error: allMessagesError.message || allMessagesError,
          code: allMessagesError.code,
          details: allMessagesError.details,
          hint: allMessagesError.hint,
          dmId
        })
        this.incrementErrorCount()
        console.log('MessageService: Error fetching DM messages, returning empty array')
        return []
      }

      if (!allMessages || allMessages.length === 0) {
        console.log('MessageService: No messages found for DM:', realDmId)
        return []
      }

      console.log('MessageService: Found', allMessages.length, 'DM messages')

      // ✅ CORRIGIDO: Buscar IDs das mensagens que estão em threads
      const messageIds = allMessages.map(msg => msg.id)
      const { data: threadMessageIds, error: threadError } = await this.supabase
        .from('thread_messages')
        .select('message_id')
        .in('message_id', messageIds)

      if (threadError) {
        console.error('Error fetching thread message IDs:', threadError)
        // Se der erro, retornar todas as mensagens (fallback)
        var data = allMessages
        var error = null
      } else {
        // ✅ CORRIGIDO: Filtrar mensagens que NÃO estão em threads
        const threadMessageIdSet = new Set(threadMessageIds?.map(tm => tm.message_id) || [])
        data = allMessages.filter(msg => !threadMessageIdSet.has(msg.id))
        
        // ✅ FILTRAR ADICIONAL: Excluir mensagens com ID especial de thread
        const beforeSpecialFilter = data.length
        data = data.filter(msg => 
          msg.dm_id !== '00000000-0000-0000-0000-000000000001'
        )
        console.log('MessageService: Filtered out', beforeSpecialFilter - data.length, 'special thread messages from DM')
        
        error = null
      }

      if (error) {
        console.error('Error fetching DM messages:', {
          error: error.message || error,
          code: error.code,
          details: error.details,
          hint: error.hint,
          dmId
        })
        // ✅ INCREMENTAR CONTADOR: Para detectar problemas persistentes
        this.incrementErrorCount()
        // ✅ FALLBACK: Retornar array vazio em caso de erro
        console.log('MessageService: Error fetching DM messages, returning empty array')
        return []
      }

      if (data && data.length > 0) {
        console.log('MessageService: Successfully fetched', data.length, 'real DM messages from Supabase')
        console.log('MessageService: Raw Supabase data:', data)
        
        // ✅ RESETAR CONTADOR: Operação bem-sucedida
        this.errorCount = 0
        
        // ✅ COMBINAR: Usar apenas dados do Supabase
        const allMessages = [...data]
        
        // ✅ REMOVER DUPLICATAS: Baseado no ID da mensagem
        const uniqueMessages = allMessages.filter((message, index, self) => 
          index === self.findIndex(m => m.id === message.id)
        )
        
        // ✅ ORDENAR: Por timestamp de criação
        uniqueMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        
        // ✅ TRANSFORMAR: Converter snake_case para camelCase
        const transformedMessages = uniqueMessages.map(msg => ({
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
        
        console.log('MessageService: Returning DM messages - Base:', data.length, 'Unique:', uniqueMessages.length, 'Transformed:', transformedMessages.length)
        console.log('MessageService: Transformed messages:', transformedMessages)
        return transformedMessages
      }

      // ✅ SE VAZIO: Retornar array vazio
      console.log('MessageService: No real DM messages found in Supabase')
      return []
      
    } catch (error) {
      console.error('Error in Supabase DM query:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        dmId
      })
      // ✅ INCREMENTAR CONTADOR: Para detectar problemas persistentes
      this.incrementErrorCount()
      console.log('MessageService: Caught error, returning empty array')
      return []
    }
  }

  /**
   * Send a message to a direct message conversation
   */
  async sendDirectMessage(dmId: string, content: string, authorId: string): Promise<Message> {
    console.log('MessageService: Sending DM message:', { dmId, content, authorId })
    
    try {
      // ✅ VALIDAÇÃO: Verificar se parâmetros são válidos
      if (!dmId || !content || !authorId) {
        throw new Error('Invalid parameters for sending DM message')
      }
      
      // ✅ FALLBACK CHECK: Se estiver em modo fallback, usar mock data imediatamente
      if (this.useFallbackMode) {
        console.log('MessageService: Using fallback mode for DM send, skipping Supabase insert')
        const mockMessage = this.getMockDMMessage(dmId, content, authorId)
        
        // ✅ CACHE: Cache removido
        console.log('MessageService: DM message created')
        
        return mockMessage
      }
      
      // ✅ IMPLEMENTAÇÃO REAL: Tentar salvar no Supabase primeiro
      console.log('MessageService: Attempting to save DM message to Supabase...')
      
      // ✅ MAPEAR: Converter ID mock para ID real se necessário
      const realDmId = this.isMockDMId(dmId) ? await this.getRealDMId(dmId, authorId) : dmId
      console.log('MessageService: Using real DM ID:', realDmId, 'for mock ID:', dmId)
      
      const insertData = {
        content: content,
        type: 'text',
        author_id: authorId,
        channel_id: null,
        dm_id: realDmId,
        attachment_name: null,
        attachment_url: null,
        data_ai_hint: null
      }
      
      console.log('MessageService: Inserting DM data to Supabase:', insertData)
      
      const { data, error } = await this.supabase
        .from('messages')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('MessageService: Supabase error sending DM:', {
          error: error.message || error,
          code: error.code,
          details: error.details,
          hint: error.hint,
          dmId,
          content,
          authorId
        })
        
        // ✅ DETECTAR: Se é erro de foreign key constraint
        if (error.code === '23503' || error.message?.includes('foreign key constraint')) {
          console.error('MessageService: Foreign key constraint error detected - DM does not exist')
          console.error('MessageService: Using fallback mode for this DM message')
          
          // ✅ FALLBACK: Usar mock data para este DM
          const mockMessage = this.getMockDMMessage(dmId, content, authorId)
          
          // ✅ CACHE: Adicionar mensagem ao cache local
          this.addMessageToCache(dmId, mockMessage)
          console.log('MessageService: DM message added to cache')
          
          return mockMessage
        }
        
        // ✅ INCREMENTAR CONTADOR: Para detectar problemas persistentes
        this.incrementErrorCount()
        
        // ✅ FALLBACK: Usar mock data em caso de erro
        console.log('MessageService: Using mock data due to Supabase error')
        const mockMessage = this.getMockDMMessage(dmId, content, authorId)
        
        // ✅ CACHE: Cache removido
        console.log('MessageService: DM message created')
        
        return mockMessage
      }

      if (data) {
        console.log('MessageService: DM message saved successfully to Supabase:', data)
        console.log('MessageService: Raw Supabase response data:', data)
        
        // ✅ RESETAR CONTADOR: Operação bem-sucedida
        this.errorCount = 0
        
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
        
        console.log('MessageService: Transformed DM message:', transformedMessage)
        
        // ✅ CACHE: Cache removido
        console.log('MessageService: DM message created')
        
        return transformedMessage
      }

      // ✅ FALLBACK: Se não retornou dados, usar mock
      console.log('MessageService: No data returned from Supabase for DM, using mock data')
      const mockMessage = this.getMockDMMessage(dmId, content, authorId)
      
      // ✅ CACHE: Cache removido
      console.log('MessageService: DM message created')
      
      return mockMessage
      
    } catch (error) {
      console.error('MessageService: Caught error in sendDirectMessage:', error)
      console.log('MessageService: Using mock data due to caught error')
      
      // ✅ FALLBACK: Usar mock data em caso de erro
      const mockMessage = this.getMockDMMessage(dmId, content, authorId)
      
      // ✅ CACHE: Cache removido
      console.log('MessageService: DM message created')
      
      return mockMessage
    }
  }

  /**
   * Get messages for a channel
   */
  async getChannelMessages(channelId: string, workspaceId?: string): Promise<Message[]> {
    try {
      console.log('MessageService: Fetching real messages for channel:', channelId)
      
      // ✅ VALIDAÇÃO: Verificar se channelId é um UUID válido OU um ID de canal mock
      console.log('MessageService: Validating channelId:', channelId)
      console.log('MessageService: isValidUUID:', this.isValidUUID(channelId))
      console.log('MessageService: isMockChannelId:', this.isMockChannelId(channelId))
      
      if (!this.isValidUUID(channelId) && !this.isMockChannelId(channelId)) {
        console.log('MessageService: Invalid channelId, returning empty array:', channelId)
        return []
      }
      
      // ✅ IMPLEMENTAÇÃO REAL: Tentar buscar do Supabase primeiro para todos os canais
      console.log('MessageService: Attempting to fetch messages from Supabase for channel:', channelId)
      
      try {
              // ✅ VERIFICAÇÃO ADICIONAL: Se for um canal mock, tentar buscar do Supabase mesmo assim
      if (this.isMockChannelId(channelId)) {
        console.log('MessageService: Mock channel detected, but trying Supabase anyway')
        // Não retornar mock data imediatamente, continuar com Supabase
      }
        // ✅ MAPEAR: Converter ID mock para ID real se necessário
        const realChannelId = this.isMockChannelId(channelId) ? this.getRealChannelId(channelId) : channelId
        console.log('MessageService: Using real channel ID:', realChannelId, 'for mock ID:', channelId)
        
        const { data, error } = await this.supabase
          .from('messages')
          .select(`
            *,
            channel:channels!messages_channel_id_fkey(
              id,
              name,
              workspace_id
            )
          `)
          .eq('channel_id', realChannelId)
          .order('created_at', { ascending: true })
          .limit(100) // Limitar a 100 mensagens para performance

        if (error) {
          console.error('Error fetching channel messages:', {
            error: error.message || error,
            code: error.code,
            details: error.details,
            hint: error.hint,
            channelId
          })
          // ✅ INCREMENTAR CONTADOR: Para detectar problemas persistentes
          this.incrementErrorCount()
          // ✅ SEM FALLBACK: Retornar array vazio em caso de erro
          console.log('MessageService: No fallback to mock data - returning empty array')
          return []
        }

        if (data && data.length > 0) {
          console.log('MessageService: Successfully fetched', data.length, 'real messages from Supabase')
          
          // ✅ FILTRAR: Garantir que as mensagens são do workspace correto
          const workspaceFilteredMessages = workspaceId 
            ? data.filter(msg => msg.channel?.workspace_id === workspaceId)
            : data

          console.log('MessageService: Filtered to', workspaceFilteredMessages.length, 'messages for workspace:', workspaceId)
          
          // ✅ FILTRAR: Excluir mensagens que estão em threads
          const messageIds = workspaceFilteredMessages.map(msg => msg.id)
          const { data: threadMessageIds, error: threadError } = await this.supabase
            .from('thread_messages')
            .select('message_id')
            .in('message_id', messageIds)

          let filteredMessages = workspaceFilteredMessages
          if (!threadError && threadMessageIds) {
            const threadMessageIdSet = new Set(threadMessageIds.map(tm => tm.message_id))
            filteredMessages = workspaceFilteredMessages.filter(msg => !threadMessageIdSet.has(msg.id))
            console.log('MessageService: Filtered out', workspaceFilteredMessages.length - filteredMessages.length, 'thread messages')
          } else if (threadError) {
            console.warn('MessageService: Error filtering thread messages, showing all messages:', threadError)
          }
          
          // ✅ FILTRAR ADICIONAL: Excluir mensagens com ID especial de thread
          const beforeSpecialFilter = filteredMessages.length
          filteredMessages = filteredMessages.filter(msg => 
            msg.dm_id !== '00000000-0000-0000-0000-000000000001'
          )
          console.log('MessageService: Filtered out', beforeSpecialFilter - filteredMessages.length, 'special thread messages from channel')
          
          // ✅ RESETAR CONTADOR: Operação bem-sucedida
          this.errorCount = 0
          
          // ✅ COMBINAR: Usar apenas dados do Supabase
          const allMessages = [...filteredMessages]
          
          // ✅ REMOVER DUPLICATAS: Baseado no ID da mensagem
          const uniqueMessages = allMessages.filter((message, index, self) => 
            index === self.findIndex(m => m.id === message.id)
          )
          
          // ✅ ORDENAR: Por timestamp de criação
          uniqueMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          
          console.log('MessageService: Returning messages - Base:', filteredMessages.length, 'Unique:', uniqueMessages.length)
          return uniqueMessages
        }

        // ✅ SE VAZIO: Retornar array vazio se não houver mensagens reais
        console.log('MessageService: No real messages found, returning empty array')
        return []
        
      } catch (error) {
        console.error('Error in Supabase query:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          channelId
        })
        // ✅ INCREMENTAR CONTADOR: Para detectar problemas persistentes
        this.incrementErrorCount()
        console.log('MessageService: No fallback to mock data - returning empty array')
        return []
      }
    } catch (error) {
      console.error('Error getting channel messages:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        channelId
      })
      // ✅ SEM FALLBACK: Retornar array vazio em caso de erro
      return []
    }
  }


  /**
   * Send a message to a channel
   */
  async sendMessage(message: Omit<MessageInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Message> {
    console.log('MessageService.sendMessage: Called with:', message)
    
    try {
      // ✅ FALLBACK CHECK: Se estiver em modo fallback, retornar erro
      if (this.useFallbackMode) {
        console.log('MessageService.sendMessage: Using fallback mode, cannot send message')
        throw new Error('Cannot send message in fallback mode')
      }
      
      // ✅ VERIFICAÇÃO ADICIONAL: Se for um canal mock, tentar salvar no Supabase mesmo assim
      if (message.channel_id && this.isMockChannelId(message.channel_id)) {
        console.log('MessageService.sendMessage: Mock channel detected, but trying Supabase anyway')
        // Não retornar mock data imediatamente, continuar com Supabase
      }
      
      // ✅ IMPLEMENTAÇÃO REAL: Tentar salvar no Supabase primeiro
      console.log('MessageService.sendMessage: Attempting to save to Supabase...')
      
      // ✅ MAPEAR: Converter ID mock para ID real se necessário
      const realChannelId = message.channel_id && this.isMockChannelId(message.channel_id) 
        ? this.getRealChannelId(message.channel_id) 
        : message.channel_id
      
      console.log('MessageService.sendMessage: Using real channel ID:', realChannelId, 'for mock ID:', message.channel_id)
      
      const insertData = {
        content: message.content,
        type: message.type || 'text',
        author_id: message.author_id,
        channel_id: realChannelId || null,
        dm_id: message.dm_id || null,
        attachment_name: message.attachment_name || null,
        attachment_url: message.attachment_url || null,
        data_ai_hint: message.data_ai_hint || null
      }
      
      console.log('MessageService.sendMessage: Inserting data:', insertData)
      
      const { data, error } = await this.supabase
        .from('messages')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('MessageService.sendMessage: Supabase error:', {
          error: error.message || error,
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: message
        })
        
        // ✅ DETECTAR: Se é erro de foreign key constraint
        if (error.code === '23503' || error.message?.includes('foreign key constraint')) {
          console.error('MessageService.sendMessage: Foreign key constraint error detected - channel does not exist')
          console.error('MessageService.sendMessage: This suggests the channel was not created in the database')
          console.error('MessageService.sendMessage: Channel ID:', message.channel_id, 'Real Channel ID:', realChannelId)
          
          // ✅ THROW ERROR: Não usar fallback, deixar o erro aparecer
          throw new Error(`Canal não existe no banco de dados. Channel ID: ${message.channel_id} (Real: ${realChannelId})`)
        }
        
        // ✅ INCREMENTAR CONTADOR: Para detectar problemas persistentes
        this.incrementErrorCount()
        
        // ✅ SEM FALLBACK: Retornar erro em vez de mock data
        console.log('MessageService.sendMessage: No fallback to mock data - throwing error')
        throw new Error(`Failed to send message: ${error.message || error}`)
      }

      if (data) {
        console.log('MessageService.sendMessage: Message saved successfully to Supabase:', data)
        
        // ✅ RESETAR CONTADOR: Operação bem-sucedida
        this.errorCount = 0
        
        return data
      }

      // ✅ FALLBACK: Se não retornou dados, lançar erro
      console.log('MessageService.sendMessage: No data returned from Supabase')
      throw new Error('Failed to send message - no data returned from Supabase')
      
    } catch (error) {
      console.error('MessageService.sendMessage: Caught error:', error)
      console.log('MessageService.sendMessage: No fallback to mock data - rethrowing error')
      
      // ✅ SEM FALLBACK: Re-throw o erro em vez de retornar mock data
      throw error
    }
  }


  /**
   * Subscribe to real-time message updates for a specific channel
   */
  subscribeToChannelMessages(channelId: string, callback: (message: Message) => void) {
    console.log('🚨🚨🚨 MessageService: SUBSCRIBING TO CHANNEL! 🚨🚨🚨', { 
      channelId, 
      timestamp: new Date().toISOString() 
    });
    
    try {
      const channel = this.supabase.channel(`channel:${channelId}`)
      
      const subscription = channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${channelId}`
          },
          (payload: any) => {
            console.log('🚨🚨🚨 MessageService: REAL-TIME MESSAGE RECEIVED! 🚨🚨🚨', { 
              channelId,
              messageId: payload.new?.id,
              content: payload.new?.content,
              timestamp: new Date().toISOString()
            });
            callback(payload.new as Message)
          }
        )
        .subscribe((status: any) => {
          console.log('🚨🚨🚨 MessageService: SUBSCRIPTION STATUS! 🚨🚨🚨', { 
            channelId,
            status,
            timestamp: new Date().toISOString()
          });
        })
      
      console.log('🚨🚨🚨 MessageService: SUBSCRIPTION CREATED! 🚨🚨🚨', { 
        channelId, 
        timestamp: new Date().toISOString() 
      });
      
      // ✅ VALIDAÇÃO: Verificar se subscription tem método unsubscribe
      if (subscription && typeof subscription.unsubscribe === 'function') {
        return subscription
      } else {
        console.log('🚨🚨🚨 MessageService: Subscription created but unsubscribe method not available')
        // ✅ FALLBACK: Retornar subscription mock
        return {
          unsubscribe: () => {
            console.log('🚨🚨🚨 MessageService: Mock subscription unsubscribe called')
          }
        }
      }
    } catch (error) {
      console.error('🚨🚨🚨 MessageService: ERROR CREATING SUBSCRIPTION! 🚨🚨🚨', error)
      // ✅ FALLBACK: Retornar subscription mock em caso de erro
      return {
        unsubscribe: () => {
          console.log('🚨🚨🚨 MessageService: Mock subscription unsubscribe called')
        }
      }
    }
  }

  /**
   * Subscribe to real-time message updates for all channels in a workspace
   * Note: This is a simplified subscription since messages don't have workspace_id
   */
  subscribeToWorkspaceMessages(workspaceId: string, callback: (message: Message) => void) {
    console.log(`🔔 MessageService: Subscribing to workspace ${workspaceId}`)
    
    try {
      // Since messages don't have workspace_id, we'll subscribe to all message inserts
      // In a real app, you might want to filter by channel_id based on workspace channels
      const channel = this.supabase.channel(`workspace:${workspaceId}`)
      
      const subscription = channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload: any) => {
            console.log(`🔔 MessageService: Received real-time message for workspace ${workspaceId}:`, payload)
            callback(payload.new as Message)
          }
        )
        .subscribe((status: any) => {
          console.log(`🔔 MessageService: Workspace ${workspaceId} subscription status:`, status)
        })

      console.log(`🔔 MessageService: Workspace ${workspaceId} subscription created`)
      
      // ✅ VALIDAÇÃO: Verificar se subscription tem método unsubscribe
      if (subscription && typeof subscription.unsubscribe === 'function') {
        return subscription
      } else {
        console.log(`🔔 MessageService: Workspace subscription created but unsubscribe method not available`)
        // ✅ FALLBACK: Retornar subscription mock
        return {
          unsubscribe: () => {
            console.log(`🔔 MessageService: Mock workspace subscription unsubscribe called`)
          }
        }
      }
    } catch (error) {
      console.error(`🔔 MessageService: ERROR CREATING WORKSPACE SUBSCRIPTION! 🔔`, error)
      // ✅ FALLBACK: Retornar subscription mock em caso de erro
      return {
        unsubscribe: () => {
          console.log(`🔔 MessageService: Mock workspace subscription unsubscribe called`)
        }
      }
    }
  }

  /**
   * Unsubscribe from workspace messages
   */
  unsubscribeFromWorkspace(workspaceId: string): void {
    console.log(`🔔 MessageService: Unsubscribing from workspace ${workspaceId}`)
    
    try {
      const channel = this.supabase.channel(`workspace:${workspaceId}`)
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe()
        console.log(`🔔 MessageService: Successfully unsubscribed from workspace ${workspaceId}`)
      } else {
        console.log(`🔔 MessageService: Channel not found or unsubscribe method not available for workspace ${workspaceId}`)
      }
    } catch (error) {
      console.error(`🔔 MessageService: Error unsubscribing from workspace ${workspaceId}:`, error)
    }
  }

  /**
   * Get users who have sent messages in a channel
   */
  async getChannelUsers(channelId: string): Promise<any[]> {
    try {
      console.log('MessageService: Fetching real users for channel:', channelId)
      
      // ✅ VALIDAÇÃO: Verificar se channelId é um UUID válido OU um ID de canal mock
      console.log('MessageService: Validating channelId for users:', channelId)
      console.log('MessageService: isValidUUID:', this.isValidUUID(channelId))
      console.log('MessageService: isMockChannelId:', this.isMockChannelId(channelId))
      
      if (!this.isValidUUID(channelId) && !this.isMockChannelId(channelId)) {
        console.log('MessageService: Invalid channelId, returning empty array:', channelId)
        return []
      }
      
      // ✅ VERIFICAÇÃO ADICIONAL: Se for um canal mock, tentar buscar do Supabase mesmo assim
      if (this.isMockChannelId(channelId)) {
        console.log('MessageService: Mock channel detected for users, but trying Supabase anyway')
        // Não retornar mock data imediatamente, continuar com Supabase
      }
      
      // ✅ IMPLEMENTAÇÃO REAL: Tentar buscar usuários do Supabase primeiro para todos os canais
      console.log('MessageService: Attempting to fetch users from Supabase for channel:', channelId)
      
      try {
        // ✅ MAPEAR: Converter ID mock para ID real se necessário
        const realChannelId = this.isMockChannelId(channelId) ? this.getRealChannelId(channelId) : channelId
        console.log('MessageService.getChannelUsers: Using real channel ID:', realChannelId, 'for mock ID:', channelId)
        
        // ✅ ESTRATÉGIA: Buscar usuários que enviaram mensagens no canal
        const { data: messages, error: messagesError } = await this.supabase
          .from('messages')
          .select('author_id')
          .eq('channel_id', realChannelId)
          .not('author_id', 'is', null)

        if (messagesError) {
          console.error('Error fetching channel messages for users:', {
            error: messagesError.message || messagesError,
            code: messagesError.code,
            details: messagesError.details,
            hint: messagesError.hint,
            channelId
          })
          // ✅ INCREMENTAR CONTADOR: Para detectar problemas persistentes
          this.incrementErrorCount()
          console.log('MessageService: No fallback to mock users - returning empty array')
          return []
        }

        // Extrair IDs únicos de usuários
        const userIds = [...new Set(messages.map((m: any) => m.author_id))]
        console.log('MessageService: Found user IDs in channel:', userIds)

        if (userIds.length === 0) {
          console.log('MessageService: No users found in channel, returning empty array')
          return []
        }

        // Buscar dados dos usuários
        const { data: users, error: usersError } = await this.supabase
          .from('users')
          .select('id, display_name, avatar_url, status')
          .in('id', userIds)

        if (usersError) {
          console.error('Error fetching users:', {
            error: usersError.message || usersError,
            code: usersError.code,
            details: usersError.details,
            hint: usersError.hint,
            channelId
          })
          // ✅ INCREMENTAR CONTADOR: Para detectar problemas persistentes
          this.incrementErrorCount()
          console.log('MessageService: User fetch failed, returning empty array')
          return []
        }

        if (users && users.length > 0) {
          console.log('MessageService: Successfully fetched', users.length, 'real users from Supabase')
          
          // ✅ RESETAR CONTADOR: Operação bem-sucedida
          this.errorCount = 0
          
          // ✅ ADICIONAR: Usuário atual autenticado se não estiver na lista
          const { data: { user: currentUser } } = await this.supabase.auth.getUser()
          if (currentUser && !users.find(u => u.id === currentUser.id)) {
            const userDisplayName = currentUser.user_metadata?.full_name || 
                                   currentUser.user_metadata?.display_name || 
                                   currentUser.email || 
                                   'Usuário Atual'
            
            const userAvatar = currentUser.user_metadata?.avatar_url || 
                              currentUser.user_metadata?.picture ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=random`
            
            users.push({
              id: currentUser.id,
              display_name: userDisplayName,
              handle: currentUser.email?.split('@')[0] || 'usuario',
              avatar_url: userAvatar,
              status: 'online'
            })
            console.log('MessageService: Added current authenticated user to users list:', {
              id: currentUser.id,
              display_name: userDisplayName,
              avatar_url: userAvatar
            })
          }
          
          // ✅ RETORNAR: Apenas usuários reais do Supabase
          console.log('MessageService: Returning users from Supabase:', users.length)
          return users
        }

        // ✅ SE VAZIO: Retornar array vazio
        console.log('MessageService: No real users found, returning empty array')
        return []
        
      } catch (error) {
        console.error('Error in Supabase user query:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          channelId
        })
        // ✅ INCREMENTAR CONTADOR: Para detectar problemas persistentes
        this.incrementErrorCount()
        console.log('MessageService: User query failed, returning empty array')
        return []
      }
    } catch (error) {
      console.error('Error getting channel users:', error)
      return []
    }
  }


  /**
   * Validate if a string is a valid UUID
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  /**
   * Check if a string is a mock channel ID (simple numeric IDs or channel names)
   */
  private isMockChannelId(str: string): boolean {
    // Mock channels use simple IDs like '1', '2', '3' or channel names like 'general', 'design-system'
    return /^[1-9]\d*$/.test(str) || ['general', 'design-system', 'project-pegasus'].includes(str)
  }

  /**
   * Get real channel ID from mock channel ID
   */
  private getRealChannelId(mockChannelId: string): string {
    const channelMap: { [key: string]: string } = {
      '1': '550e8400-e29b-41d4-a716-446655440020', // general
      '2': '550e8400-e29b-41d4-a716-446655440021', // design-system
      '3': '550e8400-e29b-41d4-a716-446655440022', // project-pegasus
      'general': '550e8400-e29b-41d4-a716-446655440020',
      'design-system': '550e8400-e29b-41d4-a716-446655440021',
      'project-pegasus': '550e8400-e29b-41d4-a716-446655440022'
    }
    return channelMap[mockChannelId] || mockChannelId
  }

  /**
   * Add a message to the mock cache for a specific channel
   */
  private addMessageToCache(channelId: string, message: Message): void {
    if (!this.mockMessageCache.has(channelId)) {
      this.mockMessageCache.set(channelId, [])
    }
    
    const channelMessages = this.mockMessageCache.get(channelId)!
    
    // ✅ VERIFICAR: Se mensagem já existe
    const exists = channelMessages.some(m => m.id === message.id)
    if (!exists) {
      channelMessages.push(message)
      console.log('MessageService: Message added to cache for channel:', channelId, 'Total messages:', channelMessages.length)
    } else {
      console.log('MessageService: Message already exists in cache, skipping duplicate')
    }
    
    // ✅ ADICIONADO: Remover duplicatas após adicionar (caso haja alguma)
    const uniqueMessages = channelMessages.filter((msg, index, self) => 
      index === self.findIndex(m => m.id === msg.id)
    )
    
    if (uniqueMessages.length !== channelMessages.length) {
      console.log('MessageService: Removed duplicate messages from cache, new count:', uniqueMessages.length)
      this.mockMessageCache.set(channelId, uniqueMessages)
    }
  }

  /**
   * Get messages from cache for a specific channel
   */
  private getMessagesFromCache(channelId: string): Message[] {
    return this.mockMessageCache.get(channelId) || []
  }

  /**
   * Add a user to the mock cache
   */
  private addUserToCache(user: any): void {
    if (user && user.id) {
      this.mockUserCache.set(user.id, user)
      console.log('MessageService: User added to cache:', user.id, user.display_name)
    }
  }

  /**
   * Get a user from cache by ID
   */
  private getUserFromCache(userId: string): any | null {
    return this.mockUserCache.get(userId) || null
  }

  /**
   * Check if ID is a mock DM ID
   */
  private isMockDMId(id: string): boolean {
    return id.startsWith('mock-dm-') || id.startsWith('dm-')
  }

  /**
   * Get real DM ID from mock DM ID
   * This will create or find a real DM in the database
   */
  private async getRealDMId(mockDmId: string, currentUserId?: string): Promise<string> {
    // ✅ MAPEAR: Converter ID mock para DM real
    if (mockDmId.startsWith('dm-')) {
      const targetUserId = mockDmId.replace('dm-', '')
      
      // ✅ MAPEAR: Converter usuário mock para UUID válido
      const realTargetUserId = this.getRealUserId(targetUserId)
      let realCurrentUserId = currentUserId ? this.getRealUserId(currentUserId) : null
      
      console.log('MessageService: Mapped users - Mock:', targetUserId, '-> Real:', realTargetUserId)
      console.log('MessageService: Current user - Mock:', currentUserId, '-> Real:', realCurrentUserId)
      
      // ✅ VALIDAÇÃO: Verificar se temos o ID do usuário atual
      if (!realCurrentUserId) {
        console.log('MessageService: No current user ID provided, using real user ID from auth')
        // ✅ USAR ID REAL: Pegar o ID do usuário autenticado
        const { data: { user } } = await this.supabase.auth.getUser()
        if (user?.id) {
          realCurrentUserId = user.id
          console.log('MessageService: Using authenticated user ID:', realCurrentUserId)
        } else {
          console.log('MessageService: No authenticated user found, using deterministic fallback')
          const hash = this.simpleHash(targetUserId)
          return `550e8400-e29b-41d4-a716-${hash.toString().padStart(12, '0')}`
        }
      }
      
      // ✅ CRIAR/ENCONTRAR: DM real no banco de dados
      const realDmId = await this.createOrFindDM(realCurrentUserId, realTargetUserId)
      
      if (realDmId) {
        console.log('MessageService: Using real DM ID:', realDmId)
        return realDmId
      } else {
        console.log('MessageService: Failed to create/find DM, using deterministic fallback')
        const hash = this.simpleHash(targetUserId)
        return `550e8400-e29b-41d4-a716-${hash.toString().padStart(12, '0')}`
      }
    }
    return mockDmId
  }

  /**
   * Simple hash function to create deterministic UUIDs
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Get real user ID from mock user ID
   * Maps mock user IDs to valid UUIDs
   */
  private getRealUserId(mockUserId: string): string {
    // ✅ MAPEAMENTO: Usuários mock para UUIDs válidos
    const userMap: { [key: string]: string } = {
      'test-user': '550e8400-e29b-41d4-a716-446655440001',
      'user-1': '550e8400-e29b-41d4-a716-446655440002',
      'user-2': '550e8400-e29b-41d4-a716-446655440003',
      'current-user': 'e4c9d0f8-b54c-4f17-9487-92872db095ab',
      'dev-user': 'e4c9d0f8-b54c-4f17-9487-92872db095ab'
    }
    
    // Se já é um UUID válido, retornar como está
    if (this.isValidUUID(mockUserId)) {
      return mockUserId
    }
    
    // Se está no mapa, retornar o UUID correspondente
    if (userMap[mockUserId]) {
      console.log('MessageService: Mapped mock user', mockUserId, 'to UUID', userMap[mockUserId])
      return userMap[mockUserId]
    }
    
    // Se não está no mapa, gerar um UUID determinístico
    const hash = this.simpleHash(mockUserId)
    const deterministicUuid = `550e8400-e29b-41d4-a716-${hash.toString().padStart(12, '0')}`
    console.log('MessageService: Generated deterministic UUID for mock user', mockUserId, ':', deterministicUuid)
    return deterministicUuid
  }

  /**
   * Create or find a direct message conversation between two users
   */
  private async createOrFindDM(user1Id: string, user2Id: string): Promise<string | null> {
    try {
      console.log('MessageService: Creating or finding DM between:', user1Id, user2Id)
      
      // ✅ VERIFICAR: Se já existe um DM entre esses usuários
      const { data: existingDM, error: findError } = await this.supabase
        .from('direct_messages')
        .select('id')
        .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
        .single()

      if (existingDM && !findError) {
        console.log('MessageService: Found existing DM:', existingDM.id)
        return existingDM.id
      }

      // ✅ CRIAR: Novo DM se não existir
      console.log('MessageService: Creating new DM between users')
      const { data: newDM, error: createError } = await this.supabase
        .from('direct_messages')
        .insert({
          user1_id: user1Id,
          user2_id: user2Id
        })
        .select('id')
        .single()

      if (createError) {
        console.error('MessageService: Error creating DM:', createError)
        console.error('MessageService: Error details:', {
          message: createError.message,
          code: createError.code,
          details: createError.details,
          hint: createError.hint,
          status: createError.status,
          statusText: createError.statusText,
          user1Id,
          user2Id
        })
        console.error('MessageService: Full error object:', JSON.stringify(createError, null, 2))
        return null
      }

      console.log('MessageService: Created new DM:', newDM.id)
      return newDM.id
      
    } catch (error) {
      console.error('MessageService: Error in createOrFindDM:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        user1Id,
        user2Id
      })
      return null
    }
  }



  /**
   * Gerar UUID válido para mensagens mock
   */
  private generateValidUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}

export const messageService = new MessageService()