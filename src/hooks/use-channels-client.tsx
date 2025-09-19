'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Channel {
  id: string
  name: string
  description: string
  is_private: boolean
  workspace_id: string
  created_by: string
  created_at: string
  updated_at: string
}

// ✅ SINGLETON: Cache global para evitar múltiplas instâncias
let channelsCache: Map<string, { data: Channel[]; timestamp: number }> = new Map()
const CACHE_DURATION = 30000 // 30 segundos

export function useChannelsClient(workspaceId: string) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChannels = useCallback(async () => {
    if (!workspaceId) {
      console.log('useChannelsClient: No workspaceId provided')
      setIsLoading(false)
      return
    }

    // ✅ CACHE CHECK: Verificar se temos dados em cache
    const cached = channelsCache.get(workspaceId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('useChannelsClient: Using cached channels')
      setChannels(cached.data)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      console.log('useChannelsClient: Fetching channels for workspace:', workspaceId)
      
      const supabase = createClient()
      
      if (!supabase) {
        console.log('useChannelsClient: No Supabase client available')
        // Usar canais mock como fallback
        const mockChannels: Channel[] = [
          {
            id: '1',
            name: 'general',
            description: 'General discussion and announcements',
            is_private: false,
            workspace_id: workspaceId,
            created_by: 'mock-user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'random',
            description: 'Random stuff and off-topic chat',
            is_private: false,
            workspace_id: workspaceId,
            created_by: 'mock-user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
        
        setChannels(mockChannels)
        channelsCache.set(workspaceId, { data: mockChannels, timestamp: Date.now() })
        console.log('useChannelsClient: Using mock channels as fallback')
        return
      }
      
      // Buscar canais do Supabase
      const { data, error: supabaseError } = await supabase
        .from('channels')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true })
      
      if (supabaseError) {
        console.error('useChannelsClient: Supabase error:', supabaseError)
        setError(supabaseError.message)
        
        // Fallback para canais mock se Supabase falhar
        const mockChannels: Channel[] = [
          {
            id: '1',
            name: 'general',
            description: 'General discussion and announcements',
            is_private: false,
            workspace_id: workspaceId,
            created_by: 'mock-user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'random',
            description: 'Random stuff and off-topic chat',
            is_private: false,
            workspace_id: workspaceId,
            created_by: 'mock-user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
        
        setChannels(mockChannels)
        channelsCache.set(workspaceId, { data: mockChannels, timestamp: Date.now() })
        console.log('useChannelsClient: Using mock channels as fallback')
      } else if (data && data.length > 0) {
        console.log('useChannelsClient: Successfully fetched channels:', data.length)
        setChannels(data)
        channelsCache.set(workspaceId, { data, timestamp: Date.now() })
      } else {
        console.log('useChannelsClient: No channels found, using mock channels')
        
        // Se não há canais reais, usar mock
        const mockChannels: Channel[] = [
          {
            id: '1',
            name: 'general',
            description: 'General discussion and announcements',
            is_private: false,
            workspace_id: workspaceId,
            created_by: 'mock-user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'random',
            description: 'Random stuff and off-topic chat',
            is_private: false,
            workspace_id: workspaceId,
            created_by: 'mock-user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
        
        setChannels(mockChannels)
        channelsCache.set(workspaceId, { data: mockChannels, timestamp: Date.now() })
      }
    } catch (err) {
      console.error('useChannelsClient: Unexpected error:', err)
      setError('Erro inesperado ao buscar canais')
      
      // Fallback para canais mock em caso de erro
      const mockChannels: Channel[] = [
        {
          id: '1',
          name: 'general',
          description: 'General discussion and announcements',
          is_private: false,
          workspace_id: workspaceId,
          created_by: 'mock-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'random',
          description: 'Random stuff and off-topic chat',
          is_private: false,
          workspace_id: workspaceId,
          created_by: 'mock-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      
      setChannels(mockChannels)
      channelsCache.set(workspaceId, { data: mockChannels, timestamp: Date.now() })
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  return {
    channels,
    isLoading,
    error,
    refetch: fetchChannels
  }
}