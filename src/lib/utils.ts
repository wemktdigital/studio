import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para limpar dados locais problemáticos
export function clearProblematicLocalData() {
  if (typeof window !== 'undefined') {
    try {
      // Limpar localStorage
      localStorage.clear()
      
      // Limpar sessionStorage
      sessionStorage.clear()
      
      // Limpar cookies relacionados ao Supabase
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      })
      
      console.log('Local data cleared successfully')
    } catch (error) {
      console.error('Error clearing local data:', error)
    }
  }
}

// Função para verificar se há dados problemáticos
export function checkForProblematicData() {
  if (typeof window !== 'undefined') {
    try {
      const localStorageKeys = Object.keys(localStorage)
      const sessionStorageKeys = Object.keys(sessionStorage)
      
      console.log('LocalStorage keys:', localStorageKeys)
      console.log('SessionStorage keys:', sessionStorageKeys)
      
      // Procurar por chaves que possam estar relacionadas ao snippet
      const problematicKeys = [...localStorageKeys, ...sessionStorageKeys].filter(key => 
        key.includes('snippet') || key.includes('47272a78')
      )
      
      if (problematicKeys.length > 0) {
        console.warn('Found potentially problematic keys:', problematicKeys)
        return problematicKeys
      }
      
      return []
    } catch (error) {
      console.error('Error checking local data:', error)
      return []
    }
  }
  return []
}
