# 🔮 Magic Link Passwordless Authentication

## 📋 Overview

Complete passwordless authentication system using Supabase magic links. Users sign in by clicking a link sent to their email - no passwords required!

---

## ✅ Features

- 🔮 **Passwordless** - No password to remember or manage
- ✉️ **Email-based** - Sign in with just an email address
- 🔒 **Secure** - Built on Supabase Auth
- 🎨 **Beautiful UI** - Inter font, custom spacing, greys + blues
- ⚡ **Auto-redirect** - Automatically redirects to `/w` after sign in
- 👤 **User Profiles** - Stores user data in `profiles` table
- 📱 **Responsive** - Works on all devices

---

## 📦 What's Included

### **1. Database**
- `supabase/migrations/20241007000013_magic_link_profiles.sql`
  - Creates `profiles` table
  - Sets up RLS policies
  - Auto-creates profile on sign up
  - Triggers for updated_at

### **2. Backend Service**
- `src/lib/services/magic-link-service.ts`
  - `sendMagicLink()` - Send magic link to email
  - `getCurrentUser()` - Get current authenticated user
  - `getUserProfile()` - Get user profile data
  - `updateUserProfile()` - Update profile
  - `signOut()` - Sign out user
  - `isAuthenticated()` - Check if user is signed in

### **3. React Hook**
- `src/hooks/use-magic-link.tsx`
  - Easy-to-use React hook
  - Manages auth state
  - Auto-updates on auth changes

### **4. Frontend Pages**
- `src/app/auth/magic-link/page.tsx` - Magic link login page
- `src/app/auth/callback/page.tsx` - Callback handler

### **5. Documentation**
- `MAGIC_LINK_SETUP.md` - Supabase configuration guide
- `MAGIC_LINK_README.md` - This file

---

## 🚀 Quick Start

### **Step 1: Configure Supabase**

Follow the instructions in `MAGIC_LINK_SETUP.md`:

1. Enable Email provider in Supabase Dashboard
2. Configure Email Templates
3. Set Redirect URLs
4. Run SQL migration

**Time: ~10 minutes**

### **Step 2: Update Environment Variables**

Add to `.env.local` or `.env.production`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:9002  # or your domain
```

### **Step 3: Run the Application**

```bash
npm run dev
```

### **Step 4: Test Magic Link**

1. Open: http://localhost:9002/auth/magic-link
2. Enter your email
3. Click "Send magic link"
4. Check your email
5. Click the link
6. You'll be redirected to `/w` (dashboard)

---

## 💻 Usage Examples

### **Example 1: Using the Hook**

```tsx
'use client'

import { useMagicLink } from '@/hooks/use-magic-link'

