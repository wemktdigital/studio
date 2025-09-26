'use client'

import { useAuthContext } from '@/components/providers/auth-provider'
import { useMemo } from 'react'

/**
 * Hook para obter o avatar do usuário atual
 */
export function useCurrentUserAvatar() {
  const { user } = useAuthContext()

  const avatarData = useMemo(() => {
    if (!user) {
      return {
        avatarUrl: null,
        displayName: 'Usuário',
        initials: 'U'
      }
    }

    const displayName = user.user_metadata?.full_name || 
                       user.user_metadata?.display_name || 
                       user.email || 
                       'Usuário'

    const avatarUrl = user.user_metadata?.avatar_url || 
                     user.user_metadata?.picture ||
                     `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&size=128`

    const initials = displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)

    return {
      avatarUrl,
      displayName,
      initials
    }
  }, [user])

  return avatarData
}
