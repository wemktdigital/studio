-- Migration: Enable Realtime for messages table
-- Created: 2025-01-27

-- Enable Realtime publication for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

