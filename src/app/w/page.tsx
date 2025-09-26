'use client'

import { useRouter } from 'next/navigation'
import { useWorkspaces } from '@/hooks'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Hash, Plus, ArrowRight, Shield, User } from 'lucide-react'
import { CreateWorkspaceDialog } from '@/components/slack/create-workspace-dialog'
import { WorkspaceManagement } from '@/components/slack/workspace-management'
import { LogoutButton } from '@/components/slack/logout-button'
import { workspaceService } from '@/lib/services'
import { useEffect, useState } from 'react'

export default function WorkspacesPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useAuthContext()
  const { workspaces, isLoading, error, refetch } = useWorkspaces()
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [adminLoading, setAdminLoading] = useState<boolean>(true)

  // ✅ VERIFICAR STATUS DE ADMIN
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setAdminLoading(false)
        return
      }

      try {
        const adminStatus = await workspaceService.isUserAdmin()
        setIsAdmin(adminStatus)
        console.log('WorkspacesPage: Admin status:', adminStatus)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setAdminLoading(false)
      }
    }

    checkAdminStatus()
  }, [user])

  if (userLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Your Workspaces</h1>
              {isAdmin && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Welcome back, {user.email}! {isAdmin ? 'You have access to all workspaces.' : 'Choose a workspace to get started.'}
            </p>
          </div>
          <CreateWorkspaceDialog />
        </div>

        {/* Access Control Info */}
        {workspaces.length > 0 && (
          <div className="mb-6 p-4 bg-muted/20 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              {isAdmin ? (
                <>
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-blue-700 dark:text-blue-300">Admin Access</span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-green-700 dark:text-green-300">User Access</span>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isAdmin 
                ? "As an admin, you can access all workspaces in the system."
                : "You can only access workspaces you are a member of."
              }
            </p>
          </div>
        )}

        {/* Workspaces Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading workspaces...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">Error loading workspaces: {error.message}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No workspaces yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first workspace to start collaborating with your team.
            </p>
            <CreateWorkspaceDialog />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <WorkspaceManagement
                key={workspace.id}
                workspace={workspace}
                onWorkspaceUpdate={refetch}
                onWorkspaceClick={() => router.push(`/w/${workspace.id}`)}
              />
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 p-6 bg-muted/10 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex gap-4">
            <CreateWorkspaceDialog />
            <Button variant="outline" onClick={() => router.push('/auth/profile')}>
              <Users className="h-4 w-4 mr-2" />
              Manage Profile
            </Button>
            <LogoutButton variant="outline" />
          </div>
        </div>
      </div>
    </div>
  )
}

