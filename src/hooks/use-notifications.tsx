'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/components/providers/auth-provider'

export function useNotifications() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  // ✅ SIMPLIFICADO: Sem dependências de tabelas inexistentes
  const {
    data: unreadCounts = [],
    isLoading: isLoadingUnreadCounts,
    error: unreadCountsError,
    refetch: refetchUnreadCounts
  } = useQuery({
    queryKey: ['unread-counts', user?.id],
    queryFn: async () => {
      // ✅ RETORNO VAZIO: Sem tabelas complexas
      return []
    },
    enabled: !!user?.id
  })

  // ✅ SIMPLIFICADO: Sem dependências de tabelas inexistentes
  const {
    data: unreadMentions = [],
    isLoading: isLoadingMentions,
    error: mentionsError,
    refetch: refetchMentions
  } = useQuery({
    queryKey: ['mentions', 'unread', user?.id],
    queryFn: async () => {
      // ✅ RETORNO VAZIO: Sem tabelas complexas
      return []
    },
    enabled: !!user?.id
  })

  // ✅ SIMPLIFICADO: Função mock
  const markAsRead = useMutation({
    mutationFn: async ({ messageId, channelId, dmId }: { messageId: string; channelId?: string; dmId?: string }) => {
      // ✅ FUNÇÃO MOCK: Sem operações de banco
      console.log('Marking as read:', { messageId, channelId, dmId })
      return { messageId, channelId, dmId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-counts'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // ✅ SIMPLIFICADO: Função mock
  const markMentionAsRead = useMutation({
    mutationFn: async (mentionId: string) => {
      // ✅ FUNÇÃO MOCK: Sem operações de banco
      console.log('Marking mention as read:', mentionId)
      return mentionId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentions'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // ✅ SIMPLIFICADO: Contadores mock
  const unreadMentionCount = 0
  const hasUnreadMessages = false
  const hasUnreadMentions = false

  // ✅ FUNÇÕES NECESSÁRIAS PARA O WORKSPACESIDEBAR
  const getTotalUnreadCount = () => {
    return 0 // ✅ SEMPRE ZERO: Sem dependências de banco
  }

  const getUnreadCount = (channelId: string) => {
    return 0 // ✅ SEMPRE ZERO: Sem dependências de banco
  }

  const getUnreadMentionCount = (channelId: string) => {
    return 0 // ✅ SEMPRE ZERO: Sem dependências de banco
  }

  const getChannelUnreadCount = (channelId: string) => {
    return 0 // ✅ SEMPRE ZERO: Sem dependências de banco
  }

  return {
    // Data
    unreadCounts,
    unreadMentions,
    unreadMentionCount,
    hasUnreadMessages,
    hasUnreadMentions,
    
    // Loading states
    isLoadingUnreadCounts,
    isLoadingMentions,
    
    // Errors
    unreadCountsError,
    mentionsError,
    
    // Actions
    markAsRead,
    markMentionAsRead,
    refetchUnreadCounts,
    refetchMentions,
    
    // ✅ TODAS AS FUNÇÕES NECESSÁRIAS
    getTotalUnreadCount,
    getUnreadCount,
    getUnreadMentionCount,
    getChannelUnreadCount
  }
}
