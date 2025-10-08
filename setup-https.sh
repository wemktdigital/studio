#!/bin/bash

# 🔒 Script de Configuração HTTPS - Studio
# Este script configura Nginx + SSL/HTTPS automaticamente

set -e  # Parar em caso de erro

echo "🔒 Configuração HTTPS para Studio"
echo "=================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ⚠️ CONFIGURE SUAS VARIÁVEIS AQUI
DOMAIN=""
EMAIL=""

# Solicitar domínio se não configurado
if [ -z "$DOMAIN" ]; then
    echo -e "${YELLOW}Digite seu domínio (ex: meusite.com):${NC}"
    read -r DOMAIN
fi

# Solicitar email se não configurado
if [ -z "$EMAIL" ]; then
    echo -e "${YELLOW}Digite seu email:${NC}"
    read -r EMAIL
fi

# Adicionar www ao domínio
WWW_DOMAIN="www.$DOMAIN"

echo ""
echo -e "${BLUE}📋 Configuração:${NC}"
echo "   Domínio: $DOMAIN"
echo "   WWW: $WWW_DOMAIN"
echo "   Email: $EMAIL"
echo ""
echo -e "${YELLOW}Pressione Enter para continuar ou Ctrl+C para cancelar...${NC}"
read

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Este script precisa ser executado como root (use sudo)${NC}"
    exit 1
fi

# Verificar se aplicação está rodando
echo ""
echo -e "${BLUE}🔍 Verificando aplicação...${NC}"
if ! curl -s http://localhost:9002 > /dev/null; then
    echo -e "${RED}❌ Aplicação não está respondendo na porta 9002${NC}"
    echo -e "${YELLOW}   Execute: pm2 start ecosystem.config.js${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Aplicação rodando na porta 9002${NC}"

# Verificar DNS
echo ""
echo -e "${BLUE}🌐 Verificando DNS...${NC}"
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
SERVER_IP=$(curl -s ifconfig.me)

if [ -z "$DOMAIN_IP" ]; then
    echo -e "${RED}❌ Domínio $DOMAIN não resolve para nenhum IP${NC}"
    echo -e "${YELLOW}   Configure o DNS do domínio para apontar para: $SERVER_IP${NC}"
    exit 1
fi

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo -e "${YELLOW}⚠️  Aviso: Domínio aponta para $DOMAIN_IP mas servidor é $SERVER_IP${NC}"
    echo -e "${YELLOW}   Você quer continuar mesmo assim? (s/n)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Ss]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ DNS configurado corretamente${NC}"
fi

# 1. Instalar Certbot (se não estiver instalado)
echo ""
echo -e "${BLUE}📦 Verificando Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    echo "   Instalando Certbot..."
    apt update -qq
    apt install certbot python3-certbot-nginx -y
    echo -e "${GREEN}✅ Certbot instalado${NC}"
else
    echo -e "${GREEN}✅ Certbot já instalado${NC}"
fi

# 2. Verificar Nginx
echo ""
echo -e "${BLUE}🔧 Verificando Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ Nginx não está instalado${NC}"
    echo -e "${YELLOW}   Instale com: apt install nginx${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Nginx instalado${NC}"

# 3. Criar backup da configuração atual
if [ -f "/etc/nginx/sites-available/studio" ]; then
    echo ""
    echo -e "${BLUE}💾 Criando backup...${NC}"
    cp /etc/nginx/sites-available/studio /etc/nginx/sites-available/studio.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ Backup criado${NC}"
fi

# 4. Verificar se arquivo nginx-studio.conf existe
if [ ! -f "nginx-studio.conf" ]; then
    echo -e "${RED}❌ Arquivo nginx-studio.conf não encontrado${NC}"
    echo -e "${YELLOW}   Execute este script no diretório do projeto${NC}"
    exit 1
fi

# 5. Copiar e configurar Nginx
echo ""
echo -e "${BLUE}📋 Configurando Nginx...${NC}"
cp nginx-studio.conf /etc/nginx/sites-available/studio

# Substituir domínio no arquivo
sed -i "s/talk.we.marketing/$DOMAIN/g" /etc/nginx/sites-available/studio
echo -e "${GREEN}✅ Configuração atualizada com seu domínio${NC}"

# 6. Criar link simbólico
echo ""
echo -e "${BLUE}🔗 Ativando configuração...${NC}"
ln -sf /etc/nginx/sites-available/studio /etc/nginx/sites-enabled/

