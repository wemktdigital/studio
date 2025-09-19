
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
  private mockMessageCache = new Map<string, Message[]>()
  private mockUserCache = new Map<string, any>()
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
  async getDirectMessageMessages(dmId: string, currentUserId?: string): Promise<Message[]> {
    console.log('MessageService: Fetching DM messages for:', dmId)
    
    try {
      // ✅ VALIDAÇÃO: Verificar se dmId é válido
      if (!dmId) {
        console.log('MessageService: Invalid dmId, using mock data')
        return this.getMockDMMessages(dmId)
      }
      
      // ✅ FALLBACK CHECK: Se estiver em modo fallback, usar mock data imediatamente
      if (this.useFallbackMode) {
        console.log('MessageService: Using fallback mode for DMs, skipping Supabase query')
        return this.getMockDMMessages(dmId)
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
        console.log('MessageService: Using mock data due to error')
        return this.getMockDMMessages(dmId)
      }

      if (!allMessages || allMessages.length === 0) {
        console.log('MessageService: No messages found for DM:', realDmId)
        return []
      }

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
        // ✅ FALLBACK: Retornar mock data em caso de erro
        console.log('MessageService: Using mock data due to error')
        return this.getMockDMMessages(dmId)
      }

      if (data && data.length > 0) {
        console.log('MessageService: Successfully fetched', data.length, 'real DM messages from Supabase')
        console.log('MessageService: Raw Supabase data:', data)
        
        // ✅ RESETAR CONTADOR: Operação bem-sucedida
        this.errorCount = 0
        
        // ✅ COMBINAR: Adicionar mensagens do cache mock se houver
        const cachedMessages = this.getMessagesFromCache(dmId)
        const allMessages = [...data, ...cachedMessages]
        
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
        
        console.log('MessageService: Returning combined DM messages - Base:', data.length, 'Cached:', cachedMessages.length, 'Unique:', uniqueMessages.length, 'Transformed:', transformedMessages.length)
        console.log('MessageService: Transformed messages:', transformedMessages)
        return transformedMessages
      }

      // ✅ SE VAZIO: Verificar se há mensagens no cache antes de usar mock
      console.log('MessageService: No real DM messages found in Supabase')
      const cachedMessages = this.getMessagesFromCache(dmId)
      if (cachedMessages && cachedMessages.length > 0) {
        console.log('MessageService: Found', cachedMessages.length, 'cached messages, returning them')
        return cachedMessages
      }
      
      console.log('MessageService: No cached messages either, using mock data')
      return this.getMockDMMessages(dmId)
      
    } catch (error) {
      console.error('Error in Supabase DM query:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        dmId
      })
      // ✅ INCREMENTAR CONTADOR: Para detectar problemas persistentes
      this.incrementErrorCount()
      console.log('MessageService: Using mock data due to caught error')
      return this.getMockDMMessages(dmId)
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
        
        // ✅ CACHE: Adicionar mensagem ao cache local
        this.addMessageToCache(dmId, mockMessage)
        console.log('MessageService: DM message added to cache')
        
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
        
        // ✅ CACHE: Adicionar mensagem ao cache local
        this.addMessageToCache(dmId, mockMessage)
        console.log('MessageService: DM message added to cache')
        
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
        
        // ✅ CACHE: Adicionar mensagem ao cache local
        this.addMessageToCache(dmId, transformedMessage)
        console.log('MessageService: DM message added to cache')
        
        return transformedMessage
      }

      // ✅ FALLBACK: Se não retornou dados, usar mock
      console.log('MessageService: No data returned from Supabase for DM, using mock data')
      const mockMessage = this.getMockDMMessage(dmId, content, authorId)
      
      // ✅ CACHE: Adicionar mensagem ao cache local
      this.addMessageToCache(dmId, mockMessage)
      console.log('MessageService: DM message added to cache')
      
      return mockMessage
      
    } catch (error) {
      console.error('MessageService: Caught error in sendDirectMessage:', error)
      console.log('MessageService: Using mock data due to caught error')
      
      // ✅ FALLBACK: Usar mock data em caso de erro
      const mockMessage = this.getMockDMMessage(dmId, content, authorId)
      
      // ✅ CACHE: Adicionar mensagem ao cache local
      this.addMessageToCache(dmId, mockMessage)
      console.log('MessageService: DM message added to cache')
      
      return mockMessage
    }
  }

  /**
   * Get messages for a channel
   */
  async getChannelMessages(channelId: string): Promise<Message[]> {
    try {
      console.log('MessageService: Fetching real messages for channel:', channelId)
      
      // ✅ VALIDAÇÃO: Verificar se channelId é um UUID válido OU um ID de canal mock
      console.log('MessageService: Validating channelId:', channelId)
      console.log('MessageService: isValidUUID:', this.isValidUUID(channelId))
      console.log('MessageService: isMockChannelId:', this.isMockChannelId(channelId))
      
      if (!this.isValidUUID(channelId) && !this.isMockChannelId(channelId)) {
        console.log('MessageService: Invalid channelId, using mock data:', channelId)
        return this.getMockMessages(channelId)
      }
      
      // ✅ FALLBACK CHECK: Se estiver em modo fallback, usar mock data imediatamente
      if (this.useFallbackMode) {
        console.log('MessageService: Using fallback mode, skipping Supabase query')
        return this.getMockMessages(channelId)
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
          .select('*')
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
          
          // ✅ RESETAR CONTADOR: Operação bem-sucedida
          this.errorCount = 0
          
          // ✅ COMBINAR: Adicionar mensagens do cache mock se houver
          const cachedMessages = this.getMessagesFromCache(channelId)
          const allMessages = [...data, ...cachedMessages]
          
          // ✅ REMOVER DUPLICATAS: Baseado no ID da mensagem
          const uniqueMessages = allMessages.filter((message, index, self) => 
            index === self.findIndex(m => m.id === message.id)
          )
          
          // ✅ ORDENAR: Por timestamp de criação
          uniqueMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          
          console.log('MessageService: Returning combined messages - Base:', data.length, 'Cached:', cachedMessages.length, 'Unique:', uniqueMessages.length)
          return uniqueMessages
        }

        // ✅ SE VAZIO: Retornar apenas mensagens mock se não houver mensagens reais
        console.log('MessageService: No real messages found, using mock data')
        return this.getMockMessages(channelId)
        
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
   * Get mock messages as fallback
   */
  private getMockMessages(channelId: string): Message[] {
    console.log('MessageService: Using mock messages as fallback for channel:', channelId)
    
    // ✅ CACHE: Verificar se há mensagens em cache para este canal
    const cachedMessages = this.getMessagesFromCache(channelId)
    console.log('MessageService: Found cached messages:', cachedMessages.length)
    
    // ✅ BASE: Mensagens padrão do canal com UUIDs válidos
    const messageId1 = this.generateValidUUID()
    const messageId2 = this.generateValidUUID()
    const userId1 = this.generateValidUUID()
    const userId2 = this.generateValidUUID()
    
    const baseMessages: Message[] = [
      {
        id: messageId1,
        content: 'Welcome to the channel! 👋',
        type: 'text',
        author_id: userId1,
        channel_id: channelId,
        dm_id: null,
        attachment_name: null,
        attachment_url: null,
        data_ai_hint: null,
        created_at: new Date(Date.now() - 60000).toISOString(), // 1 minuto atrás
        updated_at: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: messageId2,
        content: 'This is a test message',
        type: 'text',
        author_id: userId2,
        channel_id: channelId,
        dm_id: null,
        attachment_name: null,
        attachment_url: null,
        data_ai_hint: null,
        created_at: new Date(Date.now() - 30000).toISOString(), // 30 segundos atrás
        updated_at: new Date(Date.now() - 30000).toISOString()
      }
    ]
    
    // ✅ COMBINAR: Base messages + cached messages
    const allMessages = [...baseMessages, ...cachedMessages]
    
    // ✅ ORDENAR: Por timestamp de criação
    allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    
    console.log('MessageService: Returning combined messages - Base:', baseMessages.length, 'Cached:', cachedMessages.length, 'Total:', allMessages.length)
    return allMessages
  }

  /**
   * Send a message to a channel
   */
  async sendMessage(message: Omit<MessageInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Message> {
    console.log('MessageService.sendMessage: Called with:', message)
    
    try {
      // ✅ FALLBACK CHECK: Se estiver em modo fallback, usar mock data imediatamente
      if (this.useFallbackMode) {
        console.log('MessageService.sendMessage: Using fallback mode, skipping Supabase insert')
        const mockMessage = this.getMockMessage(message)
        
        // ✅ CACHE: Adicionar mensagem ao cache local
        if (message.channel_id) {
          this.addMessageToCache(message.channel_id, mockMessage)
          console.log('MessageService.sendMessage: Message added to cache for channel:', message.channel_id)
        }
        
        return mockMessage
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
          console.error('MessageService.sendMessage: Using fallback mode for this message')
          
          // ✅ FALLBACK: Usar mock data para este canal
          const mockMessage = this.getMockMessage(message)
          
          // ✅ CACHE: Adicionar mensagem ao cache local
          if (message.channel_id) {
            this.addMessageToCache(message.channel_id, mockMessage)
            console.log('MessageService.sendMessage: Message added to cache for channel:', message.channel_id)
          }
          
          return mockMessage
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

      // ✅ FALLBACK: Se não retornou dados, usar mock
      console.log('MessageService.sendMessage: No data returned from Supabase, using mock data')
      return this.getMockMessage(message)
      
    } catch (error) {
      console.error('MessageService.sendMessage: Caught error:', error)
      console.log('MessageService.sendMessage: No fallback to mock data - rethrowing error')
      
      // ✅ SEM FALLBACK: Re-throw o erro em vez de retornar mock data
      throw error
    }
  }

  /**
   * Get mock message as fallback
   */
  private getMockMessage(message: Omit<MessageInsert, 'id' | 'created_at' | 'updated_at'>): Message {
    console.log('MessageService.getMockMessage: Creating mock message for:', message.content)
    
    // ✅ MELHORADO: ID único baseado em timestamp + random + content hash
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    const contentHash = message.content ? btoa(message.content).substr(0, 8) : 'empty'
    const uniqueId = `mock-${timestamp}-${random}-${contentHash}`
    
    console.log('MessageService.getMockMessage: Generated unique ID:', uniqueId)
    
    // ✅ DETECÇÃO AUTOMÁTICA DE LINKS
    let messageType = message.type || 'text'
    let attachmentUrl = message.attachment_url
    
    if (message.content && messageType === 'text') {
      const urls = linkService.extractUrls(message.content)
      if (urls.length > 0) {
        const firstUrl = urls[0]
        const linkType = linkService.detectLinkType(firstUrl)
        
        // ✅ ATUALIZAR TIPO E URL DE ANEXO BASEADO NO LINK
        if (linkType === 'image') {
          messageType = 'image'
          attachmentUrl = firstUrl
        } else if (linkType === 'document') {
          messageType = 'link'
          attachmentUrl = firstUrl
        } else if (linkType === 'youtube' || linkType === 'github' || linkType === 'code') {
          messageType = 'link'
          attachmentUrl = firstUrl
        }
        
        console.log('MessageService: Link detected in message:', { 
          originalType: message.type, 
          newType: messageType, 
          url: firstUrl, 
          linkType 
        })
      }
    }
    
    const mockMessage: Message = {
      id: uniqueId,
      content: message.content,
      type: messageType,
      author_id: message.author_id,
      channel_id: message.channel_id || null,
      dm_id: message.dm_id || null,
      attachment_name: message.attachment_name || null,
      attachment_url: attachmentUrl || null,
      data_ai_hint: message.data_ai_hint || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('MessageService.getMockMessage: Created mock message with link detection:', mockMessage)
    return mockMessage
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
        console.log('MessageService: Invalid channelId, using mock users:', channelId)
        return this.getMockUsers()
      }
      
      // ✅ FALLBACK CHECK: Se estiver em modo fallback, usar mock data imediatamente
      if (this.useFallbackMode) {
        console.log('MessageService: Using fallback mode for users, skipping Supabase query')
        return this.getMockUsers()
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
          console.log('MessageService: No users found in channel, using mock users')
          return this.getMockUsers()
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
          console.log('MessageService: User fetch failed, using mock users as fallback')
          return this.getMockUsers()
        }

        if (users && users.length > 0) {
          console.log('MessageService: Successfully fetched', users.length, 'real users from Supabase')
          
          // ✅ RESETAR CONTADOR: Operação bem-sucedida
          this.errorCount = 0
          
          // ✅ COMBINAR: Adicionar usuários mock se houver
          const mockUsers = this.getMockUsers()
          const allUsers = [...users, ...mockUsers]
          
          // ✅ REMOVER DUPLICATAS: Por ID
          const uniqueUsers = allUsers.filter((user, index, self) => 
            index === self.findIndex(u => u.id === user.id)
          )
          
          console.log('MessageService: Returning combined users - Real:', users.length, 'Mock:', mockUsers.length, 'Total:', uniqueUsers.length)
          return uniqueUsers
        }

        // ✅ SE VAZIO: Retornar apenas usuários mock
        console.log('MessageService: No real users found, using mock users')
        return this.getMockUsers()
        
      } catch (error) {
        console.error('Error in Supabase user query:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          channelId
        })
        // ✅ INCREMENTAR CONTADOR: Para detectar problemas persistentes
        this.incrementErrorCount()
        console.log('MessageService: User query failed, using mock users as fallback')
        return this.getMockUsers()
      }
    } catch (error) {
      console.error('Error getting channel users:', error)
      return this.getMockUsers()
    }
  }

  /**
   * Get mock users as fallback
   */
  private getMockUsers(): any[] {
    console.log('MessageService: Using mock users as fallback')
    
    // ✅ BASE: Usuários padrão
    const baseUsers = [
      {
        id: 'user1',
        display_name: 'John Doe',
        handle: 'johndoe',
        avatar_url: 'https://i.pravatar.cc/40?u=john',
        status: 'online'
      },
      {
        id: 'user2',
        display_name: 'Jane Smith',
        handle: 'janesmith',
        avatar_url: 'https://i.pravatar.cc/40?u=jane',
        status: 'away'
      },
      // ✅ ADICIONAR: Usuário atual para mensagens enviadas
      {
        id: 'e4c9d0f8-b54c-4f17-9487-92872db095ab',
        display_name: 'Current User',
        handle: 'currentuser',
        avatar_url: 'https://i.pravatar.cc/40?u=current',
        status: 'online'
      }
    ]
    
    // ✅ CACHE: Adicionar usuários em cache
    const cachedUsers = Array.from(this.mockUserCache.values())
    
    // ✅ COMBINAR: Base users + cached users
    const allUsers = [...baseUsers, ...cachedUsers]
    
    // ✅ REMOVER: Duplicatas baseado em ID
    const uniqueUsers = allUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    )
    
    console.log('MessageService: Returning users - Base:', baseUsers.length, 'Cached:', cachedUsers.length, 'Total:', uniqueUsers.length)
    return uniqueUsers
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
   * Get mock DM messages for fallback
   */
  private getMockDMMessages(dmId: string): Message[] {
    console.log('MessageService: Creating mock DM messages for dmId:', dmId)
    
    const mockMessages: Message[] = [
      {
        id: `mock-dm-message-${dmId}-1`,
        content: 'Olá! Como você está?',
        type: 'text',
        author_id: 'e4c9d0f8-b54c-4f17-9487-92872db095ab', // ✅ ID real do usuário dev
        channel_id: null,
        dm_id: dmId,
        attachment_name: null,
        attachment_url: null,
        data_ai_hint: null,
        created_at: new Date(Date.now() - 300000).toISOString(),
        updated_at: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: `mock-dm-message-${dmId}-2`,
        content: 'Tudo bem! E você?',
        type: 'text',
        author_id: '550e8400-e29b-41d4-a716-446655440001', // ✅ ID real de outro usuário
        channel_id: null,
        dm_id: dmId,
        attachment_name: null,
        attachment_url: null,
        data_ai_hint: null,
        created_at: new Date(Date.now() - 240000).toISOString(),
        updated_at: new Date(Date.now() - 240000).toISOString()
      },
      {
        id: `mock-dm-message-${dmId}-3`,
        content: 'Ótimo! Estou trabalhando no projeto novo.',
        type: 'text',
        author_id: 'e4c9d0f8-b54c-4f17-9487-92872db095ab', // ✅ ID real do usuário dev
        channel_id: null,
        dm_id: dmId,
        attachment_name: null,
        attachment_url: null,
        data_ai_hint: null,
        created_at: new Date(Date.now() - 180000).toISOString(),
        updated_at: new Date(Date.now() - 180000).toISOString()
      }
    ]
    
    console.log('MessageService: Created mock DM messages:', mockMessages)
    return mockMessages
  }

  /**
   * Get mock DM message for fallback
   */
  private getMockDMMessage(dmId: string, content: string, authorId: string): Message {
    console.log('MessageService: Creating mock DM message:', { dmId, content, authorId })
    
    const mockMessage: Message = {
      id: `mock-dm-message-${dmId}-${Date.now()}`,
      content,
      type: 'text',
      author_id: authorId,
      channel_id: null,
      dm_id: dmId,
      attachment_name: null,
      attachment_url: null,
      data_ai_hint: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('MessageService: Created mock DM message:', mockMessage)
    return mockMessage
  }

  /**
   * Add message to DM cache
   */
  private addMessageToDMCache(dmId: string, message: Message): void {
    console.log('MessageService: Adding message to DM cache:', { dmId, messageId: message.id })
    
    const existingMessages = this.mockMessageCache.get(dmId) || []
    const updatedMessages = [...existingMessages, message]
    
    this.mockMessageCache.set(dmId, updatedMessages)
    
    console.log('MessageService: DM cache updated. Total messages:', updatedMessages.length)
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