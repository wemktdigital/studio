# 🚀 Instruções para o Webmaster - Instalação Studio

## 📋 Resumo do Problema

O erro de build no servidor ocorre porque **faltam arquivos** no servidor. A solução é **reenviar o projeto completo**.

---

## ✅ SOLUÇÃO RÁPIDA (5 minutos)

### **1️⃣ Receber o Arquivo**

Você receberá um arquivo `studio-completo.tar.gz` com todos os arquivos necessários.

### **2️⃣ No Servidor, executar:**

```bash
# 1. Fazer backup (se já existe instalação)
cd /var/www
[ -d "studio" ] && mv studio studio.backup.$(date +%Y%m%d_%H%M%S)

# 2. Criar diretório e extrair
mkdir -p studio
cd studio
tar -xzf /caminho/para/studio-completo.tar.gz

# 3. Executar script de verificação
chmod +x verificar-instalacao.sh
./verificar-instalacao.sh

# 4. Se tudo OK, criar .env.production
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

# ⚠️ IMPORTANTE: Edite o .env.production e altere:
# - NEXT_PUBLIC_SITE_URL para seu domínio real
nano .env.production  # ou vim, ou qualquer editor

# 5. Instalar dependências
npm ci

# 6. Fazer build
npm run build

# 7. Se build OK, iniciar aplicação
pm2 stop studio-app 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# 8. Verificar status
pm2 status
pm2 logs studio-app --lines 20

# 9. ✅ CONFIGURAR HTTPS (IMPORTANTE!)
chmod +x setup-https.sh
sudo ./setup-https.sh
# Seguir instruções na tela:
#  - Informar seu domínio
#  - Informar seu email
#  - Aguardar configuração automática
```

---

## 🔍 Verificação de Sucesso

Após executar os comandos acima, verifique:

```bash
# 1. Aplicação rodando
pm2 status
# Deve mostrar "online"

# 2. Aplicação respondendo
curl http://localhost:9002
# Deve retornar HTML

# 3. Nginx funcionando
sudo nginx -t
sudo systemctl status nginx

# 4. Site acessível
curl -I https://seu-dominio.com
# Deve retornar "200 OK"
```

---

## 🚨 Se der Erro no Build

### **Erro: "Module not found"**

```bash
# Reinstalar dependências
cd /var/www/studio
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

### **Erro: "Cannot find module"**

```bash
# Verificar arquivos
./verificar-instalacao.sh

# Se faltarem arquivos, solicitar novo arquivo completo
```

### **Erro: "Out of memory"**

```bash
# Aumentar limite de memória
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

## 📦 Estrutura Final

Após instalação, o diretório deve ter:

```
/var/www/studio/
├── src/                    ✅ Código fonte
│   ├── components/         ✅ Componentes React
│   │   └── ui/            ✅ Componentes UI
│   ├── lib/               ✅ Bibliotecas
│   │   └── supabase/      ✅ Cliente Supabase
│   ├── app/               ✅ Páginas Next.js
│   └── hooks/             ✅ React Hooks
├── public/                 ✅ Arquivos estáticos
├── .env.production         ✅ Variáveis de ambiente
├── package.json            ✅ Dependências
├── tsconfig.json           ✅ Config TypeScript
├── next.config.ts          ✅ Config Next.js
├── ecosystem.config.js     ✅ Config PM2
├── nginx-studio.conf       ✅ Config Nginx
└── node_modules/           ✅ Dependências instaladas
```

---

## 🎯 Checklist Final

- [ ] ✅ Arquivo extraído em `/var/www/studio`
- [ ] ✅ Script de verificação executado sem erros
- [ ] ✅ Arquivo `.env.production` criado e configurado
- [ ] ✅ Dependências instaladas (`node_modules` existe)
- [ ] ✅ Build completado com sucesso
- [ ] ✅ PM2 iniciado e aplicação "online"
- [ ] ✅ Aplicação responde em `localhost:9002`
- [ ] ✅ Nginx configurado e funcionando
- [ ] ✅ Site acessível via domínio

---

## 📞 Contato para Suporte

Se após seguir todos os passos o problema persistir:

1. Execute o diagnóstico:
```bash
cd /var/www/studio
./verificar-instalacao.sh > diagnostico.txt
cat diagnostico.txt
```

2. Envie o resultado do diagnóstico

3. Consulte os seguintes arquivos:
   - `CORRECAO_BUILD_SERVIDOR.md` - Soluções detalhadas
   - `WEBMASTER_GUIDE.md` - Guia completo
   - `README_INSTALACAO.md` - Documentação geral

---

## ✅ Resultado Esperado

Após instalação bem-sucedida:

```bash
$ pm2 status
┌────┬──────────────┬─────────┬─────────┬─────────┐
│ id │ name         │ mode    │ status  │ cpu     │
├────┼──────────────┼─────────┼─────────┼─────────┤
│ 0  │ studio-app   │ cluster │ online  │ 0%      │
└────┴──────────────┴─────────┴─────────┴─────────┘

$ curl -I https://seu-dominio.com
HTTP/2 200 
content-type: text/html; charset=utf-8
```

**🎉 Aplicação 100% funcional e acessível!**

