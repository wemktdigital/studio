'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  count: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'primary' | 'secondary' | 'destructive'
  showZero?: boolean
  className?: string
}

export default function NotificationBadge({ 
  count, 
  size = 'md', 
  variant = 'default',
  showZero = false,
  className 
}: NotificationBadgeProps) {
  // Don't render if count is 0 and showZero is false
  if (count === 0 && !showZero) return null

  const sizeClasses = {
    sm: 'min-w-[16px] h-4 px-1 text-xs',
    md: 'min-w-[20px] h-5 px-1.5 text-xs',
    lg: 'min-w-[24px] h-6 px-2 text-sm'
  }

  const variantClasses = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground'
  }

  // Format count (show 99+ for large numbers)
  const displayCount = count > 99 ? '99+' : count.toString()

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200",
        "animate-in fade-in-0 zoom-in-95",
        sizeClasses[size],
        variantClasses[variant],
        count > 0 && "animate-pulse",
        className
      )}
    >
      {displayCount}
    </div>
  )
}

// Compact version for small spaces
export function NotificationDot({ 
  count, 
  size = 'sm',
  className 
}: Omit<NotificationBadgeProps, 'showZero' | 'variant'>) {
  if (count === 0) return null

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  return (
    <div
      className={cn(
        "rounded-full bg-red-500 animate-pulse",
        sizeClasses[size],
        className
      )}
    />
  )
}

// Animated notification indicator
export function AnimatedNotification({ 
  count, 
  className 
}: { count: number; className?: string }) {
  if (count === 0) return null

  return (
    <div className={cn("relative", className)}>
      {/* Main badge */}
      <NotificationBadge 
        count={count} 
        variant="destructive" 
        size="sm"
        className="animate-bounce"
      />
      
      {/* Ripple effect */}
      <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
    </div>
  )
}
