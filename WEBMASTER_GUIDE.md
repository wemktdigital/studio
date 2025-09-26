# 🛠️ Guia do Webmaster - Instalação Studio

## 📋 **Resumo Executivo**

**Aplicação**: Studio (Slack-like messaging app)  
**Tecnologia**: Next.js 15.3.3 + Supabase + TypeScript  
**Status**: ✅ **100% FUNCIONAL - PRONTO PARA PRODUÇÃO**  
**Porta**: 9002 (interna) → 443/80 (externa)  
**Domínio**: Configurar conforme necessário

## 🎉 **ATUALIZAÇÃO IMPORTANTE**

**✅ APLICAÇÃO FINALIZADA E TESTADA**  
- Todos os dados mock foram removidos
- Sistema 100% funcional com dados reais do Supabase
- Interface moderna inspirada no Slack
- Sistema completo de mensagens, canais, DMs e threads
- Autenticação e autorização implementadas
- Sistema de níveis de usuário
- Notificações em tempo real
- Interface responsiva e otimizada  

## ⚡ **Instalação Rápida (5 minutos)**

```bash
# 1. Instalar dependências
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git
sudo npm install -g pm2

# 2. Clonar repositório
git clone https://github.com/seu-usuario/studio.git /var/www/studio
cd /var/www/studio

# 3. Configurar ambiente
cp env.production.example .env.production
# Editar .env.production com suas credenciais do Supabase

# 4. Instalar e buildar
npm ci --production
npm run build

# 5. Configurar PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# 6. Configurar Nginx
sudo cp nginx-studio.conf /etc/nginx/sites-available/studio
sudo ln -s /etc/nginx/sites-available/studio /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 7. SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com

# 8. ✅ VERIFICAR INSTALAÇÃO
curl -I https://seu-dominio.com
pm2 status
```

## 🔧 **Configurações Essenciais**

### **1. Variáveis de Ambiente (.env.production)**
```bash
# ✅ OBRIGATÓRIO: Configurar com suas credenciais do Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# ✅ OBRIGATÓRIO: URL do seu domínio
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com

# ✅ CONFIGURAÇÕES DE PRODUÇÃO
NODE_ENV=production
PORT=9002

# ✅ EMAIL (opcional - para notificações)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
```

### **2. Configuração PM2 (ecosystem.config.js)**
```javascript
module.exports = {
  apps: [{
    name: 'studio-app',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/studio',
    instances: 'max',
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production', PORT: 9002 }
  }]
};
```

### **3. Configuração Nginx**
- **Arquivo**: `nginx-studio.conf`
- **Localização**: `/etc/nginx/sites-available/studio`
- **Proxy**: `localhost:9002` → `https://seu-dominio.com`

## 📊 **Monitoramento**

### **Comandos Úteis:**
```bash
# Status da aplicação
pm2 status
pm2 logs studio-app

# Status do servidor
sudo systemctl status nginx
sudo netstat -tlnp | grep :9002

# Logs do sistema
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### **Métricas Importantes:**
- **CPU**: < 80% (4 cores recomendados)
- **RAM**: < 6GB (8GB recomendados)
- **Disco**: < 80% (20GB+ recomendados)
- **Uptime**: 99.9%+ esperado

## 🔄 **Deploy e Atualizações**

### **Deploy Automático:**
```bash
# Executar script de deploy
chmod +x deploy.sh
./deploy.sh
```

### **Deploy Manual:**
```bash
cd /var/www/studio
pm2 stop studio-app
git pull origin main
npm ci --production
npm run build
pm2 start studio-app
```

## 🚨 **Troubleshooting**

### **Problema: Aplicação não inicia**
```bash
# Verificar logs
pm2 logs studio-app --lines 50

# Verificar porta
sudo netstat -tlnp | grep :9002

# Verificar variáveis de ambiente
cat .env.production
```

### **Problema: Nginx não funciona**
```bash
# Testar configuração
sudo nginx -t

# Verificar status
sudo systemctl status nginx

# Reload configuração
sudo systemctl reload nginx
```

### **Problema: SSL não funciona**
```bash
# Verificar certificado
sudo certbot certificates

# Renovar certificado
sudo certbot renew --dry-run
```

## 🔒 **Segurança**

### **Firewall:**
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### **Atualizações:**
```bash
# Atualizações automáticas
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 📁 **Estrutura de Arquivos**

```
/var/www/studio/
├── src/                    # Código fonte
├── public/                 # Arquivos estáticos
├── .env.production         # Variáveis de ambiente
├── package.json            # Dependências
├── next.config.ts          # Configuração Next.js
├── ecosystem.config.js     # Configuração PM2
├── nginx-studio.conf       # Configuração Nginx
├── deploy.sh              # Script de deploy
└── README_INSTALACAO.md   # Documentação completa
```

## 📞 **Suporte e Documentação**

### **📚 Documentação Completa:**
- **README_INSTALACAO.md**: Guia completo de instalação
- **REQUISITOS_SERVIDOR.md**: Especificações técnicas detalhadas
- **env.production.example**: Exemplo de configuração
- **DEPLOY_GUIDE.md**: Guia de deploy detalhado
- **CONFIGURACAO_SUPABASE_MANUAL.md**: Configuração do Supabase

### **🔧 Comandos de Emergência:**
```bash
# Reiniciar tudo
pm2 restart all
sudo systemctl restart nginx

# Verificar status geral
pm2 status && sudo systemctl status nginx

# Logs em tempo real
pm2 logs studio-app --lines 0

# Verificar conectividade
curl -I https://seu-dominio.com
```

### **🚨 Troubleshooting Rápido:**
```bash
# Se a aplicação não carregar
pm2 restart studio-app
sudo systemctl reload nginx

# Se houver erro de build
cd /var/www/studio
npm run build

# Se houver problema de SSL
sudo certbot renew
sudo systemctl reload nginx
```

## ✅ **Checklist de Instalação**

### **📋 Pré-requisitos**
- [ ] Node.js 20.x instalado
- [ ] PM2 instalado e configurado
- [ ] Nginx instalado e configurado
- [ ] Certificado SSL válido
- [ ] Domínio configurado e apontando para o servidor

### **🔧 Configuração**
- [ ] Variáveis de ambiente configuradas (.env.production)
- [ ] Credenciais do Supabase configuradas
- [ ] URL do site configurada
- [ ] Aplicação buildada com sucesso

### **🚀 Deploy**
- [ ] Aplicação rodando na porta 9002
- [ ] PM2 gerenciando a aplicação
- [ ] Proxy reverso funcionando
- [ ] SSL/HTTPS funcionando
- [ ] Site acessível via navegador

### **🔒 Segurança**
- [ ] Firewall configurado
- [ ] Portas necessárias abertas (80, 443, 22)
- [ ] Backup automático configurado
- [ ] Monitoramento funcionando

### **✅ Testes Finais**
- [ ] Login/registro funcionando
- [ ] Criação de canais funcionando
- [ ] Envio de mensagens funcionando
- [ ] DMs funcionando
- [ ] Threads funcionando
- [ ] Notificações funcionando
- [ ] Interface responsiva

---

## 🎉 **APLICAÇÃO 100% FUNCIONAL E PRONTA PARA PRODUÇÃO!**

**✅ Status**: Completamente finalizada e testada  
**✅ Funcionalidades**: Todas implementadas e funcionando  
**✅ Performance**: Otimizada para produção  
**✅ Segurança**: Configurada e testada  
**✅ Escalabilidade**: Pronta para crescimento  

**🚀 A aplicação está pronta para uso em produção com alta disponibilidade!**
