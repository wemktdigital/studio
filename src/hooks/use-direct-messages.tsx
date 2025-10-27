'use client'

import React, { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useUnreadCounts } from '@/hooks/use-unread-counts'
import { toast } from '@/hooks/use-toast'
import { messageService } from '@/lib/services/message-service'

export function useDirectMessages(workspaceId: string) {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const { markAsRead, updateUnreadCounts } = useUnreadCounts(workspaceId)

  // Get user's direct messages
  const {
    data: directMessages = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['direct-messages', user?.id, workspaceId],
    queryFn: async () => {
      if (!user?.id) return []
      
      console.log('🔍 useDirectMessages: Fetching DMs for user:', user.id)
      
      try {
        // ✅ USAR DIRECT MESSAGE SERVICE para métodos que não existem no MessageService
        const { directMessageService } = await import('@/lib/services/direct-message-service')
        const dms = await directMessageService.getUserDirectMessages(user.id, workspaceId)
        console.log('🔍 useDirectMessages: directMessageService.getUserDirectMessages returned:', dms)
        return dms
      } catch (err) {
        console.error('🔍 useDirectMessages: Error calling directMessageService.getUserDirectMessages:', err)
        throw err
      }
      
      // Update unread counts based on the fetched DMs
      const conversationData = dms.map(dm => ({
        conversationId: `dm-${dm.userId}`,
        messages: [] // We'll update this when we have message data
      }))
      
      updateUnreadCounts(conversationData)
      
      return dms
    },
    enabled: !!user?.id && !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000
  })

  // Create new direct message conversation
  const createDirectMessage = useMutation({
    mutationFn: async ({ otherUserId }: { otherUserId: string }) => {
      if (!user?.id) throw new Error('User not authenticated')
      
      console.log('🔍 useDirectMessages: Creating DM with user:', otherUserId)
      
      try {
        // ✅ USAR DIRECT MESSAGE SERVICE para métodos que não existem no MessageService
        const { directMessageService } = await import('@/lib/services/direct-message-service')
        return await directMessageService.createDirectMessage(user.id, otherUserId)
      } catch (err) {
        console.error('🔍 useDirectMessages: Error calling directMessageService.createDirectMessage:', err)
        throw err
      }
    },
    onSuccess: (newDM) => {
      console.log('🔍 useDirectMessages: DM created successfully:', newDM)
      
      // Update the direct messages cache
      queryClient.setQueryData(['direct-messages', user?.id, workspaceId], (oldData: any) => {
        if (!oldData) return [newDM]
        
        // Check if DM already exists
        const exists = oldData.some((dm: any) => dm.id === newDM.id)
        if (exists) return oldData
        
        return [newDM, ...oldData]
      })
      
      toast({
        title: 'Conversa iniciada',
        description: 'Nova conversa direta criada com sucesso!'
      })
    },
    onError: (error: any) => {
      console.error('🔍 useDirectMessages: Error creating DM:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar a conversa. Tente novamente.',
        variant: 'destructive'
      })
    }
  })

  // Mark DM as read
  const markDMAsRead = useMutation({
    mutationFn: async ({ dmId }: { dmId: string }) => {
      if (!user?.id) throw new Error('User not authenticated')
      
      console.log('🔍 useDirectMessages: Marking DM as read:', dmId)
      
      try {
        // ✅ USAR DIRECT MESSAGE SERVICE para métodos que não existem no MessageService
        const { directMessageService } = await import('@/lib/services/direct-message-service')
        await directMessageService.markDirectMessageAsRead(dmId, user.id)
      } catch (err) {
        console.error('🔍 useDirectMessages: Error marking DM as read:', err)
        throw err
      }
    },
    onSuccess: (_, { dmId }) => {
      console.log('🔍 useDirectMessages: DM marked as read successfully:', dmId)
      
      // Mark as read in the unread counts hook
      markAsRead(`dm-${dmId}`)
      
      // Refetch direct messages to update unread counts
      refetch()
    },
    onError: (error: any) => {
      console.error('🔍 useDirectMessages: Error marking DM as read:', error)
    }
  })

  return {
    directMessages,
    isLoading,
    error,
    refetch,
    createDirectMessage: createDirectMessage.mutateAsync,
    isCreating: createDirectMessage.isPending,
    markDMAsRead: markDMAsRead.mutateAsync,
    isMarkingAsRead: markDMAsRead.isPending
  }
}

