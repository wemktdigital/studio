'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Users, Hash, Edit, Trash2, Power, PowerOff, Settings, ArrowRight } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

interface Workspace {
  id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface WorkspaceManagementProps {
  workspace: Workspace
  onWorkspaceUpdate: () => void
  onWorkspaceClick: () => void
}

export function WorkspaceManagement({ workspace, onWorkspaceUpdate, onWorkspaceClick }: WorkspaceManagementProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    name: workspace.name
  })
  
  const { toast } = useToast()
  const supabase = createClient()

  const handleEdit = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          name: editForm.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspace.id)

      if (error) {
        throw error
      }

      toast({
        title: "Workspace updated",
        description: "Your workspace has been successfully updated.",
      })
      
      setIsEditDialogOpen(false)
      onWorkspaceUpdate()
    } catch (error) {
      console.error('Error updating workspace:', error)
      toast({
        title: "Error",
        description: "Failed to update workspace. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    setIsLoading(true)
    try {
      console.log('handleToggleStatus: Starting toggle for workspace:', workspace.id)
      console.log('handleToggleStatus: Current status:', workspace.is_active)
      console.log('handleToggleStatus: New status will be:', !workspace.is_active)
      
      const { data, error } = await supabase
        .from('workspaces')
        .update({
          is_active: !workspace.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspace.id)
        .select()

      console.log('handleToggleStatus: Supabase response:', { data, error })

      if (error) {
        console.error('handleToggleStatus: Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('handleToggleStatus: Update successful, data:', data)

      toast({
        title: workspace.is_active ? "Workspace deactivated" : "Workspace activated",
        description: workspace.is_active 
          ? "Your workspace has been deactivated." 
          : "Your workspace has been activated.",
      })
      
      onWorkspaceUpdate()
    } catch (error: any) {
      console.error('handleToggleStatus: Exception caught:', error)
      console.error('handleToggleStatus: Error message:', error?.message)
      console.error('handleToggleStatus: Error details:', error?.details)
      console.error('handleToggleStatus: Error code:', error?.code)
      
      toast({
        title: "Error",
        description: error?.message || "Failed to update workspace status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspace.id)

      if (error) {
        throw error
      }

      toast({
        title: "Workspace deleted",
        description: "Your workspace has been permanently deleted.",
      })
      
      setIsDeleteDialogOpen(false)
      onWorkspaceUpdate()
    } catch (error) {
      console.error('Error deleting workspace:', error)
      toast({
        title: "Error",
        description: "Failed to delete workspace. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Hash className="h-6 w-6 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={workspace.is_active ? "default" : "secondary"}>
              {workspace.is_active ? "Active" : "Inactive"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleStatus}>
                  {workspace.is_active ? (
                    <>
                      <PowerOff className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardTitle 
          className="text-lg cursor-pointer hover:text-primary transition-colors"
          onClick={onWorkspaceClick}
        >
          {workspace.name}
        </CardTitle>
        <CardDescription>
          Workspace for team collaboration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Team members</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onWorkspaceClick}
            className="hover:bg-primary/10"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>
              Update your workspace information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter workspace name"
              />
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{workspace.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
