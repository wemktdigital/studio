'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useNotificationSounds } from './use-notification-sounds'

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export function usePushNotifications() {
  const { user } = useAuthContext()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const { playMessageSound, playDMSound, playMentionSound, playChannelSound } = useNotificationSounds()

  // Check if notifications are supported
  useEffect(() => {
    setIsSupported('Notification' in window)
  }, [])

  // Check current permission status
  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission)
    }
  }, [isSupported])

  // Request permission to send notifications
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Notifications not supported in this browser')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }, [isSupported])

  // Send a notification
  const sendNotification = useCallback((options: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.warn('Cannot send notification: not supported or permission denied')
      return null
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        actions: options.actions,
        // Add some default styling
        silent: false, // Allow sound
      })

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      // Handle notification click
      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      return notification
    } catch (error) {
      console.error('Error sending notification:', error)
      return null
    }
  }, [isSupported, permission])

  // Send a simple message notification
  const notifyNewMessage = useCallback((channelName: string, senderName: string, messagePreview: string) => {
    // Play channel sound
    playChannelSound()
    
    return sendNotification({
      title: `Nova mensagem em #${channelName}`,
      body: `${senderName}: ${messagePreview}`,
      tag: `message-${channelName}`,
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: 'Ver mensagem',
        }
      ]
    })
  }, [sendNotification, playChannelSound])

  // Send a DM notification
  const notifyNewDM = useCallback((senderName: string, messagePreview: string) => {
    // Play DM sound
    playDMSound()
    
    return sendNotification({
      title: `Nova mensagem de ${senderName}`,
      body: messagePreview,
      tag: `dm-${senderName}`,
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: 'Responder',
        }
      ]
    })
  }, [sendNotification, playDMSound])

  // Send a mention notification
  const notifyMention = useCallback((channelName: string, senderName: string, messagePreview: string) => {
    // Play mention sound
    playMentionSound()
    
    return sendNotification({
      title: `Você foi mencionado em #${channelName}`,
      body: `${senderName}: ${messagePreview}`,
      tag: `mention-${channelName}`,
      requireInteraction: true, // Mentions are important, require interaction
      actions: [
        {
          action: 'view',
          title: 'Ver mensagem',
        }
      ]
    })
  }, [sendNotification, playMentionSound])

  // Update page title when there are unread messages
  const updatePageTitle = useCallback((unreadCount: number, channelName?: string) => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${channelName || 'Studio'}`
    } else {
      document.title = channelName || 'Studio'
    }
  }, [])

  // Reset page title
  const resetPageTitle = useCallback(() => {
    document.title = 'Studio'
  }, [])

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    notifyNewMessage,
    notifyNewDM,
    notifyMention,
    updatePageTitle,
    resetPageTitle,
  }
}
