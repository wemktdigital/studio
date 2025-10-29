# 🚨 CORREÇÃO URGENTE: Erro ao Enviar Código de Recuperação

## ⚠️ PROBLEMA
O erro `Could not find the table 'public.password_reset_codes'` acontece porque a tabela **AINDA NÃO FOI CRIADA** no Supabase.

## ✅ SOLUÇÃO (5 minutos)

### **PASSO 1: Abrir Supabase Dashboard**
1. Acesse: **https://supabase.com/dashboard**
2. Faça login na sua conta
3. Selecione seu projeto (o que tem URL: `ghmawrvdsghvvzliibzv.supabase.co`)

### **PASSO 2: Abrir SQL Editor**
1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"New Query"** (botão verde no canto superior direito)

### **PASSO 3: Copiar e Colar o SQL Abaixo**

```sql
-- Criar tabela password_reset_codes
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

CREATE OR REPLACE FUNCTION cleanup_expired_reset_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_codes 
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;
```

### **PASSO 4: Executar**
1. Clique no botão **"Run"** (ou pressione `Ctrl + Enter`)
2. Você deve ver: **"Success. No rows returned"** ou mensagem de sucesso

### **PASSO 5: Verificar**
Execute este SQL para confirmar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'password_reset_codes';
```

**Resultado esperado:** Deve retornar 1 linha com `password_reset_codes`

---

## 🔄 Depois de Executar

1. **Recarregue a página** de recuperação de senha (`/auth/reset-password`)
2. **Digite seu email** novamente
3. **Clique em "Enviar código"**
4. **Deve funcionar agora!** ✅

---

## 📝 Arquivos Disponíveis

- `FIX_PASSWORD_RESET_CODES.sql` - SQL completo e comentado
- `CREATE_PASSWORD_RESET_CODES_TABLE.sql` - Versão alternativa

**Use qualquer um dos arquivos acima - todos criam a mesma tabela!**

