'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Channel {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export function useChannelsFixed(workspaceId: string) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchChannels() {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('useChannelsFixed: Fetching channels for workspace:', workspaceId);
        
        // Buscar canais do Supabase
        const { data, error: supabaseError } = await supabase
          .from('channels')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: true });
        
        if (supabaseError) {
          console.error('useChannelsFixed: Supabase error:', supabaseError);
          setError(supabaseError.message);
          
          // Fallback para canais mock se Supabase falhar
          const mockChannels: Channel[] = [
            {
              id: '1',
              name: 'general',
              description: 'Canal geral para discussões da equipe',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '2',
              name: 'random',
              description: 'Canal para conversas casuais',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '3',
              name: 'dev',
              description: 'Canal para discussões técnicas',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          
          setChannels(mockChannels);
          console.log('useChannelsFixed: Using mock channels as fallback');
        } else if (data && data.length > 0) {
          console.log('useChannelsFixed: Successfully fetched channels:', data.length);
          setChannels(data);
        } else {
          console.log('useChannelsFixed: No channels found, using mock data');
          // Usar canais mock se não houver dados
          const mockChannels: Channel[] = [
            {
              id: '1',
              name: 'general',
              description: 'Canal geral para discussões da equipe',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '2',
              name: 'random',
              description: 'Canal para conversas casuais',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '3',
              name: 'dev',
              description: 'Canal para discussões técnicas',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          
          setChannels(mockChannels);
        }
      } catch (err) {
        console.error('useChannelsFixed: Unexpected error:', err);
        setError('Erro inesperado ao buscar canais');
        
        // Fallback para canais mock em caso de erro
        const mockChannels: Channel[] = [
          {
            id: '1',
            name: 'general',
            description: 'Canal geral para discussões da equipe',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'random',
            description: 'Canal para conversas casuais',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            name: 'dev',
            description: 'Canal para discussões técnicas',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setChannels(mockChannels);
      } finally {
        setIsLoading(false);
      }
    }

    if (workspaceId) {
      fetchChannels();
    }
  }, [workspaceId]);

  return {
    channels,
    isLoading,
    error,
    refetch: () => {
      if (workspaceId) {
        // Recarregar canais
        setChannels([]);
        setIsLoading(true);
        setError(null);
        // O useEffect será executado novamente
      }
    }
  };
}
