'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceService } from '@/lib/services'
import { useAuthContext } from '@/components/providers/auth-provider'
import { toast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'

// ✅ ADICIONADO: Hook para gerenciar workspace atual
export function useCurrentWorkspace() {
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  
  // ✅ FALLBACK: Se não há workspace selecionado, usar o primeiro disponível
  const { workspaces } = useWorkspaces()
  const { workspace, isLoading, error } = useWorkspace(currentWorkspaceId || workspaces[0]?.id || '')
  
  const setCurrentWorkspace = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId)
  }
  
  // ✅ AUTO-SELECT: Se não há workspace selecionado mas há workspaces disponíveis
  useEffect(() => {
    if (!currentWorkspaceId && workspaces.length > 0 && workspaces[0]?.id !== 'mock-workspace-1' && workspaces[0]?.id !== 'mock-workspace-2') {
      setCurrentWorkspaceId(workspaces[0].id)
    }
  }, [currentWorkspaceId, workspaces, setCurrentWorkspaceId])
  
  return {
    currentWorkspace: workspace,
    currentWorkspaceId,
    setCurrentWorkspace,
    isLoading,
    error
  }
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  const { user } = useAuthContext()

  return useMutation({
    mutationFn: (data: { name: string; logo_url?: string; created_by: string }) =>
      workspaceService.createWorkspace(data),
    onSuccess: () => {
      // Invalidate the workspaces query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      toast({
        title: "Workspace created",
        description: "Your new workspace has been created successfully!",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create workspace: ${error.message}`,
        variant: "destructive",
      })
    },
  })
}

export function useWorkspaces() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  const {
    data: workspaces = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['workspaces', user?.id],
    queryFn: async () => {
      try {
        return await workspaceService.getUserWorkspaces()
      } catch (error) {
        console.error('Error in useWorkspaces queryFn:', error)
        // ✅ FALLBACK: Retornar workspaces mock se houver erro
        return [
          {
            id: 'mock-workspace-1',
            name: 'WE Marketing',
            logo_url: 'https://i.pravatar.cc/40?u=we',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-workspace-2',
            name: 'Studio Dev',
            logo_url: 'https://i.pravatar.cc/40?u=studio',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes,
    retry: 1, // Tentar apenas uma vez
    refetchOnWindowFocus: false, // Não refazer query ao focar na janela
    gcTime: 10 * 60 * 1000 // 10 minutos para garbage collection
  })

  const createWorkspaceMutation = useMutation({
    mutationFn: (data: { name: string; logo_url?: string }) =>
      workspaceService.createWorkspace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      toast({
        title: "Workspace criado",
        description: "Seu novo workspace foi criado com sucesso!",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Falha ao criar workspace: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const updateWorkspaceMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      workspaceService.updateWorkspace(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      toast({
        title: "Workspace atualizado",
        description: "Seu workspace foi atualizado com sucesso!",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar workspace: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const deleteWorkspaceMutation = useMutation({
    mutationFn: (id: string) => workspaceService.deleteWorkspace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      toast({
        title: "Workspace removido",
        description: "Seu workspace foi removido com sucesso!",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Falha ao remover workspace: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: ({ workspaceId, userId, role }: { workspaceId: string; userId: string; role?: 'member' | 'admin' }) =>
      workspaceService.addMember(workspaceId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      toast({
        title: "Membro adicionado",
        description: "Usuário foi adicionado ao workspace!",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Falha ao adicionar membro: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: ({ workspaceId, userId }: { workspaceId: string; userId: string }) =>
      workspaceService.removeMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      toast({
        title: "Membro removido",
        description: "Usuário foi removido do workspace!",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Falha ao remover membro: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  return {
    workspaces,
    isLoading,
    error,
    refetch,
    createWorkspace: createWorkspaceMutation.mutate,
    createWorkspaceAsync: createWorkspaceMutation.mutateAsync,
    updateWorkspace: updateWorkspaceMutation.mutate,
    deleteWorkspace: deleteWorkspaceMutation.mutate,
    addMember: addMemberMutation.mutate,
    removeMember: removeMemberMutation.mutate,
    isCreating: createWorkspaceMutation.isPending,
    isUpdating: updateWorkspaceMutation.isPending,
    isDeleting: deleteWorkspaceMutation.isPending,
    isAddingMember: addMemberMutation.isPending,
    isRemovingMember: removeMemberMutation.isPending,
  }
}

export function useWorkspace(id: string) {
  // Removed unused queryClient

  const {
    data: workspace,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['workspace', id],
    queryFn: async () => {
      if (!id) return null
      
      try {
        return await workspaceService.getWorkspace(id)
      } catch (error) {
        console.error('Error fetching workspace:', error)
        // ✅ FALLBACK: Retornar workspace mock se houver erro
        return {
          id,
          name: 'Workspace',
          error: true,
          logo_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    },
    enabled: !!id && id !== 'mock-workspace-1' && id !== 'mock-workspace-2', // ✅ IGNORAR: workspaces mock
    staleTime: 5 * 60 * 1000, // 5 minutes,
    retry: 1, // Tentar apenas uma vez
    refetchOnWindowFocus: false, // Não refazer query ao focar na janela
    gcTime: 10 * 60 * 1000 // 10 minutos para garbage collection
  })

  const {
    data: members = [],
    isLoading: isLoadingMembers,
    error: membersError,
    refetch: refetchMembers
  } = useQuery({
    queryKey: ['workspace-members', id],
    queryFn: () => workspaceService.getWorkspaceMembers(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes,
    retry: 1, // Tentar apenas uma vez
    refetchOnWindowFocus: false, // Não refazer query ao focar na janela
    gcTime: 10 * 60 * 1000 // 10 minutos para garbage collection
  })

  return {
    workspace,
    members,
    isLoading,
    isLoadingMembers,
    error,
    membersError,
    refetch,
    refetchMembers,
  }
}
