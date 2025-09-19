'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/components/providers/auth-provider'

export type PresenceStatus = 'online' | 'away' | 'offline' | 'busy' | 'do-not-disturb'

interface UserPresence {
  userId: string
  status: PresenceStatus
  lastSeen: Date
  isTyping?: boolean
  currentChannel?: string
}

export function usePresence(workspaceId: string) {
  const { user } = useAuthContext()
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [userStatuses, setUserStatuses] = useState<Map<string, UserPresence>>(new Map())
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    if (!user || !workspaceId) return

    // ✅ SIMPLIFICADO: Sem dependências de banco
    setIsOnline(true)
    
    // ✅ SIMPLIFICADO: Status mock para o usuário atual
    setUserStatuses(prev => new Map(prev).set(user.id, {
      userId: user.id,
      status: 'online',
      lastSeen: new Date(),
      isTyping: false,
      currentChannel: undefined
    }))

    // ✅ SIMPLIFICADO: Usuário atual sempre online
    setOnlineUsers(prev => new Set(prev).add(user.id))

    // Track user activity
    let activityTimeout: NodeJS.Timeout
    let awayTimeout: NodeJS.Timeout

    const resetActivityTimers = () => {
      clearTimeout(activityTimeout)
      clearTimeout(awayTimeout)
      
      // Set user as away after 5 minutes of inactivity
      awayTimeout = setTimeout(() => {
        setUserStatuses(prev => {
          const newMap = new Map(prev)
          const existing = newMap.get(user.id)
          if (existing) {
            newMap.set(user.id, { ...existing, status: 'away' })
          }
          return newMap
        })
      }, 5 * 60 * 1000) // 5 minutes
    }

    const handleActivity = () => {
      resetActivityTimers()
      
      // Update last seen
      setUserStatuses(prev => {
        const newMap = new Map(prev)
        const existing = newMap.get(user.id)
        if (existing) {
          newMap.set(user.id, { ...existing, lastSeen: new Date() })
        }
        return newMap
      })
    }

    // Add activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Set up periodic presence updates
    const presenceInterval = setInterval(() => {
      if (isOnline) {
        // ✅ SIMPLIFICADO: Sem operações de banco
        setUserStatuses(prev => {
          const newMap = new Map(prev)
          const existing = newMap.get(user.id)
          if (existing) {
            newMap.set(user.id, { ...existing, lastSeen: new Date() })
          }
          return newMap
        })
      }
    }, 30000) // Update every 30 seconds

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      clearTimeout(activityTimeout)
      clearTimeout(awayTimeout)
      clearInterval(presenceInterval)
      setIsOnline(false)
    }
  }, [user, workspaceId, isOnline])

  // Get user status
  const getUserStatus = (userId: string): PresenceStatus => {
    if (onlineUsers.has(userId)) {
      return userStatuses.get(userId)?.status || 'online'
    }
    return 'offline'
  }

  // Get user last seen
  const getUserLastSeen = (userId: string): Date | null => {
    return userStatuses.get(userId)?.lastSeen || null
  }

  // Check if user is typing
  const isUserTyping = (userId: string): boolean => {
    return userStatuses.get(userId)?.isTyping || false
  }

  // Set user status
  const setUserStatus = async (status: PresenceStatus) => {
    if (!user || !workspaceId) return

    // ✅ SIMPLIFICADO: Sem operações de banco
    setUserStatuses(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(user.id)
      if (existing) {
        newMap.set(user.id, { ...existing, status })
      }
      return newMap
    })
  }

  // Set typing status
  const setTypingStatus = async (isTyping: boolean, channelId?: string) => {
    if (!user || !workspaceId) return

    // ✅ SIMPLIFICADO: Sem operações de banco
    setUserStatuses(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(user.id)
      if (existing) {
        newMap.set(user.id, { ...existing, isTyping, currentChannel: channelId })
      }
      return newMap
    })
  }

  return {
    isOnline,
    onlineUsers,
    userStatuses,
    getUserStatus,
    getUserLastSeen,
    isUserTyping,
    setUserStatus,
    setTypingStatus
  }
}
