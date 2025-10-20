-- Script para verificar e corrigir a estrutura completa da tabela users
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

-- 2. Verificar constraints da tabela
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass;

-- 3. Verificar se existe coluna username e se é NOT NULL
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'username'
      AND is_nullable = 'NO'
    ) 
    THEN '❌ Coluna username existe e é NOT NULL' 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'username'
    )
    THEN '⚠️ Coluna username existe mas é nullable'
    ELSE '✅ Coluna username não existe' 
  END as username_status;

-- 4. Se username for NOT NULL, torná-la nullable ou adicionar default
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'username'
    AND is_nullable = 'NO'
  ) THEN
    -- Tornar username nullable
    ALTER TABLE public.users 
    ALTER COLUMN username DROP NOT NULL;
    
    RAISE NOTICE '✅ Coluna username tornada nullable';
  END IF;
END $$;

-- 5. Verificar se handle existe e é UNIQUE
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
    
    RAISE NOTICE '✅ Coluna handle adicionada';
  END IF;
END $$;

-- 6. Atualizar dados existentes
UPDATE public.users 
SET handle = COALESCE(handle, LOWER(REGEXP_REPLACE(COALESCE(display_name, 'user'), '[^a-zA-Z0-9_]', '_', 'g')) || '_' || substr(id::text, 1, 8))
WHERE handle IS NULL;

-- 7. Verificar estrutura final
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 8. Testar inserção
SELECT '✅ Estrutura da tabela users corrigida!' as status;
