'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Bell, Moon, Volume2, Eye, Shield, Palette } from 'lucide-react'

export default function PreferencesPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Estados das preferências
  const [preferences, setPreferences] = useState({
    // Notificações
    desktopNotifications: true,
    soundNotifications: true,
    emailNotifications: false,
    
    // Status e Presença
    autoAway: true,
    showOnlineStatus: true,
    
    // Interface
    darkMode: true,
    compactMode: false,
    showAvatars: true,
    
    // Privacidade
    showReadReceipts: true,
    showTypingIndicator: true,
    allowDirectMessages: true,
  })

  const handlePreferenceChange = (key: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
    
    toast({
      title: "Preferência atualizada",
      description: `A configuração foi salva.`,
    })
  }

  const handleSaveAll = () => {
    toast({
      title: "Preferências salvas",
      description: "Todas as suas preferências foram salvas com sucesso!",
    })
  }

  const handleReset = () => {
    setPreferences({
      desktopNotifications: true,
      soundNotifications: true,
      emailNotifications: false,
      autoAway: true,
      showOnlineStatus: true,
      darkMode: true,
      compactMode: false,
      showAvatars: true,
      showReadReceipts: true,
      showTypingIndicator: true,
      allowDirectMessages: true,
    })
    
    toast({
      title: "Preferências redefinidas",
      description: "Todas as preferências foram redefinidas para os valores padrão.",
    })
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Preferências</h1>
            <p className="text-muted-foreground">
              Personalize sua experiência no Studio
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="desktop-notifications">Notificações de desktop</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações no seu computador
                  </p>
                </div>
                <Switch
                  id="desktop-notifications"
                  checked={preferences.desktopNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange('desktopNotifications', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound-notifications">Notificações sonoras</Label>
                  <p className="text-sm text-muted-foreground">
                    Tocar sons para novas mensagens
                  </p>
                </div>
                <Switch
                  id="sound-notifications"
                  checked={preferences.soundNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange('soundNotifications', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Notificações por email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber resumos por email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status e Presença */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Status e Presença
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-away">Status automático ausente</Label>
                  <p className="text-sm text-muted-foreground">
                    Definir como ausente após inatividade
                  </p>
                </div>
                <Switch
                  id="auto-away"
                  checked={preferences.autoAway}
                  onCheckedChange={(checked) => handlePreferenceChange('autoAway', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-online-status">Mostrar status online</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir que outros vejam seu status
                  </p>
                </div>
                <Switch
                  id="show-online-status"
                  checked={preferences.showOnlineStatus}
                  onCheckedChange={(checked) => handlePreferenceChange('showOnlineStatus', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Interface
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Modo escuro</Label>
                  <p className="text-sm text-muted-foreground">
                    Usar tema escuro da interface
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) => handlePreferenceChange('darkMode', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode">Modo compacto</Label>
                  <p className="text-sm text-muted-foreground">
                    Interface mais compacta
                  </p>
                </div>
                <Switch
                  id="compact-mode"
                  checked={preferences.compactMode}
                  onCheckedChange={(checked) => handlePreferenceChange('compactMode', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-avatars">Mostrar avatares</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir fotos de perfil dos usuários
                  </p>
                </div>
                <Switch
                  id="show-avatars"
                  checked={preferences.showAvatars}
                  onCheckedChange={(checked) => handlePreferenceChange('showAvatars', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-read-receipts">Mostrar confirmação de leitura</Label>
                  <p className="text-sm text-muted-foreground">
                    Indicar quando suas mensagens foram lidas
                  </p>
                </div>
                <Switch
                  id="show-read-receipts"
                  checked={preferences.showReadReceipts}
                  onCheckedChange={(checked) => handlePreferenceChange('showReadReceipts', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-typing-indicator">Mostrar indicador de digitação</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar quando outros estão digitando
                  </p>
                </div>
                <Switch
                  id="show-typing-indicator"
                  checked={preferences.showTypingIndicator}
                  onCheckedChange={(checked) => handlePreferenceChange('showTypingIndicator', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-direct-messages">Permitir mensagens diretas</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir que outros usuários enviem mensagens diretas
                  </p>
                </div>
                <Switch
                  id="allow-direct-messages"
                  checked={preferences.allowDirectMessages}
                  onCheckedChange={(checked) => handlePreferenceChange('allowDirectMessages', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button onClick={handleSaveAll}>
                  Salvar Preferências
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Redefinir Padrões
                </Button>
                <Button variant="ghost" onClick={() => router.back()}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
