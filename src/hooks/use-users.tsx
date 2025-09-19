'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/lib/services'
import { useAuthContext } from '@/components/providers/auth-provider'
import { toast } from '@/hooks/use-toast'

export function useCurrentUser() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  const {
    data: profile,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['current-user', user?.id],
    queryFn: async () => {
      try {
        return await userService.getCurrentUser()
      } catch (error) {
        console.error('Error in useCurrentUser queryFn:', error)
        // ✅ FALLBACK: Retornar perfil mock se houver erro
        return {
          id: user?.id || 'unknown',
          display_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
          handle: user?.email?.split('@')[0] || 'user',
          avatar_url: user?.user_metadata?.avatar_url || null,
          status: 'online' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes,
    retry: 1, // Tentar apenas uma vez
    refetchOnWindowFocus: false, // Não refazer query ao focar na janela
    gcTime: 10 * 60 * 1000 // 10 minutos para garbage collection
  })

  const updateProfileMutation = useMutation({
    mutationFn: (updates: { display_name?: string; handle?: string; avatar_url?: string; status?: 'online' | 'offline' | 'away' }) =>
      userService.updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      toast({
        title: "Perfil atualizado",
        description: "Seu perfil foi atualizado com sucesso!",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar perfil: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status: 'online' | 'offline' | 'away') =>
      userService.updateStatus(status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar status: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  return {
    profile,
    isLoading,
    error,
    refetch,
    updateProfile: updateProfileMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
  }
}

export function useUser(id: string) {
  const {
    data: user,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUser(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes,
    retry: 1, // Tentar apenas uma vez
    refetchOnWindowFocus: false, // Não refazer query ao focar na janela
    gcTime: 10 * 60 * 1000 // 10 minutos para garbage collection
  })

  return {
    user,
    isLoading,
    error,
    refetch,
  }
}

export function useUsers(ids: string[]) {
  const {
    data: users = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['users', ids],
    queryFn: () => userService.getUsers(ids),
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes,
    retry: 1, // Tentar apenas uma vez
    refetchOnWindowFocus: false, // Não refazer query ao focar na janela
    gcTime: 10 * 60 * 1000 // 10 minutos para garbage collection
  })

  return {
    users,
    isLoading,
    error,
    refetch,
  }
}

export function useSearchUsers(query: string, workspaceId?: string) {
  const {
    data: users = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['search-users', query, workspaceId],
    queryFn: () => userService.searchUsers(query, workspaceId),
    enabled: query.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
  })

  return {
    users,
    isLoading,
    error,
    refetch,
  }
}
