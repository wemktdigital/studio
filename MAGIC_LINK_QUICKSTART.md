# 🚀 Magic Link - Quick Start Guide

## ⏱️ 5 Minutes to Passwordless Auth

### **Step 1: Supabase Configuration (2 min)**

1. Go to: https://supabase.com/dashboard
2. Select your project
3. **Authentication** → **Providers** → Enable **Email**
4. **Authentication** → **URL Configuration**:
   ```
   Site URL: https://your-domain.com
   Redirect URLs:
     - https://your-domain.com/auth/callback
     - http://localhost:9002/auth/callback
   ```

### **Step 2: Run Migration (1 min)**

In Supabase SQL Editor, run:

```sql
-- Copy and paste the entire contents of:
-- supabase/migrations/20241007000013_magic_link_profiles.sql
```

Or use Supabase CLI:

```bash
supabase db push
```

### **Step 3: Environment Variables (1 min)**

Create/update `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:9002
```

### **Step 4: Test (1 min)**

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:9002/auth/magic-link

# Enter your email
# Click "Send magic link"
# Check your email
# Click the link
# ✅ You're signed in!
```

---

## 📱 Usage

### **Simple Component**

```tsx
'use client'

import { useMagicLink } from '@/hooks/use-magic-link'

export default function MyApp() {
  const { user, isAuthenticated, signOut } = useMagicLink()

  if (!isAuthenticated) {
    return <a href="/auth/magic-link">Sign In</a>
  }

  return (
    <div>
      <p>Welcome, {user?.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

---

## 🎯 What You Get

✅ **Passwordless** - No passwords to manage  
✅ **Secure** - Built on Supabase Auth  
✅ **Beautiful UI** - Inter font, custom spacing  
✅ **Auto-redirect** - Goes to `/w` after sign in  
✅ **User Profiles** - Stored in `profiles` table  
✅ **Copy-paste ready** - Works out of the box  

---

## 📄 Files Created

```
✅ supabase/migrations/20241007000013_magic_link_profiles.sql
✅ src/lib/services/magic-link-service.ts
✅ src/hooks/use-magic-link.tsx
✅ src/app/auth/magic-link/page.tsx
✅ src/app/auth/callback/page.tsx
✅ MAGIC_LINK_SETUP.md
✅ MAGIC_LINK_README.md
✅ MAGIC_LINK_QUICKSTART.md (this file)
```

---

## 🔗 URLs

- **Login**: `/auth/magic-link`
- **Callback**: `/auth/callback`
- **Dashboard**: `/w` (after sign in)

---

## 🎨 Design

- **Font**: Inter with -0.06em spacing
- **Colors**: Greys + Blues
- **Style**: Modern, clean, responsive

---

## 🚨 Troubleshooting

**Can't send email?**  
→ Check Supabase Email provider is enabled

**Link doesn't work?**  
→ Add redirect URL in Supabase Dashboard

**Not redirecting?**  
→ Check `NEXT_PUBLIC_SITE_URL` is set

---

## 📚 Full Documentation

- **Setup Guide**: `MAGIC_LINK_SETUP.md`
- **Complete Docs**: `MAGIC_LINK_README.md`

---

**That's it! You now have passwordless auth! 🎉**

