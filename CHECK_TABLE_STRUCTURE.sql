-- Verificar estrutura real da tabela users
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar colunas da tabela users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar se handle existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name = 'handle'
) as handle_exists;

-- 3. Verificar dados existentes
SELECT * FROM public.users LIMIT 3;
