'use client'

import { useMemo } from 'react'
import { User } from '@/lib/types'
import { useAuthContext } from '@/components/providers/auth-provider'

/**
 * Hook para normalizar dados de usuário e garantir consistência
 */
export function useNormalizedUser() {
  const { user: rawUser } = useAuthContext()
  
  const normalizedUser = useMemo(() => {
    if (!rawUser) return null
    
    // ✅ NORMALIZAR: Converter User do Supabase para formato consistente
    return {
      id: rawUser.id,
      displayName: rawUser.user_metadata?.display_name || rawUser.email?.split('@')[0] || 'Dev User',
      handle: rawUser.user_metadata?.handle || rawUser.email?.split('@')[0] || 'devuser',
      avatarUrl: rawUser.user_metadata?.avatar_url || 'https://i.pravatar.cc/40?u=dev',
      status: 'online' as const
    } as User
  }, [rawUser])
  
  return normalizedUser
}

/**
 * Hook para normalizar lista de usuários
 */
export function useNormalizedUsers(users: any[]): User[] {
  return useMemo(() => {
    return users.map(user => {
      // ✅ NORMALIZAR: Garantir formato consistente independente da fonte
      return {
        id: user.id,
        displayName: user.displayName || user.display_name || 'Unknown User',
        handle: user.handle || user.username || 'unknown',
        avatarUrl: user.avatarUrl || user.avatar_url || '',
        status: user.status || 'offline'
      } as User
    })
  }, [users])
}

/**
 * Hook para criar lista de usuários para MessageItem
 */
export function useMessageUsers(currentUser: User | null, otherUser: User | null): User[] {
  return useMemo(() => {
    const users = [
      currentUser,
      otherUser
    ].filter(Boolean) as User[]
    
    console.log('🔍 useMessageUsers: Normalized users for MessageItem:', users.map(u => ({ id: u.id, displayName: u.displayName })))
    
    return users
  }, [currentUser, otherUser])
}
