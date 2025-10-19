-- Verificar constraints da tabela users
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar constraints da tabela users
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'users'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 2. Verificar se há foreign key para auth.users
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    confrelid::regclass as referenced_table,
    conkey as constrained_columns,
    confkey as referenced_columns
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
AND contype = 'f';

-- 3. Verificar se o usuário foi criado no auth.users
SELECT 
    id,
    email,
    created_at
FROM auth.users
WHERE id = 'dfe8a034-edf2-46b9-8026-3d84154c01fe';

-- 4. Verificar estrutura completa da tabela users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;
