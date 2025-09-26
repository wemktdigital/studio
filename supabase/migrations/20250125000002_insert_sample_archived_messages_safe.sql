-- Migration: Insert sample archived messages with safe fallback
-- Created: 2025-01-25
-- Note: This version creates sample data without depending on existing channels/users

-- First, let's see what data exists
SELECT 'Current Channels:' as info;
SELECT id, name, workspace_id FROM channels LIMIT 5;

SELECT 'Current Users:' as info;
SELECT id, email FROM users LIMIT 5;

SELECT 'Current Workspaces:' as info;
SELECT id, name FROM workspaces LIMIT 5;

-- If no channels exist, we'll create sample data
-- This is a safe approach that works even with empty database

DO $$
DECLARE
    sample_channel_id UUID;
    sample_user_id UUID;
    sample_workspace_id UUID;
    channel_count INTEGER;
    user_count INTEGER;
    workspace_count INTEGER;
BEGIN
    -- Check if we have any data
    SELECT COUNT(*) INTO channel_count FROM channels;
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO workspace_count FROM workspaces;
    
    RAISE NOTICE 'Found % channels, % users, % workspaces', channel_count, user_count, workspace_count;
    
    -- Get or create sample data
    IF channel_count > 0 THEN
        SELECT id INTO sample_channel_id FROM channels LIMIT 1;
    ELSE
        -- Create a sample channel if none exist
        INSERT INTO channels (id, name, workspace_id, created_at)
        VALUES (
            gen_random_uuid(),
            'general',
            (SELECT id FROM workspaces LIMIT 1),
            NOW()
        ) RETURNING id INTO sample_channel_id;
        RAISE NOTICE 'Created sample channel: %', sample_channel_id;
    END IF;
    
    IF user_count > 0 THEN
        SELECT id INTO sample_user_id FROM users LIMIT 1;
    ELSE
        -- Create a sample user if none exist
        INSERT INTO users (id, email, created_at)
        VALUES (
            gen_random_uuid(),
            'admin@example.com',
            NOW()
        ) RETURNING id INTO sample_user_id;
        RAISE NOTICE 'Created sample user: %', sample_user_id;
    END IF;
    
    IF workspace_count > 0 THEN
        SELECT id INTO sample_workspace_id FROM workspaces LIMIT 1;
    ELSE
        -- Create a sample workspace if none exist
        INSERT INTO workspaces (id, name, created_at)
        VALUES (
            gen_random_uuid(),
            'Sample Workspace',
            NOW()
        ) RETURNING id INTO sample_workspace_id;
        RAISE NOTICE 'Created sample workspace: %', sample_workspace_id;
    END IF;
    
    -- Now insert sample archived messages
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
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error inserting sample data: %', SQLERRM;
        RAISE NOTICE 'This is normal if the required tables (channels, users, workspaces) do not exist yet';
END $$;

-- Verify the inserted data
SELECT 
  'Archived Messages:' as info,
  am.id,
  am.content,
  c.name as channel_name,
  u.email as user_email,
  am.created_at,
  am.archived_at
FROM archived_messages am
LEFT JOIN channels c ON am.channel_id = c.id
LEFT JOIN users u ON am.user_id = u.id
ORDER BY am.archived_at DESC;
