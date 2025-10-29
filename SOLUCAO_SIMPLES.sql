-- ⚡ SOLUÇÃO SIMPLES - Copie e Cole TUDO no Supabase SQL Editor
-- Acesse: https://supabase.com/dashboard > Seu Projeto > SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS password_reset_codes CASCADE;

CREATE TABLE password_reset_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_code_per_email UNIQUE (email, code)
);

CREATE INDEX idx_password_reset_codes_email ON password_reset_codes(email);
CREATE INDEX idx_password_reset_codes_code ON password_reset_codes(code);
CREATE INDEX idx_password_reset_codes_expires_at ON password_reset_codes(expires_at);
CREATE INDEX idx_password_reset_codes_used ON password_reset_codes(used);

ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert reset codes" ON password_reset_codes;
DROP POLICY IF EXISTS "Allow select for validation" ON password_reset_codes;
DROP POLICY IF EXISTS "Allow update reset codes" ON password_reset_codes;

CREATE POLICY "Allow insert reset codes" ON password_reset_codes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select for validation" ON password_reset_codes
  FOR SELECT USING (true);

CREATE POLICY "Allow update reset codes" ON password_reset_codes
  FOR UPDATE USING (true) WITH CHECK (true);

-- ✅ Pronto! Se aparecer "Success", a tabela foi criada!