export default function MyComponent() {
  const { user, profile, isLoading, isAuthenticated, sendMagicLink, signOut } = useMagicLink()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return (
      <button onClick={() => sendMagicLink('user@example.com')}>
        Send Magic Link
      </button>
    )
  }

  return (
    <div>
      <p>Welcome, {profile?.full_name || user?.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### **Example 2: Using the Service Directly**

```tsx
import { getMagicLinkService } from '@/lib/services/magic-link-service'

const magicLinkService = getMagicLinkService()

// Send magic link
const result = await magicLinkService.sendMagicLink('user@example.com')
if (result.success) {
  console.log('Magic link sent!')
}

// Get current user
const user = await magicLinkService.getCurrentUser()

// Get user profile
if (user) {
  const profile = await magicLinkService.getUserProfile(user.id)
}

// Update profile
const updated = await magicLinkService.updateUserProfile(user.id, {
  full_name: 'John Doe',
  avatar_url: 'https://example.com/avatar.jpg'
})

// Sign out
await magicLinkService.signOut()
```

### **Example 3: Protected Route**

```tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMagicLink } from '@/hooks/use-magic-link'

export default function ProtectedPage() {
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
    return null
  }

  return <div>Protected Content</div>
}
```

### **Example 4: Custom Magic Link Button**

```tsx
'use client'

import { useState } from 'react'
import { getMagicLinkService } from '@/lib/services/magic-link-service'

export function MagicLinkButton() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const magicLinkService = getMagicLinkService()

  const handleClick = async () => {
    setIsLoading(true)
    const result = await magicLinkService.sendMagicLink(email)
    setIsLoading(false)
    
    if (result.success) {
      alert('Check your email!')
    } else {
      alert(result.message)
    }
  }

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
      />
      <button onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Magic Link'}
      </button>
    </div>
  )
}
```

---

## 🎨 Design System

The magic link pages use:

- **Font**: Inter with `-0.06em` letter spacing
- **Colors**:
  - Primary: Blue (600/700)
  - Background: Slate gradients (50/100) with blue
  - Text: Slate (600/700/900)
  - Success: Green (100/600)
  - Error: Red (50/200/600)
- **Components**: Rounded-2xl cards, smooth transitions
- **Icons**: Lucide React (Mail, Loader2, Check, etc.)

---

## 🔧 API Reference

### **MagicLinkService**

#### `sendMagicLink(email: string)`
Sends a magic link to the specified email.

**Returns**: `Promise<MagicLinkResponse>`
```ts
{
  success: boolean
  message: string
  error?: string
}
```

#### `getCurrentUser()`
Gets the currently authenticated user.

**Returns**: `Promise<User | null>`

#### `getUserProfile(userId: string)`
Gets the user's profile from the database.

**Returns**: `Promise<ProfileData | null>`

#### `updateUserProfile(userId: string, updates: Partial<ProfileData>)`
Updates the user's profile.

**Returns**: `Promise<ProfileData | null>`

#### `signOut()`
Signs out the current user.

**Returns**: `Promise<MagicLinkResponse>`

#### `isAuthenticated()`
Checks if a user is currently authenticated.

**Returns**: `Promise<boolean>`

#### `getSession()`
Gets the current session.

**Returns**: `Promise<Session | null>`

#### `onAuthStateChange(callback)`
Listens for auth state changes.

**Parameters**: 
- `callback: (user: User | null) => void`

**Returns**: Unsubscribe function

---

### **useMagicLink Hook**

```ts
const {
  user,              // Current user object
  profile,           // User profile data
  isLoading,         // Loading state
  isAuthenticated,   // Is user signed in?
  sendMagicLink,     // Send magic link function
  signOut,           // Sign out function
  updateProfile,     // Update profile function
} = useMagicLink()
```

---

## 📊 Database Schema

### **profiles Table**

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,              -- References auth.users
  email TEXT UNIQUE NOT NULL,       -- User email
  full_name TEXT,                   -- Full name
  avatar_url TEXT,                  -- Avatar URL
  metadata JSONB,                   -- Additional data
  created_at TIMESTAMP,             -- Created timestamp
  updated_at TIMESTAMP              -- Updated timestamp
)
```

### **RLS Policies**

- Users can view their own profile
- Users can update their own profile
- Users can insert their own profile
- (Optional) Public profiles viewable by everyone

---

## 🔒 Security

- ✅ **RLS Enabled** - Row Level Security on all tables
- ✅ **Secure Functions** - Database functions use SECURITY DEFINER
- ✅ **Rate Limiting** - Configurable rate limits on magic link requests
- ✅ **Email Verification** - Optional email confirmation
- ✅ **Token Expiry** - Magic links expire after 1 hour
- ✅ **HTTPS Only** - Requires HTTPS in production

---

## 🚨 Troubleshooting

### **"Email rate limit exceeded"**
- Wait a few minutes before trying again
- Configure rate limits in Supabase Dashboard

### **"Invalid redirect URL"**
- Add URL to Supabase Dashboard → Authentication → URL Configuration
- Check `NEXT_PUBLIC_SITE_URL` environment variable

### **Magic link doesn't work**
- Check spam folder
- Ensure link hasn't expired (1 hour limit)
- Verify redirect URLs are configured correctly

### **User profile not created**
- Check if trigger `on_auth_user_created` exists
- Verify RLS policies are correct
- Check Supabase logs for errors

### **Not redirecting to dashboard**
- Ensure `/w` route exists
- Check browser console for errors
- Verify callback page is working

---

## 🎯 Testing

### **Test Checklist**

- [ ] Send magic link to valid email
- [ ] Receive email with magic link
- [ ] Click magic link
- [ ] Redirect to callback page
- [ ] Redirect to dashboard (`/w`)
- [ ] User profile created in database
- [ ] Can sign out
- [ ] Can sign in again
- [ ] Protected routes work
- [ ] Error handling works

### **Test Emails**

For development, you can use:
- Gmail
- Outlook
- Temp email services (maildrop.cc, etc.)

---

## 📚 Resources

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Magic Links Guide**: https://supabase.com/docs/guides/auth/auth-magic-link
- **Next.js Auth**: https://nextjs.org/docs/authentication
- **Inter Font**: https://fonts.google.com/specimen/Inter

---

## 🎉 Ready to Use!

The magic link authentication system is complete and ready to use. Just:

1. Configure Supabase (10 minutes)
2. Run the migration
3. Start using magic links!

**No passwords, no problems! 🔮**

---

## 📞 Support

If you need help:

1. Check `MAGIC_LINK_SETUP.md` for configuration
2. Review Supabase logs for errors
3. Check browser console for client errors
4. Verify environment variables are set

---

## 📝 License

This code is part of your project and follows your project's license.

---

**✅ Complete passwordless authentication system ready to go!**

