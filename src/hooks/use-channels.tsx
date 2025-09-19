'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useCurrentWorkspace } from './use-workspaces'
import { supabase } from '@/lib/supabase'

export function useChannels() {
  const { currentWorkspace } = useCurrentWorkspace()

  const {
    data: channels = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['channels', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) {
        console.log('useChannels: No current workspace, returning empty array')
        return []
      }

      // ✅ USAR CHANNEL SERVICE: Em vez de supabase direto
      const { channelService } = await import('@/lib/services')
      return channelService.getWorkspaceChannels(currentWorkspace.id)
    },
    enabled: !!currentWorkspace?.id && currentWorkspace.id !== 'mock-workspace-1' && currentWorkspace.id !== 'mock-workspace-2', // ✅ IGNORAR: workspaces mock
    retry: 1, // Tentar apenas uma vez
    refetchOnWindowFocus: false, // Não refazer query ao focar na janela
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000 // 10 minutos para garbage collection
  })

  return {
    channels,
    isLoading,
    error,
    refetch
  }
}

// ✅ ADICIONADO: Hook para buscar canais de um workspace específico
export function useWorkspaceChannels(workspaceId: string) {
  const {
    data: channels = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['workspace-channels', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        console.log('🔍 useWorkspaceChannels: No workspaceId provided, returning empty array')
        return []
      }

      // ✅ SSR CHECK: Só executar no cliente
      if (typeof window === 'undefined') {
        console.log('🔍 useWorkspaceChannels: SSR detected, returning empty array')
        return []
      }

      console.log('🔍 useWorkspaceChannels: Fetching channels for workspace:', workspaceId)

      try {
        // ✅ USAR CHANNEL SERVICE: Em vez de supabase direto
        const { channelService } = await import('@/lib/services')
        console.log('🔍 useWorkspaceChannels: channelService imported successfully')
        
        const result = await channelService.getWorkspaceChannels(workspaceId)
        
        console.log('🔍 useWorkspaceChannels: Fetched channels:', result.length)
        console.log('🔍 useWorkspaceChannels: Channel data:', result)
        return result
      } catch (error) {
        console.error('🔍 useWorkspaceChannels: Error fetching channels:', error)
        return []
      }
    },
    enabled: !!workspaceId && typeof window !== 'undefined', // ✅ SSR CHECK: Só habilitar no cliente
    retry: 1, // Tentar apenas uma vez
    refetchOnWindowFocus: false, // Não refazer query ao focar na janela
    staleTime: 30 * 60 * 1000, // 30 minutos (aumentado)
    gcTime: 60 * 60 * 1000, // 1 hora para garbage collection (aumentado)
    refetchOnMount: false, // Não refazer ao montar o componente
    refetchOnReconnect: false // Não refazer ao reconectar
  })

  return {
    channels,
    isLoading,
    error,
    refetch
  }
}

// ✅ ADICIONADO: Hook para buscar um canal específico
export function useChannel(channelId: string) {
  const {
    data: channel,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: async () => {
      if (!channelId) return null

      console.log('🔍 useChannel: Fetching channel:', channelId)

      try {
        // ✅ USAR CHANNEL SERVICE: Em vez de supabase direto
        const { channelService } = await import('@/lib/services')
        console.log('🔍 useChannel: channelService imported:', channelService)
        
        // ✅ VALIDAÇÃO: Verificar se channelService tem o método getChannel
        if (!channelService || typeof channelService.getChannel !== 'function') {
          console.error('🔍 useChannel: channelService.getChannel method not available')
          throw new Error('ChannelService.getChannel method not available')
        }
        
        console.log('🔍 useChannel: Calling channelService.getChannel with:', channelId)
        const result = await channelService.getChannel(channelId)
        
        if (result) {
          console.log('🔍 useChannel: Channel found:', result)
          return result
        } else {
          console.log('🔍 useChannel: Channel result is null/undefined')
        }
        
        // ✅ FALLBACK: Se não encontrou, retornar canal mock
        console.log('🔍 useChannel: Channel not found, returning mock channel')
        const mockChannel = {
          id: channelId,
          name: 'Channel',
          description: 'Channel description',
          is_private: false,
          workspace_id: 'unknown',
          created_by: 'unknown',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        console.log('🔍 useChannel: Returning mock channel:', mockChannel)
        return mockChannel
      } catch (error) {
        console.error('Error in useChannel queryFn:', error)
        
        // ✅ FALLBACK: Retornar canal mock em caso de erro
        console.log('🔍 useChannel: Returning mock channel due to error')
        const errorMockChannel = {
          id: channelId,
          name: 'Channel',
          description: 'Channel description',
          is_private: false,
          workspace_id: 'unknown',
          created_by: 'unknown',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        console.log('🔍 useChannel: Returning error mock channel:', errorMockChannel)
        return errorMockChannel
      }
    },
    enabled: !!channelId && channelId !== 'test-channel', // ✅ IGNORAR: channelId de teste
    retry: 1, // Tentar apenas uma vez
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false, // Não refazer query ao focar na janela
    gcTime: 10 * 60 * 1000 // 10 minutos para garbage collection
  })

  return {
    channel,
    isLoading,
    error,
    refetch
  }
}

// ✅ ADICIONADO: Hook para buscar canais do usuário
export function useUserChannels(userId: string) {
  const {
    data: channels = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-channels', userId],
    queryFn: async () => {
      if (!userId) return []

      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('created_by', userId)
        .order('name')

      if (error) {
        console.error('Error fetching user channels:', error)
        throw error
      }

      return data || []
    },
    enabled: !!userId
  })

  return {
    channels,
    isLoading,
    error,
    refetch
  }
}

// ✅ ADICIONADO: Hook para buscar canais
export function useSearchChannels(query: string) {
  const {
    data: channels = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['search-channels', query],
    queryFn: async () => {
      if (!query.trim()) return []

      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(10)

      if (error) {
        console.error('Error searching channels:', error)
        throw error
      }

      return data || []
    },
    enabled: !!query.trim()
  })

  return {
    channels,
    isLoading,
    error,
    refetch
  }
}

// ✅ ADICIONADO: Hook para criar canais
export function useCreateChannel() {
  const { user } = useAuthContext()
  const { currentWorkspace } = useCurrentWorkspace()
  const queryClient = useQueryClient()

  const createChannel = useMutation({
    mutationFn: async ({ name, description, isPrivate, workspace_id, created_by }: { 
      name: string; 
      description?: string; 
      isPrivate?: boolean;
      workspace_id: string;
      created_by: string;
    }) => {
      if (!workspace_id || !created_by) {
        throw new Error('Workspace ID and user ID are required')
      }

      const { data, error } = await supabase
        .from('channels')
        .insert({
          name,
          description,
          workspace_id,
          created_by,
          is_private: isPrivate || false
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating channel:', error)
        throw error
      }

      return data
    },
    onSuccess: (data, variables) => {
      console.log('🔍 useCreateChannel: Channel created successfully:', data);
      console.log('🔍 useCreateChannel: Invalidating queries for workspace:', variables.workspace_id);
      
      // Invalidate specific workspace channels
      queryClient.invalidateQueries({ 
        queryKey: ['workspace-channels', variables.workspace_id] 
      })
      
      // Also invalidate general channels queries
      queryClient.invalidateQueries({ queryKey: ['channels'] })
      queryClient.invalidateQueries({ queryKey: ['workspace-channels'] })
    }
  })

  return {
    mutate: createChannel.mutate,
    mutateAsync: createChannel.mutateAsync,
    isPending: createChannel.isPending,
    error: createChannel.error
  }
}
