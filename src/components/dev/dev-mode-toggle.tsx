'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Code, Play, Square } from 'lucide-react'

export function DevModeToggle() {
  const { enableMockUser, disableMockUser, isMockUserEnabled } = useAuthContext()
  const [isDevMode, setIsDevMode] = useState(false)

  useEffect(() => {
    setIsDevMode(process.env.NODE_ENV === 'development')
  }, [])

  if (!isDevMode) return null

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
          <Code className="h-5 w-5" />
          Modo Desenvolvimento
        </CardTitle>
        <CardDescription className="text-orange-700 dark:text-orange-300">
          Ative o usuário mock para testar funcionalidades sem autenticação real
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {!isMockUserEnabled ? (
            <Button
              onClick={enableMockUser}
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
            >
              <Play className="h-4 w-4 mr-2" />
              Ativar Usuário Mock
            </Button>
          ) : (
            <Button
              onClick={disableMockUser}
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
            >
              <Square className="h-4 w-4 mr-2" />
              Desativar Usuário Mock
            </Button>
          )}
          
          {isMockUserEnabled && (
            <Button
              onClick={() => window.location.href = '/w'}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Ir para Workspace
            </Button>
          )}
        </div>
        
        {isMockUserEnabled && (
          <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
            ✅ Usuário mock ativado: dev@studio.com
          </p>
        )}
      </CardContent>
    </Card>
  )
}
