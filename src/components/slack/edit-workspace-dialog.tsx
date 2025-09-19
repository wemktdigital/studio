'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Edit, Save, X } from 'lucide-react'

interface EditWorkspaceDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  currentWorkspace?: {
    name: string
    description?: string
    isActive: boolean
  }
  onWorkspaceUpdate?: (data: { name: string; description: string; isActive: boolean }) => void
}

export function EditWorkspaceDialog({ 
  isOpen, 
  onOpenChange, 
  workspaceId,
  currentWorkspace,
  onWorkspaceUpdate
}: EditWorkspaceDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (currentWorkspace) {
      setFormData({
        name: currentWorkspace.name || '',
        description: currentWorkspace.description || '',
        isActive: currentWorkspace.isActive ?? true
      })
    }
  }, [currentWorkspace])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do workspace é obrigatório.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Simular atualização do workspace
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Workspace atualizado",
        description: "As informações do workspace foram atualizadas com sucesso.",
      })
      
      onWorkspaceUpdate?.(formData)
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o workspace. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (currentWorkspace) {
      setFormData({
        name: currentWorkspace.name || '',
        description: currentWorkspace.description || '',
        isActive: currentWorkspace.isActive ?? true
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Workspace
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do seu workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Nome do Workspace</Label>
            <Input
              id="workspace-name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Nome do workspace"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-description">Descrição</Label>
            <Textarea
              id="workspace-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descreva o propósito deste workspace"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="workspace-active">Workspace ativo</Label>
              <p className="text-sm text-muted-foreground">
                Desative para arquivar o workspace
              </p>
            </div>
            <Switch
              id="workspace-active"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="gap-2">
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="gap-2">
            <Save className="h-4 w-4" />
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
