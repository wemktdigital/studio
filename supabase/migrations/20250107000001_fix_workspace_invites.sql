-- Migration: Fix workspace_invites table - Add token column
-- Created: 2025-01-07
-- Description: Adiciona coluna token à tabela existente ou cria tabela completa

-- Drop table if exists (para começar do zero)
DROP TABLE IF EXISTS workspace_invites CASCADE;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS generate_invite_token() CASCADE;

-- Function to generate unique token (must be created before table)
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
BEGIN
  RETURN 'invite_' || encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create workspace_invites table
CREATE TABLE workspace_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT generate_invite_token(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_workspace_invites_email ON workspace_invites(email);
CREATE INDEX idx_workspace_invites_workspace_id ON workspace_invites(workspace_id);
CREATE INDEX idx_workspace_invites_token ON workspace_invites(token);
CREATE INDEX idx_workspace_invites_status ON workspace_invites(status);
CREATE INDEX idx_workspace_invites_expires_at ON workspace_invites(expires_at);
CREATE INDEX idx_workspace_invites_inviter_id ON workspace_invites(inviter_id);

-- Enable Row Level Security
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace_invites
-- Users can view invites for workspaces they belong to
CREATE POLICY "Users can view invites for their workspaces" ON workspace_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_members.workspace_id = workspace_invites.workspace_id 
      AND workspace_members.user_id = auth.uid()
    )
  );

-- Users can create invites for workspaces they belong to
CREATE POLICY "Users can create invites for their workspaces" ON workspace_invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_members.workspace_id = workspace_invites.workspace_id 
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin')
    )
    AND inviter_id = auth.uid()
  );

-- Users can update invites they created
CREATE POLICY "Users can update their own invites" ON workspace_invites
  FOR UPDATE USING (inviter_id = auth.uid());

-- Users can delete invites they created
CREATE POLICY "Users can delete their own invites" ON workspace_invites
  FOR DELETE USING (inviter_id = auth.uid());

-- Anyone can view invites by token (for the invite acceptance page)
CREATE POLICY "Anyone can view invites by token" ON workspace_invites
  FOR SELECT USING (true);

-- Drop existing trigger function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspace_invites_updated_at 
  BEFORE UPDATE ON workspace_invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Drop existing function if it exists with different return type
DROP FUNCTION IF EXISTS cleanup_expired_invites() CASCADE;

-- Function to clean up expired invites
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE workspace_invites 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' 
  AND expires_at < NOW();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Drop existing function if it exists with different signature
DROP FUNCTION IF EXISTS accept_workspace_invite(TEXT, UUID) CASCADE;

-- Function to accept invite
CREATE OR REPLACE FUNCTION accept_workspace_invite(
  invite_token TEXT,
  user_id UUID
)
RETURNS JSON AS $$
DECLARE
  invite_record workspace_invites%ROWTYPE;
  member_exists BOOLEAN;
  result JSON;
BEGIN
  -- Get the invite
  SELECT * INTO invite_record 
  FROM workspace_invites 
  WHERE token = invite_token 
  AND status = 'pending'
  AND expires_at > NOW();
  
  -- Check if invite exists and is valid
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invite not found, expired, or already processed'
    );
  END IF;
  
  -- Check if user already exists in workspace
  SELECT EXISTS(
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = invite_record.workspace_id 
    AND workspace_members.user_id = accept_workspace_invite.user_id
  ) INTO member_exists;
  
  IF member_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User is already a member of this workspace'
    );
  END IF;
  
  -- Add user to workspace
  INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
  VALUES (invite_record.workspace_id, accept_workspace_invite.user_id, invite_record.role, NOW())
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  
  -- Update invite status
  UPDATE workspace_invites 
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    accepted_by = accept_workspace_invite.user_id,
    updated_at = NOW()
  WHERE id = invite_record.id;
  
  -- Return success with workspace info
  SELECT json_build_object(
    'success', true,
    'workspace_id', invite_record.workspace_id,
    'role', invite_record.role,
    'message', 'Successfully joined workspace'
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing view if it exists
DROP VIEW IF EXISTS workspace_invite_stats CASCADE;

-- Create a view for invite statistics
CREATE OR REPLACE VIEW workspace_invite_stats AS
SELECT 
  w.id as workspace_id,
  w.name as workspace_name,
  COUNT(CASE WHEN wi.status = 'pending' THEN 1 END) as pending_invites,
  COUNT(CASE WHEN wi.status = 'accepted' THEN 1 END) as accepted_invites,
  COUNT(CASE WHEN wi.status = 'expired' THEN 1 END) as expired_invites,
  COUNT(CASE WHEN wi.status = 'cancelled' THEN 1 END) as cancelled_invites,
  COUNT(*) as total_invites
FROM workspaces w
LEFT JOIN workspace_invites wi ON w.id = wi.workspace_id
GROUP BY w.id, w.name;

-- Grant access to the view
GRANT SELECT ON workspace_invite_stats TO authenticated;

-- Add comments to table
COMMENT ON TABLE workspace_invites IS 'Stores workspace invitation data with token-based access';
COMMENT ON COLUMN workspace_invites.token IS 'Unique token for invite link';
COMMENT ON COLUMN workspace_invites.expires_at IS 'Invite expiration time (default 7 days)';
COMMENT ON COLUMN workspace_invites.accepted_by IS 'User who accepted the invite (if any)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela workspace_invites recriada com sucesso';
  RAISE NOTICE '✅ Coluna token configurada com geração automática';
  RAISE NOTICE '✅ Policies de segurança criadas';
  RAISE NOTICE '✅ Funções auxiliares criadas';
  RAISE NOTICE '✅ Índices de performance criados';
  RAISE NOTICE '✅ View de estatísticas criada';
END $$;
