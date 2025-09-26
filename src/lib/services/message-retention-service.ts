import { createClient } from '@/lib/supabase/client'

export interface MessageRetentionConfig {
  retentionDays: number
  autoArchive: boolean
  workspaceId: string
}

export interface ArchivedMessage {
  id: string
  content: string
  channelId: string
  userId: string
  createdAt: string
  archivedAt: string
}

export class MessageRetentionService {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Processa a retenção de mensagens baseada na configuração
   */
  async processMessageRetention(config: MessageRetentionConfig): Promise<{
    archivedCount: number
    archivedMessages: ArchivedMessage[]
    errors: string[]
  }> {
    try {
      const retentionDate = new Date()
      retentionDate.setDate(retentionDate.getDate() - config.retentionDays)
      
      console.log(`🗄️ Processando retenção de mensagens para workspace ${config.workspaceId}`)
      console.log(`📅 Arquivando mensagens anteriores a: ${retentionDate.toISOString()}`)

      // Buscar mensagens antigas
      const { data: oldMessages, error: fetchError } = await this.supabase
        .from('messages')
        .select(`
          id,
          content,
          channel_id,
          author_id,
          created_at,
          channels(workspace_id)
        `)
        .eq('channels.workspace_id', config.workspaceId)
        .lt('created_at', retentionDate.toISOString())
        .order('created_at', { ascending: true })

      if (fetchError) {
        console.error('Erro ao buscar mensagens antigas:', JSON.stringify(fetchError, null, 2))
        return {
          archivedCount: 0,
          archivedMessages: [],
          errors: [`Erro ao buscar mensagens: ${fetchError.message || 'Erro desconhecido'}`]
        }
      }

      if (!oldMessages || oldMessages.length === 0) {
        console.log('✅ Nenhuma mensagem antiga encontrada para arquivar')
        return {
          archivedCount: 0,
          archivedMessages: [],
          errors: []
        }
      }

      console.log(`📦 Encontradas ${oldMessages.length} mensagens para arquivar`)

      // Criar registros de arquivamento
      const archivedMessages: ArchivedMessage[] = oldMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        channelId: msg.channel_id,
        userId: msg.author_id, // ✅ CORRIGIDO: Usar author_id em vez de user_id
        createdAt: msg.created_at,
        archivedAt: new Date().toISOString()
      }))

      // Em uma implementação real, você moveria as mensagens para uma tabela de arquivo
      // Por enquanto, vamos simular o processo
      const { error: archiveError } = await this.supabase
        .from('archived_messages')
        .insert(archivedMessages.map(msg => ({
          original_message_id: msg.id,
          content: msg.content,
          channel_id: msg.channelId,
          user_id: msg.userId,
          created_at: msg.createdAt,
          archived_at: msg.archivedAt,
          workspace_id: config.workspaceId
        })))

      if (archiveError) {
        console.error('Erro ao arquivar mensagens:', archiveError)
        return {
          archivedCount: 0,
          archivedMessages: [],
          errors: [`Erro ao arquivar mensagens: ${archiveError.message}`]
        }
      }

      // Remover mensagens originais (opcional - pode manter para auditoria)
      if (config.autoArchive) {
        const { error: deleteError } = await this.supabase
          .from('messages')
          .delete()
          .in('id', oldMessages.map(msg => msg.id))

        if (deleteError) {
          console.error('Erro ao remover mensagens originais:', deleteError)
          return {
            archivedCount: archivedMessages.length,
            archivedMessages,
            errors: [`Mensagens arquivadas, mas erro ao remover originais: ${deleteError.message}`]
          }
        }
      }

      console.log(`✅ ${archivedMessages.length} mensagens arquivadas com sucesso`)
      
      return {
        archivedCount: archivedMessages.length,
        archivedMessages,
        errors: []
      }

    } catch (error) {
      console.error('Erro geral no processamento de retenção:', error)
      return {
        archivedCount: 0,
        archivedMessages: [],
        errors: [`Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]
      }
    }
  }

  /**
   * Obtém estatísticas de retenção para um workspace
   */
  async getRetentionStats(workspaceId: string, retentionDays: number): Promise<{
    totalMessages: number
    messagesToArchive: number
    archivedMessages: number
    oldestMessage: string | null
    newestMessage: string | null
  }> {
    try {
      const retentionDate = new Date()
      retentionDate.setDate(retentionDate.getDate() - retentionDays)

      // Contar total de mensagens
      const { count: totalMessages } = await this.supabase
        .from('messages')
        .select('*, channels(workspace_id)', { count: 'exact', head: true })
        .eq('channels.workspace_id', workspaceId)

      // Contar mensagens para arquivar
      const { count: messagesToArchive } = await this.supabase
        .from('messages')
        .select('*, channels(workspace_id)', { count: 'exact', head: true })
        .eq('channels.workspace_id', workspaceId)
        .lt('created_at', retentionDate.toISOString())

      // Contar mensagens já arquivadas
      const { count: archivedMessages } = await this.supabase
        .from('archived_messages')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)

      // Buscar mensagem mais antiga
      const { data: oldestMessage } = await this.supabase
        .from('messages')
        .select('created_at, channels(workspace_id)')
        .eq('channels.workspace_id', workspaceId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      // Buscar mensagem mais recente
      const { data: newestMessage } = await this.supabase
        .from('messages')
        .select('created_at, channels(workspace_id)')
        .eq('channels.workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      return {
        totalMessages: totalMessages || 0,
        messagesToArchive: messagesToArchive || 0,
        archivedMessages: archivedMessages || 0,
        oldestMessage: oldestMessage?.created_at || null,
        newestMessage: newestMessage?.created_at || null
      }

    } catch (error) {
      console.error('Erro ao obter estatísticas de retenção:', error)
      return {
        totalMessages: 0,
        messagesToArchive: 0,
        archivedMessages: 0,
        oldestMessage: null,
        newestMessage: null
      }
    }
  }

  /**
   * Restaura mensagens arquivadas (opcional)
   */
  async restoreArchivedMessages(messageIds: string[]): Promise<{
    restoredCount: number
    errors: string[]
  }> {
    try {
      // Buscar mensagens arquivadas
      const { data: archivedMessages, error: fetchError } = await this.supabase
        .from('archived_messages')
        .select('*')
        .in('original_message_id', messageIds)

      if (fetchError) {
        return {
          restoredCount: 0,
          errors: [`Erro ao buscar mensagens arquivadas: ${fetchError.message}`]
        }
      }

      if (!archivedMessages || archivedMessages.length === 0) {
        return {
          restoredCount: 0,
          errors: ['Nenhuma mensagem arquivada encontrada']
        }
      }

      // Restaurar mensagens
      const messagesToRestore = archivedMessages.map(msg => ({
        id: msg.original_message_id,
        content: msg.content,
        channel_id: msg.channel_id,
        author_id: msg.user_id, // ✅ CORRIGIDO: Usar author_id para a tabela messages
        created_at: msg.created_at
      }))

      const { error: restoreError } = await this.supabase
        .from('messages')
        .insert(messagesToRestore)

      if (restoreError) {
        return {
          restoredCount: 0,
          errors: [`Erro ao restaurar mensagens: ${restoreError.message}`]
        }
      }

      // Remover do arquivo
      const { error: deleteError } = await this.supabase
        .from('archived_messages')
        .delete()
        .in('original_message_id', messageIds)

      if (deleteError) {
        return {
          restoredCount: messagesToRestore.length,
          errors: [`Mensagens restauradas, mas erro ao remover do arquivo: ${deleteError.message}`]
        }
      }

      return {
        restoredCount: messagesToRestore.length,
        errors: []
      }

    } catch (error) {
      return {
        restoredCount: 0,
        errors: [`Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]
      }
    }
  }
}

// Instância singleton
export const messageRetentionService = new MessageRetentionService()