# Remover configuração padrão se existir
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
    echo -e "${GREEN}✅ Configuração padrão removida${NC}"
fi

# 7. Criar configuração temporária para Certbot
echo ""
echo -e "${BLUE}🔧 Criando configuração temporária...${NC}"
cat > /etc/nginx/sites-available/studio-temp << EOF
server {
    listen 80;
    server_name $DOMAIN $WWW_DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        proxy_pass http://localhost:9002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Ativar configuração temporária
ln -sf /etc/nginx/sites-available/studio-temp /etc/nginx/sites-enabled/studio

# 8. Testar configuração do Nginx
echo ""
echo -e "${BLUE}🧪 Testando configuração...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Configuração válida${NC}"
else
    echo -e "${RED}❌ Erro na configuração do Nginx${NC}"
    exit 1
fi

# 9. Reload Nginx
echo ""
echo -e "${BLUE}🔄 Recarregando Nginx...${NC}"
systemctl reload nginx
echo -e "${GREEN}✅ Nginx recarregado${NC}"

# 10. Abrir portas no firewall
echo ""
echo -e "${BLUE}🔥 Configurando firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp > /dev/null 2>&1 || true
    ufw allow 443/tcp > /dev/null 2>&1 || true
    echo -e "${GREEN}✅ Portas 80 e 443 abertas${NC}"
fi

# 11. Obter certificado SSL
echo ""
echo -e "${BLUE}🔒 Obtendo certificado SSL...${NC}"
echo -e "${YELLOW}   Aguarde... isso pode levar alguns segundos${NC}"
echo ""

if certbot --nginx -d $DOMAIN -d $WWW_DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --redirect \
    --non-interactive; then
    echo ""
    echo -e "${GREEN}✅ Certificado SSL obtido com sucesso!${NC}"
else
    echo ""
    echo -e "${RED}❌ Falha ao obter certificado SSL${NC}"
    echo -e "${YELLOW}   Verifique:${NC}"
    echo "   - DNS está apontando corretamente"
    echo "   - Porta 80 está acessível externamente"
    echo "   - Firewall não está bloqueando"
    exit 1
fi

# 12. Aplicar configuração completa
echo ""
echo -e "${BLUE}🔧 Aplicando configuração completa...${NC}"
rm /etc/nginx/sites-enabled/studio
ln -sf /etc/nginx/sites-available/studio /etc/nginx/sites-enabled/studio

# Testar e reload
if nginx -t; then
    systemctl reload nginx
    echo -e "${GREEN}✅ Configuração completa aplicada${NC}"
else
    echo -e "${RED}❌ Erro na configuração final${NC}"
    exit 1
fi

# 13. Verificar renovação automática
echo ""
echo -e "${BLUE}🔄 Configurando renovação automática...${NC}"
if certbot renew --dry-run > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Renovação automática configurada${NC}"
else
    echo -e "${YELLOW}⚠️  Aviso: Teste de renovação falhou${NC}"
fi

# 14. Testar HTTPS
echo ""
echo -e "${BLUE}🧪 Testando HTTPS...${NC}"
sleep 2
if curl -sI https://$DOMAIN | grep -q "HTTP/2 200"; then
    echo -e "${GREEN}✅ HTTPS funcionando!${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS pode não estar funcionando completamente${NC}"
fi

# Resumo final
echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 HTTPS Configurado com Sucesso!${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}🌐 Seu site está disponível em:${NC}"
echo "   https://$DOMAIN"
echo "   https://$WWW_DOMAIN"
echo ""
echo -e "${BLUE}📋 Próximos passos:${NC}"
echo "   1. Acesse: https://$DOMAIN"
echo "   2. Verifique o cadeado de segurança no navegador"
echo "   3. Teste SSL: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""
echo -e "${BLUE}🔄 Renovação automática:${NC}"
echo "   ✅ Certificado será renovado automaticamente"
echo "   ✅ Válido por 90 dias, renova a cada 60 dias"
echo ""
echo -e "${BLUE}📊 Comandos úteis:${NC}"
echo "   Ver certificados: sudo certbot certificates"
echo "   Renovar manualmente: sudo certbot renew"
echo "   Testar renovação: sudo certbot renew --dry-run"
echo "   Logs Nginx: sudo tail -f /var/log/nginx/studio_access.log"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

