'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { useAuthContext } from '@/components/providers/auth-provider'
import { LogoutButton } from './logout-button'

export function DynamicHeader() {
  const { user, loading } = useAuthContext()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Studio</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {loading ? (
            // Loading state
            <div className="flex items-center space-x-4">
              <div className="animate-pulse bg-muted h-8 w-16 rounded"></div>
              <div className="animate-pulse bg-muted h-8 w-20 rounded"></div>
            </div>
          ) : user ? (
            // Logged in user
            <div className="flex items-center space-x-4">
              <Link href="/w">
                <Button variant="ghost">Workspaces</Button>
              </Link>
              <LogoutButton showUserInfo={true} />
            </div>
          ) : (
            // Not logged in
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Criar conta</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
