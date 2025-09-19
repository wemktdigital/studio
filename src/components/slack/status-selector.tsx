'use client'

import React, { useState } from 'react'
import { ChevronDown, Circle, Clock, X, AlertTriangle, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { PresenceStatus } from '@/hooks/use-presence'
import { cn } from '@/lib/utils'

interface StatusSelectorProps {
  currentStatus: PresenceStatus
  onStatusChange: (status: PresenceStatus) => void
  className?: string
}

const statusOptions = [
  {
    value: 'online' as PresenceStatus,
    label: 'Online',
    description: 'Disponível para conversar',
    icon: Circle,
    color: 'text-green-500',
    bgColor: 'bg-green-500'
  },
  {
    value: 'away' as PresenceStatus,
    label: 'Ausente',
    description: 'Inativo há 5+ minutos',
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500'
  },
  {
    value: 'busy' as PresenceStatus,
    label: 'Ocupado',
    description: 'Não perturbe',
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-500'
  },
  {
    value: 'do-not-disturb' as PresenceStatus,
    label: 'Não perturbe',
    description: 'Silencioso',
    icon: Moon,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500'
  },
  {
    value: 'offline' as PresenceStatus,
    label: 'Offline',
    description: 'Não disponível',
    icon: X,
    color: 'text-gray-400',
    bgColor: 'bg-gray-400'
  }
]

export default function StatusSelector({ 
  currentStatus, 
  onStatusChange,
  className 
}: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const currentOption = statusOptions.find(option => option.value === currentStatus)
  const IconComponent = currentOption?.icon || Circle

  const handleStatusSelect = (status: PresenceStatus) => {
    onStatusChange(status)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 gap-2 hover:bg-accent hover:text-accent-foreground",
            className
          )}
        >
          <div className="relative">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full",
              currentOption?.bgColor
            )} />
            
            {/* Animated pulse for online status */}
            {currentStatus === 'online' && (
              <div className={cn(
                "absolute inset-0 rounded-full animate-ping",
                "w-2.5 h-2.5",
                currentOption?.bgColor,
                "opacity-75"
              )} />
            )}
          </div>
          
          <span className="text-xs font-medium">
            {currentOption?.label}
          </span>
          
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">Definir status</p>
          <p className="text-xs text-muted-foreground">
            Escolha como você quer aparecer para outros usuários
          </p>
        </div>
        
        <DropdownMenuSeparator />
        
        {statusOptions.map((option) => {
          const OptionIcon = option.icon
          const isSelected = option.value === currentStatus
          
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleStatusSelect(option.value)}
              className={cn(
                "flex items-start gap-3 px-3 py-2.5 cursor-pointer",
                isSelected && "bg-accent"
              )}
            >
              <div className="relative mt-0.5">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  option.bgColor
                )} />
                
                {/* Animated pulse for online status */}
                {option.value === 'online' && (
                  <div className={cn(
                    "absolute inset-0 rounded-full animate-ping",
                    "w-3 h-3",
                    option.bgColor,
                    "opacity-75"
                  )} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-foreground" : "text-foreground"
                  )}>
                    {option.label}
                  </span>
                  
                  {isSelected && (
                    <span className="text-xs text-muted-foreground">
                      (Atual)
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
