-- Migration: Create archived_messages table for message retention system
-- Created: 2025-01-25

-- Create archived_messages table
CREATE TABLE IF NOT EXISTS archived_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_message_id UUID NOT NULL,
  content TEXT NOT NULL,
  channel_id UUID NOT NULL,
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_archived_messages_workspace_id ON archived_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_archived_messages_channel_id ON archived_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_archived_messages_user_id ON archived_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_messages_archived_at ON archived_messages(archived_at);
CREATE INDEX IF NOT EXISTS idx_archived_messages_created_at ON archived_messages(created_at);

-- Enable RLS
ALTER TABLE archived_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for archived_messages
CREATE POLICY "Users can view archived messages from their workspaces" ON archived_messages
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert archived messages" ON archived_messages
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete archived messages" ON archived_messages
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add foreign key constraints (optional, for data integrity)
-- Note: These might fail if the referenced tables don't exist yet
-- ALTER TABLE archived_messages ADD CONSTRAINT fk_archived_messages_channel 
--   FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE;
-- 
-- ALTER TABLE archived_messages ADD CONSTRAINT fk_archived_messages_user 
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- 
-- ALTER TABLE archived_messages ADD CONSTRAINT fk_archived_messages_workspace 
--   FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Add comments for documentation
COMMENT ON TABLE archived_messages IS 'Stores archived messages for audit and compliance purposes';
COMMENT ON COLUMN archived_messages.original_message_id IS 'ID of the original message before archiving';
COMMENT ON COLUMN archived_messages.content IS 'Content of the archived message';
COMMENT ON COLUMN archived_messages.channel_id IS 'ID of the channel where the message was posted';
COMMENT ON COLUMN archived_messages.user_id IS 'ID of the user who posted the message';
COMMENT ON COLUMN archived_messages.workspace_id IS 'ID of the workspace the message belongs to';
COMMENT ON COLUMN archived_messages.created_at IS 'Original creation date of the message';
COMMENT ON COLUMN archived_messages.archived_at IS 'Date when the message was archived';
