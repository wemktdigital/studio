import { createClient } from '@/lib/supabase/client'

export interface ActivityItem {
  id: string
  type: 'message' | 'mention' | 'reaction' | 'thread' | 'channel_join' | 'channel_leave'
  title: string
  description: string
  time: string
  unread: boolean
  channelId?: string
  userId?: string
  userName?: string
  channelName?: string
  created_at: string
  workspace_id: string
}

export class ActivityService {
  private supabase = createClient()

  /**
   * Buscar atividades reais do workspace
   */
  async getWorkspaceActivities(workspaceId: string, currentUserId: string): Promise<ActivityItem[]> {
    try {
      console.log('🔍 ActivityService: Fetching activities for workspace:', workspaceId)

      const activities: ActivityItem[] = []

      // Buscar mensagens recentes (simplificado)
      const { data: messages, error: messagesError } = await this.supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          author_id,
          channel_id
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (messagesError) {
        console.error('ActivityService: Error fetching messages:', messagesError)
      } else if (messages) {
        // Buscar informações dos canais para as mensagens
        const channelIds = [...new Set(messages.map(m => m.channel_id))]
        const { data: channels } = await this.supabase
          .from('channels')
          .select('id, name, workspace_id')
          .in('id', channelIds)
          .eq('workspace_id', workspaceId)

        // Buscar informações dos usuários
        const userIds = [...new Set(messages.map(m => m.author_id))]
        const { data: users } = await this.supabase
          .from('users')
          .select('id, display_name, handle')
          .in('id', userIds)

        // Filtrar mensagens que contêm menções e estão no workspace correto
        for (const message of messages) {
          const channel = channels?.find(c => c.id === message.channel_id)
          if (!channel) continue

          // Verificar se a mensagem contém menção ao usuário atual
          if (message.content.includes(`@${currentUserId}`)) {
            const author = users?.find(u => u.id === message.author_id)
            activities.push({
              id: `mention-${message.id}`,
              type: 'mention',
              title: 'Você foi mencionado',
              description: `${author?.display_name || 'Usuário'} mencionou você em #${channel.name}`,
              time: this.formatTimeAgo(message.created_at),
              unread: true,
              channelId: message.channel_id,
              userId: message.author_id,
              userName: author?.display_name || 'Usuário',
              channelName: channel.name,
              created_at: message.created_at,
              workspace_id: workspaceId
            })
          }
        }
      }

      // Buscar threads recentes (simplificado)
      const { data: threads, error: threadsError } = await this.supabase
        .from('threads')
        .select(`
          id,
          title,
          created_at,
          channel_id
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (threadsError) {
        console.error('ActivityService: Error fetching threads:', threadsError)
      } else if (threads) {
        // Buscar informações dos canais para as threads
        const threadChannelIds = [...new Set(threads.map(t => t.channel_id))]
        const { data: threadChannels } = await this.supabase
          .from('channels')
          .select('id, name, workspace_id')
          .in('id', threadChannelIds)
          .eq('workspace_id', workspaceId)

        for (const thread of threads) {
          const channel = threadChannels?.find(c => c.id === thread.channel_id)
          if (!channel) continue

          activities.push({
            id: `thread-${thread.id}`,
            type: 'thread',
            title: 'Nova thread',
            description: `Nova conversa iniciada em #${channel.name}`,
            time: this.formatTimeAgo(thread.created_at),
            unread: false,
            channelId: thread.channel_id,
            channelName: channel.name,
            created_at: thread.created_at,
            workspace_id: workspaceId
          })
        }
      }

      // Ordenar por data de criação (mais recente primeiro)
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      console.log('🔍 ActivityService: Found activities:', activities.length)
      return activities

    } catch (error) {
      console.error('ActivityService: Unexpected error:', error)
      return []
    }
  }

  /**
   * Buscar atividades por tipo específico
   */
  async getActivitiesByType(
    workspaceId: string, 
    currentUserId: string, 
    type: 'mentions' | 'reactions' | 'threads' | 'messages'
  ): Promise<ActivityItem[]> {
    const allActivities = await this.getWorkspaceActivities(workspaceId, currentUserId)
    
    switch (type) {
      case 'mentions':
        return allActivities.filter(a => a.type === 'mention')
      case 'reactions':
        return allActivities.filter(a => a.type === 'reaction')
      case 'threads':
        return allActivities.filter(a => a.type === 'thread')
      case 'messages':
        return allActivities.filter(a => a.type === 'message')
      default:
        return allActivities
    }
  }

  /**
   * Marcar atividade como lida
   */
  async markActivityAsRead(activityId: string): Promise<void> {
    try {
      // Por enquanto, apenas log - em produção seria salvo no banco
      console.log('🔍 ActivityService: Marking activity as read:', activityId)
    } catch (error) {
      console.error('ActivityService: Error marking activity as read:', error)
    }
  }

  /**
   * Formatar tempo relativo
   */
  private formatTimeAgo(dateString: string): string {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'agora'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} min`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d`
    }
  }

  /**
   * Buscar estatísticas de atividade
   */
  async getActivityStats(workspaceId: string, currentUserId: string): Promise<{
    totalActivities: number
    unreadActivities: number
    mentionsCount: number
    threadsCount: number
  }> {
    try {
      const activities = await this.getWorkspaceActivities(workspaceId, currentUserId)
      
      return {
        totalActivities: activities.length,
        unreadActivities: activities.filter(a => a.unread).length,
        mentionsCount: activities.filter(a => a.type === 'mention').length,
        threadsCount: activities.filter(a => a.type === 'thread').length
      }
    } catch (error) {
      console.error('ActivityService: Error getting stats:', error)
      return {
        totalActivities: 0,
        unreadActivities: 0,
        mentionsCount: 0,
        threadsCount: 0
      }
    }
  }
}

// Instância singleton
export const activityService = new ActivityService()
