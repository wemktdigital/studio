'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messageService } from '@/lib/services/message-service'
import { useAuthContext } from '@/components/providers/auth-provider'
import { toast } from '@/hooks/use-toast'
import { useEffect, useRef } from 'react'
import { useMentions } from './use-mentions'
import { createClient } from '@/lib/supabase/client'

export function useChannelMessages(channelId: string, workspaceId?: string) {
  const queryClient = useQueryClient()
  const { user } = useAuthContext()
  const { processNewMention } = useMentions()
  
  // Debug log - VERY VISIBLE
  console.log('🚨🚨🚨 useChannelMessages: HOOK CALLED! 🚨🚨🚨', { 
    channelId, 
    workspaceId,
    timestamp: new Date().toISOString() 
  });

  // 🔹 CARREGAR MENSAGENS: Query para buscar mensagens do canal via Supabase
  // Esta query executa quando o canal é selecionado e carrega as mensagens com JOIN em users
  const query = useQuery({
    queryKey: ['channel-messages', channelId, workspaceId],
    queryFn: () => messageService.getChannelMessages(channelId, workspaceId),
    enabled: !!channelId && channelId !== 'test-channel', // 🔹 FILTRO: Ignorar canais de teste
    staleTime: 0, // 🔹 SEMPRE ATUALIZADO: Sempre considerar dados stale para buscas recentes
    retry: 1, // 🔹 RETRY: Tentar apenas uma vez em caso de erro
    refetchOnWindowFocus: false, // 🔹 PERFORMANCE: Não refazer query ao focar na janela
    gcTime: 10 * 60 * 1000 // 🔹 CACHE: Manter em cache por 10 minutos antes de descartar
  })

  // 🔹 CARREGAR USUÁRIOS: Query separada para buscar lista de usuários do canal
  // Usado para exibir lista de membros e permitir mencionar usuários
  const usersQuery = useQuery({
    queryKey: ['channel-users', channelId],
    queryFn: () => messageService.getChannelUsers(channelId),
    enabled: !!channelId && channelId !== 'test-channel', // 🔹 FILTRO: Ignorar canais de teste
    staleTime: 0, // 🔹 SEMPRE ATUALIZADO: Lista de usuários pode mudar
    retry: 1, // 🔹 RETRY: Tentar apenas uma vez
    refetchOnWindowFocus: false, // 🔹 PERFORMANCE: Não refazer query ao focar na janela
    gcTime: 10 * 60 * 1000 // 🔹 CACHE: Manter em cache por 10 minutos
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

  // 🔹 TEMPO REAL: Effect para inscrever-se em mudanças em tempo real via Supabase Realtime
  // Quando outra pessoa envia mensagem no canal, ela aparece automaticamente sem recarregar a página
  useEffect(() => {
    // 🔹 VALIDAÇÃO: Ignorar canais de teste
    if (!channelId || channelId === 'test-channel') return
    
    // 🔹 AUTENTICAÇÃO: Verificar se usuário está autenticado
    if (!user) {
      console.log('🔔 useChannelMessages: Usuário não autenticado, pulando subscription')
      return
    }

    console.log('🔔 useChannelMessages: Configurando subscription para canal', channelId)
    
    let subscription: any = null
    
    // 🔹 CONFIGURAR SUBSCRIPTION: Função para criar conexão em tempo real
    const setupSubscription = async () => {
      try {
        console.log('🔔 useChannelMessages: Criando subscription...')
        subscription = await messageService.subscribeToChannelMessages(channelId, (newMessage) => {
          console.log('📨 [HOOK] 🔥🔥🔥 MENSAGEM RECEBIDA! 🔥🔥🔥')
          console.log('📨 [HOOK] ID da mensagem:', newMessage.id)
          console.log('📨 [HOOK] Conteúdo:', newMessage.content)
          console.log('📨 [HOOK] Autor ID:', newMessage.authorId)
          console.log('📨 [HOOK] Autor completo:', newMessage.author)
          console.log('📨 [HOOK] DisplayName:', newMessage.author?.displayName)
          
          // ✅ VALIDAÇÃO SIMPLES: Verificar autor
          if (!newMessage.author || !newMessage.author.displayName || newMessage.author.displayName.trim() === '') {
            console.warn('⚠️ [HOOK] Mensagem ignorada - sem autor válido')
            return
          }
          
          // 🔹 ATUALIZAR CACHE: Adicionar nova mensagem recebida
          queryClient.setQueryData(['channel-messages', channelId, workspaceId], (oldData: any) => {
            if (!oldData) return [newMessage]
            
            // 🔹 PREVENIR DUPLICADAS
            const exists = oldData.some((msg: any) => msg.id === newMessage.id)
            if (exists) {
              console.log('⚠️ [HOOK] Mensagem já existe, pulando duplicata')
              return oldData
            }
            
            console.log('✅ [HOOK] Adicionando mensagem ao cache:', newMessage.author.displayName)
            console.log('✅ [HOOK] Cache agora tem:', oldData.length + 1, 'mensagens')
            
            return [...oldData, newMessage]
          })
        })
        
        console.log('✅ useChannelMessages: Subscription criada com sucesso!')
      } catch (error) {
        console.error('❌ useChannelMessages: Erro ao configurar subscription:', error)
      }
    }
    
    // 🔹 INICIAR: Executar setup da subscription
    setupSubscription()

    // 🔹 CLEANUP: Desinscrever apenas quando componente desmonta ou canal muda
    return () => {
      console.log('🧹 useChannelMessages: Limpando subscription do canal', channelId)
      try {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe()
          console.log('✅ useChannelMessages: Subscription cancelada')
        }
      } catch (error) {
        console.error('❌ useChannelMessages: Erro ao desinscrever:', error)
      }
    }
  }, [channelId, workspaceId, queryClient, user])

  // 🔹 ENVIAR MENSAGEM: Mutation para enviar nova mensagem no canal
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      // 🔹 VALIDAÇÃO: Verificar se usuário está autenticado
      if (!user) throw new Error('User not authenticated')
      if (channelId === 'test-channel') throw new Error('Cannot send messages to test channel')
      
      console.log('🔔 useChannelMessages: Enviando mensagem:', { content, channelId, userId: user.id })
      
      // 🔹 CHAMADA AO SERVIÇO: Enviar mensagem ao Supabase e obter retorno com dados completos
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
      
      console.log('🔔 useChannelMessages: Mensagem enviada com sucesso:', result)
      return result
    },
    onSuccess: (newMessage) => {
      console.log('🔔 useChannelMessages: Mensagem enviada, atualizando cache local:', newMessage)
      
      // 🔹 GARANTIR AUTHOR: Se a mensagem retornada não tiver o campo author (caso raro),
      // injetar manualmente usando os dados do usuário autenticado
      const messageWithAuthor = newMessage.author ? newMessage : {
        ...newMessage,
        author: {
          id: user?.id || newMessage.authorId,
          displayName: user?.user_metadata?.display_name || 'Usuário',
          handle: user?.user_metadata?.handle || 'usuario',
          avatarUrl: user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/40?u=default',
          status: 'online' as const
        }
      }
      
      // 🔹 ATUALIZAR CACHE: Adicionar mensagem com dados completos do autor ao cache local
      // Isso garante que nome e avatar apareçam imediatamente sem precisar recarregar a página
      queryClient.setQueryData(
        ['channel-messages', channelId, workspaceId],
        (oldData: any) => {
          if (!oldData) {
            console.log('🔔 useChannelMessages: Cache vazio, criando array com nova mensagem')
            return [messageWithAuthor]
          }
          
          console.log('🔔 useChannelMessages: Atualizando cache com', oldData.length, 'mensagens existentes')
          
          // 🔹 PREVENIR DUPLICADAS: Verificar se mensagem já existe no cache
          const exists = oldData.some((msg: any) => msg.id === messageWithAuthor.id)
          if (exists) {
            console.log('🔔 useChannelMessages: Mensagem já existe no cache, pulando duplicata')
            return oldData
          }
          
          // 🔹 REMOVER DUPLICATAS: Garantir que não há mensagens duplicadas no cache antigo
          const uniqueOldData = oldData.filter((msg: any, index: number, self: any[]) => 
            index === self.findIndex(m => m.id === msg.id)
          )
          
          console.log('🔔 useChannelMessages: Adicionando nova mensagem. Total após update:', uniqueOldData.length + 1)
          
          // 🔹 RETORNAR: Cache atualizado com nova mensagem incluindo dados do autor
          return [...uniqueOldData, messageWithAuthor]
        }
      )
      
      // 🔹 COMENTADO: Não invalidar query para manter cache local atualizado
      // Invalidar causaria refetch do servidor e perdemos a atualização imediata
      // queryClient.invalidateQueries({ queryKey: ['channel-messages', channelId, workspaceId] })
    },
    onError: (error) => {
      console.error('🔔 useChannelMessages: Erro ao enviar mensagem:', error)
    }
  })

  // 🔹 TRANSFORMAR DADOS: Mapear mensagens e usuários para o formato esperado pelos componentes
  const result = {
    // 🔹 MENSAGENS: Transformar mensagens para formato esperado pelo componente
    messages: (query.data || [])
      .map(msg => ({
        id: msg.id,
        channelId: msg.channelId || undefined,
        dmId: msg.dmId || undefined,
        authorId: msg.authorId,
        content: msg.content,
        type: msg.type as 'text' | 'image' | 'code' | 'link',
        createdAt: msg.createdAt,
        reactions: msg.reactions || [],
        attachment: msg.attachmentName && msg.attachmentUrl ? {
          name: msg.attachmentName,
          url: msg.attachmentUrl
        } : undefined,
        dataAiHint: msg.dataAiHint || undefined,
        // 🔹 AUTOR: Dados do autor incluídos diretamente da mensagem
        // Isso permite que o nome e avatar apareçam sem fazer consultas adicionais
        author: msg.author
      }))
      // 🔹 REMOVER DUPLICATAS: Garantir que não há mensagens duplicadas baseadas no ID
      .filter((message, index, self) => 
        index === self.findIndex(m => m.id === message.id)
      ),
    // 🔹 USUÁRIOS: Transformar lista de usuários para formato esperado pelos componentes
    // Normalizar campos (snake_case -> camelCase) e fornecer valores padrão
    users: (usersQuery.data || []).map(user => ({
      id: user.id,
      displayName: user.display_name || user.displayName || 'Unknown User',
      handle: user.handle || user.handle || 'unknown',
      avatarUrl: user.avatar_url || user.avatarUrl || '',
      status: user.status || 'offline'
    })),
    // 🔹 ESTADOS: Combinar estados de loading e erro de ambas as queries
    isLoading: query.isLoading || usersQuery.isLoading,
    error: query.error || usersQuery.error,
    // 🔹 AÇÕES: Função para enviar mensagem e estado de envio
    sendMessage: sendMessage.mutateAsync,
    isSending: sendMessage.isPending,
  }

  console.log('🚨🚨🚨 useChannelMessages: Retornando resultado:', {
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
  const supabase = createClient()

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
      async (newMessage) => {
        console.log(`🔔 useWorkspaceMessages: Received real-time message:`, newMessage)
        
        // ✅ CORREÇÃO: Buscar dados do usuário para a nova mensagem
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, display_name, handle, avatar_url, status')
            .eq('id', newMessage.authorId)
            .single()
          
          if (userError) {
            console.warn('🔔 useWorkspaceMessages: Error fetching user data:', userError)
          }
          
          // ✅ ADICIONAR: Dados do usuário à mensagem
          const messageWithUser = {
            ...newMessage,
            author: userData ? {
              id: userData.id,
              displayName: userData.display_name || 'Usuário',
              handle: userData.handle || 'usuario',
              avatarUrl: userData.avatar_url || '',
              status: userData.status || 'offline'
            } : {
              id: newMessage.authorId,
              displayName: 'Usuário Desconhecido',
              handle: 'unknown',
              avatarUrl: 'https://i.pravatar.cc/40?u=unknown',
              status: 'offline' as const
            }
          }
          
          // Update the specific channel's messages
          if (newMessage.channel_id) {
            queryClient.setQueryData(
              ['channel-messages', newMessage.channel_id],
              (oldData: any) => {
                if (!oldData) return [messageWithUser]
                return [...oldData, messageWithUser]
              }
            )
            console.log(`🔔 useWorkspaceMessages: Updated cache for channel ${newMessage.channel_id}`)
          }
        } catch (error) {
          console.error('🔔 useWorkspaceMessages: Error processing new message:', error)
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
