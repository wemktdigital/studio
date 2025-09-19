# 🛠️ Guia do Webmaster - Instalação Studio

## 📋 **Resumo Executivo**

**Aplicação**: Studio (Slack-like messaging app)  
**Tecnologia**: Next.js 15.3.3 + Supabase + TypeScript  
**Porta**: 9002 (interna) → 443/80 (externa)  
**Domínio**: Configurar conforme necessário  

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
# Editar .env.production com suas credenciais

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
```

## 🔧 **Configurações Essenciais**

### **1. Variáveis de Ambiente (.env.production)**
```bash
# OBRIGATÓRIO: Configurar com suas credenciais
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
NODE_ENV=production
PORT=9002
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

## 📞 **Suporte**

### **Documentação:**
- **README_INSTALACAO.md**: Guia completo de instalação
- **REQUISITOS_SERVIDOR.md**: Especificações técnicas detalhadas
- **env.production.example**: Exemplo de configuração

### **Comandos de Emergência:**
```bash
# Reiniciar tudo
pm2 restart all
sudo systemctl restart nginx

# Verificar status geral
pm2 status && sudo systemctl status nginx

# Logs em tempo real
pm2 logs studio-app --lines 0
```

## ✅ **Checklist de Instalação**

- [ ] Node.js 20.x instalado
- [ ] PM2 instalado e configurado
- [ ] Nginx instalado e configurado
- [ ] Certificado SSL válido
- [ ] Variáveis de ambiente configuradas
- [ ] Aplicação rodando na porta 9002
- [ ] Proxy reverso funcionando
- [ ] Firewall configurado
- [ ] Backup automático configurado
- [ ] Monitoramento funcionando

---

**🎯 Aplicação pronta para produção com alta disponibilidade!**
