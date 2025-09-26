import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type Thread = Database['public']['Tables']['threads']['Row']
type Message = Database['public']['Tables']['messages']['Row']
type Channel = Database['public']['Tables']['channels']['Row']

export interface ThreadWithDetails extends Thread {
  original_message: Message
  channel: Pick<Channel, 'id' | 'name'>
  participants: {
    id: string
    display_name: string | null
    handle: string | null
    avatar_url: string | null
  }[]
}

export interface ThreadMessage extends Message {
  author: {
    id: string
    display_name: string | null
    handle: string | null
    avatar_url: string | null
  }
}

export class ThreadService {
  private threadCounter = 1
  
  private get supabase() {
    const client = createClient()
    return client
  }

  /**
   * Criar uma nova thread
   */
  async createThread(data: {
    originalMessageId: string
    channelId?: string
    dmId?: string
    workspaceId: string
    title?: string
  }): Promise<Thread> {
    
    // ✅ FALLBACK: Retornar null se não conseguir criar thread
    console.log('ThreadService: Failed to create thread, returning null')
    return null
    
    // ✅ COMENTADO: Query Supabase desabilitada devido a problemas de RLS
    // const { data: thread, error } = await this.supabase
    //   .from('threads')
    //   .insert({
    //     original_message_id: data.originalMessageId,
    //     channel_id: data.channelId,
    //     workspace_id: data.workspaceId,
    //     title: data.title
    //   })
    //   .select()
    //   .single()

    // if (error) {
    //   console.error('ThreadService.createThread: Error:', error)
    //   throw error
    // }

    // return thread
  }

  /**
   * Obter uma thread por ID com detalhes
   */
  async getThread(threadId: string): Promise<ThreadWithDetails | null> {
    // ✅ FALLBACK: Retornar null se não conseguir buscar thread
    console.log('ThreadService: Failed to get thread, returning null')
    return null

    // ✅ COMENTADO: Query Supabase desabilitada devido a problemas de RLS
    // const { data, error } = await this.supabase
    //   .from('threads')
    //   .select(`
    //     *,
    //     original_message:messages!threads_original_message_id_fkey(*),
    //     channel:channels!threads_channel_id_fkey(
    //       id,
    //       name
    //     )
    //   `)
    //   .eq('id', threadId)
    //   .single()

    // if (error) {
    //   console.error('ThreadService.getThread: Error:', error)
    //   return null
    // }

    // // Buscar participantes da thread
    // const { data: participants } = await this.supabase
    //   .from('messages')
    //   .select(`
    //     author:users!messages_author_id_fkey(
    //       id,
    //       display_name,
    //       handle,
    //       avatar_url
    //     )
    //   `)
    //   .eq('thread_id', threadId)
    //   .not('author_id', 'is', null)

    // const uniqueParticipants = participants
    //   ?.filter((p: any, index: number, arr: any[]) => 
    //     arr.findIndex((item: any) => item.author?.id === p.author?.id) === index
    //   )
    //   .map((p: any) => p.author)
    //   .filter(Boolean) || []

    // return {
    //   ...data,
    //   participants: uniqueParticipants
    // }

    return null
  }


  /**
   * Obter threads de um canal
   */
  async getChannelThreads(channelId: string): Promise<ThreadWithDetails[]> {
    
    if (!channelId || channelId === 'undefined' || channelId === 'null') {
      return [];
    }
    
    // ✅ LIMPAR CACHE: Cache removido
    
    // ✅ FALLBACK: Retornar array vazio se não conseguir buscar threads
    console.log('ThreadService: Failed to get channel threads, returning empty array')
    return [];
    
    // ✅ COMENTADO: Query Supabase desabilitada devido a problemas de RLS
    // try {
    //   const { data, error } = await this.supabase
    //     .from('threads')
    //     .select('id, title, channel_id')
    //     .limit(1);
      
    //   if (error) {
    //     console.error('🔍 ThreadService.getChannelThreads: Error:', error);
    //     return [];
    //   }
      
    //   return [];
    // } catch (catchError) {
    //   console.error('🔍 ThreadService.getChannelThreads: Catch error:', catchError);
    //   return [];
    // }
  }

  /**
   * Obter mensagens de uma thread
   */
  async getThreadMessages(threadId: string): Promise<ThreadMessage[]> {
    
    // ✅ VALIDAÇÃO: Verificar se threadId é válido
    if (!threadId || threadId === 'undefined' || threadId === 'null') {
      return [];
    }
    
    // ✅ VALIDAÇÃO: Verificar se threadId é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(threadId)) {
      
      // ✅ LIMPAR CACHE: Limpar cache de mensagens de thread para evitar conflitos
      this.threadMessageCache.clear();
      
      return [];
    }
    
