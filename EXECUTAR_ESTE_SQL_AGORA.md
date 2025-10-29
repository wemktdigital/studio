# 🚨 EXECUTE ESTE SQL AGORA NO SUPABASE

## ⚠️ PROBLEMA
A tabela `password_reset_codes` **NÃO EXISTE** no banco de dados. Por isso o erro "Could not find the table".

## ✅ SOLUÇÃO IMEDIATA

### **1. Abra o Supabase Dashboard:**
🔗 https://supabase.com/dashboard

### **2. Selecione seu projeto** (ghmawrvdsghvvzliibzv)

### **3. Clique em "SQL Editor"** (menu lateral esquerdo)

### **4. Cole e execute TODO o SQL abaixo:**

```sql
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

### **5. Clique em "Run"** (ou pressione Ctrl+Enter)

### **6. Aguarde a mensagem de sucesso**

### **7. RECARREGUE a página** `/auth/reset-password`

### **8. Tente enviar o código novamente**

---

## ✅ CONFIRMAÇÃO

Se quiser verificar se funcionou, execute este SQL no Supabase:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'password_reset_codes';
```

**Deve retornar:** `password_reset_codes`

---

## 📝 NOTA IMPORTANTE

⚠️ **O código do projeto está correto!** O problema é que a tabela precisa ser criada **manualmente no Supabase Dashboard**. 

Depois de executar o SQL acima, tudo vai funcionar! ✅

