-- Script para verificar e corrigir problemas com mensagens diretas
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a foreign key messages_author_id_fkey existe
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'messages'
  AND kcu.column_name = 'author_id';

-- 2. Verificar estrutura da tabela messages
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'messages'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Testar query de mensagens diretas
SELECT 
  m.id,
  m.content,
  m.author_id,
  m.dm_id,
  m.created_at,
  u.id as user_id,
  u.display_name,
  u.username,
  u.handle,
  u.avatar_url,
  u.status
FROM messages m
LEFT JOIN users u ON m.author_id = u.id
WHERE m.dm_id IS NOT NULL
ORDER BY m.created_at DESC
LIMIT 5;

-- 5. Verificar se há mensagens sem autor
SELECT 
  COUNT(*) as total_messages,
  COUNT(u.id) as messages_with_author,
  COUNT(*) - COUNT(u.id) as messages_without_author
FROM messages m
LEFT JOIN users u ON m.author_id = u.id
WHERE m.dm_id IS NOT NULL;

-- 6. Verificar usuários órfãos (existem em auth.users mas não em public.users)
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  pu.id as public_user_id,
  pu.display_name,
  pu.created_at as public_created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- 7. Criar usuários órfãos se necessário
INSERT INTO public.users (
  id,
  display_name,
  username,
  handle,
  avatar_url,
  status,
  user_level,
  created_at,
  updated_at
)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'display_name', SPLIT_PART(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'username', SPLIT_PART(au.email, '@', 1)),
  LOWER(REGEXP_REPLACE(
    COALESCE(au.raw_user_meta_data->>'display_name', SPLIT_PART(au.email, '@', 1)),
    '[^a-zA-Z0-9_]', '_', 'g'
  )) || '_' || substr(au.id::text, 1, 8),
  COALESCE(au.raw_user_meta_data->>'avatar_url', null),
  'online',
  COALESCE(au.raw_user_meta_data->>'user_level', 'member'),
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 8. Verificar resultado final
SELECT '✅ Verificação e correção de mensagens diretas concluída!' as status;