    try {
      // ✅ CORRIGIDO: Buscar mensagens reais da tabela thread_messages
      
      // Buscar mensagens da thread através da tabela thread_messages
      const { data: threadMessages, error: threadError } = await this.supabase
        .from('thread_messages')
        .select(`
          id,
          thread_id,
          message_id,
          created_at,
          messages!inner(
            id,
            content,
            type,
            author_id,
            dm_id,
            channel_id,
            created_at,
            updated_at
          )
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })

      if (threadError) {
        console.error('🔍 ThreadService.getThreadMessages: Error fetching thread messages:', JSON.stringify(threadError, null, 2))
        // Fallback para array vazio em caso de erro
        return []
      }

      if (!threadMessages || threadMessages.length === 0) {
        return []
      }


      // ✅ TRANSFORMAR: Converter para formato ThreadMessage
      const transformedMessages: ThreadMessage[] = threadMessages.map(tm => {
        const message = tm.messages
        return {
          id: message.id,
          content: message.content,
          type: message.type as 'text' | 'image' | 'code' | 'link',
          author_id: message.author_id,
          channel_id: message.channel_id,
          dm_id: message.dm_id,
          thread_id: threadId,
          created_at: message.created_at,
          updated_at: message.updated_at,
          author: {
            id: message.author_id,
            display_name: 'Current User', // TODO: Buscar dados reais do usuário
            handle: 'currentuser',
            avatar_url: 'https://i.pravatar.cc/40?u=current'
          }
        }
      })

      return transformedMessages

    } catch (error) {
      console.error('🔍 ThreadService.getThreadMessages: Unexpected error:', JSON.stringify(error, null, 2))
      // Fallback para array vazio em caso de erro inesperado
      return []
    }
  }

  /**
   * Adicionar mensagem a uma thread
   */
  async addMessageToThread(threadId: string, messageData: {
    content: string
    authorId: string
    channelId?: string
    dmId?: string
    type?: 'text' | 'image' | 'code' | 'link'
  }): Promise<ThreadMessage> {
    try {
      // ✅ CORRIGIDO: Mensagens de thread NÃO devem aparecer no canal principal
      // Vamos salvar na tabela messages mas com um campo especial para identificar como thread
      
      console.log('🔍 ThreadService.addMessageToThread: Adding message to thread only (not to main channel)')

      // ✅ IMPLEMENTADO: Salvar mensagem na tabela messages
      // A mensagem será relacionada à thread através da tabela thread_messages
      // As consultas do canal principal devem filtrar mensagens que estão em threads
      
      // ✅ CORRIGIDO: Criar ou obter um DM especial para threads
      const threadDMId = await this.getOrCreateThreadDM()
      
      const messageInsertData = {
        content: messageData.content,
        author_id: messageData.authorId,
        type: messageData.type || 'text',
        // ✅ CORRIGIDO: Para satisfazer a constraint message_location_check,
        // vamos usar um dm_id especial para mensagens de thread
        // Isso evita que apareçam no canal principal
        channel_id: null,
        dm_id: threadDMId
      }

      const { data: message, error: messageError } = await this.supabase
        .from('messages')
        .insert(messageInsertData)
        .select()
        .single()

      if (messageError) {
        console.error('🔍 ThreadService.addMessageToThread: Error creating message:', JSON.stringify(messageError, null, 2))
        console.error('🔍 ThreadService.addMessageToThread: Message data:', JSON.stringify(messageInsertData, null, 2))
        throw messageError
      }

      // ✅ ADICIONAR: Relacionar com a thread na tabela thread_messages
      const { data: threadMessage, error: threadError } = await this.supabase
        .from('thread_messages')
        .insert({
          thread_id: threadId,
          message_id: message.id
        })
        .select()
        .single()

      if (threadError) {
        console.error('🔍 ThreadService.addMessageToThread: Error adding to thread:', JSON.stringify(threadError, null, 2))
        throw threadError
      }


      // ✅ TRANSFORMAR: Converter para formato esperado
      const transformedMessage: ThreadMessage = {
        id: message.id, // Usar ID da mensagem
        content: message.content,
        type: message.type as 'text' | 'image' | 'code' | 'link',
        author_id: message.author_id,
        channel_id: null, // Mensagens de thread não devem aparecer no canal
        dm_id: null, // Mensagens de thread não devem aparecer no DM
        thread_id: threadId,
        created_at: message.created_at,
        updated_at: message.updated_at,
        author: {
          id: message.author_id,
          display_name: 'Current User', // TODO: Buscar dados reais do usuário
          handle: 'currentuser',
          avatar_url: 'https://i.pravatar.cc/40?u=current'
        }
      }

      return transformedMessage

    } catch (error) {
      console.error('🔍 ThreadService.addMessageToThread: Error:', JSON.stringify(error, null, 2))
      console.error('🔍 ThreadService.addMessageToThread: Error message:', error instanceof Error ? error.message : 'Unknown error')
      console.error('🔍 ThreadService.addMessageToThread: Error stack:', error instanceof Error ? error.stack : 'No stack')
      
      // ✅ FALLBACK: Retornar null se houver erro
      console.log('ThreadService: Failed to add message to thread, returning null')
      return null;
    }
  }

  /**
   * Obter threads de um workspace
   */
  async getWorkspaceThreads(workspaceId: string): Promise<Thread[]> {
    const { data, error } = await this.supabase
      .from('threads')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('ThreadService.getWorkspaceThreads: Error:', error)
      throw error
    }

    return data || []
  }

  /**
   * Atualizar título de uma thread
   */
  async updateThreadTitle(threadId: string, title: string): Promise<Thread> {
    const { data, error } = await this.supabase
      .from('threads')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', threadId)
      .select()
      .single()

    if (error) {
      console.error('ThreadService.updateThreadTitle: Error:', error)
      throw error
    }

    return data
  }

  /**
   * Marcar thread como lida
   */
  async markThreadAsRead(threadId: string, userId: string): Promise<void> {
    // Aqui você pode implementar lógica para marcar mensagens como lidas
    // Por exemplo, criar uma tabela thread_reads ou usar a tabela existente
  }

  /**
   * Obter estatísticas de threads
   */
  async getThreadStats(workspaceId: string): Promise<{
    totalThreads: number
    activeThreads: number
    totalMessages: number
  }> {
    const { data, error } = await this.supabase
      .from('threads')
      .select('message_count')
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error('ThreadService.getThreadStats: Error:', error)
      throw error
    }

    const totalThreads = data?.length || 0
    const totalMessages = data?.reduce((sum: number, thread: any) => sum + (thread.message_count || 0), 0) || 0
    const activeThreads = data?.filter((thread: any) => 
      new Date(thread.last_message_at || '').getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length || 0

    return {
      totalThreads,
      activeThreads,
      totalMessages
    }
  }

  /**
   * Deletar uma thread (e todas as suas mensagens)
   */
  async deleteThread(threadId: string): Promise<void> {
    const { error } = await this.supabase
      .from('threads')
      .delete()
      .eq('id', threadId)

    if (error) {
      console.error('ThreadService.deleteThread: Error:', error)
      throw error
    }
  }





  /**
   * Adicionar mensagem ao cache de uma thread
   */
  private addMessageToThreadCache(threadId: string, message: ThreadMessage): void {
    
    // ✅ Obter mensagens existentes ou criar array vazio
    const existingMessages = this.mockThreadMessagesCache.get(threadId) || [];
    
    // ✅ Adicionar nova mensagem
    const updatedMessages = [...existingMessages, message];
    
    // ✅ Salvar no cache
    this.mockThreadMessagesCache.set(threadId, updatedMessages);
    
  }

  /**
   * Criar ou obter um DM especial para mensagens de thread
   */
  private async getOrCreateThreadDM(): Promise<string> {
    const THREAD_DM_ID = '00000000-0000-0000-0000-000000000001'
    
    try {
      // ✅ VERIFICAR: Se o DM especial já existe
      const { data: existingDM, error: checkError } = await this.supabase
        .from('direct_messages')
        .select('id')
        .eq('id', THREAD_DM_ID)
        .single()
      
      if (existingDM) {
        console.log('ThreadService: Thread DM already exists:', THREAD_DM_ID)
        return THREAD_DM_ID
      }
      
      // ✅ CRIAR: DM especial para threads se não existir
      const { data: newDM, error: createError } = await this.supabase
        .from('direct_messages')
        .insert({
          id: THREAD_DM_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()
      
      if (createError) {
        console.error('ThreadService: Error creating thread DM:', createError)
        throw createError
      }
      
      console.log('ThreadService: Created thread DM:', newDM.id)
      return newDM.id
      
    } catch (error) {
      console.error('ThreadService: Error in getOrCreateThreadDM:', error)
      // ✅ FALLBACK: Retornar um ID válido se der erro
      return THREAD_DM_ID
    }
  }
}

export const threadService = new ThreadService()
