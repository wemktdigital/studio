#!/bin/bash

# 🚀 Script de Deploy Automatizado - Studio
# Este script automatiza o processo de deploy da aplicação Studio

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy do Studio..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "package.json não encontrado. Execute este script no diretório raiz do projeto."
fi

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    error "Node.js não está instalado. Instale Node.js 18+ antes de continuar."
fi

# Verificar versão do Node.js
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js versão 18+ é necessária. Versão atual: $(node --version)"
fi

log "Verificando dependências..."

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    warning "PM2 não está instalado. Instalando..."
    npm install -g pm2
fi

# Verificar se o arquivo de ambiente existe
if [ ! -f ".env.production" ]; then
    error "Arquivo .env.production não encontrado. Crie o arquivo com as variáveis de ambiente necessárias."
fi

log "Instalando dependências..."
npm ci --only=production || error "Falha ao instalar dependências"

log "Executando build de produção..."
npm run build || error "Falha no build de produção"

log "Parando aplicação anterior (se estiver rodando)..."
pm2 stop studio 2>/dev/null || true

log "Iniciando aplicação com PM2..."
pm2 start ecosystem.config.js --env production || error "Falha ao iniciar aplicação"

log "Salvando configuração do PM2..."
pm2 save

log "Verificando status da aplicação..."
sleep 3
pm2 status

# Verificar se a aplicação está respondendo
log "Testando aplicação..."
if curl -f -s http://localhost:9002 > /dev/null; then
    success "Aplicação está respondendo corretamente!"
else
    warning "Aplicação pode não estar respondendo ainda. Verifique os logs com: pm2 logs studio"
fi

log "Configurando logs..."
mkdir -p logs
pm2 logs studio --lines 10

success "Deploy concluído com sucesso!"
echo ""
echo "📊 Comandos úteis:"
echo "  pm2 status          - Ver status da aplicação"
echo "  pm2 logs studio     - Ver logs da aplicação"
echo "  pm2 restart studio  - Reiniciar aplicação"
echo "  pm2 stop studio     - Parar aplicação"
echo "  pm2 monit           - Monitoramento em tempo real"
echo ""
echo "🌐 Aplicação disponível em: http://localhost:9002"
echo "📝 Logs salvos em: ./logs/"
echo ""
echo "🔧 Para configurar SSL e domínio, consulte o DEPLOY_GUIDE.md"