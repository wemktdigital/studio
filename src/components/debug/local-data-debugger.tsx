'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { clearProblematicLocalData, checkForProblematicData } from '@/lib/utils'

export function LocalDataDebugger() {
  const [problematicKeys, setProblematicKeys] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Verificar dados problemáticos na inicialização
    const keys = checkForProblematicData()
    setProblematicKeys(keys)
  }, [])

  const handleClearData = () => {
    clearProblematicLocalData()
    setProblematicKeys([])
    window.location.reload()
  }

  const handleCheckData = () => {
    const keys = checkForProblematicData()
    setProblematicKeys(keys)
  }

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        Debug Local Data
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background border border-border rounded-lg p-4 shadow-lg max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Local Data Debugger</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
        >
          ×
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="text-xs">
          <strong>Problematic Keys:</strong>
          {problematicKeys.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {problematicKeys.map((key, index) => (
                <li key={index} className="text-red-500 font-mono text-xs">
                  {key}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-green-500 ml-2">None found</span>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckData}
            className="text-xs"
          >
            Check Again
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearData}
            className="text-xs"
          >
            Clear All Data
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          This will clear localStorage, sessionStorage, and cookies.
        </div>
      </div>
    </div>
  )
}
