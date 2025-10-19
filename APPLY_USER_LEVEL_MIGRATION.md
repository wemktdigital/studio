# Aplicar Migração: user_level

## 📋 Problema Identificado

A tabela `users` não possui o campo `user_level` necessário para o sistema de permissões admin.

## ✅ Solução

Execute o SQL abaixo no **Supabase Dashboard > SQL Editor**:

```sql
-- 1. Adicionar coluna user_level
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS user_level TEXT DEFAULT 'member';

-- 2. Adicionar constraint de validação
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_user_level_check'
  ) THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT users_user_level_check
    CHECK (user_level IN ('super_admin', 'admin', 'moderator', 'member', 'guest', 'viewer'));
  END IF;
END $$;

-- 3. Atualizar função trigger para incluir user_level
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    display_name,
    handle,
    avatar_url,
    status,
    user_level,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'handle', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', null),
    'online',
    COALESCE(NEW.raw_user_meta_data->>'user_level', 'member'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Atualizar usuários existentes para ter user_level
UPDATE public.users 
SET user_level = 'member' 
WHERE user_level IS NULL;

-- 5. Definir você como super_admin (SUBSTITUA O EMAIL)
UPDATE public.users 
SET user_level = 'super_admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'edson@we.marketing'
);

-- Verificar resultado
SELECT id, display_name, user_level 
FROM public.users 
ORDER BY created_at DESC;
```

## 🔍 Como Aplicar

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Cole o SQL acima
5. Clique em **Run** ou pressione `Ctrl+Enter`
6. Verifique se apareceu "Success" 

## ✅ Após Aplicar

Reinicie a aplicação e tente criar um usuário novamente. O erro "Database error saving new user" deve desaparecer.

## 📝 Notas

- Altere o email `'edson@we.marketing'` para o seu email na linha que define super_admin
- Você pode adicionar mais super_admins executando:
  ```sql
  UPDATE public.users SET user_level = 'super_admin' 
  WHERE id IN (SELECT id FROM auth.users WHERE email = 'seu-email@dominio.com');
  ```

