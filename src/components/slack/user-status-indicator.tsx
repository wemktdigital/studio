'use client'

import React from 'react'
import { Circle, Clock, X, AlertTriangle, Moon } from 'lucide-react'
import { PresenceStatus } from '@/hooks/use-presence'
import { cn } from '@/lib/utils'

interface UserStatusIndicatorProps {
  status: PresenceStatus
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const statusConfig = {
  online: {
    icon: Circle,
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    label: 'Online',
    description: 'Disponível'
  },
  away: {
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
    label: 'Ausente',
    description: 'Inativo há 5+ min'
  },
  offline: {
    icon: X,
    color: 'text-gray-400',
    bgColor: 'bg-gray-400',
    label: 'Offline',
    description: 'Não disponível'
  },
  busy: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-500',
    label: 'Ocupado',
    description: 'Não perturbe'
  },
  'do-not-disturb': {
    icon: Moon,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500',
    label: 'Não perturbe',
    description: 'Silencioso'
  }
}

export default function UserStatusIndicator({ 
  status, 
  size = 'md', 
  showLabel = false,
  className 
}: UserStatusIndicatorProps) {
  const config = statusConfig[status]
  const IconComponent = config.icon

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const iconSizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-5 h-5'
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Status Dot */}
      <div className="relative">
        <div className={cn(
          "rounded-full",
          sizeClasses[size],
          config.bgColor
        )} />
        
        {/* Animated pulse for online status */}
        {status === 'online' && (
          <div className={cn(
            "absolute inset-0 rounded-full animate-ping",
            sizeClasses[size],
            config.bgColor,
            "opacity-75"
          )} />
        )}
      </div>

      {/* Status Label */}
      {showLabel && (
        <div className="flex flex-col">
          <span className={cn(
            "text-xs font-medium",
            config.color
          )}>
            {config.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {config.description}
          </span>
        </div>
      )}
    </div>
  )
}

// Compact version for small spaces
export function UserStatusDot({ 
  status, 
  size = 'sm',
  className 
}: Omit<UserStatusIndicatorProps, 'showLabel'>) {
  const config = statusConfig[status]
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "rounded-full",
        sizeClasses[size],
        config.bgColor
      )} />
      
      {/* Animated pulse for online status */}
      {status === 'online' && (
        <div className={cn(
          "absolute inset-0 rounded-full animate-ping",
          sizeClasses[size],
          config.bgColor,
          "opacity-75"
        )} />
      )}
    </div>
  )
}
