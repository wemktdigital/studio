#!/bin/bash

# Script para gerar pacote completo para webmaster
# Data: $(date)

echo "🚀 Gerando pacote completo para webmaster..."

# Criar diretório temporário
TEMP_DIR="studio-webmaster-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$TEMP_DIR"

echo "📁 Criando estrutura de diretórios..."

# Copiar arquivos principais
cp -r src/ "$TEMP_DIR/"
cp -r public/ "$TEMP_DIR/"
cp -r supabase/ "$TEMP_DIR/"

# Copiar arquivos de configuração
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/"
cp next.config.ts "$TEMP_DIR/"
cp tailwind.config.ts "$TEMP_DIR/"
cp tsconfig.json "$TEMP_DIR/"
cp postcss.config.mjs "$TEMP_DIR/"
cp components.json "$TEMP_DIR/"
cp middleware.ts "$TEMP_DIR/"
cp next-env.d.ts "$TEMP_DIR/"

# Copiar arquivos de ambiente
cp env.example "$TEMP_DIR/"
cp env.production.example "$TEMP_DIR/"

# Copiar scripts importantes
cp deploy.sh "$TEMP_DIR/"
cp setup-https.sh "$TEMP_DIR/"
cp verificar-instalacao.sh "$TEMP_DIR/"
cp ecosystem.config.js "$TEMP_DIR/"
cp nginx-studio.conf "$TEMP_DIR/"

# Copiar documentação importante
cp README.md "$TEMP_DIR/"
cp README_INSTALACAO.md "$TEMP_DIR/"
cp DEPLOY_GUIDE.md "$TEMP_DIR/"
cp INSTALACAO_SERVIDOR.md "$TEMP_DIR/"
cp REQUISITOS_SERVIDOR.md "$TEMP_DIR/"
cp WEBMASTER_GUIDE.md "$TEMP_DIR/"
cp INSTRUCOES_WEBMASTER.md "$TEMP_DIR/"

# Copiar scripts SQL importantes
cp FIX_USER_CREATION.sql "$TEMP_DIR/"
cp FIX_USERS_TABLE_FINAL.sql "$TEMP_DIR/"
cp FIX_DM_MESSAGES.sql "$TEMP_DIR/"
cp FIX_TRIGGER_SIMPLE.sql "$TEMP_DIR/"

# Copiar arquivos de status
cp STATUS_APLICACAO.md "$TEMP_DIR/"
cp APLICACAO_FINALIZADA.md "$TEMP_DIR/"

echo "📝 Criando arquivo de instruções..."

# Criar arquivo de instruções principal
cat > "$TEMP_DIR/INSTRUCOES_WEBMASTER_COMPLETAS.md" << 'EOF'
# 🚀 Studio2 - Instruções Completas para Webmaster

## 📋 Visão Geral
Sistema de chat colaborativo estilo Slack desenvolvido em Next.js 15 com Supabase.

## 🎯 Status Atual
✅ **SISTEMA TOTALMENTE FUNCIONAL**
- Criação e gerenciamento de usuários
- Workspaces e canais
- Mensagens diretas
- Sistema de convites
- Painel administrativo
- Configurações do workspace

## 🛠️ Tecnologias Utilizadas
- **Frontend**: Next.js 15.3.3 + React + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Styling**: Tailwind CSS + Radix UI
- **Deploy**: PM2 + Nginx
- **Email**: Resend

## 📦 Instalação Rápida

### 1. Pré-requisitos
```bash
# Node.js 18+ e npm
node --version
npm --version

# PM2 para produção
npm install -g pm2

# Nginx (Ubuntu/Debian)
sudo apt update
sudo apt install nginx
```

### 2. Configuração do Projeto
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.example .env.local
# Editar .env.local com suas credenciais
```

### 3. Configuração do Supabase
1. Execute os scripts SQL na ordem:
   - `FIX_USERS_TABLE_FINAL.sql`
   - `FIX_USER_CREATION.sql`
   - `FIX_TRIGGER_SIMPLE.sql`
   - `FIX_DM_MESSAGES.sql`

### 4. Build e Deploy
```bash
# Build para produção
npm run build

# Iniciar com PM2
pm2 start ecosystem.config.js

# Configurar Nginx
sudo cp nginx-studio.conf /etc/nginx/sites-available/studio
sudo ln -s /etc/nginx/sites-available/studio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Configurações Importantes

### Variáveis de Ambiente (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Email (Resend)
RESEND_API_KEY=sua_chave_resend

# Site
NEXT_PUBLIC_SITE_URL=https://seudominio.com
```

### Portas
- **Desenvolvimento**: 9002
- **Produção**: 3000 (PM2)
- **Nginx**: 80/443

## 📁 Estrutura de Arquivos Importantes

```
src/
├── app/                    # Páginas Next.js
│   ├── admin/             # Painel administrativo
│   ├── w/[workspaceId]/   # Workspace principal
│   └── api/              # APIs
├── components/            # Componentes React
├── hooks/                # Hooks customizados
├── lib/                  # Serviços e utilitários
└── types/               # Tipos TypeScript

supabase/
├── migrations/          # Migrações do banco
└── seed.sql            # Dados iniciais
```

## 🚨 Solução de Problemas

### Erro de Criação de Usuário
- Execute `FIX_USER_CREATION.sql` no Supabase
- Verifique se o trigger `handle_new_user` está ativo

### Erro "Usuário Desconhecido" em DMs
- Execute `FIX_DM_MESSAGES.sql` no Supabase
- Verifique foreign keys da tabela `messages`

### Problemas de Permissão
- Verifique RLS policies no Supabase
- Confirme SERVICE_ROLE_KEY no .env.local

## 📊 Monitoramento

### Logs PM2
```bash
pm2 logs studio-app
pm2 monit
```

### Logs Nginx
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔄 Atualizações

### Deploy de Nova Versão
```bash
git pull origin main
npm install
npm run build
pm2 restart studio-app
```

### Backup do Banco
```bash
# Via Supabase Dashboard ou CLI
supabase db dump --file backup.sql
```

## 📞 Suporte

### Logs Importantes
- Console do navegador (F12)
- Terminal do servidor
- Logs do PM2
- Logs do Nginx

### Arquivos de Debug
- `STATUS_APLICACAO.md` - Status atual
- `APLICACAO_FINALIZADA.md` - Funcionalidades implementadas

## ✅ Checklist de Deploy

- [ ] Node.js 18+ instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Variáveis de ambiente configuradas
- [ ] Scripts SQL executados no Supabase
- [ ] Build realizado (`npm run build`)
- [ ] PM2 configurado e rodando
- [ ] Nginx configurado e ativo
- [ ] SSL configurado (se necessário)
- [ ] Teste de funcionalidades básicas

## 🎉 Sistema Pronto!

O sistema está totalmente funcional e pronto para produção!
EOF

echo "📦 Criando arquivo compactado..."

# Criar arquivo tar.gz
tar -czf "${TEMP_DIR}.tar.gz" "$TEMP_DIR"

# Remover diretório temporário
rm -rf "$TEMP_DIR"

echo "✅ Pacote criado: ${TEMP_DIR}.tar.gz"
echo "📁 Tamanho: $(du -h "${TEMP_DIR}.tar.gz" | cut -f1)"
echo ""
echo "🚀 Para extrair: tar -xzf ${TEMP_DIR}.tar.gz"
echo "📖 Instruções completas em: ${TEMP_DIR}/INSTRUCOES_WEBMASTER_COMPLETAS.md"
