/**
 * 🔮 useMagicLink Hook
 * React hook for magic link authentication
 */

import { useState, useEffect } from 'react'
import { getMagicLinkService, type ProfileData } from '@/lib/services/magic-link-service'
import type { User } from '@supabase/supabase-js'

export function useMagicLink() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const magicLinkService = getMagicLinkService()

  // Carregar usuário atual
  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      try {
        const currentUser = await magicLinkService.getCurrentUser()
        
        if (!isMounted) return

        if (currentUser) {
          setUser(currentUser)
          setIsAuthenticated(true)

          // Carregar perfil
          const userProfile = await magicLinkService.getUserProfile(currentUser.id)
          if (isMounted) {
            setProfile(userProfile)
          }
        } else {
          setUser(null)
          setIsAuthenticated(false)
          setProfile(null)
        }
      } catch (error) {
        console.error('Error loading user:', error)
        if (isMounted) {
          setUser(null)
          setIsAuthenticated(false)
          setProfile(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadUser()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = magicLinkService.onAuthStateChange((user) => {
      if (!isMounted) return

      setUser(user)
      setIsAuthenticated(user !== null)

      if (user) {
        // Recarregar perfil
        magicLinkService.getUserProfile(user.id).then((profile) => {
          if (isMounted) {
            setProfile(profile)
          }
        })
      } else {
        setProfile(null)
      }
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  // Enviar magic link
  const sendMagicLink = async (email: string) => {
    return await magicLinkService.sendMagicLink(email)
  }

  // Fazer logout
  const signOut = async () => {
    const result = await magicLinkService.signOut()
    if (result.success) {
      setUser(null)
      setProfile(null)
      setIsAuthenticated(false)
    }
    return result
  }

  // Atualizar perfil
  const updateProfile = async (
    updates: Partial<Omit<ProfileData, 'id' | 'email' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user) return null

    const updatedProfile = await magicLinkService.updateUserProfile(user.id, updates)
    if (updatedProfile) {
      setProfile(updatedProfile)
    }
    return updatedProfile
  }

  return {
    user,
    profile,
    isLoading,
    isAuthenticated,
    sendMagicLink,
    signOut,
    updateProfile,
  }
}

