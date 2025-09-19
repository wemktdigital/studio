'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/components/providers/auth-provider'
import { MessageMention } from '@/lib/types'

export function useMentions() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

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

  // ✅ SIMPLIFICADO: Sem dependências de tabelas inexistentes
  const {
    data: allMentions = [],
    isLoading: isLoadingAllMentions,
    error: allMentionsError
  } = useQuery({
    queryKey: ['mentions', 'all', user?.id],
    queryFn: async () => {
      // ✅ RETORNO VAZIO: Sem tabelas complexas
      return []
    },
    enabled: !!user?.id
  })

  // ✅ SIMPLIFICADO: Função mock
  const markMentionAsRead = useMutation({
    mutationFn: async (mentionId: string) => {
      // ✅ FUNÇÃO MOCK: Sem operações de banco
      console.log('Marking mention as read:', mentionId)
      return mentionId
    },
    onSuccess: () => {
      // Invalidate mentions queries
      queryClient.invalidateQueries({ queryKey: ['mentions'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // ✅ SIMPLIFICADO: Função mock
  const markAllMentionsAsRead = useMutation({
    mutationFn: async () => {
      // ✅ FUNÇÃO MOCK: Sem operações de banco
      console.log('Marking all mentions as read')
    },
    onSuccess: () => {
      // Invalidate mentions queries
      queryClient.invalidateQueries({ queryKey: ['mentions'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // ✅ SIMPLIFICADO: Contadores mock
  const unreadMentionCount = 0
  const hasUnreadMentions = false

  // Get mentions by channel
  const getMentionsByChannel = (channelId: string) => {
    return [] // ✅ SEMPRE VAZIO: Sem dependências de banco
  }

  // Get mentions by DM
  const getMentionsByDM = (dmId: string) => {
    return [] // ✅ SEMPRE VAZIO: Sem dependências de banco
  }

  // ✅ SIMPLIFICADO: Função mock
  const processNewMention = async (mention: MessageMention) => {
    // ✅ FUNÇÃO MOCK: Sem operações de banco
    console.log('Processing new mention:', mention)

    // Invalidate queries to refresh mentions
    queryClient.invalidateQueries({ queryKey: ['mentions'] })
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  return {
    // Data
    unreadMentions,
    allMentions,
    unreadMentionCount,
    hasUnreadMentions,
    
    // Loading states
    isLoadingMentions,
    isLoadingAllMentions,
    
    // Errors
    mentionsError,
    allMentionsError,
    
    // Actions
    markMentionAsRead,
    markAllMentionsAsRead,
    refetchMentions,
    processNewMention,
    
    // Utilities
    getMentionsByChannel,
    getMentionsByDM
  }
}
