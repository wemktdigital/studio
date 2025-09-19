'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { directMessageServiceNew } from '@/lib/services/direct-message-service-new'
import { DirectMessage, Message } from '@/lib/types'
import { toast } from '@/hooks/use-toast'

/**
 * Hook para gerenciar mensagens diretas - VERSÃO NOVA E SIMPLIFICADA
 */
export function useDirectMessagesNew(userId: string) {
  const queryClient = useQueryClient()

  // Obter todas as DMs do usuário
  const {
    data: dms = [],
    isLoading: isLoadingDMs,
    error: dmsError
  } = useQuery({
    queryKey: ['direct-messages-new', userId],
    queryFn: () => directMessageServiceNew.getUserDMs(userId),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1
  })

  // Criar nova DM
  const createDMMutation = useMutation({
    mutationFn: async ({ otherUserId }: { otherUserId: string }) => {
      console.log('useDirectMessagesNew: Creating DM with user:', otherUserId)
      return await directMessageServiceNew.getOrCreateDM(userId, otherUserId)
    },
    onSuccess: (newDM) => {
      console.log('useDirectMessagesNew: DM created successfully:', newDM.id)
      queryClient.invalidateQueries({ queryKey: ['direct-messages-new', userId] })
      toast({
        title: 'Conversa iniciada',
        description: 'Nova conversa criada com sucesso!'
      })
    },
    onError: (error) => {
      console.error('useDirectMessagesNew: Error creating DM:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a conversa. Tente novamente.',
        variant: 'destructive'
      })
    }
  })

  return {
    dms,
    isLoadingDMs,
    dmsError,
    createDM: createDMMutation.mutate,
    isCreatingDM: createDMMutation.isPending
  }
}

/**
 * Hook para gerenciar mensagens de uma DM específica - VERSÃO NOVA E SIMPLIFICADA
 */
export function useDMMessagesNew(dmId: string) {
  const queryClient = useQueryClient()

  // Obter mensagens da DM
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['dm-messages-new', dmId],
    queryFn: () => directMessageServiceNew.getDMMessages(dmId),
    staleTime: 1 * 60 * 1000, // 1 minuto
    retry: 1,
    refetchOnWindowFocus: false
  })

  // Enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, authorId }: { content: string; authorId: string }) => {
      console.log('useDMMessagesNew: Sending message:', content)
      return await directMessageServiceNew.sendDMMessage(dmId, content, authorId)
    },
    onSuccess: (newMessage) => {
      console.log('useDMMessagesNew: Message sent successfully:', newMessage.id)
      
      // Atualizar cache local imediatamente
      queryClient.setQueryData(['dm-messages-new', dmId], (oldMessages: Message[] = []) => [
        ...oldMessages,
        newMessage
      ])
      
      // Invalidar para garantir sincronização
      queryClient.invalidateQueries({ queryKey: ['dm-messages-new', dmId] })
    },
    onError: (error) => {
      console.error('useDMMessagesNew: Error sending message:', error)
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive'
      })
    }
  })

  return {
    messages,
    isLoadingMessages,
    messagesError,
    sendMessage: sendMessageMutation.mutateAsync,
    isSendingMessage: sendMessageMutation.isPending,
    refetchMessages
  }
}

/**
 * Hook para obter ou criar uma DM específica entre dois usuários
 */
export function useSpecificDMNew(user1Id: string, user2Id: string) {
  const queryClient = useQueryClient()

  const {
    data: dm,
    isLoading: isLoadingDM,
    error: dmError
  } = useQuery({
    queryKey: ['specific-dm-new', user1Id, user2Id],
    queryFn: () => directMessageServiceNew.getOrCreateDM(user1Id, user2Id),
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 1
  })

  return {
    dm,
    isLoadingDM,
    dmError
  }
}
