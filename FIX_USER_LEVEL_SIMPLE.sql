-- Script simplificado para corrigir user_level
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Adicionar coluna (ignora se já existe)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS user_level TEXT DEFAULT 'member';

-- 2. Atualizar usuários existentes
UPDATE public.users 
SET user_level = 'member' 
WHERE user_level IS NULL;

-- 3. Atualizar função trigger (IMPORTANTE!)
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

-- 4. Definir você como super_admin (ALTERE O EMAIL!)
UPDATE public.users 
SET user_level = 'super_admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'edson@we.marketing'
);

-- 5. Verificar resultado
SELECT 
  u.id,
  au.email,
  u.display_name, 
  u.user_level,
  u.created_at
FROM public.users u
JOIN auth.users au ON au.id = u.id
ORDER BY u.created_at DESC
LIMIT 10;

