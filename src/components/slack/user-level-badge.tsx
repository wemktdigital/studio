'use client'

import { Badge } from '@/components/ui/badge'
import { Crown, Shield, User, Users, Settings, AlertTriangle } from 'lucide-react'
import { useUserLevels } from '@/hooks/use-user-levels'
import { cn } from '@/lib/utils'

const levelIcons = {
  super_admin: Crown,
  admin: Shield,
  manager: Settings,
  member: User,
  guest: Users,
  banned: AlertTriangle
}

const levelColors = {
  super_admin: 'bg-purple-500 hover:bg-purple-600 text-white',
  admin: 'bg-red-500 hover:bg-red-600 text-white',
  manager: 'bg-blue-500 hover:bg-blue-600 text-white',
  member: 'bg-green-500 hover:bg-green-600 text-white',
  guest: 'bg-gray-500 hover:bg-gray-600 text-white',
  banned: 'bg-black hover:bg-black text-white'
}

const levelLabels = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
  guest: 'Guest',
  banned: 'Banned'
}

export function UserLevelBadge() {
  const { currentUserLevel, isLoadingUserLevel } = useUserLevels()

  if (isLoadingUserLevel || !currentUserLevel) {
    return null
  }

  const Icon = levelIcons[currentUserLevel.userLevel]
  const colorClass = levelColors[currentUserLevel.userLevel]
  const label = levelLabels[currentUserLevel.userLevel]

  return (
    <Badge 
      className={cn(
        "flex items-center gap-1 px-2 py-1 text-xs font-medium cursor-pointer transition-colors",
        colorClass
      )}
      title={`Seu nível: ${label}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}
