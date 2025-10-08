# 🔒 Configuração HTTPS com Nginx e Certbot

## 📋 Pré-requisitos

- ✅ Nginx instalado
- ✅ Certbot instalado
- ✅ Domínio apontando para o servidor
- ✅ Aplicação rodando na porta 9002

---

## 🚀 Instalação Rápida (5 minutos)

### **1️⃣ Instalar Certbot (se ainda não tiver)**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### **2️⃣ Configurar Nginx**

```bash
# Copiar arquivo de configuração
sudo cp nginx-studio.conf /etc/nginx/sites-available/studio

# IMPORTANTE: Editar o arquivo e trocar o domínio
sudo nano /etc/nginx/sites-available/studio

# Procure por "talk.we.marketing" e substitua pelo SEU domínio
# Exemplo: seu-dominio.com
```

**⚠️ IMPORTANTE:** No arquivo `/etc/nginx/sites-available/studio`, substitua:
- `talk.we.marketing` → `seu-dominio.com`
- `www.talk.we.marketing` → `www.seu-dominio.com`

### **3️⃣ Ativar configuração**

```bash
# Criar link simbólico
sudo ln -sf /etc/nginx/sites-available/studio /etc/nginx/sites-enabled/

# Remover configuração padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t
```

### **4️⃣ Obter Certificado SSL**

```bash
# Obter certificado para seu domínio
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Seguir as instruções:
# 1. Informar email
# 2. Aceitar termos
# 3. Escolher opção 2 (redirect HTTP to HTTPS)
```

### **5️⃣ Reload Nginx**

```bash
# Recarregar Nginx
sudo systemctl reload nginx

# Verificar status
sudo systemctl status nginx
```

### **6️⃣ Testar HTTPS**

```bash
# Testar SSL
curl -I https://seu-dominio.com

# Deve retornar: HTTP/2 200
```

---

## 📝 Script Automatizado

Crie um arquivo `setup-https.sh`:

```bash
#!/bin/bash

# 🔒 Script de Configuração HTTPS - Studio
# Configure as variáveis abaixo

# ⚠️ CONFIGURE SEU DOMÍNIO AQUI
DOMAIN="seu-dominio.com"
WWW_DOMAIN="www.seu-dominio.com"
EMAIL="seu-email@exemplo.com"

echo "🔒 Configurando HTTPS para $DOMAIN..."

# 1. Instalar Certbot (se não estiver instalado)
if ! command -v certbot &> /dev/null; then
    echo "📦 Instalando Certbot..."
    sudo apt update
    sudo apt install certbot python3-certbot-nginx -y
fi

# 2. Criar backup da configuração atual
if [ -f "/etc/nginx/sites-available/studio" ]; then
    echo "💾 Criando backup da configuração atual..."
    sudo cp /etc/nginx/sites-available/studio /etc/nginx/sites-available/studio.backup.$(date +%Y%m%d_%H%M%S)
fi

# 3. Copiar configuração do Nginx
echo "📋 Configurando Nginx..."
sudo cp nginx-studio.conf /etc/nginx/sites-available/studio

# 4. Substituir domínio no arquivo
echo "✏️  Atualizando domínio na configuração..."
sudo sed -i "s/talk.we.marketing/$DOMAIN/g" /etc/nginx/sites-available/studio

# 5. Criar link simbólico
echo "🔗 Ativando configuração..."
sudo ln -sf /etc/nginx/sites-available/studio /etc/nginx/sites-enabled/

# 6. Remover configuração padrão
sudo rm -f /etc/nginx/sites-enabled/default

# 7. Testar configuração do Nginx
echo "🧪 Testando configuração do Nginx..."
if sudo nginx -t; then
    echo "✅ Configuração do Nginx OK"
else
    echo "❌ Erro na configuração do Nginx"
    exit 1
fi

# 8. Reload Nginx
echo "🔄 Recarregando Nginx..."
sudo systemctl reload nginx

# 9. Obter certificado SSL
echo "🔒 Obtendo certificado SSL..."
echo "⚠️  Siga as instruções do Certbot:"
sudo certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --email $EMAIL --agree-tos --no-eff-email

# 10. Verificar renovação automática
echo "🔄 Configurando renovação automática..."
sudo certbot renew --dry-run

# 11. Verificar status final
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ HTTPS Configurado com Sucesso!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🌐 Site disponível em:"
echo "   https://$DOMAIN"
echo "   https://$WWW_DOMAIN"
echo ""
echo "📋 Próximos passos:"
echo "   1. Testar: curl -I https://$DOMAIN"
echo "   2. Acessar no navegador: https://$DOMAIN"
echo "   3. Verificar SSL: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""
echo "🔄 Renovação automática configurada"
echo "   O certificado será renovado automaticamente antes de expirar"
echo ""
```

**Para usar o script:**

```bash
# 1. Editar o script e configurar seu domínio
nano setup-https.sh

# 2. Dar permissão de execução
chmod +x setup-https.sh

# 3. Executar
sudo ./setup-https.sh
```

---

## 🔧 Configuração Manual Detalhada

### **Passo 1: Preparar Configuração do Nginx**

```bash
# 1. Copiar arquivo
sudo cp nginx-studio.conf /etc/nginx/sites-available/studio

# 2. Editar e substituir domínio
sudo nano /etc/nginx/sites-available/studio
```

