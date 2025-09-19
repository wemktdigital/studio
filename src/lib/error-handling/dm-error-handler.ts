'use client'

import { toast } from '@/hooks/use-toast'

export interface ErrorContext {
  operation: string
  component?: string
  userId?: string
  dmId?: string
  additionalInfo?: Record<string, any>
}

export class DMErrorHandler {
  /**
   * Tratar erros de forma consistente
   */
  static handleError(error: any, context: ErrorContext): void {
    console.error(`❌ DM Error [${context.operation}]:`, error)
    
    // ✅ LOGGING: Log detalhado para debug
    console.error('Error context:', context)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      name: error?.name
    })
    
    // ✅ TOAST: Mostrar erro para o usuário
    this.showErrorToast(error, context)
  }
  
  /**
   * Mostrar toast de erro baseado no tipo de erro
   */
  private static showErrorToast(error: any, context: ErrorContext): void {
    let title = 'Erro'
    let description = 'Ocorreu um erro inesperado. Tente novamente.'
    
    // ✅ ERRO ESPECÍFICO: Mensagens baseadas no tipo de erro
    if (error?.message?.includes('Auth')) {
      title = 'Erro de Autenticação'
      description = 'Sua sessão expirou. Faça login novamente.'
    } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      title = 'Erro de Conexão'
      description = 'Verifique sua conexão com a internet.'
    } else if (error?.message?.includes('permission') || error?.message?.includes('RLS')) {
      title = 'Erro de Permissão'
      description = 'Você não tem permissão para realizar esta ação.'
    } else if (context.operation === 'sendMessage') {
      title = 'Erro ao Enviar'
      description = 'Não foi possível enviar a mensagem. Tente novamente.'
    } else if (context.operation === 'getMessages') {
      title = 'Erro ao Carregar'
      description = 'Não foi possível carregar as mensagens.'
    } else if (context.operation === 'createDM') {
      title = 'Erro ao Criar Conversa'
      description = 'Não foi possível iniciar a conversa.'
    }
    
    toast({
      title,
      description,
      variant: 'destructive'
    })
  }
  
  /**
   * Verificar se é um erro recuperável
   */
  static isRecoverableError(error: any): boolean {
    // ✅ ERROS RECUPERÁVEIS: Network, timeout, rate limit
    const recoverablePatterns = [
      'network',
      'timeout',
      'rate limit',
      'temporary',
      'service unavailable'
    ]
    
    const errorMessage = error?.message?.toLowerCase() || ''
    return recoverablePatterns.some(pattern => errorMessage.includes(pattern))
  }
  
  /**
   * Obter delay para retry baseado no tipo de erro
   */
  static getRetryDelay(error: any, attempt: number): number {
    // ✅ BACKOFF: Delay exponencial para retry
    const baseDelay = 1000 // 1 segundo
    const maxDelay = 10000 // 10 segundos
    
    if (error?.message?.includes('rate limit')) {
      return Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
    }
    
    return Math.min(baseDelay * attempt, maxDelay)
  }
  
  /**
   * Verificar se deve usar dados mock
   */
  static shouldUseMockData(error: any): boolean {
    // ✅ MOCK FALLBACK: Usar mock em caso de erros específicos
    const mockFallbackPatterns = [
      'auth',
      'permission',
      'rls',
      'unauthorized',
      'forbidden'
    ]
    
    const errorMessage = error?.message?.toLowerCase() || ''
    return mockFallbackPatterns.some(pattern => errorMessage.includes(pattern))
  }
}

/**
 * Hook para tratamento de erros em componentes
 */
export function useDMErrorHandler() {
  const handleError = (error: any, context: ErrorContext) => {
    DMErrorHandler.handleError(error, context)
  }
  
  const isRecoverable = (error: any) => {
    return DMErrorHandler.isRecoverableError(error)
  }
  
  const getRetryDelay = (error: any, attempt: number) => {
    return DMErrorHandler.getRetryDelay(error, attempt)
  }
  
  const shouldUseMock = (error: any) => {
    return DMErrorHandler.shouldUseMockData(error)
  }
  
  return {
    handleError,
    isRecoverable,
    getRetryDelay,
    shouldUseMock
  }
}
