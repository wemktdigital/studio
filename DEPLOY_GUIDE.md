# 🚀 Guia Completo de Deploy - Studio

## 📋 Checklist Pré-Deploy

### ✅ **Verificações Concluídas**
- [x] Build de produção funcionando (`npm run build`)
- [x] Modo desenvolvimento removido da landing page
- [x] Console.log de debug removidos
- [x] Componentes de debug desativados
- [x] Configurações do Next.js otimizadas
- [x] Erros de sintaxe corrigidos
- [x] Suspense boundary adicionado para `useSearchParams`

### ⚠️ **Warnings Conhecidos (Não Críticos)**
- Warnings do Genkit/OpenTelemetry (funcionalidades de IA ainda em desenvolvimento)
- Handlebars warnings (dependências internas do Genkit)

---

## 🛠️ **Configuração do Servidor**

### **1. Requisitos do Servidor**
```bash
# Node.js 18+ (recomendado: Node.js 20)
node --version

# npm ou yarn
npm --version

# Git
git --version
```

### **2. Instalação das Dependências**
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/studio.git
cd studio

# Instale as dependências
npm install

# Ou com yarn
yarn install
```

---

## 🔧 **Configuração de Ambiente**

### **1. Arquivo de Ambiente de Produção**
Crie o arquivo `.env.production` com as seguintes variáveis:

```bash
# ========================================
# CONFIGURAÇÃO DE PRODUÇÃO - STUDIO APP
# ========================================

# Supabase Configuration (OBRIGATÓRIO)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sua-chave-publica-aqui
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sua-chave-service-role-aqui

# Email Service (OPCIONAL - para funcionalidades de email)
RESEND_API_KEY=re_sua-chave-resend-aqui

# Site Configuration (OBRIGATÓRIO)
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com

# Node Environment (OBRIGATÓRIO)
NODE_ENV=production
PORT=9002
```

### **2. Configuração do Supabase**

#### **Passo 1: Criar Projeto no Supabase**
1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Escolha organização e nome do projeto
5. Defina senha do banco de dados
6. Escolha região (recomendado: mais próxima dos usuários)

#### **Passo 2: Obter Chaves de API**
1. No dashboard do Supabase, vá em **Settings > API**
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

#### **Passo 3: Executar Schema do Banco**
1. No dashboard do Supabase, vá em **SQL Editor**
2. Execute o conteúdo do arquivo `supabase-schema.sql`
3. Verifique se todas as tabelas foram criadas em **Table Editor**

---

## 🚀 **Processo de Deploy**

### **Opção 1: Deploy Manual**

#### **1. Build de Produção**
```bash
# Fazer build
npm run build

# Testar localmente
npm start
```

#### **2. Configurar Servidor Web (Nginx)**
```nginx
# /etc/nginx/sites-available/studio
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:9002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### **3. Configurar SSL (Certbot)**
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

#### **4. Configurar PM2 (Process Manager)**
```bash
# Instalar PM2
npm install -g pm2

# Usar o arquivo ecosystem.config.js já configurado
pm2 start ecosystem.config.js --env production

# Salvar configuração
pm2 save
pm2 startup
```

### **Opção 2: Deploy com Docker**

#### **1. Criar Dockerfile**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 9002

CMD ["npm", "start"]
```

#### **2. Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'
services:
  studio:
    build: .
    ports:
      - "9002:9002"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped
```

---

## 🔍 **Verificações Pós-Deploy**

### **1. Testes Funcionais**
- [ ] Landing page carrega corretamente
- [ ] Registro de usuário funciona
- [ ] Login funciona
- [ ] Criação de workspace funciona
- [ ] Criação de canais funciona
- [ ] Envio de mensagens funciona
- [ ] Notificações funcionam

### **2. Verificações Técnicas**
```bash
# Verificar se a aplicação está rodando
curl -I http://localhost:9002

# Verificar logs
pm2 logs studio

# Verificar status
pm2 status
```

### **3. Monitoramento**
- [ ] Configurar monitoramento de uptime
- [ ] Configurar logs de erro
- [ ] Configurar backup do banco de dados
- [ ] Configurar alertas de performance

---

## 🛡️ **Segurança**

### **1. Configurações de Segurança**
- [ ] HTTPS configurado e funcionando
- [ ] Headers de segurança configurados
- [ ] Rate limiting implementado
- [ ] Firewall configurado
- [ ] Backup automático configurado

### **2. Variáveis Sensíveis**
- [ ] Nunca commitar arquivos `.env*`
- [ ] Usar variáveis de ambiente no servidor
- [ ] Rotacionar chaves periodicamente
- [ ] Monitorar acesso às APIs

---

## 📊 **Monitoramento e Manutenção**

### **1. Logs Importantes**
```bash
# Logs da aplicação
pm2 logs studio

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs do sistema
sudo journalctl -u nginx -f
```

### **2. Comandos Úteis**
```bash
# Reiniciar aplicação
pm2 restart studio

# Atualizar aplicação
git pull
npm install
npm run build
pm2 restart studio

# Verificar uso de recursos
pm2 monit
htop
```

---

## 🆘 **Solução de Problemas**

### **Problemas Comuns**

#### **1. Aplicação não inicia**
```bash
# Verificar logs
pm2 logs studio

# Verificar se a porta está em uso
sudo netstat -tlnp | grep :9002

# Verificar variáveis de ambiente
pm2 env studio
```

#### **2. Erro de conexão com Supabase**
- Verificar se as chaves estão corretas
- Verificar se o projeto Supabase está ativo
- Verificar conectividade de rede

#### **3. Problemas de SSL**
```bash
# Renovar certificado
sudo certbot renew

# Verificar status
sudo certbot certificates
```

---

## 📞 **Suporte**

### **Contatos**
- **Desenvolvedor**: [seu-email@exemplo.com]
- **Documentação**: [link-para-docs]
- **Issues**: [link-para-github-issues]

### **Recursos Úteis**
- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação PM2](https://pm2.keymetrics.io/docs/)

---

## ✅ **Checklist Final**

- [ ] Servidor configurado e funcionando
- [ ] Domínio apontando para o servidor
- [ ] SSL configurado e funcionando
- [ ] Supabase configurado e conectado
- [ ] Aplicação rodando com PM2
- [ ] Monitoramento configurado
- [ ] Backup configurado
- [ ] Testes funcionais realizados
- [ ] Documentação atualizada

**🎉 Deploy concluído com sucesso!**
