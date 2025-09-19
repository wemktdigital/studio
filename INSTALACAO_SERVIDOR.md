# 🚀 Guia de Instalação - Studio no Servidor

Este guia fornece instruções completas para instalar e configurar a aplicação Studio em um servidor de produção.

## 📋 Pré-requisitos

### Sistema Operacional
- **Ubuntu 20.04+** (recomendado)
- **CentOS 8+**
- **Debian 11+**
- **macOS** (para desenvolvimento)

### Software Necessário
- **Node.js 18.17+** ou **Node.js 20+**
- **npm 9+** ou **yarn 1.22+**
- **Git 2.30+**
- **PM2** (para gerenciamento de processos)
- **Nginx** (como proxy reverso)
- **Certificado SSL** (Let's Encrypt recomendado)

### Serviços Externos
- **Conta no Supabase** (banco de dados)
- **Domínio configurado** (opcional, mas recomendado)

## 🔧 Instalação Passo a Passo

### 1. Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
sudo apt install -y curl wget git build-essential

# Instalar Node.js 20 (versão LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalações
node --version  # Deve retornar v20.x.x
npm --version   # Deve retornar 10.x.x
git --version
```

### 2. Instalação do PM2

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Configurar PM2 para inicializar com o sistema
pm2 startup
# Execute o comando que será exibido

# Salvar configuração atual do PM2
pm2 save
```

### 3. Clonagem e Configuração da Aplicação

```bash
# Criar diretório para aplicações
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www

# Clonar repositório
cd /var/www
git clone https://github.com/seu-usuario/studio.git
cd studio

# Instalar dependências
npm install

# Instalar dependências de produção
npm ci --only=production
```

### 4. Configuração das Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp env.example .env.production

# Editar arquivo de produção
nano .env.production
```

**Conteúdo do `.env.production`:**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui

# Email Service (Resend)
RESEND_API_KEY=re_sua-chave-resend-aqui

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://seudominio.com
NODE_ENV=production

# Database (se usando PostgreSQL local)
DATABASE_URL=postgresql://usuario:senha@localhost:5432/studio_db

# Redis (opcional, para cache)
REDIS_URL=redis://localhost:6379

# Logs
LOG_LEVEL=info
```

### 5. Configuração do Supabase

#### 5.1 Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Configure:
   - **Nome**: Studio Production
   - **Database Password**: Senha forte
   - **Region**: Escolha a mais próxima do seu servidor

#### 5.2 Configurar Schema do Banco
```bash
# Executar migrations (se houver)
npm run db:migrate

# Ou executar SQL manualmente no dashboard do Supabase
```

#### 5.3 Configurar RLS (Row Level Security)
No dashboard do Supabase, execute as políticas RLS necessárias para segurança.

### 6. Build da Aplicação

```bash
# Fazer build da aplicação
npm run build

# Verificar se o build foi bem-sucedido
ls -la .next/
```

### 7. Configuração do PM2

```bash
# Criar arquivo de configuração do PM2
nano ecosystem.config.js
```

**Conteúdo do `ecosystem.config.js`:**

```javascript
module.exports = {
  apps: [
    {
      name: 'studio',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/studio',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/studio-error.log',
      out_file: '/var/log/pm2/studio-out.log',
      log_file: '/var/log/pm2/studio-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ]
};
```

```bash
# Iniciar aplicação com PM2
pm2 start ecosystem.config.js --env production

# Verificar status
pm2 status
pm2 logs studio
```

### 8. Configuração do Nginx

```bash
# Instalar Nginx
sudo apt install -y nginx

# Criar configuração do site
sudo nano /etc/nginx/sites-available/studio
```

**Conteúdo da configuração do Nginx:**

```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seudominio.com www.seudominio.com;

    # Certificados SSL (serão configurados com Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Configurações de segurança
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    location / {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Cache para assets estáticos
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }

    # Rate limiting para login
    location /auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Logs
    access_log /var/log/nginx/studio_access.log;
    error_log /var/log/nginx/studio_error.log;
}
```

```bash
# Habilitar site
sudo ln -s /etc/nginx/sites-available/studio /etc/nginx/sites-enabled/

# Remover site padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 9. Configuração do SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seudominio.com -d www.seudominio.com

# Configurar renovação automática
sudo crontab -e
# Adicionar linha:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 10. Configuração de Firewall

```bash
# Configurar UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Verificar status
sudo ufw status
```

### 11. Monitoramento e Logs

```bash
# Criar diretórios de log
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Configurar logrotate para logs do PM2
sudo nano /etc/logrotate.d/pm2
```

**Conteúdo do logrotate:**

```
/var/log/pm2/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 12. Scripts de Deploy

```bash
# Criar script de deploy
nano deploy.sh
```

**Conteúdo do `deploy.sh`:**

```bash
#!/bin/bash

set -e

echo "🚀 Iniciando deploy do Studio..."

# Parar aplicação
pm2 stop studio

# Fazer backup do banco (se necessário)
echo "📦 Fazendo backup..."

# Atualizar código
git pull origin main

# Instalar dependências
npm ci --only=production

# Fazer build
npm run build

# Executar migrations (se houver)
# npm run db:migrate

# Reiniciar aplicação
pm2 start studio

# Verificar status
pm2 status

echo "✅ Deploy concluído com sucesso!"
```

```bash
# Tornar script executável
chmod +x deploy.sh
```

## 🔍 Verificação da Instalação

### 1. Testes Básicos

```bash
# Verificar se aplicação está rodando
curl -I http://localhost:3000

# Verificar logs
pm2 logs studio

# Verificar status do Nginx
sudo systemctl status nginx

# Verificar certificado SSL
sudo certbot certificates
```

### 2. Testes de Funcionalidade

1. **Acesse seu domínio** no navegador
2. **Teste criação de conta**
3. **Teste login**
4. **Teste criação de workspace**
5. **Teste envio de mensagens**

## 🛠️ Comandos Úteis

### Gerenciamento da Aplicação

```bash
# Reiniciar aplicação
pm2 restart studio

# Parar aplicação
pm2 stop studio

# Ver logs em tempo real
pm2 logs studio --lines 100

# Verificar uso de recursos
pm2 monit

# Recarregar aplicação (zero downtime)
pm2 reload studio
```

### Gerenciamento do Sistema

```bash
# Verificar uso de disco
df -h

# Verificar uso de memória
free -h

# Verificar processos Node.js
ps aux | grep node

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/studio_error.log
```

### Backup e Restore

```bash
# Backup do código
tar -czf studio-backup-$(date +%Y%m%d).tar.gz /var/www/studio

# Backup do banco (via Supabase)
# Use o dashboard do Supabase para exportar dados

# Restore (se necessário)
tar -xzf studio-backup-YYYYMMDD.tar.gz -C /
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Aplicação não inicia
```bash
# Verificar logs
pm2 logs studio

# Verificar se porta está em uso
sudo netstat -tlnp | grep :3000

# Verificar permissões
ls -la /var/www/studio
```

#### 2. Erro 502 Bad Gateway
```bash
# Verificar se aplicação está rodando
pm2 status

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/studio_error.log

# Reiniciar Nginx
sudo systemctl restart nginx
```

#### 3. Problemas de SSL
```bash
# Verificar certificado
sudo certbot certificates

# Renovar certificado
sudo certbot renew

# Testar configuração SSL
sudo nginx -t
```

#### 4. Problemas de Memória
```bash
# Verificar uso de memória
free -h
pm2 monit

# Aumentar limite de memória no ecosystem.config.js
# max_memory_restart: '2G'
```

## 📊 Monitoramento Avançado

### 1. Configurar PM2 Plus (Opcional)

```bash
# Conectar ao PM2 Plus
pm2 link <secret_key> <public_key>
```

### 2. Configurar Alertas

```bash
# Instalar dependências para alertas
npm install -g pm2-logrotate

# Configurar rotação de logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## 🔒 Segurança Adicional

### 1. Configurar Fail2Ban

```bash
# Instalar Fail2Ban
sudo apt install -y fail2ban

# Configurar
sudo nano /etc/fail2ban/jail.local
```

### 2. Configurar Backup Automático

```bash
# Criar script de backup
nano backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backups/studio-$DATE.tar.gz /var/www/studio
find /backups -name "studio-*.tar.gz" -mtime +7 -delete
```

## 📈 Otimizações de Performance

### 1. Otimizar Node.js

```bash
# Configurar no ecosystem.config.js
node_args: '--max-old-space-size=2048 --optimize-for-size'
```

### 2. Configurar Cache do Nginx

```nginx
# Adicionar no nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
```

## 🎯 Conclusão

Seguindo este guia, você terá uma instalação completa e segura da aplicação Studio em seu servidor. A aplicação estará configurada com:

- ✅ **SSL/TLS** para segurança
- ✅ **Proxy reverso** com Nginx
- ✅ **Gerenciamento de processos** com PM2
- ✅ **Monitoramento** e logs
- ✅ **Backup** automático
- ✅ **Otimizações** de performance

Para suporte adicional, consulte os logs da aplicação e do sistema, ou entre em contato com a equipe de desenvolvimento.

---

**📝 Nota**: Este guia assume um servidor Ubuntu/Debian. Para outros sistemas operacionais, adapte os comandos conforme necessário.
