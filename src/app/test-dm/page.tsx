'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { directMessageServiceNew } from '@/lib/services/direct-message-service-new'
import { isMockUserEnabled } from '@/lib/supabase/client'

export default function DMTestPage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [mockUserStatus, setMockUserStatus] = useState<'loading' | 'enabled' | 'disabled'>('loading')

  useEffect(() => {
    // ✅ HYDRATION FIX: Verificar status do mock user apenas no cliente
    if (typeof window !== 'undefined') {
      setMockUserStatus(isMockUserEnabled() ? 'enabled' : 'disabled')
    }
  }, [])

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const runTests = async () => {
    setIsLoading(true)
    setTestResults([])
    
    try {
      addResult('🚀 Iniciando testes do módulo DM...')
      
      // Teste 1: Verificar mock user
      const mockEnabled = isMockUserEnabled()
      addResult(`✅ Mock user habilitado: ${mockEnabled}`)
      
      // Teste 2: Criar DM
      addResult('📝 Testando criação de DM...')
      const dm = await directMessageServiceNew.getOrCreateDM(
        'e4c9d0f8-b54c-4f17-9487-92872db095ab',
        '550e8400-e29b-41d4-a716-446655440001'
      )
      addResult(`✅ DM criada: ${dm.id}`)
      
      // Teste 3: Obter mensagens
      addResult('💬 Testando obtenção de mensagens...')
      const messages = await directMessageServiceNew.getDMMessages(dm.id)
      addResult(`✅ Mensagens obtidas: ${messages.length}`)
      
      // Teste 4: Enviar mensagem
      addResult('📤 Testando envio de mensagem...')
      const newMessage = await directMessageServiceNew.sendDMMessage(
        dm.id,
        'Teste de mensagem!',
        'e4c9d0f8-b54c-4f17-9487-92872db095ab'
      )
      addResult(`✅ Mensagem enviada: ${newMessage.id}`)
      
      // Teste 5: Verificar mensagens após envio
      const updatedMessages = await directMessageServiceNew.getDMMessages(dm.id)
      addResult(`✅ Total de mensagens após envio: ${updatedMessages.length}`)
      
      addResult('🎉 Todos os testes passaram com sucesso!')
      
    } catch (error) {
      addResult(`❌ Erro durante teste: ${error}`)
      console.error('Test error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const enableMockUser = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dev_mock_user', 'true')
      setMockUserStatus('enabled')
      addResult('✅ Mock user habilitado! Recarregue a página.')
    }
  }

  const disableMockUser = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dev_mock_user')
      setMockUserStatus('disabled')
      addResult('❌ Mock user desabilitado! Recarregue a página.')
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Teste do Módulo de Mensagens Diretas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={runTests} disabled={isLoading}>
                {isLoading ? 'Testando...' : 'Executar Testes'}
              </Button>
              <Button onClick={enableMockUser} variant="outline">
                Habilitar Mock User
              </Button>
              <Button onClick={disableMockUser} variant="outline">
                Desabilitar Mock User
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Status do Mock User: {
                mockUserStatus === 'loading' ? '⏳ Carregando...' :
                mockUserStatus === 'enabled' ? '✅ Habilitado' : '❌ Desabilitado'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📋 Resultados dos Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-muted-foreground">Nenhum teste executado ainda.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
