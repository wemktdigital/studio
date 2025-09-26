-- Migration: Insert sample archived messages for testing
-- Created: 2025-01-25
-- Note: Execute this AFTER creating the archived_messages table

-- First, let's check what channels and users exist
-- Uncomment the lines below to see what data is available:

-- SELECT 'Channels:' as info;
-- SELECT id, name, workspace_id FROM channels;
-- SELECT 'Users:' as info;
-- SELECT id, name, email FROM users;
-- SELECT 'Workspaces:' as info;
-- SELECT id, name FROM workspaces;

-- Insert sample archived messages only if channels exist
-- This will only insert if there are actual channels and users in the database

DO $$
DECLARE
    sample_channel_id UUID;
    sample_user_id UUID;
    sample_workspace_id UUID;
BEGIN
    -- Get the first available channel
    SELECT id INTO sample_channel_id FROM channels LIMIT 1;
    
    -- Get the first available user
    SELECT id INTO sample_user_id FROM users LIMIT 1;
    
    -- Get the first available workspace
    SELECT id INTO sample_workspace_id FROM workspaces LIMIT 1;
    
    -- Only insert if we have all required data
    IF sample_channel_id IS NOT NULL AND sample_user_id IS NOT NULL AND sample_workspace_id IS NOT NULL THEN
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
            sample_channel_id,
            sample_user_id,
            sample_workspace_id,
            NOW() - INTERVAL '7 days',
            NOW() - INTERVAL '1 day'
        ),
        (
            gen_random_uuid(),
            'Outra mensagem arquivada para mostrar como o sistema funciona.',
            sample_channel_id,
            sample_user_id,
            sample_workspace_id,
            NOW() - INTERVAL '14 days',
            NOW() - INTERVAL '2 days'
        ),
        (
            gen_random_uuid(),
            'Mensagem de teste para verificar a funcionalidade de retenção.',
            sample_channel_id,
            sample_user_id,
            sample_workspace_id,
            NOW() - INTERVAL '30 days',
            NOW() - INTERVAL '3 days'
        );
        
        RAISE NOTICE 'Sample archived messages inserted successfully';
    ELSE
        RAISE NOTICE 'Cannot insert sample messages: missing channels, users, or workspaces';
        RAISE NOTICE 'Channel ID: %, User ID: %, Workspace ID: %', sample_channel_id, sample_user_id, sample_workspace_id;
    END IF;
END $$;

-- Verify the inserted data
SELECT 
  am.id,
  am.content,
  c.name as channel_name,
  u.name as user_name,
  u.email as user_email,
  am.created_at,
  am.archived_at
FROM archived_messages am
LEFT JOIN channels c ON am.channel_id = c.id
LEFT JOIN users u ON am.user_id = u.id
ORDER BY am.archived_at DESC;
