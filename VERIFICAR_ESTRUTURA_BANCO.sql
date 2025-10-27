-- Script para verificar e corrigir problemas estruturais no banco de dados
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar estrutura atual da tabela messages
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'messages'
ORDER BY ordinal_position;

-- 2. Verificar foreign keys existentes
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
  AND tc.table_name = 'messages';

-- 3. Verificar se existem mensagens na tabela
SELECT COUNT(*) as total_messages FROM messages;

-- 4. Verificar se existem usuários na tabela users
SELECT COUNT(*) as total_users FROM users;

-- 5. Verificar se existem canais na tabela channels
SELECT COUNT(*) as total_channels FROM channels;

-- 6. Testar query básica de mensagens
SELECT 
  m.id,
  m.content,
  m.author_id,
  m.channel_id,
  m.created_at
FROM messages m
ORDER BY m.created_at DESC
LIMIT 5;

-- 7. Testar JOIN com users (se a foreign key existir)
SELECT 
  m.id,
  m.content,
  m.author_id,
  m.channel_id,
  m.created_at,
  u.display_name,
  u.handle,
  u.avatar_url
FROM messages m
LEFT JOIN users u ON m.author_id = u.id
ORDER BY m.created_at DESC
LIMIT 5;

