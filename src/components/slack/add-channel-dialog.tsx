'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useCreateChannel } from '@/hooks/use-channels'
import { useAuthContext } from '@/components/providers/auth-provider'
import { toast } from '@/hooks/use-toast'

interface AddChannelDialogProps {
  isOpen: boolean
  onClose: () => void
  workspaceId?: string // ✅ ADICIONADO: Prop opcional
}

export default function AddChannelDialog({ isOpen, onClose, workspaceId }: AddChannelDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  
  const { createChannel, isCreating, error } = useCreateChannel()
  const { user } = useAuthContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome do canal é obrigatório',
        variant: 'destructive'
      })
      return
    }

    try {
      await createChannel({
        name: name.trim(),
        description: description.trim() || undefined,
        isPrivate
      })

      toast({
        title: 'Sucesso',
        description: 'Canal criado com sucesso!'
      })

      // Reset form
      setName('')
      setDescription('')
      setIsPrivate(false)
      onClose()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao criar canal',
        variant: 'destructive'
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Criar Novo Canal</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Canal</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: geral"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do canal"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
            <Label htmlFor="private">Canal Privado</Label>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
            >
              {isCreating ? 'Criando...' : 'Criar Canal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
