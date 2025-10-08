# 🔮 Magic Link Login - Configuração Supabase

## 📋 Passo 1: Configurar Supabase Dashboard

### **1. Acessar Supabase Dashboard**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** → **Providers**

### **2. Configurar Email Provider**
1. Encontre **Email** na lista de providers
2. **Ative** o Email provider
3. Configure as opções:
   ```
   ✅ Enable Email provider
   ✅ Confirm email (opcional - desabilite para desenvolvimento)
   ✅ Secure email change (recomendado)
   ```

### **3. Configurar Email Templates**
1. Vá em **Authentication** → **Email Templates**
2. Selecione **Magic Link**
3. Configure o template:

```html
<h2>Magic Link Login</h2>
<p>Click the link below to sign in to your account:</p>
<p><a href="{{ .ConfirmationURL }}">Sign In</a></p>
<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This link expires in 1 hour.</p>
```

### **4. Configurar URL Settings**
1. Vá em **Authentication** → **URL Configuration**
2. Configure:
   ```
   Site URL: https://seu-dominio.com
   Redirect URLs: 
     - https://seu-dominio.com/auth/callback
     - http://localhost:9002/auth/callback (desenvolvimento)
   ```

### **5. Configurar Rate Limiting (Opcional)**
1. Vá em **Authentication** → **Rate Limits**
2. Configure limites para magic links:
   ```
   Magic Link: 5 requests per hour per email
   ```

---

## 📋 Passo 2: Executar Migration SQL

Execute o seguinte SQL no **SQL Editor** do Supabase:

```sql
-- ================================================
-- MAGIC LINK LOGIN - DATABASE SETUP
-- ================================================

-- 1. Criar tabela profiles (se não existir)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policies para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 4. Função para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger para criar profile ao registrar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para updated_at
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 8. Índices para performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles(created_at DESC);

-- ================================================
-- VERIFICAÇÃO
-- ================================================

-- Verificar se tabela foi criada
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles';

-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Verificar trigger
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## 📋 Passo 3: Configurar Variáveis de Ambiente

No arquivo `.env.local` (desenvolvimento) ou `.env.production` (produção):

```bash
# Supabase (já deve ter)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon

# Site URL (importante para redirect)
NEXT_PUBLIC_SITE_URL=http://localhost:9002  # desenvolvimento
# NEXT_PUBLIC_SITE_URL=https://seu-dominio.com  # produção
```

---

## ✅ Verificação

Após configurar, verifique:

### **1. Supabase Dashboard**
```bash
# Verificar se Email provider está ativo
Authentication → Providers → Email (✅ Enabled)

# Verificar URLs
Authentication → URL Configuration
- Site URL configurado
- Redirect URLs incluem /auth/callback
```

### **2. Database**
```sql
-- Verificar tabela profiles
SELECT * FROM public.profiles LIMIT 1;

-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### **3. Teste Rápido**
```bash
# No console do navegador, após implementar o frontend:
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'test@example.com'
})
console.log(data, error)
```

---

## 🔧 Troubleshooting

### **Erro: "Invalid email"**
- Verifique se Email provider está ativo
- Verifique formato do email

### **Erro: "Email not confirmed"**
- Desabilite "Confirm email" no Supabase para desenvolvimento
- Ou confirme o email manualmente no dashboard

### **Erro: "Invalid redirect URL"**
- Adicione a URL em Authentication → URL Configuration
- Verifique se NEXT_PUBLIC_SITE_URL está correto

### **Link não funciona**
- Verifique se /auth/callback existe
- Verifique logs do navegador
- Verifique se token está válido (expira em 1 hora)

---

## 📚 Recursos

- **Docs Supabase**: https://supabase.com/docs/guides/auth/auth-magic-link
- **Email Templates**: https://supabase.com/docs/guides/auth/auth-email-templates
- **Rate Limiting**: https://supabase.com/docs/guides/auth/rate-limits

---

## ⏱️ Tempo Estimado

- Configuração Supabase: 5 minutos
- SQL Migration: 2 minutos
- Teste: 2 minutos
- **Total: ~10 minutos**

**✅ Pronto para implementar o frontend!**

