# 📚 Guia Rápido de Instalação - Studio

Este é um guia resumido para instalar rapidamente a aplicação Studio em um servidor.

## 🚀 Instalação Rápida (5 minutos)

### 1. Pré-requisitos
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y curl git nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

### 2. Deploy da Aplicação
```bash
# Clonar repositório
git clone https://github.com/seu-usuario/studio.git
cd studio

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.production.example .env.production
nano .env.production  # Editar com suas configurações

# Deploy automático
./deploy.sh
```

### 3. Configurar Nginx
```bash
# Copiar configuração
sudo cp nginx-studio.conf /etc/nginx/sites-available/studio
sudo ln -s /etc/nginx/sites-available/studio /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Testar e reiniciar
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL com Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

## 📋 Checklist de Instalação

- [ ] Node.js 20+ instalado
- [ ] PM2 instalado globalmente
- [ ] Nginx instalado e configurado
- [ ] Repositório clonado
- [ ] Variáveis de ambiente configuradas
- [ ] Build da aplicação executado
- [ ] PM2 configurado e rodando
- [ ] Nginx configurado e funcionando
- [ ] SSL configurado
- [ ] Domínio apontando para o servidor

## 🔧 Comandos Úteis

```bash
# Gerenciar aplicação
pm2 status
pm2 logs studio
pm2 restart studio
pm2 stop studio

# Gerenciar Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx

# Ver logs
sudo tail -f /var/log/nginx/studio_error.log
pm2 logs studio --lines 50
```

## 📖 Documentação Completa

Para instruções detalhadas, consulte o arquivo `INSTALACAO_SERVIDOR.md`.

## 🆘 Suporte

Em caso de problemas:
1. Verifique os logs: `pm2 logs studio`
2. Verifique status: `pm2 status`
3. Teste Nginx: `sudo nginx -t`
4. Consulte a documentação completa

---

**⚡ Dica**: Use o script `deploy.sh` para automatizar futuros deploys!
