-- Verificar mensagens de DM no banco
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar mensagens de DM existentes
SELECT 
  m.id,
  m.content,
  m.author_id,
  m.dm_id,
  m.created_at,
  u.display_name,
  u.username,
  u.avatar_url
FROM messages m
LEFT JOIN users u ON u.id = m.author_id
WHERE m.dm_id IS NOT NULL
ORDER BY m.created_at DESC
LIMIT 10;

-- 2. Verificar se há mensagens com author_id específico
SELECT 
  m.id,
  m.content,
  m.author_id,
  m.dm_id,
  m.created_at,
  u.display_name,
  u.username
FROM messages m
LEFT JOIN users u ON u.id = m.author_id
WHERE m.author_id = 'e4c9d0f8-b54c-4f17-9487-92872db095ab'
ORDER BY m.created_at DESC
LIMIT 5;
