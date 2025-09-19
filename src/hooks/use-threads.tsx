'use client'

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { ThreadService, ThreadWithDetails, ThreadMessage } from '@/lib/services/thread-service'

// Lazy instantiation of ThreadService
const getThreadService = () => {
  console.log('🔍 getThreadService: Creating new ThreadService instance');
  const service = new ThreadService();
  console.log('🔍 getThreadService: Service created:', service);
  return service;
}

// Hook para obter uma thread específica
export function useThread(threadId: string) {
  return useQuery({
    queryKey: ['thread', threadId],
    queryFn: () => getThreadService().getThread(threadId),
    enabled: !!threadId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obter mensagens de uma thread com paginação infinita
export function useThreadMessages(threadId: string, pageSize: number = 20) {
  return useInfiniteQuery({
    queryKey: ['thread-messages', threadId],
    queryFn: async ({ pageParam = 0 }) => {
      const messages = await getThreadService().getThreadMessages(threadId)
      const start = pageParam * pageSize
      const end = start + pageSize
      return {
        messages: messages.slice(start, end),
        nextPage: end < messages.length ? pageParam + 1 : undefined,
        hasMore: end < messages.length
      }
    },
    initialPageParam: 0,
    enabled: !!threadId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })
}

// Hook para obter threads de um canal
export function useChannelThreads(channelId: string | undefined) {
  console.log('🔍 useChannelThreads: Called with channelId:', channelId);
  
  const result = useQuery({
    queryKey: ['channel-threads', channelId],
    queryFn: async () => {
      if (!channelId) {
        console.log('🔍 useChannelThreads: No channelId, returning empty array');
        return [];
      }
      console.log('🔍 useChannelThreads: Executing query for channelId:', channelId);
      
      // ✅ LIMPAR CACHE: Limpar cache do serviço antes de buscar threads
      const service = getThreadService();
      console.log('🔍 useChannelThreads: Cleared service cache before query');
      
      const data = await service.getChannelThreads(channelId);
      console.log('🔍 useChannelThreads: Query result:', data);
      return data;
    },
    enabled: !!channelId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    // ✅ CACHE: Configurações mais agressivas para evitar conflitos
    gcTime: 5 * 60 * 1000, // 5 minutos para garbage collection
    refetchOnWindowFocus: false, // Não refazer query ao focar na janela
  });
  
  console.log('🔍 useChannelThreads: Hook result:', { 
    channelId, 
    data: result.data, 
    isLoading: result.isLoading, 
    error: result.error 
  });
  
  return result;
}

// Hook para obter threads de um workspace
export function useWorkspaceThreads(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-threads', workspaceId],
    queryFn: () => getThreadService().getWorkspaceThreads(workspaceId),
    enabled: !!workspaceId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

// Hook para criar uma nova thread
export function useCreateThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      originalMessageId: string
      channelId?: string
      dmId?: string
      workspaceId: string
      title?: string
    }) => {
      const service = getThreadService();
      return service.createThread(data);
    },
    onSuccess: (newThread, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['channel-threads', variables.channelId] })
      queryClient.invalidateQueries({ queryKey: ['workspace-threads', variables.workspaceId] })
      
      // Adicionar a nova thread ao cache
      queryClient.setQueryData(
        ['channel-threads', variables.channelId],
        (oldData: any) => {
          if (!oldData) return [newThread]
          return [newThread, ...oldData]
        }
      )
    },
    onError: (error: any) => {
      console.error('useCreateThread: Error:', error)
    }
  })
}

// Hook para adicionar mensagem a uma thread
export function useAddThreadMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ threadId, messageData }: {
      threadId: string
      messageData: {
        content: string
        authorId: string
        channelId?: string
        dmId?: string
        type?: 'text' | 'image' | 'code' | 'link'
      }
    }) => {
      const service = getThreadService();
      return service.addMessageToThread(threadId, messageData);
    },
    onSuccess: (newMessage, variables) => {
      console.log('🔍 useAddThreadMessage: Success! Adding message to cache:', { newMessage, variables });
      
      // ✅ NÃO invalidar queries - isso causa refetch e perde o cache local
      // ✅ Atualizar cache diretamente para manter sincronização
      
      // Adicionar a nova mensagem ao cache de mensagens da thread
      queryClient.setQueryData(
        ['thread-messages', variables.threadId],
        (oldData: any) => {
          if (!oldData || !oldData.pages || !Array.isArray(oldData.pages)) {
            return {
              pages: [{ messages: [newMessage], nextPage: undefined, hasMore: false }],
              pageParams: [0]
            }
          }
          
          // Clone the existing data structure
          const newData = {
            ...oldData,
            pages: oldData.pages.map((page: any, index: number) => {
              if (index === oldData.pages.length - 1) {
                // Add message to the last page
                return {
                  ...page,
                  messages: [...(page.messages || []), newMessage],
                  hasMore: false // Since we're adding a message, this is now the last page
                }
              }
              return page
            })
          }
          
          return newData
        }
      )
      
      // ✅ Atualizar também o cache de threads do canal para refletir nova mensagem
      queryClient.setQueryData(
        ['channel-threads', variables.messageData.channelId],
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return oldData.map((thread: any) => {
            if (thread.id === variables.threadId) {
              return {
                ...thread,
                message_count: (thread.message_count || 0) + 1,
                last_message_at: new Date().toISOString()
              };
            }
            return thread;
          });
        }
      )
      
      console.log('🔍 useAddThreadMessage: Cache updated successfully');
    },
    onError: (error: any) => {
      console.error('useAddThreadMessage: Error:', error)
    }
  })
}

// Hook para atualizar título de uma thread
export function useUpdateThreadTitle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ threadId, title }: { threadId: string; title: string }) =>
      getThreadService().updateThreadTitle(threadId, title),
    onSuccess: (updatedThread) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['thread', updatedThread.id] })
      queryClient.invalidateQueries({ queryKey: ['channel-threads', (updatedThread as any).channel_id] })
      queryClient.invalidateQueries({ queryKey: ['workspace-threads', (updatedThread as any).workspace_id] })
    },
    onError: (error: any) => {
      console.error('useUpdateThreadTitle: Error:', error)
    }
  })
}

// Hook para deletar uma thread
export function useDeleteThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: getThreadService().deleteThread,
    onSuccess: (_, threadId) => {
      // Remover a thread de todos os caches
      queryClient.removeQueries({ queryKey: ['thread', threadId] })
      queryClient.removeQueries({ queryKey: ['thread-messages', threadId] })
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['channel-threads'] })
      queryClient.invalidateQueries({ queryKey: ['workspace-threads'] })
    },
    onError: (error: any) => {
      console.error('useDeleteThread: Error:', error)
    }
  })
}

// Hook para estatísticas de threads
export function useThreadStats(workspaceId: string) {
  return useQuery({
    queryKey: ['thread-stats', workspaceId],
    queryFn: () => getThreadService().getThreadStats(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}
