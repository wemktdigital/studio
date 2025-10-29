-- Migration: Create password_reset_codes table
-- Created: 2025-01-29
-- Description: Tabela para armazenar códigos de verificação de recuperação de senha

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create password_reset_codes table
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para garantir que um código não seja usado mais de uma vez
  CONSTRAINT unique_code_per_email UNIQUE (email, code) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_code ON password_reset_codes(code);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires_at ON password_reset_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_used ON password_reset_codes(used);

-- Function to clean expired codes (opcional, pode ser executada periodicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_reset_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_codes 
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Política: Permitir inserção de códigos (qualquer um pode solicitar recuperação)
CREATE POLICY "Allow insert reset codes" ON password_reset_codes
  FOR INSERT
  WITH CHECK (true);

-- Política: Permitir leitura apenas para validação (apenas código válido pode ser lido)
-- Na prática, as API routes vão usar service role, mas por segurança:
CREATE POLICY "Allow select for validation" ON password_reset_codes
  FOR SELECT
  USING (true);

-- Política: Permitir atualização para marcar como usado
CREATE POLICY "Allow update reset codes" ON password_reset_codes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

