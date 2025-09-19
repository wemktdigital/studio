# 📋 Requisitos para Instalação em Servidor Web

## 🖥️ **Especificações do Servidor**

### **Requisitos Mínimos:**
- **CPU**: 2 cores (2.0 GHz)
- **RAM**: 4GB
- **Armazenamento**: 20GB SSD
- **Sistema Operacional**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+

### **Requisitos Recomendados:**
- **CPU**: 4 cores (2.5 GHz+)
- **RAM**: 8GB+
- **Armazenamento**: 50GB+ SSD
- **Sistema Operacional**: Ubuntu 22.04 LTS

## 🔧 **Software Necessário**

### **1. Node.js**
```bash
# Instalar Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar versão
node --version  # Deve ser v20.x+
npm --version   # Deve ser v10.x+
```

### **2. PM2 (Process Manager)**
```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Configurar PM2 para inicializar com o sistema
pm2 startup
pm2 save
```

### **3. Nginx (Proxy Reverso)**
```bash
# Instalar Nginx
sudo apt update
sudo apt install nginx

# Habilitar e iniciar Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### **4. Git**
```bash
# Instalar Git
sudo apt install git
```

## 🌐 **Configuração de Domínio e SSL**

### **1. DNS**
- **A Record**: `seu-dominio.com` → IP do servidor
- **CNAME**: `www.seu-dominio.com` → `seu-dominio.com`

### **2. Certificado SSL (Let's Encrypt)**
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

## 📁 **Estrutura de Arquivos no Servidor**

```
/var/www/studio/
├── src/                    # Código fonte da aplicação
├── public/                 # Arquivos estáticos
├── .env.production         # Variáveis de ambiente de produção
├── package.json            # Dependências
├── next.config.ts          # Configuração Next.js
├── ecosystem.config.js     # Configuração PM2
├── nginx-studio.conf       # Configuração Nginx
└── deploy.sh              # Script de deploy
```

## ⚙️ **Variáveis de Ambiente de Produção**

Criar arquivo `.env.production`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ghmawrvdsghvvzliibzv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobWF3cnZkc2dodnZ6bGlpYnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMDc3NzEsImV4cCI6MjA3MDg4Mzc3MX0.fmar501flcc0cHnU6UOsWRsn7-daQ_cwDmQ1cqOmM6A
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobWF3cnZkc2dodnZ6bGlpYnp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTMwNzc3MSwiZXhwIjoyMDcwODgzNzcxfQ.siw4e-S2IlrFcyKoGryFM7AUHpFTqBrrVUehxj9c5cY

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key_here

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com

# Node Environment
NODE_ENV=production
PORT=9002
```

## 🔥 **Configuração PM2**

Arquivo `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'studio-app',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/studio',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 9002
    },
    error_file: '/var/log/pm2/studio-error.log',
    out_file: '/var/log/pm2/studio-out.log',
    log_file: '/var/log/pm2/studio.log',
    time: true
  }]
};
```

## 🌐 **Configuração Nginx**

Arquivo `/etc/nginx/sites-available/studio`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;

    # Proxy to Next.js
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

    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:9002;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Favicon
    location /favicon.ico {
        proxy_pass http://localhost:9002;
        add_header Cache-Control "public, max-age=86400";
    }
}
```

## 🚀 **Script de Deploy**

Arquivo `deploy.sh`:

```bash
#!/bin/bash

# Configurações
APP_DIR="/var/www/studio"
REPO_URL="https://github.com/seu-usuario/studio.git"
BRANCH="main"

echo "🚀 Iniciando deploy da aplicação Studio..."

# Parar aplicação
echo "⏹️ Parando aplicação..."
pm2 stop studio-app

# Backup do diretório atual
echo "💾 Criando backup..."
if [ -d "$APP_DIR" ]; then
    cp -r $APP_DIR $APP_DIR.backup.$(date +%Y%m%d_%H%M%S)
fi

# Clonar/Atualizar código
echo "📥 Atualizando código..."
if [ -d "$APP_DIR" ]; then
    cd $APP_DIR
    git pull origin $BRANCH
else
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci --production

# Build da aplicação
echo "🔨 Fazendo build da aplicação..."
npm run build

# Configurar permissões
echo "🔐 Configurando permissões..."
sudo chown -R www-data:www-data $APP_DIR
sudo chmod -R 755 $APP_DIR

# Iniciar aplicação
echo "▶️ Iniciando aplicação..."
pm2 start ecosystem.config.js

# Verificar status
echo "✅ Verificando status..."
pm2 status
pm2 logs studio-app --lines 10

echo "🎉 Deploy concluído com sucesso!"
echo "🌐 Aplicação disponível em: https://seu-dominio.com"
```

## 🔧 **Comandos de Instalação Completa**

```bash
# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar PM2
sudo npm install -g pm2

# 4. Instalar Nginx
sudo apt install nginx -y

# 5. Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# 6. Configurar Nginx
sudo cp nginx-studio.conf /etc/nginx/sites-available/studio
sudo ln -s /etc/nginx/sites-available/studio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 7. Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# 8. Configurar PM2
pm2 startup
pm2 save

# 9. Executar deploy
chmod +x deploy.sh
./deploy.sh
```

## 📊 **Monitoramento e Logs**

### **Verificar Status da Aplicação:**
```bash
# Status PM2
pm2 status

# Logs em tempo real
pm2 logs studio-app

# Monitoramento
pm2 monit
```

### **Verificar Nginx:**
```bash
# Status Nginx
sudo systemctl status nginx

# Testar configuração
sudo nginx -t

# Reload configuração
sudo systemctl reload nginx
```

### **Logs do Sistema:**
```bash
# Logs PM2
tail -f /var/log/pm2/studio.log

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs do sistema
sudo journalctl -u nginx -f
```

## 🔒 **Segurança**

### **Firewall (UFW):**
```bash
# Configurar firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### **Atualizações Automáticas:**
```bash
# Instalar unattended-upgrades
sudo apt install unattended-upgrades -y

# Configurar atualizações automáticas
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 📈 **Backup e Manutenção**

### **Backup Automático:**
```bash
# Criar script de backup
sudo crontab -e

# Adicionar linha para backup diário às 2h
0 2 * * * /var/www/studio/backup.sh
```

### **Limpeza de Logs:**
```bash
# Script de limpeza de logs
sudo logrotate -f /etc/logrotate.conf
```

## 🆘 **Solução de Problemas**

### **Aplicação não inicia:**
```bash
# Verificar logs
pm2 logs studio-app

# Verificar porta
sudo netstat -tlnp | grep :9002

# Reiniciar aplicação
pm2 restart studio-app
```

### **Nginx não funciona:**
```bash
# Testar configuração
sudo nginx -t

# Verificar status
sudo systemctl status nginx

# Reload configuração
sudo systemctl reload nginx
```

### **SSL não funciona:**
```bash
# Renovar certificado
sudo certbot renew --dry-run

# Verificar certificado
sudo certbot certificates
```

## 📞 **Contato para Suporte**

- **Documentação**: README_INSTALACAO.md
- **Scripts**: deploy.sh, ecosystem.config.js
- **Configurações**: nginx-studio.conf, .env.production

---

**✅ Aplicação pronta para produção com alta disponibilidade e segurança!**
