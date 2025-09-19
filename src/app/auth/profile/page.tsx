'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, User, Mail, Calendar, Save, Camera, Shield, Bell, Palette, Eye, EyeOff, History } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { LogoutButton } from '@/components/slack/logout-button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: userLoading } = useAuthContext()
  const { toast } = useToast()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState({
    display_name: '',
    username: '',
    avatar_url: '',
    status: 'online'
  })
  const [settings, setSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    dark_mode: true,
    sound_enabled: true
  })
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [loginHistory, setLoginHistory] = useState([])

  useEffect(() => {
    if (user && !userLoading) {
      loadUserProfile()
    }
  }, [user, userLoading])

  const loadUserProfile = async () => {
    try {
      console.log('loadUserProfile: Loading profile for user:', user?.id)
      console.log('loadUserProfile: Full user object:', user)
      
      if (!user?.id) {
        console.error('loadUserProfile: No user ID available')
        return
      }

      console.log('loadUserProfile: Querying users table for ID:', user.id)
      
      const { data, error } = await supabase
        .from('users')
        .select('display_name, avatar_url, status')
        .eq('id', user.id)
        .single()

      console.log('loadUserProfile: Supabase response:', { 
        data, 
        error,
        errorMessage: error?.message,
        errorDetails: error?.details,
        errorHint: error?.hint,
        errorCode: error?.code
      })

      if (error) {
        console.error('loadUserProfile: Supabase error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Check if user exists in users table
        console.log('loadUserProfile: Checking if user exists in users table...')
        const { data: userExists, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()
        
        console.log('loadUserProfile: User exists check:', { userExists, checkError })
        
        if (!userExists) {
          console.log('loadUserProfile: User not found in users table, creating profile...')
          // Try to create the user profile
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              display_name: user.email?.split('@')[0] || 'New User',
              status: 'online'
            })
          
          console.log('loadUserProfile: Create profile result:', { createError })
        }
        
        // Set default profile data
        setProfile({
          display_name: user.email?.split('@')[0] || 'New User',
          username: user.email?.split('@')[0] || 'new_user', // Keep for UI compatibility
          avatar_url: '',
          status: 'online'
        })
        return
      }

      if (data) {
        console.log('loadUserProfile: Setting profile data:', data)
        setProfile({
          display_name: data.display_name || user.email?.split('@')[0] || 'New User',
          username: user.email?.split('@')[0] || 'new_user', // Generate from email since username column doesn't exist
          avatar_url: data.avatar_url || '',
          status: data.status || 'online'
        })
      } else {
        console.log('loadUserProfile: No data returned, setting defaults')
        setProfile({
          display_name: user.email?.split('@')[0] || 'New User',
          username: user.email?.split('@')[0] || 'new_user',
          avatar_url: '',
          status: 'online'
        })
      }
          } catch (error) {
        console.error('loadUserProfile: Exception:', error)
        // Set default profile data on any error
        if (user) {
          setProfile({
            display_name: user.email?.split('@')[0] || 'New User',
            username: user.email?.split('@')[0] || 'new_user', // Generate from email
            avatar_url: '',
            status: 'online'
          })
        }
      }
  }

  const handleProfileUpdate = async () => {
    setIsLoading(true)
    try {
      console.log('handleProfileUpdate: Updating profile for user:', user?.id)
      console.log('handleProfileUpdate: Profile data:', profile)

      if (!user?.id) {
        throw new Error('No user ID available')
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          status: profile.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()

      console.log('handleProfileUpdate: Supabase response:', { data, error })

      if (error) {
        console.error('handleProfileUpdate: Supabase error:', error)
        throw error
      }

      console.log('handleProfileUpdate: Profile updated successfully')

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })
    } catch (error: any) {
      console.error('handleProfileUpdate: Error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso"
      })
      
      setPasswordDialogOpen(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadLoginHistory = async () => {
    try {
      // Simular histórico de login (em uma implementação real, isso viria do Supabase)
      const mockHistory = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          ip: '192.168.1.100',
          userAgent: 'Chrome 120.0.0.0',
          location: 'São Paulo, Brasil',
          success: true
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          ip: '192.168.1.100',
          userAgent: 'Chrome 120.0.0.0',
          location: 'São Paulo, Brasil',
          success: true
        },
        {
          id: 3,
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          ip: '192.168.1.101',
          userAgent: 'Safari 17.0',
          location: 'São Paulo, Brasil',
          success: false
        }
      ]
      setLoginHistory(mockHistory)
    } catch (error) {
      console.error('Error loading login history:', error)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erro", 
        description: "A imagem deve ter no máximo 2MB",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const base64String = e.target?.result as string
          
          // Update profile with base64 image
          setProfile(prev => ({ ...prev, avatar_url: base64String }))
          
          toast({
        title: "Avatar atualizado",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      })
        } catch (error) {
          console.error('Error processing avatar:', error)
          toast({
            title: "Erro",
            description: "Falha ao processar a imagem. Tente novamente.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Erro",
        description: "Falha ao fazer upload da imagem. Tente novamente.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  if (userLoading) {
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          {/* Logout Section */}
          <div className="flex justify-end">
            <LogoutButton variant="destructive" />
          </div>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and avatar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                      <AvatarFallback>
                        {profile.display_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
                      <Camera className="h-4 w-4" />
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                          id="display_name"
                          value={profile.display_name}
                          onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                          placeholder="Enter your display name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={profile.username}
                          onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                          placeholder="Enter your username"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />



                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={profile.status}
                    onChange={(e) => setProfile({ ...profile, status: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="online">Online</option>
                    <option value="away">Away</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                <Button onClick={handleProfileUpdate} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Member since</p>
                    <p className="text-sm text-muted-foreground">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Manage your notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive push notifications</p>
                  </div>
                  <Switch
                    checked={settings.push_notifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, push_notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sound Notifications</p>
                    <p className="text-sm text-muted-foreground">Play sounds for notifications</p>
                  </div>
                  <Switch
                    checked={settings.sound_enabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, sound_enabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize your interface appearance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Use dark theme</p>
                  </div>
                  <Switch
                    checked={settings.dark_mode}
                    onCheckedChange={(checked) => setSettings({ ...settings, dark_mode: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Alterar Senha</DialogTitle>
                      <DialogDescription>
                        Digite sua senha atual e a nova senha desejada.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Senha Atual</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            placeholder="Digite sua senha atual"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                          >
                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nova Senha</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            placeholder="Digite a nova senha"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                          >
                            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            placeholder="Confirme a nova senha"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                          >
                            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleChangePassword} disabled={isLoading}>
                        {isLoading ? "Alterando..." : "Alterar Senha"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={loadLoginHistory}
                    >
                      <History className="h-4 w-4 mr-2" />
                      View Login History
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Histórico de Login</DialogTitle>
                      <DialogDescription>
                        Visualize os últimos acessos à sua conta.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {loginHistory.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          Nenhum histórico de login encontrado.
                        </p>
                      ) : (
                        loginHistory.map((entry: any) => (
                          <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${entry.success ? 'bg-green-500' : 'bg-red-500'}`} />
                              <div>
                                <p className="font-medium">
                                  {new Date(entry.timestamp).toLocaleString('pt-BR')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {entry.ip} • {entry.location}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {entry.userAgent}
                                </p>
                              </div>
                            </div>
                            <Badge variant={entry.success ? "default" : "destructive"}>
                              {entry.success ? "Sucesso" : "Falha"}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
                        Fechar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
