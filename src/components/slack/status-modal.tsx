'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { X, Shield } from 'lucide-react'

interface StatusModalProps {
  isOpen: boolean
  onClose: () => void
  currentStatus?: string
  onStatusChange: (status: string, duration?: string) => void
}

const statusSuggestions = [
  'Em uma reunião',
  'No almoço',
  'Foco total',
  'Disponível',
  'Ausente',
  'Ocupado',
  'Volto em breve',
  'Trabalhando remotamente',
  'Em trânsito',
  'Livre para conversar'
]

const durationOptions = [
  { value: 'never', label: 'Não limpar' },
  { value: '30min', label: '30 minutos' },
  { value: '1hour', label: '1 hora' },
  { value: '4hours', label: '4 horas' },
  { value: '8hours', label: '8 horas' },
  { value: '24hours', label: '24 horas' }
]

export default function StatusModal({ 
  isOpen, 
  onClose, 
  currentStatus = '', 
  onStatusChange 
}: StatusModalProps) {
  const [status, setStatus] = useState(currentStatus)
  const [duration, setDuration] = useState('never')
  const { toast } = useToast()

  const handleSave = () => {
    if (status.trim()) {
      onStatusChange(status.trim(), duration)
      toast({
        title: "Status atualizado",
        description: `Status definido como: "${status.trim()}"`,
      })
    } else {
      toast({
        title: "Status limpo",
        description: "Seu status foi removido.",
      })
    }
    onClose()
  }

  const handleClear = () => {
    setStatus('')
    setDuration('never')
    onStatusChange('', 'never')
    toast({
      title: "Status limpo",
      description: "Seu status foi removido.",
    })
    onClose()
  }

  const handleSuggestionClick = (suggestion: string) => {
    setStatus(suggestion)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold">
            Definir seu status
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de Status */}
          <div className="space-y-2">
            <Label htmlFor="status-input">Status</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                id="status-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Qual é o seu status?"
                className="pl-10 pr-8"
              />
              {status && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatus('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Sugestões de Status */}
          {statusSuggestions.length > 0 && (
            <div className="space-y-2">
              <Label>Sugestões</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {statusSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="justify-start text-left h-auto p-2 text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Duração do Status */}
          <div className="space-y-2">
            <Label htmlFor="duration-select">Remover status após...</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a duração" />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Link para editar sugestões */}
          <div className="pt-2">
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-blue-600 hover:text-blue-800"
              onClick={() => {
                toast({
                  title: "Funcionalidade em desenvolvimento",
                  description: "A edição de sugestões será implementada em breve.",
                })
              }}
            >
              Editar sugestões para Studio
            </Button>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={!status}
          >
            Limpar status
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
