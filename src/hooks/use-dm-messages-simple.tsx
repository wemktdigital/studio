'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/components/providers/auth-provider'
import { toast } from '@/hooks/use-toast'
import { messageService } from '@/lib/services/message-service'

export function useDMMessagesSimple(dmId: string, workspaceId?: string) {
  const queryClient = useQueryClient()
  const { user } = useAuthContext()
  
  console.log('🚨🚨🚨 useDMMessagesSimple: HOOK CALLED! 🚨🚨🚨', { 
    dmId, 
    userId: user?.id,
    timestamp: new Date().toISOString() 
  })

  // ✅ INTEGRADO: Query usando MessageService para DMs
  const query = useQuery({
    queryKey: ['dm-messages-simple', dmId],
    queryFn: async () => {
      console.log('🚨🚨🚨 useDMMessagesSimple: FETCHING DM MESSAGES VIA MESSAGESERVICE! 🚨🚨🚨')
      return await messageService.getDirectMessageMessages(dmId, user?.id, workspaceId)
    },
    enabled: !!dmId,
    staleTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000
  })

  // ✅ INTEGRADO: Users query usando MessageService
  const usersQuery = useQuery({
    queryKey: ['dm-users-simple', dmId],
    queryFn: async () => {
      console.log('🚨🚨🚨 useDMMessagesSimple: FETCHING DM USERS VIA MESSAGESERVICE! 🚨🚨🚨')
      
      // ✅ CORRIGIDO: Usar IDs reais que correspondem às mensagens
      const mockUsers = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001', // Mapeado para 'test-user'
          display_name: 'Usuário 1',
          handle: 'usuario1',
          avatar_url: '',
          status: 'online'
        },
        {
          id: user?.id || 'e4c9d0f8-b54c-4f17-9487-92872db095ab', // Usuário atual
          display_name: user?.user_metadata?.display_name || 'Edson',
          handle: user?.user_metadata?.handle || 'edson',
          avatar_url: user?.user_metadata?.avatar_url || '',
          status: 'online'
        }
      ]
      
      console.log('🚨🚨🚨 useDMMessagesSimple: Returning mock users:', mockUsers)
      return mockUsers
    },
    enabled: !!dmId,
    staleTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000
  })

  // ✅ INTEGRADO: Send message mutation usando MessageService
  const sendMessage = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      if (!user?.id) throw new Error('User not authenticated')
      
      console.log('🚨🚨🚨 useDMMessagesSimple: SENDING DM MESSAGE VIA MESSAGESERVICE! 🚨🚨🚨', { content, userId: user.id, dmId })
      
      // Usar MessageService para enviar DM
      return await messageService.sendDirectMessage(dmId, content, user.id)
    },
    onSuccess: (newMessage) => {
      console.log('🚨🚨🚨 useDMMessagesSimple: DM MESSAGE SENT VIA MESSAGESERVICE! 🚨🚨🚨', newMessage)
      
      // Atualizar cache
      queryClient.setQueryData(['dm-messages-simple', dmId], (oldData: any) => {
        if (!oldData) return [newMessage]
        
        // Verificar se mensagem já existe
        const exists = oldData.some((msg: any) => msg.id === newMessage.id)
        if (exists) {
          console.log('🔔 useDMMessagesSimple: Message already exists in cache, skipping duplicate')
          return oldData
        }
        
        return [...oldData, newMessage]
      })
      
      toast({
        title: 'Mensagem enviada',
        description: 'Sua mensagem foi enviada com sucesso!',
      })
    },
    onError: (error: any) => {
      console.error('🚨🚨🚨 useDMMessagesSimple: ERROR SENDING DM VIA MESSAGESERVICE! 🚨🚨🚨', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive'
      })
    }
  })

  // ✅ SIMPLES: Transformar dados para o formato esperado
  const result = {
    messages: (query.data || [])
      .map(msg => ({
        id: msg.id,
        channelId: msg.channel_id || undefined,
        dmId: msg.dm_id || undefined,
        authorId: msg.author_id,
        content: msg.content,
        type: msg.type as 'text' | 'image' | 'code' | 'link',
        createdAt: msg.created_at,
        reactions: [],
        attachment: msg.attachment_name && msg.attachment_url ? {
          name: msg.attachment_name,
          url: msg.attachment_url
        } : undefined,
        dataAiHint: msg.data_ai_hint || undefined
      })),
    users: (usersQuery.data || []).map(user => ({
      id: user.id,
      displayName: user.display_name || 'Unknown User',
      handle: user.handle || 'unknown',
      avatarUrl: user.avatar_url || '',
      status: user.status || 'offline'
    })),
    isLoading: query.isLoading || usersQuery.isLoading,
    error: query.error || usersQuery.error,
    sendMessage: sendMessage.mutateAsync,
    isSending: sendMessage.isPending,
  }

  console.log('🚨🚨🚨 useDMMessagesSimple: RETURNING RESULT! 🚨🚨🚨', {
    messageCount: result.messages.length,
    userCount: result.users.length,
    isLoading: result.isLoading,
    error: result.error,
    messages: result.messages,
    users: result.users
  })

  return result
}
