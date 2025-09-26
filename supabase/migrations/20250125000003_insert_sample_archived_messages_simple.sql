-- Migration: Insert sample archived messages (simple version)
-- Created: 2025-01-25
-- Note: This version creates sample data without checking existing tables

-- Insert sample archived messages with hardcoded UUIDs
-- This approach works regardless of existing table structure

INSERT INTO archived_messages (
  original_message_id,
  content,
  channel_id,
  user_id,
  workspace_id,
  created_at,
  archived_at
) VALUES 
(
  gen_random_uuid(),
  'Esta é uma mensagem arquivada de exemplo para demonstração da interface de auditoria.',
  gen_random_uuid(), -- Sample channel ID
  gen_random_uuid(), -- Sample user ID
  gen_random_uuid(), -- Sample workspace ID
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '1 day'
),
(
  gen_random_uuid(),
  'Outra mensagem arquivada para mostrar como o sistema funciona.',
  gen_random_uuid(), -- Sample channel ID
  gen_random_uuid(), -- Sample user ID
  gen_random_uuid(), -- Sample workspace ID
  NOW() - INTERVAL '14 days',
  NOW() - INTERVAL '2 days'
),
(
  gen_random_uuid(),
  'Mensagem de teste para verificar a funcionalidade de retenção.',
  gen_random_uuid(), -- Sample channel ID
  gen_random_uuid(), -- Sample user ID
  gen_random_uuid(), -- Sample workspace ID
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '3 days'
);

-- Verify the inserted data
SELECT 
  'Sample Archived Messages:' as info,
  id,
  content,
  created_at,
  archived_at
FROM archived_messages
ORDER BY archived_at DESC
LIMIT 10;
