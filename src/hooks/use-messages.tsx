'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messageService } from '@/lib/services/message-service'
import { useAuthContext } from '@/components/providers/auth-provider'
import { toast } from '@/hooks/use-toast'
import { useEffect, useRef } from 'react'
import { useMentions } from './use-mentions'

export function useChannelMessages(channelId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuthContext()
  const { processNewMention } = useMentions()
  
  // Debug log - VERY VISIBLE
  console.log('🚨🚨🚨 useChannelMessages: HOOK CALLED! 🚨🚨🚨', { 
    channelId, 
    timestamp: new Date().toISOString() 
  });

  const query = useQuery({
    queryKey: ['channel-messages', channelId],
    queryFn: () => messageService.getChannelMessages(channelId),
    enabled: !!channelId && channelId !== 'test-channel', // ✅ IGNORAR: channelId de teste
    staleTime: 0, // Always fresh
    retry: 1, // Tentar apenas uma vez
    refetchOnWindowFocus: false, // Não refazer query ao focar na janela
    gcTime: 10 * 60 * 1000 // 10 minutos para garbage collection
  })

  // Fetch users for this channel
  const usersQuery = useQuery({
    queryKey: ['channel-users', channelId],
    queryFn: () => messageService.getChannelUsers(channelId),
    enabled: !!channelId && channelId !== 'test-channel', // ✅ IGNORAR: channelId de teste
    staleTime: 0,
    retry: 1, // Tentar apenas uma vez
    refetchOnWindowFocus: false, // Não refazer query ao focar na janela
    gcTime: 10 * 60 * 1000 // 10 minutos para garbage collection
  })

  console.log('🚨🚨🚨 useChannelMessages: Query results:', {
    messagesQuery: {
      data: query.data?.length || 0,
      isLoading: query.isLoading,
      error: query.error
    },
    usersQuery: {
      data: usersQuery.data?.length || 0,
      isLoading: usersQuery.isLoading,
      error: usersQuery.error
    }
  });

  // Real-time subscription
  useEffect(() => {
    if (!channelId || channelId === 'test-channel') return // ✅ IGNORAR: channelId de teste

    console.log('🔔 useChannelMessages: Setting up subscription for channel', channelId)
    
    const subscription = messageService.subscribeToChannelMessages(channelId, (newMessage) => {
      console.log('🚨🚨🚨 useChannelMessages: REAL-TIME MESSAGE RECEIVED! 🚨🚨🚨', { 
        messageId: newMessage.id, 
        content: newMessage.content,
        timestamp: new Date().toISOString()
      });
      
      // Update cache
      queryClient.setQueryData(['channel-messages', channelId], (oldData: any) => {
        if (!oldData) return [newMessage]
        
        // Check if message already exists
        const exists = oldData.some((msg: any) => msg.id === newMessage.id)
        if (exists) {
          console.log('🔔 useChannelMessages: Message already exists in cache, skipping duplicate')
          return oldData
        }
        
        // ✅ ADICIONADO: Remover duplicatas antes de adicionar nova mensagem
        const uniqueOldData = oldData.filter((msg: any, index: number, self: any[]) => 
          index === self.findIndex(m => m.id === msg.id)
        )
        
        console.log('🔔 useChannelMessages: Updated cache for channel', channelId)
        return [...uniqueOldData, newMessage]
      })
    })

    return () => {
      console.log('🔔 useChannelMessages: Cleaning up subscription for channel', channelId)
      try {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe()
        } else {
          console.log('🔔 useChannelMessages: Subscription unsubscribe method not available')
        }
      } catch (error) {
        console.error('🔔 useChannelMessages: Error unsubscribing from channel', channelId, error)
      }
    }
  }, [channelId, queryClient, processNewMention])

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('User not authenticated')
      if (channelId === 'test-channel') throw new Error('Cannot send messages to test channel')
      
      console.log('🔔 useChannelMessages: Sending message:', { content, channelId, userId: user.id })
      
      const result = await messageService.sendMessage({
        content,
        author_id: user.id,
        channel_id: channelId,
        type: 'text',
        dm_id: null,
        attachment_name: null,
        attachment_url: null,
        data_ai_hint: null
      })
      
      console.log('🔔 useChannelMessages: Message sent successfully:', result)
      return result
    },
    onSuccess: (newMessage) => {
      console.log('🔔 useChannelMessages: Message sent successfully, updating cache:', newMessage)
      
      // ✅ ATUALIZAR CACHE IMEDIATAMENTE: Adicionar mensagem ao cache local
      queryClient.setQueryData(
        ['channel-messages', channelId],
        (oldData: any) => {
          if (!oldData) {
            console.log('🔔 useChannelMessages: No old data, creating new array with message')
            return [newMessage]
          }
          
          console.log('🔔 useChannelMessages: Updating cache with', oldData.length, 'existing messages')
          
          // ✅ VERIFICAR: Se mensagem já existe
          const exists = oldData.some((msg: any) => msg.id === newMessage.id)
          if (exists) {
            console.log('🔔 useChannelMessages: Message already exists in cache, skipping duplicate')
            return oldData
          }
          
          // ✅ ADICIONADO: Remover duplicatas antes de adicionar nova mensagem
          const uniqueOldData = oldData.filter((msg: any, index: number, self: any[]) => 
            index === self.findIndex(m => m.id === msg.id)
          )
          
          console.log('🔔 useChannelMessages: Adding new message to cache. Total messages after update:', uniqueOldData.length + 1)
          return [...uniqueOldData, newMessage]
        }
      )
      
      // ✅ COMENTADO: Não invalidar query para manter cache local
      // queryClient.invalidateQueries({ queryKey: ['channel-messages', channelId] })
    },
    onError: (error) => {
      console.error('🔔 useChannelMessages: Error sending message:', error)
    }
  })

  // Return the data and other properties
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
        reactions: [], // ✅ IMPLEMENTADO: Sistema de reações (será carregado dinamicamente)
        attachment: msg.attachment_name && msg.attachment_url ? {
          name: msg.attachment_name,
          url: msg.attachment_url
        } : undefined,
        dataAiHint: msg.data_ai_hint || undefined
      }))
      // ✅ ADICIONADO: Remover mensagens duplicadas baseadas no ID
      .filter((message, index, self) => 
        index === self.findIndex(m => m.id === message.id)
      ),
    // ✅ CORRIGIDO: Mapear campos de usuários para o formato esperado
    users: (usersQuery.data || []).map(user => ({
      id: user.id,
      displayName: user.display_name || user.displayName || 'Unknown User',
      handle: user.handle || user.handle || 'unknown',
      avatarUrl: user.avatar_url || user.avatarUrl || '',
      status: user.status || 'offline'
    })),
    isLoading: query.isLoading || usersQuery.isLoading,
    error: query.error || usersQuery.error,
    sendMessage: sendMessage.mutateAsync,
    isSending: sendMessage.isPending,
  }

  console.log('🚨🚨🚨 useChannelMessages: Returning result:', {
    messageCount: result.messages.length,
    userCount: result.users.length,
    isLoading: result.isLoading,
    error: result.error
  });

  return result
}

