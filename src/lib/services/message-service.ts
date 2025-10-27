
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

// ✅ TIPOS: Definir tipos para mensagens com dados do autor
interface MessageWithAuthor {
  id: string
  content: string
  type: string
  authorId: string
  channelId: string | null
  dmId: string | null
  createdAt: string
  updatedAt: string
  attachmentName: string | null
  attachmentUrl: string | null
  dataAiHint: string | null
  reactions: any[]
  author: {
    id: string
    displayName: string
    handle: string
    avatarUrl: string
    status: 'online' | 'offline' | 'away'
  }
}

type Message = Database['public']['Tables']['messages']['Row']
type MessageInsert = Database['public']['Tables']['messages']['Insert']
type MessageUpdate = Database['public']['Tables']['messages']['Update']
type MessageReaction = Database['public']['Tables']['message_reactions']['Row']
type Thread = Database['public']['Tables']['threads']['Row']
type ThreadMessage = Database['public']['Tables']['thread_messages']['Row']

/**
 * ✅ SERVIÇO DE MENSAGENS: Classe responsável por gerenciar mensagens do chat
 * 
 * Funcionalidades:
 * - Buscar mensagens de canais e DMs
 * - Enviar mensagens
 * - Atualizações em tempo real via Supabase Realtime
 * - Incluir dados do autor (nome, avatar) em cada mensagem
 * - Tratamento de erros e fallbacks
 */
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
   * ✅ INCREMENTAR ERRO: Incrementa contador de erros e força fallback se necessário
   * 
   * Funcionalidades:
   * - Incrementa contador de erros
   * - Loga aviso com contagem atual
   * - Força modo fallback se atingir limite máximo
   * - Usado para detectar problemas persistentes com Supabase
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
   * ✅ TESTE DE CONEXÃO: Testa conexão com Supabase e configura modo fallback
   * 
   * Funcionalidades:
   * - Verifica se está rodando em SSR (pula teste)
   * - Verifica se cliente Supabase é null
   * - Executa query simples para testar conexão
   * - Configura modo fallback se conexão falhar
   * - Loga status da conexão
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
      // Primeiro buscar todas as mensagens do DM (sem JOIN para evitar problemas)
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

      // ✅ ADICIONADO: Buscar dados dos usuários separadamente
      const userIds = [...new Set(allMessages.map(msg => msg.author_id))]
      let usersData = []
      
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await this.supabase
          .from('users')
          .select('id, display_name, username, avatar_url, status')
          .in('id', userIds)
        
        if (usersError) {
          console.error('Error fetching users for DM messages:', usersError)
        } else {
          usersData = users || []
        }
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
        
        // ✅ BUSCAR: Dados dos usuários que enviaram mensagens
        const authorIds = [...new Set(uniqueMessages.map(msg => msg.author_id))]
        
        const { data: usersData, error: usersError } = await this.supabase
          .from('users')
          .select('id, display_name, username, handle, avatar_url, status')
          .in('id', authorIds)
        
        if (usersError) {
          console.error('❌ MessageService: Error fetching users:', usersError)
        }
        
        // ✅ TRANSFORMAR: Converter snake_case para camelCase E incluir dados do autor
        const transformedMessages = uniqueMessages.map(msg => {
          // Buscar dados do autor
          const author = usersData?.find(u => u.id === msg.author_id)
          

          
          const authorData = author || {
            id: msg.author_id,
            display_name: msg.author_id ? `Usuário ${msg.author_id.slice(0, 8)}` : 'Usuário Desconhecido',
            username: msg.author_id ? `user_${msg.author_id.slice(0, 8)}` : 'unknown',
            avatar_url: null,
            status: 'offline'
          }

          console.log('🔍 MessageService: Transforming DM message:', {
            messageId: msg.id,
            authorId: msg.author_id,
            authorFound: !!author,
            authorData: author,
            authorData_displayName: author?.display_name,
            authorData_username: author?.username
          })

          const transformedMessage = {
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
            reactions: [], // Inicializar array vazio
            // ✅ ADICIONADO: Dados do autor em camelCase
            author: {
              id: authorData.id,
              displayName: authorData.display_name || authorData.username || authorData.handle || `Usuário ${msg.author_id.slice(0, 8)}`,
              handle: authorData.handle || authorData.username || 'usuario',
              avatarUrl: authorData.avatar_url || 'https://i.pravatar.cc/40?u=default',
              status: authorData.status || 'offline'
            }
          }

          console.log('🔍 MessageService: Transformed DM message:', {
            messageId: transformedMessage.id,
            author_displayName: transformedMessage.author.displayName,
            author_id: transformedMessage.author.id
          })

          return transformedMessage
        })
        
        console.log('MessageService: Returning', transformedMessages.length, 'DM messages')
        console.log('🔍 MessageService: ALL TRANSFORMED MESSAGES:', JSON.stringify(transformedMessages.map(m => ({ id: m.id, author: m.author?.displayName || 'SEM AUTOR' })), null, 2))
        
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
   * ✅ BUSCAR MENSAGENS: Obtém todas as mensagens de um canal específico
   * 
   * @param channelId - ID do canal (UUID válido ou ID mock)
   * @param workspaceId - ID do workspace (opcional, para futuras otimizações)
   * @returns Array de mensagens com dados do autor incluídos
   * 
   * Funcionalidades:
   * - Valida se o channelId é válido
   * - Converte IDs mock para UUIDs reais
   * - Busca mensagens do Supabase
   * - Busca dados dos usuários separadamente
   * - Combina dados para criar mensagens completas
   * - Retorna array vazio em caso de erro
   */
  async getChannelMessages(channelId: string, workspaceId?: string): Promise<MessageWithAuthor[]> {
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
        
        // ✅ CORREÇÃO: Primeiro tentar query simples sem JOIN para verificar se há mensagens
        const { data: simpleData, error: simpleError } = await this.supabase
          .from('messages')
          .select('id, content, author_id, channel_id, created_at, updated_at, type')
          .eq('channel_id', realChannelId)
          .order('created_at', { ascending: true })
          .limit(100)

        if (simpleError) {
          console.error('Error fetching channel messages (simple query):', {
            error: simpleError.message || simpleError,
            code: simpleError.code,
            details: simpleError.details,
            hint: simpleError.hint,
            channelId
          })
          this.incrementErrorCount()
          console.log('MessageService: Simple query failed, returning empty array')
          return []
        }

        if (!simpleData || simpleData.length === 0) {
          console.log('MessageService: No messages found for channel:', realChannelId)
          return []
        }

        console.log('MessageService: Found', simpleData.length, 'messages, now fetching user data')

        // ✅ CORREÇÃO: Buscar dados dos usuários separadamente para evitar problemas de JOIN
        const authorIds = [...new Set(simpleData.map(msg => msg.author_id))]
        const { data: usersData, error: usersError } = await this.supabase
          .from('users')
          .select('id, display_name, handle, avatar_url, status')
          .in('id', authorIds)

        if (usersError) {
          console.warn('MessageService: Error fetching users data:', usersError)
        }

        // ✅ CORREÇÃO: Criar mapa de usuários para lookup rápido
        const usersMap = new Map()
        if (usersData) {
          usersData.forEach(user => {
            usersMap.set(user.id, user)
          })
        }

        // ✅ TRANSFORMAR: Converter para formato Message com dados do autor
        const transformedMessages: MessageWithAuthor[] = simpleData.map(msg => {
          const user = usersMap.get(msg.author_id)
          return {
            id: msg.id,
            content: msg.content,
            type: msg.type || 'text',
            authorId: msg.author_id,
            channelId: msg.channel_id,
            dmId: null,
            attachmentName: null,
            attachmentUrl: null,
            dataAiHint: null,
            createdAt: msg.created_at,
            updatedAt: msg.updated_at,
            reactions: [],
            // ✅ ADICIONAR: Dados do autor com fallback para usuário desconhecido
            author: user ? {
              id: user.id,
              displayName: user.display_name || 'Usuário',
              handle: user.handle || 'usuario',
              avatarUrl: user.avatar_url || 'https://i.pravatar.cc/40?u=default',
              status: user.status || 'offline'
            } : {
              id: msg.author_id,
              displayName: 'Usuário Desconhecido',
              handle: 'unknown',
              avatarUrl: 'https://i.pravatar.cc/40?u=unknown',
              status: 'offline' as const
            }
          }
        })

        console.log('MessageService: Successfully transformed', transformedMessages.length, 'messages')
        
        // ✅ RESETAR CONTADOR: Operação bem-sucedida
        this.errorCount = 0
        
        return transformedMessages
        
      } catch (error) {
        console.error('Error in Supabase query:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          channelId
        })
        // ✅ INCREMENTAR CONTADOR: Para detectar problemas persistentes
        this.incrementErrorCount()
        console.log('MessageService: Query failed, returning empty array')
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
   * ✅ ENVIAR MENSAGEM: Salva uma nova mensagem no canal
   * 
   * @param message - Dados da mensagem a ser enviada (sem id, created_at, updated_at)
   * @returns Mensagem salva com dados do autor incluídos
   * 
   * Funcionalidades:
   * - Valida se não está em modo fallback
   * - Converte IDs mock para UUIDs reais
   * - Insere mensagem no Supabase
   * - Busca dados do usuário autor
   * - Retorna mensagem completa com dados do autor
   * - Lança erro em caso de falha
   */
  async sendMessage(message: Omit<MessageInsert, 'id' | 'created_at' | 'updated_at'>): Promise<MessageWithAuthor> {
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
      
      // ✅ CORREÇÃO: Usar query simples para inserir mensagem
      const { data, error } = await this.supabase
        .from('messages')
        .insert(insertData)
        .select('id, content, author_id, channel_id, dm_id, created_at, updated_at, type')
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
        
        // ✅ CORREÇÃO: Buscar dados do usuário separadamente
        const { data: userData, error: userError } = await this.supabase
          .from('users')
          .select('id, display_name, handle, avatar_url, status')
          .eq('id', data.author_id)
          .single()

        if (userError) {
          console.warn('MessageService.sendMessage: Error fetching user data:', userError)
        }
        
        // ✅ TRANSFORMAR: Converter para formato Message com dados do autor
        const transformedMessage: MessageWithAuthor = {
          id: data.id,
          content: data.content,
          type: data.type || 'text',
          authorId: data.author_id,
          channelId: data.channel_id,
          dmId: data.dm_id,
          attachmentName: null,
          attachmentUrl: null,
          dataAiHint: null,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          reactions: [],
          // ✅ ADICIONAR: Dados do autor com fallback para usuário desconhecido
          author: userData ? {
            id: userData.id,
            displayName: userData.display_name || 'Usuário',
            handle: userData.handle || 'usuario',
            avatarUrl: userData.avatar_url || 'https://i.pravatar.cc/40?u=default',
            status: userData.status || 'offline'
          } : {
            id: data.author_id,
            displayName: 'Usuário Desconhecido',
            handle: 'unknown',
            avatarUrl: 'https://i.pravatar.cc/40?u=unknown',
            status: 'offline' as const
          }
        }
        
        return transformedMessage
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
   * ✅ TEMPO REAL: Inscreve-se para receber mensagens em tempo real de um canal
   * 
   * @param channelId - ID do canal para monitorar
   * @param callback - Função chamada quando uma nova mensagem é recebida
   * @returns Subscription que pode ser cancelada
   * 
   * Funcionalidades:
   * - Verifica se o cliente Supabase está disponível
   * - Verifica se não está em SSR
   * - Verifica se o usuário está autenticado
   * - Cria subscription para mudanças na tabela messages
   * - Transforma mensagens recebidas para incluir dados do autor
   * - Usa fallback com polling se subscription falhar
   */
  async subscribeToChannelMessages(channelId: string, callback: (message: MessageWithAuthor) => void) {
    console.log('🚨🚨🚨 MessageService: SUBSCRIBING TO CHANNEL! 🚨🚨🚨', { 
      channelId, 
      timestamp: new Date().toISOString() 
    });
    
    try {
      // ✅ VERIFICAÇÃO: Verificar se o cliente Supabase está disponível
      if (!this.supabase) {
        console.error('🚨🚨🚨 MessageService: Supabase client is null!')
        return this.createFallbackSubscription(channelId, callback)
      }
      
      // ✅ VERIFICAÇÃO: Verificar se estamos no cliente (não SSR)
      if (typeof window === 'undefined') {
        console.log('🚨🚨🚨 MessageService: SSR detected, skipping subscription')
        return this.createFallbackSubscription(channelId, callback)
      }
      
      // ✅ VERIFICAÇÃO: Verificar se o usuário está autenticado
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
      if (sessionError) {
        console.error('🚨🚨🚨 MessageService: Error getting session:', sessionError)
        return this.createFallbackSubscription(channelId, callback)
      }
      
      if (!session) {
        console.log('🚨🚨🚨 MessageService: User not authenticated, skipping subscription')
        return this.createFallbackSubscription(channelId, callback)
      }
      
      console.log('🚨🚨🚨 MessageService: User authenticated, creating subscription for channel:', channelId)
      console.log('🚨🚨🚨 MessageService: Session user ID:', session.user.id)
      
      // ✅ TENTATIVA: Criar subscription com timeout
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
          async (payload: any) => {
            console.log('🚨🚨🚨 MessageService: REAL-TIME MESSAGE RECEIVED! 🚨🚨🚨', { 
              channelId,
              messageId: payload.new?.id,
              content: payload.new?.content,
              authorId: payload.new?.author_id,
              timestamp: new Date().toISOString()
            });
            
            // ✅ BUSCAR DADOS DO AUTOR
            try {
              const { data: userData, error: userError } = await this.supabase
                .from('users')
                .select('id, display_name, username, handle, avatar_url, status')
                .eq('id', payload.new.author_id)
                .single()
              
              console.log('🔍 🔍 🔍 DIAGNÓSTICO COMPLETO 🔍 🔍 🔍')
              console.log('👤 Author ID buscado:', payload.new.author_id)
              console.log('👤 UserData retornado:', userData)
              console.log('👤 Display Name:', userData?.display_name)
              console.log('👤 Username:', userData?.username)
              console.log('👤 Handle:', userData?.handle)
              console.log('👤 Tem dados?', !!userData)
              console.log('👤 Erro:', userError)
              
              // ✅ CRIAR MENSAGEM COM DADOS DO AUTOR
              const transformedMessage: MessageWithAuthor = {
                id: payload.new.id,
                content: payload.new.content,
                type: payload.new.type,
                authorId: payload.new.author_id,
                channelId: payload.new.channel_id,
                dmId: payload.new.dm_id,
                createdAt: payload.new.created_at,
                updatedAt: payload.new.updated_at,
                attachmentName: payload.new.attachment_name,
                attachmentUrl: payload.new.attachment_url,
                dataAiHint: payload.new.data_ai_hint,
                reactions: [],
                // ✅ ADICIONAR: Dados do autor do banco de dados
                author: userData ? {
                  id: userData.id,
                  displayName: userData.display_name || userData.username || userData.handle || `Usuário ${payload.new.author_id.slice(0, 8)}`,
                  handle: userData.handle || userData.username || 'usuario',
                  avatarUrl: userData.avatar_url || 'https://i.pravatar.cc/40?u=default',
                  status: userData.status || 'offline'
                } : {
                  id: payload.new.author_id,
                  displayName: `Usuário ${payload.new.author_id.slice(0, 8)}`,
                  handle: `user_${payload.new.author_id.slice(0, 8)}`,
                  avatarUrl: 'https://i.pravatar.cc/40?u=unknown',
                  status: 'offline' as const
                }
              }
              
              console.log('✅ Enviando mensagem com autor:', transformedMessage.author.displayName)
              callback(transformedMessage)
            } catch (error) {
              console.error('❌ Erro ao buscar autor:', error)
              // Enviar mensagem mesmo sem dados do autor
              const transformedMessage: MessageWithAuthor = {
                id: payload.new.id,
                content: payload.new.content,
                type: payload.new.type,
                authorId: payload.new.author_id,
                channelId: payload.new.channel_id,
                dmId: payload.new.dm_id,
                createdAt: payload.new.created_at,
                updatedAt: payload.new.updated_at,
                attachmentName: payload.new.attachment_name,
                attachmentUrl: payload.new.attachment_url,
                dataAiHint: payload.new.data_ai_hint,
                reactions: [],
                author: {
                  id: payload.new.author_id,
                  displayName: 'Usuário Desconhecido',
                  handle: 'unknown',
                  avatarUrl: 'https://i.pravatar.cc/40?u=unknown',
                  status: 'offline' as const
                }
              }
              callback(transformedMessage)
            }
          }
        )
        .subscribe((status: any) => {
          console.log('🚨🚨🚨 MessageService: SUBSCRIPTION STATUS! 🚨🚨🚨', { 
            channelId,
            status,
            timestamp: new Date().toISOString()
          });
          
          // ✅ DEBUG: Verificar se subscription foi criada com sucesso
          if (status === 'SUBSCRIBED') {
            console.log('✅ MessageService: Subscription criada com sucesso!')
          } else if (status === 'CHANNEL_ERROR') {
            console.log('🔄 MessageService: Subscription falhou, usando fallback com polling')
            // ✅ FALLBACK: Se subscription falhar, usar polling
            return this.createFallbackSubscription(channelId, callback)
          } else if (status === 'TIMED_OUT') {
            console.log('⏰ MessageService: Timeout na subscription, usando fallback com polling')
            return this.createFallbackSubscription(channelId, callback)
          } else if (status === 'CLOSED') {
            console.log('🔒 MessageService: Subscription fechada!')
          }
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
        return this.createFallbackSubscription(channelId, callback)
      }
    } catch (error) {
      console.log('🔄 MessageService: Erro na subscription, usando fallback com polling:', error)
      // ✅ FALLBACK: Retornar subscription mock em caso de erro
      return this.createFallbackSubscription(channelId, callback)
    }
  }

  /**
   * ✅ FALLBACK: Criar subscription usando polling como alternativa
   * 
   * @param channelId - ID do canal para monitorar
   * @param callback - Função chamada quando uma nova mensagem é encontrada
   * @returns Subscription mock que pode ser cancelada
   * 
   * Funcionalidades:
   * - Cria um intervalo de polling a cada 3 segundos
   * - Busca a mensagem mais recente do canal
   * - Compara com a última mensagem conhecida
   * - Chama callback se encontrar nova mensagem
   * - Transforma mensagem para incluir dados do autor
   * - Retorna objeto com método unsubscribe
   */
  private createFallbackSubscription(channelId: string, callback: (message: MessageWithAuthor) => void) {
    console.log('🔄 MessageService: Creating fallback subscription with polling for channel:', channelId)
    
    let lastMessageId: string | null = null
    let isActive = true
    
    const pollInterval = setInterval(async () => {
      if (!isActive) return
      
      try {
        // Buscar mensagens mais recentes
        console.log('🔄 MessageService: Polling channel messages for:', channelId)
        
        if (!this.supabase) {
          console.error('🔄 MessageService: Supabase client not available for polling')
          return
        }
        
        // ✅ VALIDAÇÃO: Verificar se channelId é válido
        if (!channelId || channelId.trim() === '') {
          console.error('🔄 MessageService: Invalid channelId for polling:', channelId)
          return
        }
        
        const { data: messages, error } = await this.supabase
          .from('messages')
          .select('*')
          .eq('channel_id', channelId)
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (error) {
          console.error('🔄 MessageService: Error polling channel messages:', {
            error: error.message || error,
            code: error.code,
            details: error.details,
            hint: error.hint,
            channelId,
            fullError: JSON.stringify(error, null, 2)
          })
          return
        }
        
        console.log('🔄 MessageService: Channel polling result:', { messagesCount: messages?.length || 0, channelId })
        
        if (messages && messages.length > 0) {
          const latestMessage = messages[0]
          if (!lastMessageId || latestMessage.id !== lastMessageId) {
            lastMessageId = latestMessage.id
            console.log('🔄 MessageService: New message found via polling:', latestMessage.id)
            
            // ✅ BUSCAR DADOS DO AUTOR
            try {
              const { data: userData, error: userError } = await this.supabase
                .from('users')
                .select('id, display_name, username, handle, avatar_url, status')
                .eq('id', latestMessage.author_id)
                .single()
              
              console.log('🔍 [POLLING] Autor encontrado:', { 
                displayName: userData?.display_name,
                username: userData?.username,
                hasData: !!userData,
                error: userError?.message 
              })
              
              // ✅ CRIAR MENSAGEM COM DADOS DO AUTOR
              const transformedMessage: MessageWithAuthor = {
                id: latestMessage.id,
                content: latestMessage.content,
                type: latestMessage.type,
                authorId: latestMessage.author_id,
                channelId: latestMessage.channel_id,
                dmId: latestMessage.dm_id,
                createdAt: latestMessage.created_at,
                updatedAt: latestMessage.updated_at,
                attachmentName: latestMessage.attachment_name,
                attachmentUrl: latestMessage.attachment_url,
                dataAiHint: latestMessage.data_ai_hint,
                reactions: [],
                // ✅ ADICIONAR: Dados do autor do banco de dados
                author: userData ? {
                  id: userData.id,
                  displayName: userData.display_name || userData.username || userData.handle || `Usuário ${latestMessage.author_id.slice(0, 8)}`,
                  handle: userData.handle || userData.username || 'usuario',
                  avatarUrl: userData.avatar_url || 'https://i.pravatar.cc/40?u=default',
                  status: userData.status || 'offline'
                } : {
                  id: latestMessage.author_id,
                  displayName: `Usuário ${latestMessage.author_id.slice(0, 8)}`,
                  handle: `user_${latestMessage.author_id.slice(0, 8)}`,
                  avatarUrl: 'https://i.pravatar.cc/40?u=unknown',
                  status: 'offline' as const
                }
              }
              
              console.log('✅ [POLLING] Enviando mensagem com autor:', transformedMessage.author.displayName)
              callback(transformedMessage)
            } catch (error) {
              console.error('❌ [POLLING] Erro ao buscar autor:', error)
              // Enviar mensagem mesmo sem dados do autor
              const transformedMessage: MessageWithAuthor = {
                id: latestMessage.id,
                content: latestMessage.content,
                type: latestMessage.type,
                authorId: latestMessage.author_id,
                channelId: latestMessage.channel_id,
                dmId: latestMessage.dm_id,
                createdAt: latestMessage.created_at,
                updatedAt: latestMessage.updated_at,
                attachmentName: latestMessage.attachment_name,
                attachmentUrl: latestMessage.attachment_url,
                dataAiHint: latestMessage.data_ai_hint,
                reactions: [],
                author: {
                  id: latestMessage.author_id,
                  displayName: 'Usuário Desconhecido',
                  handle: 'unknown',
                  avatarUrl: 'https://i.pravatar.cc/40?u=unknown',
                  status: 'offline' as const
                }
              }
              callback(transformedMessage)
            }
          }
        }
      } catch (error) {
        console.error('🔄 MessageService: Error in polling:', error)
      }
    }, 3000) // Poll a cada 3 segundos (menos agressivo)
    
    return {
      unsubscribe: () => {
        console.log('🔄 MessageService: Stopping fallback polling for channel:', channelId)
        isActive = false
        clearInterval(pollInterval)
      }
    }
  }

  /**
   * Subscribe to real-time message updates for a specific DM
   */
  async subscribeToDMMessages(dmId: string, callback: (message: Message) => void) {
    console.log('🚨🚨🚨 MessageService: SUBSCRIBING TO DM! 🚨🚨🚨', { 
      dmId, 
      timestamp: new Date().toISOString() 
    });
    
    try {
      // ✅ VERIFICAÇÃO: Verificar se o cliente Supabase está disponível
      if (!this.supabase) {
        console.error('🚨🚨🚨 MessageService: Supabase client is null!')
        return this.createFallbackDMSubscription(dmId, callback)
      }
      
      // ✅ VERIFICAÇÃO: Verificar se estamos no cliente (não SSR)
      if (typeof window === 'undefined') {
        console.log('🚨🚨🚨 MessageService: SSR detected, skipping DM subscription')
        return this.createFallbackDMSubscription(dmId, callback)
      }
      
      // ✅ VERIFICAÇÃO: Verificar se o usuário está autenticado
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
      if (sessionError) {
        console.error('🚨🚨🚨 MessageService: Error getting session:', sessionError)
        return this.createFallbackDMSubscription(dmId, callback)
      }
      
      if (!session) {
        console.log('🚨🚨🚨 MessageService: User not authenticated, skipping DM subscription')
        return this.createFallbackDMSubscription(dmId, callback)
      }
      
      console.log('🚨🚨🚨 MessageService: User authenticated, creating DM subscription for:', dmId)
      console.log('🚨🚨🚨 MessageService: Session user ID:', session.user.id)
      
      // ✅ TENTATIVA: Criar subscription com timeout
      const channel = this.supabase.channel(`realtime:dm:${dmId}`)
      
      const subscription = channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `dm_id=eq.${dmId}`
          },
          async (payload: any) => {
            console.log('🚨🚨🚨 MessageService: REAL-TIME DM MESSAGE RECEIVED! 🚨🚨🚨', {
              dmId,
              messageId: payload.new?.id,
              content: payload.new?.content,
              authorId: payload.new?.author_id,
              timestamp: new Date().toISOString()
            })
            
            // ✅ BUSCAR DADOS DO AUTOR
            try {
              const { data: userData, error: userError } = await this.supabase
                .from('users')
                .select('id, display_name, username, handle, avatar_url, status')
                .eq('id', payload.new.author_id)
                .single()
              
              console.log('🔍 [DM REALTIME] Autor encontrado:', { 
                displayName: userData?.display_name,
                username: userData?.username,
                hasData: !!userData,
                error: userError?.message 
              })
              
              // ✅ CRIAR MENSAGEM COM DADOS DO AUTOR
              const messageWithAuthor = {
                ...payload.new,
                authorId: payload.new.author_id, // ✅ GARANTIR que authorId está presente
                author: userData ? {
                  id: userData.id,
                  displayName: userData.display_name || userData.username || userData.handle || `Usuário ${payload.new.author_id.slice(0, 8)}`,
                  handle: userData.handle || userData.username || 'usuario',
                  avatarUrl: userData.avatar_url || 'https://i.pravatar.cc/40?u=default',
                  status: userData.status || 'offline'
                } : {
                  id: payload.new.author_id,
                  displayName: `Usuário ${payload.new.author_id.slice(0, 8)}`,
                  handle: `user_${payload.new.author_id.slice(0, 8)}`,
                  avatarUrl: 'https://i.pravatar.cc/40?u=unknown',
                  status: 'offline' as const
                }
              }
              
              console.log('✅ [DM REALTIME] Enviando mensagem com autor:', messageWithAuthor.author.displayName)
              console.log('📤 [DM REALTIME] Payload completo:', JSON.stringify(messageWithAuthor, null, 2))
              console.log('📤 [DM REALTIME] UserData completo:', JSON.stringify(userData, null, 2))
              callback(messageWithAuthor as Message)
            } catch (error) {
              console.error('❌ [DM REALTIME] Erro ao buscar autor:', error)
              // Enviar mensagem mesmo sem dados do autor
              callback(payload.new as Message)
            }
          }
        )
        .subscribe((status: any) => {
          console.log('🚨🚨🚨 MessageService: DM SUBSCRIPTION STATUS! 🚨🚨🚨', {
            dmId,
            status,
            timestamp: new Date().toISOString()
          });

          if (status === 'SUBSCRIBED') {
            console.log('✅ MessageService: DM Subscription criada com sucesso!')
          } else if (status === 'CHANNEL_ERROR') {
            console.log('🔄 MessageService: DM Subscription falhou, usando fallback com polling')
            return this.createFallbackDMSubscription(dmId, callback)
          } else if (status === 'TIMED_OUT') {
            console.log('⏰ MessageService: Timeout na DM subscription, usando fallback com polling')
            return this.createFallbackDMSubscription(dmId, callback)
          } else if (status === 'CLOSED') {
            console.log('🔒 MessageService: DM Subscription fechada!')
          }
        })

      console.log('🚨🚨🚨 MessageService: DM SUBSCRIPTION CREATED! 🚨🚨🚨', {
        dmId,
        timestamp: new Date().toISOString()
      });

      if (subscription && typeof subscription.unsubscribe === 'function') {
        return subscription
      } else {
        console.log('🚨🚨🚨 MessageService: DM Subscription created but unsubscribe method not available')
        return this.createFallbackDMSubscription(dmId, callback)
      }
    } catch (error) {
      console.log('🔄 MessageService: Erro na DM subscription, usando fallback com polling:', error)
      return this.createFallbackDMSubscription(dmId, callback)
    }
  }

  /**
   * ✅ FALLBACK: Criar subscription usando polling como alternativa para DMs
   */
  private createFallbackDMSubscription(dmId: string, callback: (message: Message) => void) {
    console.log('🔄 MessageService: Creating fallback DM subscription with polling for:', dmId)
    
    let lastMessageId: string | null = null
    let isActive = true
    
    const pollInterval = setInterval(async () => {
      if (!isActive) return
      
      try {
        // Buscar mensagens mais recentes da DM
        console.log('🔄 MessageService: Polling DM messages for:', dmId)
        
        if (!this.supabase) {
          console.error('🔄 MessageService: Supabase client not available for polling')
          return
        }
        
        // ✅ DEBUG: Verificar se o cliente Supabase está funcionando
        try {
          const { data: testData, error: testError } = await this.supabase
            .from('messages')
            .select('id')
            .limit(1)
          
          console.log('🔄 MessageService: Supabase connection test:', {
            hasTestData: !!testData,
            hasTestError: !!testError,
            testErrorType: typeof testError,
            dmId
          })
        } catch (testErr) {
          console.error('🔄 MessageService: Supabase connection test failed:', testErr)
          return
        }
        
        // ✅ VALIDAÇÃO: Verificar se dmId é válido
        if (!dmId || dmId.trim() === '') {
          console.error('🔄 MessageService: Invalid dmId for polling:', dmId)
          return
        }
        
        // ✅ CONVERSÃO: Converter ID mock para UUID real se necessário
        let realDmId = dmId
        if (this.isMockDMId(dmId)) {
          console.log('🔄 MessageService: Converting mock DM ID to real UUID:', dmId)
          realDmId = await this.getRealDMId(dmId)
          console.log('🔄 MessageService: Using real DM ID for polling:', realDmId)
        }
        
        // ✅ VALIDAÇÃO: Verificar se o ID final é um UUID válido
        if (!this.isValidUUID(realDmId)) {
          console.error('🔄 MessageService: Final dmId is not a valid UUID:', realDmId)
          return
        }
        
        const { data: messages, error } = await this.supabase
          .from('messages')
          .select('*')
          .eq('dm_id', realDmId)
          .order('created_at', { ascending: false })
          .limit(1)
        
        console.log('🔄 MessageService: DM polling query completed:', {
          originalDmId: dmId,
          realDmId: realDmId,
          hasData: !!messages,
          dataLength: messages?.length || 0,
          hasError: !!error,
          errorType: typeof error,
          errorKeys: error ? Object.keys(error) : [],
          timestamp: new Date().toISOString()
        })
        
        if (error) {
          console.error('🔄 MessageService: Error polling DM messages:', {
            error: error.message || error,
            code: error.code,
            details: error.details,
            hint: error.hint,
            originalDmId: dmId,
            realDmId: realDmId,
            fullError: JSON.stringify(error, null, 2)
          })
          return
        }
        
        console.log('🔄 MessageService: Polling result:', { messagesCount: messages?.length || 0, originalDmId: dmId, realDmId: realDmId })
        
                  if (messages && messages.length > 0) {
          const latestMessage = messages[0]
          if (!lastMessageId || latestMessage.id !== lastMessageId) {
            lastMessageId = latestMessage.id
            console.log('🔄 MessageService: New DM message found via polling:', latestMessage.id)
            
            // ✅ BUSCAR DADOS DO AUTOR
            try {
              const { data: userData, error: userError } = await this.supabase
                .from('users')
                .select('id, display_name, username, handle, avatar_url, status')
                .eq('id', latestMessage.author_id)
                .single()
              
              console.log('🔍 [POLLING DM] Autor encontrado:', { 
                displayName: userData?.display_name,
                username: userData?.username,
                hasData: !!userData,
                error: userError?.message 
              })
              
              // ✅ CRIAR MENSAGEM COM DADOS DO AUTOR
              const transformedMessage: MessageWithAuthor = {
                id: latestMessage.id,
                content: latestMessage.content,
                type: latestMessage.type,
                authorId: latestMessage.author_id,
                channelId: latestMessage.channel_id,
                dmId: latestMessage.dm_id,
                createdAt: latestMessage.created_at,
                updatedAt: latestMessage.updated_at,
                attachmentName: latestMessage.attachment_name,
                attachmentUrl: latestMessage.attachment_url,
                dataAiHint: latestMessage.data_ai_hint,
                reactions: [],
                author: userData ? {
                  id: userData.id,
                  displayName: userData.display_name || userData.username || userData.handle || `Usuário ${latestMessage.author_id.slice(0, 8)}`,
                  handle: userData.handle || userData.username || 'usuario',
                  avatarUrl: userData.avatar_url || 'https://i.pravatar.cc/40?u=default',
                  status: userData.status || 'offline'
                } : {
                  id: latestMessage.author_id,
                  displayName: `Usuário ${latestMessage.author_id.slice(0, 8)}`,
                  handle: `user_${latestMessage.author_id.slice(0, 8)}`,
                  avatarUrl: 'https://i.pravatar.cc/40?u=unknown',
                  status: 'offline' as const
                }
              }
              
              console.log('✅ [POLLING DM] Enviando mensagem com autor:', transformedMessage.author.displayName)
              console.log('📤 [POLLING DM] Payload completo:', JSON.stringify(transformedMessage, null, 2))
              console.log('📤 [POLLING DM] UserData:', JSON.stringify(userData, null, 2))
              callback(transformedMessage as Message)
            } catch (error) {
              console.error('❌ [POLLING DM] Erro ao buscar autor:', error)
              // Enviar mensagem mesmo sem dados do autor
              const transformedMessage = {
                ...latestMessage,
                author: {
                  id: latestMessage.author_id,
                  displayName: 'Usuário Desconhecido',
                  handle: 'unknown',
                  avatarUrl: 'https://i.pravatar.cc/40?u=unknown',
                  status: 'offline' as const
                }
              }
              callback(transformedMessage as Message)
            }
          }
        }
      } catch (error) {
        console.error('🔄 MessageService: Error in DM polling:', error)
      }
    }, 3000) // Poll a cada 3 segundos (menos agressivo)
    
    return {
      unsubscribe: () => {
        console.log('🔄 MessageService: Stopping fallback DM polling for:', dmId)
        isActive = false
        clearInterval(pollInterval)
      }
    }
  }

  /**
   * ✅ TEMPO REAL WORKSPACE: Inscreve-se para receber mensagens de todos os canais do workspace
   * 
   * @param workspaceId - ID do workspace para monitorar
   * @param callback - Função chamada quando uma nova mensagem é recebida
   * @returns Subscription que pode ser cancelada
   * 
   * Funcionalidades:
   * - Cria subscription para todas as mensagens do workspace
   * - Monitora mudanças na tabela messages
   * - Transforma mensagens recebidas para incluir dados do autor
   * - Retorna subscription mock em caso de erro
   * 
   * Nota: Como messages não tem workspace_id, monitora todas as mensagens
   * Em uma app real, você filtraria por channel_id baseado nos canais do workspace
   */
  subscribeToWorkspaceMessages(workspaceId: string, callback: (message: MessageWithAuthor) => void) {
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
            
            // ✅ CORREÇÃO: Transformar mensagem antes de chamar callback
            const transformedMessage: MessageWithAuthor = {
              id: payload.new.id,
              content: payload.new.content,
              type: payload.new.type,
              authorId: payload.new.author_id,
              channelId: payload.new.channel_id,
              dmId: payload.new.dm_id,
              createdAt: payload.new.created_at,
              updatedAt: payload.new.updated_at,
              attachmentName: payload.new.attachment_name,
              attachmentUrl: payload.new.attachment_url,
              dataAiHint: payload.new.data_ai_hint,
              reactions: [],
              // ✅ ADICIONAR: Dados do autor (será buscado no hook useWorkspaceMessages)
              author: {
                id: payload.new.author_id,
                displayName: 'Carregando...',
                handle: 'loading',
                avatarUrl: '',
                status: 'offline' as const
              }
            }
            
            callback(transformedMessage)
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
   * ✅ VALIDAR UUID: Verifica se uma string é um UUID válido
   * 
   * @param uuid - String a ser validada
   * @returns true se for UUID válido, false caso contrário
   * 
   * Funcionalidades:
   * - Usa regex para validar formato UUID v4
   * - Aceita UUIDs em minúsculas ou maiúsculas
   * - Retorna boolean para facilitar uso em condicionais
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  /**
   * ✅ VERIFICAR CANAL MOCK: Verifica se uma string é um ID de canal mock
   * 
   * @param str - String a ser verificada
   * @returns true se for ID mock, false caso contrário
   * 
   * Funcionalidades:
   * - Verifica se é número simples (1, 2, 3, etc.)
   * - Verifica se é nome de canal conhecido
   * - Usado para identificar canais mock vs UUIDs reais
   */
  private isMockChannelId(str: string): boolean {
    // Mock channels use simple IDs like '1', '2', '3' or channel names like 'general', 'design-system'
    return /^[1-9]\d*$/.test(str) || ['general', 'design-system', 'project-pegasus'].includes(str)
  }

  /**
   * ✅ MAPEAR CANAL REAL: Converte ID mock de canal para UUID real
   * 
   * @param mockChannelId - ID mock do canal
   * @returns UUID real correspondente
   * 
   * Funcionalidades:
   * - Mapeia IDs numéricos para UUIDs específicos
   * - Mapeia nomes de canais para UUIDs específicos
   * - Retorna o próprio ID se não for mock
   * - Usado para compatibilidade com banco de dados real
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
   * ✅ GERAR UUID: Gera um UUID válido para mensagens mock
   * 
   * @returns UUID v4 válido
   * 
   * Funcionalidades:
   * - Usa algoritmo padrão para gerar UUID v4
   * - Substitui caracteres 'x' e 'y' por valores aleatórios
   * - Retorna string no formato UUID padrão
   * - Usado para criar IDs únicos em dados mock
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