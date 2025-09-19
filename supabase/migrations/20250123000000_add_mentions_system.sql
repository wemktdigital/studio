-- Migration: Add mentions system
-- Created: 2025-01-23

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

-- Create trigger for updated_at
CREATE TRIGGER update_message_read_status_updated_at BEFORE UPDATE ON message_read_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Create trigger for updated_at
CREATE TRIGGER update_message_mentions_updated_at BEFORE UPDATE ON message_mentions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add function to extract usernames from text
CREATE OR REPLACE FUNCTION extract_mentions(text_content TEXT)
RETURNS TEXT[] AS $$
BEGIN
  -- Extract @username patterns from text
  -- This regex finds @username patterns and extracts just the username part
  RETURN ARRAY(
    SELECT DISTINCT substring(match FROM 2) -- Remove the @ symbol
    FROM regexp_matches(text_content, '@([a-zA-Z0-9_]+)', 'g') AS matches(match)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add function to create mentions for a message
CREATE OR REPLACE FUNCTION create_message_mentions(
  p_message_id UUID,
  p_text_content TEXT,
  p_mentioned_by_user_id UUID,
  p_channel_id UUID DEFAULT NULL,
  p_dm_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  username TEXT;
  mentioned_user_id UUID;
BEGIN
  -- Extract usernames from message content
  FOR username IN SELECT unnest(extract_mentions(p_text_content))
  LOOP
    -- Find user by username
    SELECT id INTO mentioned_user_id
    FROM users
    WHERE username = username
    LIMIT 1;
    
    -- If user found and not mentioning themselves, create mention record
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != p_mentioned_by_user_id THEN
      INSERT INTO message_mentions (
        message_id,
        mentioned_user_id,
        mentioned_by_user_id,
        channel_id,
        dm_id
      ) VALUES (
        p_message_id,
        mentioned_user_id,
        p_mentioned_by_user_id,
        p_channel_id,
        p_dm_id
      )
      ON CONFLICT (message_id, mentioned_user_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically create mentions when messages are inserted
CREATE OR REPLACE FUNCTION handle_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the create_message_mentions function for new messages
  PERFORM create_message_mentions(
    NEW.id,
    NEW.content,
    NEW.user_id,
    NEW.channel_id,
    NEW.dm_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS trigger_message_mentions ON messages;
CREATE TRIGGER trigger_message_mentions
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_insert();

-- Add trigger for updating mentions when messages are updated
CREATE OR REPLACE FUNCTION handle_message_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if content changed
  IF OLD.content != NEW.content THEN
    -- Delete old mentions for this message
    DELETE FROM message_mentions WHERE message_id = NEW.id;
    
    -- Create new mentions based on updated content
    PERFORM create_message_mentions(
      NEW.id,
      NEW.content,
      NEW.user_id,
      NEW.channel_id,
      NEW.dm_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on messages table for updates
DROP TRIGGER IF EXISTS trigger_message_mentions_update ON messages;
CREATE TRIGGER trigger_message_mentions_update
  AFTER UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_update();

-- Add trigger for deleting mentions when messages are deleted
CREATE OR REPLACE FUNCTION handle_message_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all mentions for the deleted message
  DELETE FROM message_mentions WHERE message_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on messages table for deletes
DROP TRIGGER IF EXISTS trigger_message_mentions_delete ON messages;
CREATE TRIGGER trigger_message_mentions_delete
  AFTER DELETE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_delete();
