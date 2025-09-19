'use client'

import { useAuthContext } from '@/components/providers/auth-provider'
import { useNormalizedUser } from '@/hooks/use-normalized-users'

export function MockUserDebug() {
  const { user: rawUser, loading } = useAuthContext()
  const normalizedUser = useNormalizedUser()
  
  console.log('🔍 MockUserDebug: rawUser:', rawUser)
  console.log('🔍 MockUserDebug: normalizedUser:', normalizedUser)
  console.log('🔍 MockUserDebug: loading:', loading)
  console.log('🔍 MockUserDebug: localStorage dev_mock_user:', typeof window !== 'undefined' ? localStorage.getItem('dev_mock_user') : 'N/A')
  
  return (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
      <h3 className="font-bold">🐛 Debug Mock User</h3>
      <div className="text-sm">
        <p><strong>Loading:</strong> {loading ? 'Sim' : 'Não'}</p>
        <p><strong>Raw User:</strong> {rawUser ? `${rawUser.id} - ${rawUser.email}` : 'null'}</p>
        <p><strong>Normalized User:</strong> {normalizedUser ? `${normalizedUser.id} - ${normalizedUser.displayName}` : 'null'}</p>
        <p><strong>Mock User Enabled:</strong> {typeof window !== 'undefined' ? localStorage.getItem('dev_mock_user') : 'N/A'}</p>
      </div>
    </div>
  )
}