'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, UserPlus, CheckCircle, AlertCircle } from 'lucide-react'

export default function WorkspaceInvitePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const workspaceId = params.workspaceId as string

  const [isLoading, setIsLoading] = useState(false)
  const [isValidInvite, setIsValidInvite] = useState(true)
  const [workspaceName, setWorkspaceName] = useState('WE Marketing')

  useEffect(() => {
    // Simular verificação se o convite é válido
    // Em uma implementação real, você verificaria no banco de dados
    const checkInvite = async () => {
      try {
        // Simular verificação
        await new Promise(resolve => setTimeout(resolve, 500))
        setIsValidInvite(true)
      } catch (error) {
        setIsValidInvite(false)
      }
    }

    checkInvite()
  }, [workspaceId])

  const handleJoinWorkspace = async () => {
    setIsLoading(true)
    try {
      // Simular adição ao workspace
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Bem-vindo ao workspace!",
        description: `Você foi adicionado ao ${workspaceName} com sucesso.`,
      })
      
      router.push(`/w/${workspaceId}`)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível entrar no workspace. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValidInvite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Convite Inválido</CardTitle>
            <CardDescription>
              Este link de convite não é válido ou expirou.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Convite para o Workspace</CardTitle>
          <CardDescription>
            Você foi convidado para participar do workspace <strong>{workspaceName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Nome do Workspace</Label>
            <Input
              id="workspace-name"
              value={workspaceName}
              readOnly
              className="bg-muted"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Este convite é válido e seguro</span>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleJoinWorkspace} 
              disabled={isLoading}
              className="w-full gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {isLoading ? 'Entrando...' : 'Entrar no Workspace'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="w-full gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