export function useDMMessages(dmId: string, workspaceId?: string) {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const { markAsRead } = useUnreadCounts('')

  // ✅ USAR A MESMA LÓGICA DOS CANAIS: messageService.getDirectMessageMessages
  const {
    data: messages = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['dm-messages', dmId],
    queryFn: async () => {
      if (!dmId) return []
      
      try {
        const { messageService } = await import('@/lib/services/message-service')
        const result = await messageService.getDirectMessageMessages(dmId, user?.id, workspaceId)
        return result
      } catch (err) {
        console.error('useDMMessages: Error:', err)
        throw err
      }
    },
    enabled: !!dmId,
    staleTime: 30000, // 30 segundos
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    gcTime: 5 * 60 * 1000 // 5 minutos
  })

  // ✅ ADICIONADO: Garantir que as mensagens sejam carregadas após refresh
  useEffect(() => {
    if (dmId && !isLoading && !messages?.length) {
      refetch()
    }
  }, [dmId, isLoading, messages?.length, refetch])

  // Mark messages as read when conversation is opened
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !dmId) return
      
      try {
        const { directMessageService } = await import('@/lib/services/direct-message-service')
        await directMessageService.markDirectMessageAsRead(dmId, user.id)
      } catch (err) {
        console.error('Error marking messages as read:', err)
        throw err
      }
    },
    onSuccess: () => {
      markAsRead(`dm-${dmId}`)
    },
    onError: (error: any) => {
      console.error('🔍 useDMMessages: Error marking messages as read:', error)
    }
  })

  // Automatically mark as read when messages are loaded
  React.useEffect(() => {
    if (messages.length > 0 && user?.id) {
      markAsReadMutation.mutate()
    }
  }, [messages.length, user?.id, dmId])

  // Real-time subscription for DMs
  useEffect(() => {
    if (!dmId) return
    if (!user) {
      console.log('🔔 useDMMessages: User not authenticated, skipping DM subscription')
      return
    }

    console.log('🔔 useDMMessages: Setting up DM subscription for', dmId)
    console.log('🔔 useDMMessages: User authenticated:', !!user)
    console.log('🔔 useDMMessages: User ID:', user?.id)

    let subscription: any = null

    const setupSubscription = async () => {
      try {
        subscription = await messageService.subscribeToDMMessages(dmId, (newMessage) => {
          console.log('🚨🚨🚨 useDMMessages: REAL-TIME DM MESSAGE RECEIVED! 🚨🚨🚨')
          console.log('📦 newMessage completo:', JSON.stringify(newMessage, null, 2))
          console.log('👤 newMessage.author:', newMessage.author)
          console.log('👤 newMessage.author?.displayName:', newMessage.author?.displayName)
          
          // ✅ VALIDAÇÃO: Verificar se mensagem tem o mínimo necessário
          if (!newMessage.id || !newMessage.content) {
            console.warn('⚠️ DM ignorada - sem ID ou conteúdo')
            return
          }
          
          // ✅ SE NÃO TEM AUTHOR OU AUTHOR VAZIO, BUSCAR DOS DADOS DO USUÁRIO
          if (!newMessage.author || Object.keys(newMessage.author).length === 0) {
            console.warn('⚠️ DM sem autor ou com autor vazio, tentando encontrar nos dados da mensagem')
            
            // Tentar extrair dados do autor dos campos da mensagem
            const authorId = newMessage.author_id || newMessage.authorId || newMessage.author?.id
            const displayName = (newMessage as any).display_name || newMessage.author?.displayName || (newMessage as any).displayName
            const username = (newMessage as any).username
            const handle = (newMessage as any).handle
            
            console.log('🔍 Tentando criar author:', { authorId, displayName, username, handle, authorFromMessage: newMessage.author })
            
            // Se tiver algum dado do autor, criar objeto
            if (authorId && (displayName || username || handle)) {
              newMessage.author = {
                id: authorId,
                displayName: displayName || username || handle || 'Usuário',
                handle: handle || username || 'usuario',
                avatarUrl: (newMessage as any).avatar_url || newMessage.author?.avatarUrl || (newMessage as any).avatarUrl || 'https://i.pravatar.cc/40?u=default',
                status: ((newMessage as any).status || newMessage.author?.status || 'offline') as 'online' | 'offline' | 'away'
              }
              console.log('✅ Author criado com sucesso:', newMessage.author)
            } else {
              console.error('❌ DM sem dados do autor suficientes:', { authorId, displayName, username, handle })
              // Não adicionar ao cache se não tiver dados mínimos
              return
            }
          }
          
          console.log('✅ DM válida recebida de:', newMessage.author.displayName)
          console.log('📦 DM completa ANTES do cache:', JSON.stringify(newMessage, null, 2))

          // Update cache
          queryClient.setQueryData(['dm-messages', dmId], (oldData: any) => {
            console.log('🔔 useDMMessages: Atualizando cache, oldData length:', oldData?.length)
            
            if (!oldData) {
              console.log('🔔 useDMMessages: Primeira mensagem, criando array')
              console.log('📦 NOVA MENSAGEM NO CACHE:', JSON.stringify(newMessage, null, 2))
              return [newMessage]
            }

            // Check if message already exists
            const exists = oldData.some((msg: any) => msg.id === newMessage.id)
            if (exists) {
              console.log('🔔 useDMMessages: Message already exists in cache, skipping duplicate')
              return oldData
            }

            // ✅ ADICIONADO: Remover duplicatas antes de adicionar nova mensagem
            const uniqueOldData = oldData.filter((msg: any, index: number, self: any[]) =>
              index === self.findIndex(m => m.id === msg.id)
            )

            const newData = [...uniqueOldData, newMessage]
            console.log('🔔 useDMMessages: Updated cache for DM', dmId)
            console.log('📦 NOVA MENSAGEM NO FINAL DO ARRAY:', JSON.stringify(newMessage, null, 2))
            console.log('📦 ARRAY COMPLETO NO CACHE:', JSON.stringify(newData.map(m => ({ id: m.id, author: m.author?.displayName || 'SEM AUTOR' })), null, 2))
            console.log('🔍 NEWMESSAGE.AUTHOR NO CACHE:', JSON.stringify(newMessage.author, null, 2))
            console.log('🔍 NEWMESSAGE.AUTHOR.ID:', newMessage.author?.id)
            console.log('🔍 NEWMESSAGE.AUTHOR.DISPLAYNAME:', newMessage.author?.displayName)
            return newData
          })
        })
      } catch (error) {
        console.error('🔔 useDMMessages: Error setting up DM subscription:', error)
      }
    }

    setupSubscription()

    return () => {
      console.log('🔔 useDMMessages: Cleaning up DM subscription for', dmId)
      try {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe()
        } else {
          console.log('🔔 useDMMessages: DM Subscription unsubscribe method not available')
        }
      } catch (error) {
        console.error('🔔 useDMMessages: Error unsubscribing from DM', dmId, error)
      }
    }
  }, [dmId, queryClient, user])

  // Send message to direct message conversation
  const sendMessage = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      if (!user?.id) throw new Error('User not authenticated')
      if (!dmId) throw new Error('DM ID is required')
      
      console.log('🔍 useDMMessages: Sending message to DM:', { dmId, content, userId: user.id })
      
      try {
        // ✅ USAR MESSAGE SERVICE COMO OS CANAIS
        const { messageService } = await import('@/lib/services/message-service')
        const result = await messageService.sendDirectMessage(dmId, content, user.id)
        console.log('🔍 useDMMessages: messageService.sendDirectMessage returned:', result)
        return result
      } catch (err) {
        console.error('🔍 useDMMessages: Error calling messageService.sendDirectMessage:', err)
        throw err
      }
    },
    onSuccess: (newMessage) => {
      console.log('🔍 useDMMessages: Message sent successfully:', newMessage)
      
      // Transform the new message to match the expected format
      const transformedMessage = {
        id: newMessage.id,
        dmId: newMessage.dm_id,
        authorId: newMessage.author_id,
        content: newMessage.content,
        type: newMessage.type as 'text' | 'image' | 'code' | 'link',
        createdAt: newMessage.created_at || new Date().toISOString(), // Fallback if undefined
        reactions: [],
        attachment: newMessage.attachment_name && newMessage.attachment_url ? {
          name: newMessage.attachment_name,
          url: newMessage.attachment_url
        } : undefined,
        dataAiHint: newMessage.data_ai_hint || undefined,
      author: {
        id: newMessage.author_id || 'unknown',
        displayName: user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Você',
        handle: user?.user_metadata?.handle || user?.email?.split('@')[0] || 'usuario',
        avatarUrl: user?.user_metadata?.avatar_url || '',
        status: 'online' as const
      }
      }
      
      // Update the messages cache with transformed message
      queryClient.setQueryData(['dm-messages', dmId], (oldData: any) => {
        if (!oldData) return [transformedMessage]
        
        // Check if message already exists
        const exists = oldData.some((msg: any) => msg.id === transformedMessage.id)
        if (exists) return oldData
        
        return [...oldData, transformedMessage]
      })
      
      // Also update the direct messages list to show new last message
      queryClient.invalidateQueries({ queryKey: ['direct-messages'] })
    },
    onError: (error: any) => {
      console.error('🔍 useDMMessages: Error sending message:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive'
      })
    }
  })

  // Transform messages with detailed logging
  const transformedMessages = (messages || []).map((msg, index) => {
    console.log(`🔍 useDMMessages: Transforming message ${index}:`, {
      original: msg,
      id: msg.id,
      dmId: msg.dm_id,
      authorId: msg.author_id,
      content: msg.content,
      createdAt: msg.created_at,
      author: msg.author
    })
    
    const transformed = {
      id: msg.id,
      dmId: msg.dm_id,
      authorId: msg.author_id || 'unknown',
      content: msg.content,
      type: msg.type as 'text' | 'image' | 'code' | 'link',
      createdAt: msg.created_at || new Date().toISOString(), // Fallback if undefined
      reactions: [], // TODO: Implement reactions for DMs
      attachment: msg.attachment_name && msg.attachment_url ? {
        name: msg.attachment_name,
        url: msg.attachment_url
      } : undefined,
      dataAiHint: msg.data_ai_hint || undefined,
      author: msg.author ? {
        id: msg.author.id,
        displayName: msg.author.displayName || msg.author.display_name || msg.author.username || 'Usuário Desconhecido',
        handle: msg.author.handle || msg.author.username || 'unknown',
        avatarUrl: msg.author.avatarUrl || msg.author.avatar_url || '',
        status: msg.author.status || 'online'
      } : {
        id: msg.author_id || 'unknown',
        displayName: msg.author_id ? `Usuário ${msg.author_id.slice(0, 8)}` : 'Usuário Desconhecido',
        handle: msg.author_id ? `user_${msg.author_id.slice(0, 8)}` : 'unknown',
        avatarUrl: '',
        status: 'offline'
      }
    }
    
    console.log(`🔍 useDMMessages: Transformed message ${index}:`, transformed)
    return transformed
  })
  
  console.log('🔍 useDMMessages: Final transformed messages:', {
    count: transformedMessages.length,
    messages: transformedMessages
  })

  return {
    messages: transformedMessages,
    isLoading,
    error,
    refetch,
    sendMessage: sendMessage.mutateAsync,
    isSending: sendMessage.isPending,
    markAsRead: markAsReadMutation.mutateAsync,
    isMarkingAsRead: markAsReadMutation.isPending
  }
}
