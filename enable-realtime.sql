-- Habilitar Realtime para tabela messages
-- Execute este SQL no Supabase para mensagens em tempo real funcionarem

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Verificar se funcionou
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages';

-- Se retornar "messages", está habilitado!