export function useWorkspaceMessages(workspaceId: string) {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const subscriptionRef = useRef<any>(null)

  // Subscribe to all workspace messages
  useEffect(() => {
    if (!workspaceId || !user || workspaceId === 'mock-workspace-1' || workspaceId === 'mock-workspace-2') return // ✅ IGNORAR: workspaces mock

    console.log(`🔔 useWorkspaceMessages: Setting up subscription for workspace ${workspaceId}`)

    // Prevent multiple subscriptions
    if (subscriptionRef.current) {
      console.log(`🔔 useWorkspaceMessages: Subscription already exists for workspace ${workspaceId}, skipping`)
      return
    }

    subscriptionRef.current = messageService.subscribeToWorkspaceMessages(
      workspaceId,
      (newMessage) => {
        console.log(`🔔 useWorkspaceMessages: Received real-time message:`, newMessage)
        // Update the specific channel's messages
        if (newMessage.channel_id) {
          queryClient.setQueryData(
            ['channel-messages', newMessage.channel_id],
            (oldData: any) => {
              if (!oldData) return [newMessage]
              return [...oldData, newMessage]
            }
          )
          console.log(`🔔 useWorkspaceMessages: Updated cache for channel ${newMessage.channel_id}`)
        }
      }
    )

    console.log(`🔔 useWorkspaceMessages: Subscription created for workspace ${workspaceId}`)

    return () => {
      if (subscriptionRef.current) {
        console.log(`🔔 useWorkspaceMessages: Cleaning up subscription for workspace ${workspaceId}`)
        try {
          if (typeof messageService.unsubscribeFromWorkspace === 'function') {
            messageService.unsubscribeFromWorkspace(workspaceId)
          } else {
            console.log(`🔔 useWorkspaceMessages: unsubscribeFromWorkspace method not available`)
          }
        } catch (error) {
          console.error(`🔔 useWorkspaceMessages: Error unsubscribing from workspace ${workspaceId}:`, error)
        }
        subscriptionRef.current = null
      }
    }
  }, [workspaceId, user, queryClient]) // Added queryClient back to dependencies

  return {
    // This hook is mainly for subscriptions, not data fetching
    subscribe: true,
  }
}
