'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Bell, BellOff, MessageCircle, Hash, Users, AtSign, Heart, Reply } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface NotificationSettings {
  // General notifications
  allNotifications: boolean
  desktopNotifications: boolean
  emailNotifications: boolean
  mobileNotifications: boolean
  
  // Activity types
  mentions: boolean
  reactions: boolean
  threads: boolean
  directMessages: boolean
  channelMessages: boolean
  userStatusChanges: boolean
  
  // Quiet hours
  quietHours: boolean
  quietStart: string
  quietEnd: string
  
  // Frequency
  notificationFrequency: 'immediate' | 'digest' | 'weekly'
}

interface NotificationSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
}

export function NotificationSettingsModal({ isOpen, onClose, workspaceId }: NotificationSettingsModalProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    allNotifications: true,
    desktopNotifications: true,
    emailNotifications: false,
    mobileNotifications: false,
    mentions: true,
    reactions: false,
    threads: true,
    directMessages: true,
    channelMessages: false,
    userStatusChanges: false,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '08:00',
    notificationFrequency: 'immediate'
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Load settings from localStorage or API
  useEffect(() => {
    if (isOpen) {
      const savedSettings = localStorage.getItem(`notification-settings-${workspaceId}`)
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings))
        } catch (error) {
          console.error('Error loading notification settings:', error)
        }
      }
    }
  }, [isOpen, workspaceId])

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      // Save to localStorage (in production, save to API)
      localStorage.setItem(`notification-settings-${workspaceId}`, JSON.stringify(settings))
      
      // Request browser notification permission if desktop notifications are enabled
      if (settings.desktopNotifications && 'Notification' in window) {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          // Show test notification
          new Notification('Studio', {
            body: 'Configurações de notificação salvas com sucesso!',
            icon: '/favicon.ico'
          })
        }
      }
      
      toast({
        title: 'Configurações salvas',
        description: 'Suas preferências de notificação foram atualizadas.',
      })
      
      onClose()
    } catch (error) {
      console.error('Error saving notification settings:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const SettingRow = ({ 
    icon: Icon, 
    label, 
    description, 
    settingKey, 
    value, 
    disabled = false 
  }: {
    icon: any
    label: string
    description: string
    settingKey: keyof NotificationSettings
    value: boolean
    disabled?: boolean
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        checked={value}
        onCheckedChange={(checked) => handleSettingChange(settingKey, checked)}
        disabled={disabled}
      />
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configurações de Notificações
          </DialogTitle>
          <DialogDescription>
            Configure como você deseja receber notificações neste workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* General Notifications */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações Gerais
            </h3>
            <div className="space-y-1">
              <SettingRow
                icon={Bell}
                label="Todas as notificações"
                description="Ativar ou desativar todas as notificações"
                settingKey="allNotifications"
                value={settings.allNotifications}
              />
              <SettingRow
                icon={Bell}
                label="Notificações do navegador"
                description="Receber notificações na área de trabalho"
                settingKey="desktopNotifications"
                value={settings.desktopNotifications}
                disabled={!settings.allNotifications}
              />
              <SettingRow
                icon={BellOff}
                label="Notificações por email"
                description="Receber notificações por email"
                settingKey="emailNotifications"
                value={settings.emailNotifications}
                disabled={!settings.allNotifications}
              />
            </div>
          </div>

          <Separator />

          {/* Activity Types */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Tipos de Atividade
            </h3>
            <div className="space-y-1">
              <SettingRow
                icon={AtSign}
                label="Menções"
                description="Quando alguém mencionar você"
                settingKey="mentions"
                value={settings.mentions}
                disabled={!settings.allNotifications}
              />
              <SettingRow
                icon={Heart}
                label="Reações"
                description="Quando alguém reagir às suas mensagens"
                settingKey="reactions"
                value={settings.reactions}
                disabled={!settings.allNotifications}
              />
              <SettingRow
                icon={Reply}
                label="Threads"
                description="Quando alguém responder em threads"
                settingKey="threads"
                value={settings.threads}
                disabled={!settings.allNotifications}
              />
              <SettingRow
                icon={MessageCircle}
                label="Mensagens diretas"
                description="Receber mensagens diretas"
                settingKey="directMessages"
                value={settings.directMessages}
                disabled={!settings.allNotifications}
              />
              <SettingRow
                icon={Hash}
                label="Mensagens de canal"
                description="Mensagens em canais que você segue"
                settingKey="channelMessages"
                value={settings.channelMessages}
                disabled={!settings.allNotifications}
              />
              <SettingRow
                icon={Users}
                label="Mudanças de status"
                description="Quando usuários mudarem de status"
                settingKey="userStatusChanges"
                value={settings.userStatusChanges}
                disabled={!settings.allNotifications}
              />
            </div>
          </div>

          <Separator />

          {/* Quiet Hours */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Horário Silencioso</h3>
            <div className="space-y-1">
              <SettingRow
                icon={BellOff}
                label="Ativar horário silencioso"
                description="Pausar notificações em horários específicos"
                settingKey="quietHours"
                value={settings.quietHours}
                disabled={!settings.allNotifications}
              />
              
              {settings.quietHours && (
                <div className="pl-7 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Das</Label>
                    <input
                      type="time"
                      value={settings.quietStart}
                      onChange={(e) => handleSettingChange('quietStart', e.target.value)}
                      className="px-2 py-1 text-xs border rounded"
                    />
                    <Label className="text-xs text-muted-foreground">às</Label>
                    <input
                      type="time"
                      value={settings.quietEnd}
                      onChange={(e) => handleSettingChange('quietEnd', e.target.value)}
                      className="px-2 py-1 text-xs border rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
