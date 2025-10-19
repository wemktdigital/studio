-- Corrigir políticas RLS para permitir criação de usuários por super_admin
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Remover política restritiva atual
DROP POLICY IF EXISTS "users_insert_own" ON public.users;

-- 2. Criar política mais permissiva para INSERT
CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT WITH CHECK (
    -- Permitir se for o próprio usuário
    id = auth.uid() 
    OR 
    -- Permitir se o usuário atual for super_admin
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND user_level = 'super_admin'
    )
  );

-- 3. Verificar se a política foi criada
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
AND cmd = 'INSERT';

-- 4. Teste: Verificar se você é super_admin
SELECT 
  u.id,
  u.display_name,
  u.user_level,
  au.email
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE u.id = auth.uid();

-- 5. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Política RLS corrigida!';
  RAISE NOTICE '✅ Super admins agora podem criar usuários';
END $$;
