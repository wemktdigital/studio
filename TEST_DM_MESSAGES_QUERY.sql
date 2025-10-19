-- Teste da query SQL para mensagens de DM
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar se existem mensagens de DM
SELECT 
  m.id,
  m.content,
  m.author_id,
  m.dm_id,
  m.created_at
FROM messages m
WHERE m.dm_id IS NOT NULL
ORDER BY m.created_at DESC
LIMIT 5;

-- 2. Testar a query com JOIN para ver se funciona
SELECT 
  m.id,
  m.content,
  m.author_id,
  m.dm_id,
  m.created_at,
  u.display_name,
  u.username,
  u.avatar_url,
  u.status
FROM messages m
LEFT JOIN users u ON u.id = m.author_id
WHERE m.dm_id IS NOT NULL
ORDER BY m.created_at DESC
LIMIT 5;

-- 3. Verificar se existem DMs
SELECT 
  dm.id,
  dm.user1_id,
  dm.user2_id,
  dm.created_at
FROM direct_messages dm
ORDER BY dm.created_at DESC
LIMIT 5;