**Substituir em todas as ocorrências:**
- `talk.we.marketing` → `seu-dominio.com`
- `www.talk.we.marketing` → `www.seu-dominio.com`

### **Passo 2: Configuração Inicial sem SSL**

Para evitar erros, primeiro configure sem SSL:

```bash
# Criar configuração temporária sem SSL
sudo tee /etc/nginx/sites-available/studio-temp << 'EOF'
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
EOF

# Ativar configuração temporária
sudo ln -sf /etc/nginx/sites-available/studio-temp /etc/nginx/sites-enabled/studio
sudo nginx -t && sudo systemctl reload nginx
```

### **Passo 3: Obter Certificado SSL**

```bash
# Obter certificado (o Certbot configurará automaticamente)
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### **Passo 4: Aplicar Configuração Completa**

```bash
# Remover configuração temporária
sudo rm /etc/nginx/sites-enabled/studio

# Ativar configuração completa (já editada com seu domínio)
sudo ln -sf /etc/nginx/sites-available/studio /etc/nginx/sites-enabled/

# Testar e reload
sudo nginx -t && sudo systemctl reload nginx
```

---

## ✅ Verificação

### **1. Testar HTTP → HTTPS Redirect**

```bash
curl -I http://seu-dominio.com
# Deve retornar: HTTP/1.1 301 Moved Permanently
# Location: https://seu-dominio.com/
```

### **2. Testar HTTPS**

```bash
curl -I https://seu-dominio.com
# Deve retornar: HTTP/2 200
```

### **3. Testar no Navegador**

Abra: `https://seu-dominio.com`

Deve mostrar:
- ✅ Cadeado verde/seguro
- ✅ "Conexão segura"
- ✅ Certificado válido

### **4. Verificar SSL Grade**

Teste em: https://www.ssllabs.com/ssltest/analyze.html?d=seu-dominio.com

**Resultado esperado: A ou A+**

---

## 🔄 Renovação Automática

O Certbot configura renovação automática. Para verificar:

```bash
# Testar renovação
sudo certbot renew --dry-run

# Ver timer de renovação automática
sudo systemctl status certbot.timer

# Ver quando os certificados expiram
sudo certbot certificates
```

**Certificados Let's Encrypt são válidos por 90 dias e renovados automaticamente a cada 60 dias.**

---

## 🛠️ Comandos Úteis

```bash
# Ver certificados instalados
sudo certbot certificates

# Renovar certificados manualmente
sudo certbot renew

# Revogar certificado
sudo certbot revoke --cert-path /etc/letsencrypt/live/seu-dominio.com/cert.pem

# Testar configuração Nginx
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Ver logs Nginx
sudo tail -f /var/log/nginx/studio_access.log
sudo tail -f /var/log/nginx/studio_error.log

# Ver logs Certbot
sudo journalctl -u certbot
```

---

## 🚨 Solução de Problemas

### **Problema: "Connection refused"**

```bash
# Verificar se aplicação está rodando
pm2 status

# Verificar se porta 9002 está aberta
sudo netstat -tlnp | grep :9002

# Verificar logs da aplicação
pm2 logs studio-app
```

### **Problema: "502 Bad Gateway"**

```bash
# Aplicação não está respondendo
pm2 restart studio-app

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/studio_error.log
```

### **Problema: Certbot falha**

```bash
# Verificar se porta 80 está aberta
sudo ufw allow 80
sudo ufw allow 443

# Verificar DNS
dig seu-dominio.com +short
# Deve retornar o IP do servidor

# Testar Certbot standalone
sudo certbot certonly --standalone -d seu-dominio.com
```

### **Problema: Certificado não renova automaticamente**

```bash
# Verificar timer
sudo systemctl status certbot.timer

# Habilitar timer
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Testar renovação
sudo certbot renew --dry-run
```

---

## 📊 Checklist Final

- [ ] ✅ Certbot instalado
- [ ] ✅ Arquivo nginx-studio.conf copiado para `/etc/nginx/sites-available/studio`
- [ ] ✅ Domínio substituído no arquivo de configuração
- [ ] ✅ Link simbólico criado em `/etc/nginx/sites-enabled/`
- [ ] ✅ Certificado SSL obtido via Certbot
- [ ] ✅ Nginx reload executado
- [ ] ✅ HTTP redireciona para HTTPS
- [ ] ✅ HTTPS funcionando (status 200)
- [ ] ✅ Certificado válido no navegador
- [ ] ✅ SSL Grade A/A+
- [ ] ✅ Renovação automática configurada

---

## 🎯 Resultado Esperado

Após configuração completa:

```bash
$ curl -I https://seu-dominio.com
HTTP/2 200 
server: nginx
content-type: text/html; charset=utf-8
strict-transport-security: max-age=31536000; includeSubDomains
x-frame-options: DENY
x-content-type-options: nosniff
x-xss-protection: 1; mode=block
```

**🎉 Site seguro e funcionando com HTTPS!**

---

## 📞 Suporte

Se tiver problemas:

1. Verificar logs: `sudo tail -f /var/log/nginx/studio_error.log`
2. Verificar aplicação: `pm2 logs studio-app`
3. Testar Nginx: `sudo nginx -t`
4. Verificar DNS: `dig seu-dominio.com`
5. Verificar firewall: `sudo ufw status`

**Tempo estimado de configuração: 5-10 minutos**

