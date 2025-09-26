-- Migration: Add mentions system (Simple version)
-- Created: 2025-01-23
-- Simple version without complex triggers

-- Add message read status table
CREATE TABLE IF NOT EXISTS message_read_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL, -- 'channel-{id}' or 'dm-{id}'
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, conversation_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_read_status_user_id ON message_read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_conversation_id ON message_read_status(conversation_id);

-- Enable RLS
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_read_status
CREATE POLICY "Users can view their own read status" ON message_read_status
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own read status" ON message_read_status
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own read status" ON message_read_status
  FOR UPDATE USING (user_id = auth.uid());

-- Add mentions table for tracking @username mentions
CREATE TABLE IF NOT EXISTS message_mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mentioned_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  dm_id UUID REFERENCES direct_messages(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, mentioned_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_mentions_mentioned_user_id ON message_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_message_mentions_message_id ON message_mentions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_mentions_channel_id ON message_mentions(channel_id);
CREATE INDEX IF NOT EXISTS idx_message_mentions_dm_id ON message_mentions(dm_id);
CREATE INDEX IF NOT EXISTS idx_message_mentions_is_read ON message_mentions(is_read);

-- Enable RLS
ALTER TABLE message_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_mentions
CREATE POLICY "Users can view mentions of themselves" ON message_mentions
  FOR SELECT USING (mentioned_user_id = auth.uid());

CREATE POLICY "Users can view mentions they created" ON message_mentions
  FOR SELECT USING (mentioned_by_user_id = auth.uid());

CREATE POLICY "Users can insert mentions" ON message_mentions
  FOR INSERT WITH CHECK (mentioned_by_user_id = auth.uid());

CREATE POLICY "Users can update mentions of themselves" ON message_mentions
  FOR UPDATE USING (mentioned_user_id = auth.uid());
