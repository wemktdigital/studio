-- Migration: Create special DM for thread messages
-- Created: 2025-01-25

-- Insert the special thread DM if it doesn't exist
INSERT INTO direct_messages (id, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Add comment for documentation
COMMENT ON COLUMN direct_messages.id IS 'Special DM ID 00000000-0000-0000-0000-000000000001 is reserved for thread messages';
