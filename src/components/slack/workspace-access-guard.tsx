'use client'

import { useWorkspaceAccess, useIsAdmin } from '@/hooks'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Lock, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface WorkspaceAccessGuardProps {
  workspaceId: string
  children: React.ReactNode
}

export function WorkspaceAccessGuard({ workspaceId, children }: WorkspaceAccessGuardProps) {
  const router = useRouter()
  const { user } = useAuthContext()
  const { hasAccess, isLoading: accessLoading } = useWorkspaceAccess(workspaceId)
  const { isAdmin, isLoading: adminLoading } = useIsAdmin()

  const isLoading = accessLoading || adminLoading

  // ✅ REDIRECT: Se não tem acesso, redirecionar para página de workspaces
  useEffect(() => {
    if (!isLoading && !hasAccess && user) {
      console.log('WorkspaceAccessGuard: User does not have access to workspace:', workspaceId)
      router.push('/w')
    }
  }, [hasAccess, isLoading, workspaceId, router, user])

  // ✅ LOADING: Mostrar loading enquanto verifica acesso
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

  // ✅ NO ACCESS: Mostrar mensagem de acesso negado
  if (!hasAccess && user) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {isAdmin ? (
                    <>
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Admin Access</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">User Access</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isAdmin 
                    ? "As an admin, you should have access to all workspaces. Please contact support if this is an error."
                    : "You can only access workspaces you are a member of."
                  }
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/w')}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Workspaces
                </Button>
                {isAdmin && (
                  <Button 
                    onClick={() => window.location.reload()}
                    className="flex-1"
                  >
                    Retry Access
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ✅ ACCESS GRANTED: Renderizar conteúdo
  return <>{children}</>
}
