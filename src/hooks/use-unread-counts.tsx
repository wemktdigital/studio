'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '@/components/providers/auth-provider'

interface UnreadCounts {
  [conversationId: string]: number
}

export function useUnreadCounts(workspaceId: string) {
  const { user } = useAuthContext()
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({})
  const [lastReadTimes, setLastReadTimes] = useState<{[conversationId: string]: string}>({})

  /**
   * Mark messages as read for a conversation
   */
  const markAsRead = useCallback((conversationId: string) => {
    if (!conversationId) return

    console.log('🔍 useUnreadCounts: Marking as read:', conversationId)
    
    // Update last read time
    setLastReadTimes(prev => ({
      ...prev,
      [conversationId]: new Date().toISOString()
    }))

    // Clear unread count
    setUnreadCounts(prev => ({
      ...prev,
      [conversationId]: 0
    }))

    // Store in localStorage for persistence
    const storageKey = `lastRead_${user?.id}_${conversationId}`
    localStorage.setItem(storageKey, new Date().toISOString())
  }, [user?.id])

  /**
   * Increment unread count for a conversation
   */
  const incrementUnreadCount = useCallback((conversationId: string) => {
    if (!conversationId) return

    console.log('🔍 useUnreadCounts: Incrementing unread count for:', conversationId)
    
    setUnreadCounts(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || 0) + 1
    }))
  }, [])

  /**
   * Get unread count for a specific conversation
   */
  const getUnreadCount = useCallback((conversationId: string): number => {
    return unreadCounts[conversationId] || 0
  }, [unreadCounts])

  /**
   * Get total unread count across all conversations
   */
  const getTotalUnreadCount = useCallback((): number => {
    return Object.values(unreadCounts).reduce((total, count) => total + count, 0)
  }, [unreadCounts])

  /**
   * Load last read times from localStorage on mount
   */
  useEffect(() => {
    if (!user?.id) return

    console.log('🔍 useUnreadCounts: Loading last read times from localStorage')
    
    const loadedTimes: {[conversationId: string]: string} = {}
    
    // Load all stored last read times for this user
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(`lastRead_${user.id}_`)) {
        const conversationId = key.replace(`lastRead_${user.id}_`, '')
        const lastReadTime = localStorage.getItem(key)
        if (lastReadTime) {
          loadedTimes[conversationId] = lastReadTime
        }
      }
    }
    
    setLastReadTimes(loadedTimes)
    console.log('🔍 useUnreadCounts: Loaded last read times:', loadedTimes)
  }, [user?.id])

  /**
   * Calculate unread count based on last read time and message timestamps
   */
  const calculateUnreadCount = useCallback((
    conversationId: string, 
    messages: Array<{created_at: string, author_id: string}>
  ): number => {
    if (!conversationId || !messages.length) return 0

    const lastReadTime = lastReadTimes[conversationId]
    if (!lastReadTime) {
      // If no last read time, count all messages from other users
      return messages.filter(msg => msg.author_id !== user?.id).length
    }

    const lastReadDate = new Date(lastReadTime)
    
    // Count messages after last read time from other users
    const unreadCount = messages.filter(msg => {
      const messageDate = new Date(msg.created_at)
      return messageDate > lastReadDate && msg.author_id !== user?.id
    }).length

    console.log('🔍 useUnreadCounts: Calculated unread count:', {
      conversationId,
      lastReadTime,
      totalMessages: messages.length,
      unreadCount
    })

    return unreadCount
  }, [lastReadTimes, user?.id])

  /**
   * Update unread counts for multiple conversations
   */
  const updateUnreadCounts = useCallback((conversationData: Array<{
    conversationId: string
    messages: Array<{created_at: string, author_id: string}>
  }>) => {
    console.log('🔍 useUnreadCounts: Updating unread counts for conversations:', conversationData.length)
    
    const newUnreadCounts: UnreadCounts = {}
    
    conversationData.forEach(({ conversationId, messages }) => {
      const count = calculateUnreadCount(conversationId, messages)
      newUnreadCounts[conversationId] = count
    })
    
    setUnreadCounts(newUnreadCounts)
    console.log('🔍 useUnreadCounts: Updated unread counts:', newUnreadCounts)
  }, [calculateUnreadCount])

  return {
    unreadCounts,
    markAsRead,
    incrementUnreadCount,
    getUnreadCount,
    getTotalUnreadCount,
    updateUnreadCounts,
    lastReadTimes
  }
}
