'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { LogOut, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showUserInfo?: boolean
}

export function LogoutButton({ 
  variant = 'ghost', 
  size = 'default', 
  className = '',
  showUserInfo = false 
}: LogoutButtonProps) {
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { user, signOut } = useAuthContext()
  const { toast } = useToast()
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const { error } = await signOut()
      
      if (error) {
        throw error
      }

      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
      
      setIsLogoutDialogOpen(false)
      router.push('/')
    } catch (error) {
      console.error('Error during logout:', error)
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  if (showUserInfo) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={variant} size={size} className={className}>
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || 'User'} />
                <AvatarFallback>
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">
                {user.user_metadata?.display_name || user.email}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center justify-start gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || 'User'} />
                <AvatarFallback>
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.user_metadata?.display_name || 'Usuário'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/auth/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setIsLogoutDialogOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Logout Confirmation Dialog */}
        <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Logout</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja sair da sua conta? Você será redirecionado para a página inicial.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsLogoutDialogOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                disabled={isLoading}
              >
                {isLoading ? "Saindo..." : "Sair"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        className={className}
        onClick={() => setIsLogoutDialogOpen(true)}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </Button>

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Logout</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja sair da sua conta? Você será redirecionado para a página inicial.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsLogoutDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              disabled={isLoading}
            >
              {isLoading ? "Saindo..." : "Sair"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
