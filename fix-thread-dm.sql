-- Fix thread DM issue
-- Execute this in Supabase SQL Editor

-- Insert the special thread DM if it doesn't exist
INSERT INTO direct_messages (id, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify the insertion
SELECT id, created_at FROM direct_messages WHERE id = '00000000-0000-0000-0000-000000000001';
