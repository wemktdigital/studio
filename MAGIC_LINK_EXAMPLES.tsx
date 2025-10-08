/**
 * 🔮 Magic Link Authentication - Code Examples
 * Copy-paste ready code snippets
 */

// ============================================================================
// EXAMPLE 1: Basic Magic Link Login Component
// ============================================================================

'use client'

import { useState } from 'react'
import { getMagicLinkService } from '@/lib/services/magic-link-service'

export function BasicMagicLinkLogin() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const service = getMagicLinkService()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await service.sendMagicLink(email)
    setLoading(false)
    if (result.success) setSent(true)
  }

  if (sent) {
    return <div>Check your email at {email}!</div>
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Magic Link'}
      </button>
    </form>
  )
}

// ============================================================================
// EXAMPLE 2: Using the Hook
// ============================================================================

'use client'

import { useMagicLink } from '@/hooks/use-magic-link'

export function UserProfile() {
  const { user, profile, isLoading, isAuthenticated, signOut } = useMagicLink()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <a href="/auth/magic-link">Sign In</a>
  }

  return (
    <div>
      <h1>Welcome, {profile?.full_name || user?.email}!</h1>
      <p>Email: {user?.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}

// ============================================================================
// EXAMPLE 3: Protected Route Component
// ============================================================================

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMagicLink } from '@/hooks/use-magic-link'

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useMagicLink()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/magic-link')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return <>{children}</>
}

// Usage:
// <ProtectedPage>
//   <YourProtectedContent />
// </ProtectedPage>

// ============================================================================
// EXAMPLE 4: Profile Edit Form
// ============================================================================

'use client'

import { useState } from 'react'
import { useMagicLink } from '@/hooks/use-magic-link'

export function ProfileEditForm() {
  const { profile, updateProfile } = useMagicLink()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await updateProfile({ full_name: fullName })
    setLoading(false)
    alert('Profile updated!')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full Name"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  )
}

// ============================================================================
// EXAMPLE 5: Auth State Listener
// ============================================================================

'use client'

import { useEffect } from 'react'
import { getMagicLinkService } from '@/lib/services/magic-link-service'

export function AuthListener() {
  useEffect(() => {
    const service = getMagicLinkService()

    const { data: { subscription } } = service.onAuthStateChange((user) => {
      if (user) {
        console.log('User signed in:', user.email)
        // Do something when user signs in
      } else {
        console.log('User signed out')
        // Do something when user signs out
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return null
}

// ============================================================================
// EXAMPLE 6: Navigation Guard
// ============================================================================

'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useMagicLink } from '@/hooks/use-magic-link'

const publicRoutes = ['/auth/magic-link', '/auth/callback', '/']

export function NavigationGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading } = useMagicLink()

  useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = publicRoutes.includes(pathname)

      if (!isAuthenticated && !isPublicRoute) {
        router.push('/auth/magic-link')
      }

      if (isAuthenticated && pathname === '/auth/magic-link') {
        router.push('/w')
      }
    }
  }, [isAuthenticated, isLoading, pathname, router])

  return <>{children}</>
}

// Usage in layout.tsx:
// <NavigationGuard>
//   {children}
// </NavigationGuard>

// ============================================================================
// EXAMPLE 7: Sign In Button
// ============================================================================

'use client'

import { useRouter } from 'next/navigation'
import { useMagicLink } from '@/hooks/use-magic-link'

export function SignInButton() {
  const router = useRouter()
  const { isAuthenticated, signOut } = useMagicLink()

  if (isAuthenticated) {
    return (
      <button onClick={signOut} className="btn btn-secondary">
        Sign Out
      </button>
    )
  }

  return (
    <button
      onClick={() => router.push('/auth/magic-link')}
      className="btn btn-primary"
    >
      Sign In
    </button>
  )
}

// ============================================================================
// EXAMPLE 8: User Avatar Component
// ============================================================================

'use client'

import { useMagicLink } from '@/hooks/use-magic-link'

export function UserAvatar() {
  const { profile } = useMagicLink()

  if (!profile) return null

  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.full_name || profile.email}
        className="w-10 h-10 rounded-full"
      />
    )
  }

  // Fallback to initials
  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : profile.email[0].toUpperCase()

  return (
    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
      {initials}
    </div>
  )
}

// ============================================================================
// EXAMPLE 9: Server-Side Auth Check
// ============================================================================

// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/magic-link')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {profile?.full_name || user.email}!</p>
    </div>
  )
}

// ============================================================================
// EXAMPLE 10: Layout with Auth Provider
// ============================================================================

// app/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { useMagicLink } from '@/hooks/use-magic-link'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading } = useMagicLink()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <>{children}</>
}

// ============================================================================
// EXAMPLE 11: API Route with Auth
// ============================================================================

// app/api/profile/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ profile })
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const { data: profile, error: updateError } = await supabase
    .from('profiles')
    .update(body)
    .eq('id', user.id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ profile })
}

// ============================================================================
// EXAMPLE 12: Complete Auth Flow Component
// ============================================================================

'use client'

import { useState } from 'react'
import { useMagicLink } from '@/hooks/use-magic-link'
import { Mail, Loader2, User, LogOut } from 'lucide-react'

export function CompleteAuthFlow() {
  const {
    user,
    profile,
    isLoading,
    isAuthenticated,
    sendMagicLink,
    signOut,
    updateProfile
  } = useMagicLink()

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    const result = await sendMagicLink(email)
    setSending(false)
    if (result.success) setSent(true)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    await updateProfile({ full_name: fullName })
    setUpdating(false)
    alert('Profile updated!')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    if (sent) {
      return (
        <div className="text-center p-8">
          <Mail className="w-12 h-12 mx-auto mb-4 text-green-600" />
          <h2 className="text-2xl font-bold mb-2">Check your email!</h2>
          <p className="text-gray-600">
            We sent a magic link to <strong>{email}</strong>
          </p>
        </div>
      )
    }

    return (
      <form onSubmit={handleSendLink} className="space-y-4 max-w-md mx-auto p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
        <button
          type="submit"
          disabled={sending}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>
    )
  }

  return (
    <div className="max-w-md mx-auto p-8 space-y-6">
      <div className="text-center">
        <User className="w-12 h-12 mx-auto mb-4 text-blue-600" />
        <h2 className="text-2xl font-bold mb-2">Profile</h2>
        <p className="text-gray-600">{user?.email}</p>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full Name"
          className="w-full px-4 py-2 border rounded-lg"
        />
        <button
          type="submit"
          disabled={updating}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {updating ? 'Saving...' : 'Update Profile'}
        </button>
      </form>

      <button
        onClick={signOut}
        className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  )
}

// ============================================================================
// That's it! All examples ready to copy and paste! 🎉
// ============================================================================

