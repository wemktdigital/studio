-- ========================================
-- SOLUÇÃO RÁPIDA: Criar tabela password_reset_codes
-- ========================================
-- Execute este script COMPLETO no Supabase SQL Editor
-- ========================================

-- 1. Criar extensão UUID (se não existir)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Remover tabela se existir (para recriar do zero)
DROP TABLE IF EXISTS password_reset_codes CASCADE;

-- 3. Criar tabela password_reset_codes
CREATE TABLE password_reset_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_code_per_email UNIQUE (email, code)
);

-- 4. Criar índices para performance
CREATE INDEX idx_password_reset_codes_email ON password_reset_codes(email);
CREATE INDEX idx_password_reset_codes_code ON password_reset_codes(code);
CREATE INDEX idx_password_reset_codes_expires_at ON password_reset_codes(expires_at);
CREATE INDEX idx_password_reset_codes_used ON password_reset_codes(used);

-- 5. Habilitar RLS
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- 6. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Allow insert reset codes" ON password_reset_codes;
DROP POLICY IF EXISTS "Allow select for validation" ON password_reset_codes;
DROP POLICY IF EXISTS "Allow update reset codes" ON password_reset_codes;

-- 7. Criar políticas RLS
CREATE POLICY "Allow insert reset codes" ON password_reset_codes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow select for validation" ON password_reset_codes
  FOR SELECT
  USING (true);

CREATE POLICY "Allow update reset codes" ON password_reset_codes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 8. Função para limpar códigos expirados (opcional)
CREATE OR REPLACE FUNCTION cleanup_expired_reset_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_codes 
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- 9. Verificar se foi criado corretamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'password_reset_codes'
  ) THEN
    RAISE NOTICE '✅ Tabela password_reset_codes criada com sucesso!';
  ELSE
    RAISE EXCEPTION '❌ Erro: Tabela não foi criada';
  END IF;
END $$;

-- 10. Mostrar estrutura da tabela
SELECT 
  'Tabela criada: ' || table_name as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'password_reset_codes';

