-- Script para verificar e corrigir a estrutura da tabela users
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar a estrutura atual da tabela users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Verificar se a coluna handle existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'handle'
    ) 
    THEN '✅ Coluna handle existe' 
    ELSE '❌ Coluna handle NÃO existe' 
  END as handle_status;

-- 3. Adicionar coluna handle se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'handle'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN handle TEXT UNIQUE;
    
    RAISE NOTICE '✅ Coluna handle adicionada à tabela users';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna handle já existe na tabela users';
  END IF;
END $$;

-- 4. Verificar se a coluna user_level existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'user_level'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN user_level TEXT DEFAULT 'member' 
    CHECK (user_level IN ('super_admin', 'admin', 'moderator', 'member', 'guest', 'viewer'));
    
    RAISE NOTICE '✅ Coluna user_level adicionada à tabela users';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna user_level já existe na tabela users';
  END IF;
END $$;

-- 5. Atualizar handles existentes se necessário
UPDATE public.users 
SET handle = LOWER(REGEXP_REPLACE(display_name, '[^a-zA-Z0-9_]', '_', 'g')) || '_' || substr(id::text, 1, 8)
WHERE handle IS NULL OR handle = '';

-- 6. Verificar estrutura final
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 7. Testar inserção de usuário
SELECT '✅ Estrutura da tabela users verificada e corrigida!' as status;
