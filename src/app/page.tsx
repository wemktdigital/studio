import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Users, Hash, Zap } from 'lucide-react'
import { DynamicHeader } from '@/components/slack/dynamic-header'
import { DevModeToggle } from '@/components/dev/dev-mode-toggle'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <DynamicHeader />

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Studio
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            A plataforma de comunicação moderna para equipes que querem colaborar de forma eficiente e organizada
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-6">
                Começar grátis
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>

        {/* Dev Mode Toggle */}
        <div className="mb-8">
          <DevModeToggle />
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Comunicação em Tempo Real</CardTitle>
              <CardDescription>
                Mensagens instantâneas, notificações push e sincronização em tempo real
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Workspaces Organizados</CardTitle>
              <CardDescription>
                Organize sua equipe em workspaces e canais para máxima produtividade
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Integração Inteligente</CardTitle>
              <CardDescription>
                IA integrada para sugestões inteligentes e automação de tarefas
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Pronto para começar?</CardTitle>
              <CardDescription>
                Junte-se a milhares de equipes que já estão usando Studio para melhorar sua comunicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/signup">
                <Button size="lg" className="w-full">
                  Criar minha conta gratuita
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-8">
        <div className="container text-center text-muted-foreground">
          <p>&copy; 2024 Studio. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
