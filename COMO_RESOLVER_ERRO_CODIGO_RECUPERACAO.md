# 🔧 Como Resolver Erro de Envio de Código

## ❌ Problema

O erro `Could not find the table 'public.password_reset_codes'` acontece porque a tabela ainda não foi criada no banco de dados Supabase.

## ✅ Solução

Execute o script SQL abaixo no Supabase:

### **Passo 1: Acessar Supabase Dashboard**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (no menu lateral esquerdo)

### **Passo 2: Executar o Script**

Cole e execute todo o conteúdo do arquivo `CREATE_PASSWORD_RESET_CODES_TABLE.sql` no SQL Editor:

```sql
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
  
  CONSTRAINT unique_code_per_email UNIQUE (email, code) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_code ON password_reset_codes(code);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires_at ON password_reset_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_used ON password_reset_codes(used);

-- Function to clean expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_reset_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_codes 
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow insert reset codes" ON password_reset_codes;
DROP POLICY IF EXISTS "Allow select for validation" ON password_reset_codes;
DROP POLICY IF EXISTS "Allow update reset codes" ON password_reset_codes;

-- Create policies
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
```

### **Passo 3: Verificar**

Após executar, você deve ver:
- ✅ Tabela criada com sucesso
- ✅ Índices criados
- ✅ Políticas RLS configuradas

### **Passo 4: Testar**

1. Recarregue a página de recuperação de senha
2. Digite seu email
3. Clique em "Enviar código"
4. O código deve ser enviado por email agora! ✅

## 📝 Nota

O arquivo completo está em: `CREATE_PASSWORD_RESET_CODES_TABLE.sql`

Você pode copiar o conteúdo completo desse arquivo e colar no SQL Editor do Supabase.

