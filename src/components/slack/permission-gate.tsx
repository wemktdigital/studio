'use client'

import { ReactNode } from 'react'
import { useUserLevels } from '@/hooks/use-user-levels'

interface PermissionGateProps {
  children: ReactNode
  requiredPermission?: keyof ReturnType<typeof useUserLevels>['can']
  fallback?: ReactNode
  showFallback?: boolean
}

export function PermissionGate({ 
  children, 
  requiredPermission, 
  fallback = null,
  showFallback = false 
}: PermissionGateProps) {
  const { can, isLoadingUserLevel } = useUserLevels()

  // Show loading state
  if (isLoadingUserLevel) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded" />
      </div>
    )
  }

  // Check permission
  if (requiredPermission && !can[requiredPermission]()) {
    return showFallback ? <>{fallback}</> : null
  }

  // Show children if permission check passes
  return <>{children}</>
}

// Convenience components for common permissions
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate requiredPermission="isAdmin" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function ManagerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate requiredPermission="isManager" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function SuperAdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate requiredPermission="isSuperAdmin" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function CanCreateChannels({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate requiredPermission="createChannels" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function CanManageUsers({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate requiredPermission="manageUsers" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function CanBanUsers({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate requiredPermission="banUsers" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}
