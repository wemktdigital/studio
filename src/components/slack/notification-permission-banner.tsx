'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NotificationPermissionBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [hasPermission, setHasPermission] = useState<NotificationPermission | null>(null)

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setHasPermission(Notification.permission)
      
      // Show banner if permission is not granted
      if (Notification.permission === 'default') {
        setIsVisible(true)
      }
    }
  }, [])

  const handleActivate = async () => {
    try {
      const permission = await Notification.requestPermission()
      setHasPermission(permission)
      
      if (permission === 'granted') {
        setIsVisible(false)
        // Show a test notification
        new Notification('Studio', {
          body: 'Notificações ativadas com sucesso!',
          icon: '/favicon.ico'
        })
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (!isVisible || hasPermission === 'granted') {
    return null
  }

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-[60] max-w-sm bg-background border border-border rounded-lg shadow-lg p-4",
      "transform transition-all duration-200 ease-in-out",
      "animate-in slide-in-from-bottom-2"
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Ativar notificações
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Receba alertas quando chegar novas mensagens.
          </p>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleActivate}
              className="text-xs h-8 px-3"
            >
              <Bell className="h-3 w-3 mr-1" />
              Ativar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-xs h-8 px-3"
            >
              <X className="h-3 w-3 mr-1" />
              Depois
            </Button>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="flex-shrink-0 h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
