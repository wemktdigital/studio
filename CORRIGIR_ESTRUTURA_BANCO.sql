-- Script para corrigir estrutura do banco de dados
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar se a foreign key messages_author_id_fkey existe
DO $$
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_author_id_fkey' 
        AND table_name = 'messages'
    ) THEN
        -- Adicionar a foreign key se não existir
        ALTER TABLE messages 
        ADD CONSTRAINT messages_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key messages_author_id_fkey adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Foreign key messages_author_id_fkey já existe';
    END IF;
END $$;

-- 2. Verificar se a foreign key messages_channel_id_fkey existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_channel_id_fkey' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE messages 
        ADD CONSTRAINT messages_channel_id_fkey 
        FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key messages_channel_id_fkey adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Foreign key messages_channel_id_fkey já existe';
    END IF;
END $$;

-- 3. Verificar se a foreign key messages_dm_id_fkey existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_dm_id_fkey' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE messages 
        ADD CONSTRAINT messages_dm_id_fkey 
        FOREIGN KEY (dm_id) REFERENCES direct_messages(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key messages_dm_id_fkey adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Foreign key messages_dm_id_fkey já existe';
    END IF;
END $$;

-- 4. Criar índices para melhor performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_dm_id ON messages(dm_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 5. Verificar se as tabelas users, channels e direct_messages existem
DO $$
BEGIN
    -- Verificar tabela users
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'Tabela users não existe!';
    END IF;
    
    -- Verificar tabela channels
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channels') THEN
        RAISE EXCEPTION 'Tabela channels não existe!';
    END IF;
    
    -- Verificar tabela direct_messages
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'direct_messages') THEN
        RAISE EXCEPTION 'Tabela direct_messages não existe!';
    END IF;
    
    RAISE NOTICE 'Todas as tabelas necessárias existem';
END $$;

-- 6. Testar relacionamentos após correções
SELECT 
  'Teste de relacionamento messages -> users' as teste,
  COUNT(*) as total_messages,
  COUNT(u.id) as messages_com_usuario
FROM messages m
LEFT JOIN users u ON m.author_id = u.id;

-- 7. Verificar mensagens órfãs (sem usuário válido)
SELECT 
  'Mensagens órfãs' as tipo,
  COUNT(*) as quantidade
FROM messages m
LEFT JOIN users u ON m.author_id = u.id
WHERE u.id IS NULL;

-- 8. Verificar mensagens órfãs (sem canal válido)
SELECT 
  'Mensagens sem canal válido' as tipo,
  COUNT(*) as quantidade
FROM messages m
LEFT JOIN channels c ON m.channel_id = c.id
WHERE m.channel_id IS NOT NULL AND c.id IS NULL;

-- 9. Verificar mensagens órfãs (sem DM válido)
SELECT 
  'Mensagens sem DM válido' as tipo,
  COUNT(*) as quantidade
FROM messages m
LEFT JOIN direct_messages dm ON m.dm_id = dm.id
WHERE m.dm_id IS NOT NULL AND dm.id IS NULL;

