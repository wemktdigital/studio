# 🔧 Correção do Erro de Build no Servidor

## ❌ Problema Identificado

O build está falando com erro:
```
Module not found: Can't resolve '@/components/ui/card'
Module not found: Can't resolve '@/components/ui/button'
Module not found: Can't resolve '@/lib/supabase/client'
```

## 🔍 Causa Raiz

O problema ocorre porque:
1. ❌ Os arquivos não foram enviados completamente para o servidor
2. ❌ O `node_modules` não foi instalado corretamente
3. ❌ O arquivo `.env.production` pode estar faltando variáveis

## ✅ Solução Passo a Passo

### **OPÇÃO 1: Reenviar Projeto Completo (RECOMENDADO)**

```bash
# 1. No seu computador local, criar arquivo compactado
cd /Users/edsonmedeiros/Documents/GitHub/studio
tar -czf studio.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='*.log' \
  .

# 2. Enviar para o servidor
scp studio.tar.gz root@seu-servidor:/tmp/

# 3. No servidor, extrair e configurar
ssh root@seu-servidor

cd /var/www
rm -rf studio  # Backup primeiro se necessário!
mkdir studio
cd studio
tar -xzf /tmp/studio.tar.gz

# 4. Instalar dependências
npm ci

# 5. Criar arquivo .env.production
cat > .env.production << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ghmawrvdsghvvzliibzv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobWF3cnZkc2dodnZ6bGlpYnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDc3NzEsImV4cCI6MjA3MDg4Mzc3MX0.fmar501flcc0cHnU6UOsWRsn7-daQ_cwDmQ1cqOmM6A
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobWF3cnZkc2dodnZ6bGlpYnp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTMwNzc3MSwiZXhwIjoyMDcwODgzNzcxfQ.siw4e-S2IlrFcyKoGryFM7AUHpFTqBrrVUehxj9c5cY

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com

# Node Environment
NODE_ENV=production
PORT=9002
EOF

# 6. Fazer build
npm run build

# 7. Iniciar aplicação
pm2 start ecosystem.config.js
pm2 save
```

---

### **OPÇÃO 2: Verificar Arquivos Existentes**

```bash
# No servidor, verificar se arquivos existem
cd /var/www/studio

# 1. Verificar estrutura de diretórios
ls -la src/components/ui/ | grep -E "(card|button|input)\.tsx"
ls -la src/lib/supabase/ | grep client.ts

# 2. Se arquivos existem, reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# 3. Limpar cache do Next.js
rm -rf .next

# 4. Verificar arquivo .env.production
cat .env.production

# 5. Tentar build novamente
npm run build
```

---

### **OPÇÃO 3: Via Git (Se repositório estiver atualizado)**

```bash
# No servidor
cd /var/www/studio

# 1. Fazer backup
cp -r /var/www/studio /var/www/studio.backup.$(date +%Y%m%d_%H%M%S)

# 2. Limpar instalação anterior
rm -rf node_modules .next

# 3. Atualizar código
git pull origin main

# 4. Instalar dependências
npm ci

# 5. Verificar .env.production existe
if [ ! -f .env.production ]; then
  echo "ERRO: .env.production não existe!"
  echo "Copie o arquivo .env.production.example e configure as variáveis"
  exit 1
fi

# 6. Fazer build
npm run build

# 7. Reiniciar aplicação
pm2 restart studio-app
```

---

## 🔍 Checklist de Verificação

Antes de fazer o build, verifique:

- [ ] ✅ Arquivo `src/components/ui/card.tsx` existe
- [ ] ✅ Arquivo `src/components/ui/button.tsx` existe
- [ ] ✅ Arquivo `src/components/ui/input.tsx` existe
- [ ] ✅ Arquivo `src/lib/supabase/client.ts` existe
- [ ] ✅ Arquivo `.env.production` existe e está configurado
- [ ] ✅ Diretório `node_modules` existe e está completo
- [ ] ✅ Node.js versão 20.x está instalado

## 📋 Comandos de Diagnóstico

```bash
# Verificar estrutura do projeto
cd /var/www/studio
echo "=== Verificando arquivos críticos ==="
ls -lh src/components/ui/card.tsx 2>/dev/null && echo "✅ card.tsx OK" || echo "❌ card.tsx FALTANDO"
ls -lh src/components/ui/button.tsx 2>/dev/null && echo "✅ button.tsx OK" || echo "❌ button.tsx FALTANDO"
ls -lh src/components/ui/input.tsx 2>/dev/null && echo "✅ input.tsx OK" || echo "❌ input.tsx FALTANDO"
ls -lh src/lib/supabase/client.ts 2>/dev/null && echo "✅ client.ts OK" || echo "❌ client.ts FALTANDO"
ls -lh .env.production 2>/dev/null && echo "✅ .env.production OK" || echo "❌ .env.production FALTANDO"

echo ""
echo "=== Verificando Node.js ==="
node --version
npm --version

echo ""
echo "=== Verificando dependências ==="
[ -d "node_modules" ] && echo "✅ node_modules existe" || echo "❌ node_modules FALTANDO"
[ -f "package.json" ] && echo "✅ package.json existe" || echo "❌ package.json FALTANDO"

echo ""
echo "=== Verificando tsconfig.json ==="
cat tsconfig.json | grep "@/\*"
```

## 🚨 Se o Erro Persistir

Se após todas as tentativas o erro continuar:

1. **Limpar tudo e reinstalar:**
```bash
cd /var/www
rm -rf studio
# Reenviar projeto completo via OPÇÃO 1
```

2. **Verificar permissões:**
```bash
sudo chown -R $USER:$USER /var/www/studio
chmod -R 755 /var/www/studio
```

3. **Verificar espaço em disco:**
```bash
df -h
```

4. **Verificar memória:**
```bash
free -h
```

## 📞 Resultado Esperado

Após seguir os passos acima, o build deve completar com sucesso:

```
✓ Compiled successfully
✓ Generating static pages (13/13)
✓ Finalizing page optimization
```

---

## 🎯 Resumo

**Problema**: Arquivos não encontrados durante build  
**Causa**: Projeto incompleto no servidor  
**Solução**: Reenviar projeto completo e reinstalar dependências  
**Tempo estimado**: 5-10 minutos  

**✅ Após correção, a aplicação estará 100% funcional!**

