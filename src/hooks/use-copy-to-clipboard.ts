'use client'

import { useState } from 'react'
import { toast } from '@/hooks/use-toast'

/**
 * Hook seguro para copiar texto para clipboard
 * Com fallback para navegadores sem suporte
 */
export function useCopyToClipboard() {
  const [isCopying, setIsCopying] = useState(false)

  const copy = async (text: string): Promise<boolean> => {
    if (!text) return false

    setIsCopying(true)
    
    try {
      // Verificar se o navegador suporta Clipboard API
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
          await navigator.clipboard.writeText(text)
          return true
        } catch (clipError) {
          // Se falhar, usar fallback
          console.warn('Clipboard API falhou, usando fallback:', clipError)
          // Continuar com fallback abaixo
        }
      }
      
      // Fallback: método antigo usando textarea
      if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.left = '-999999px'
        textarea.style.top = '-999999px'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        
        try {
          const successful = document.execCommand('copy')
          document.body.removeChild(textarea)
          
          if (!successful) {
            throw new Error('Falha ao copiar usando método alternativo')
          }
          
          return true
        } catch (err) {
          document.body.removeChild(textarea)
          throw err
        }
      }
    } catch (error: any) {
      console.warn('Erro ao copiar para clipboard:', error)
      
      // Mostrar opção manual como último recurso
      toast({
        title: "Não foi possível copiar automaticamente",
        description: (
          <div className="space-y-2">
            <p>Selecione e copie manualmente:</p>
            <code className="block p-2 bg-muted rounded text-xs break-all">{text}</code>
          </div>
        ),
        variant: "default",
        duration: 10000,
      })
      
      return false
    } finally {
      setIsCopying(false)
    }
  }

  return { copy, isCopying }
}

