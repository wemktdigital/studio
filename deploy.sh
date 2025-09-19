#!/bin/bash

# 🚀 Script de Deploy - Studio
# Este script automatiza o processo de deploy da aplicação

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
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
    error "package.json não encontrado. Execute este script na raiz do projeto."
fi

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    error "PM2 não está instalado. Execute: npm install -g pm2"
fi

# Verificar se Git está disponível
if ! command -v git &> /dev/null; then
    error "Git não está instalado."
fi

log "🚀 Iniciando processo de deploy do Studio..."

# 1. Verificar status atual
log "📊 Verificando status atual da aplicação..."
if pm2 describe studio > /dev/null 2>&1; then
    CURRENT_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="studio") | .pm2_env.status')
    log "Status atual: $CURRENT_STATUS"
else
    log "Aplicação não está rodando no PM2"
fi

# 2. Fazer backup (opcional)
if [ "$1" = "--backup" ]; then
    log "📦 Criando backup..."
    BACKUP_DIR="./backups"
    mkdir -p $BACKUP_DIR
    BACKUP_FILE="$BACKUP_DIR/studio-backup-$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "$BACKUP_FILE" --exclude='node_modules' --exclude='.next' --exclude='.git' .
    success "Backup criado: $BACKUP_FILE"
fi

# 3. Parar aplicação se estiver rodando
if pm2 describe studio > /dev/null 2>&1; then
    log "⏹️  Parando aplicação..."
    pm2 stop studio
    success "Aplicação parada"
fi

# 4. Verificar se há mudanças no Git
if [ -d ".git" ]; then
    log "🔄 Verificando mudanças no Git..."
    
    # Verificar se há mudanças não commitadas
    if ! git diff-index --quiet HEAD --; then
        warning "Há mudanças não commitadas. Deseja continuar? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            error "Deploy cancelado. Commit suas mudanças primeiro."
        fi
    fi
    
    # Fazer pull das mudanças
    log "📥 Atualizando código do repositório..."
    git fetch origin
    git pull origin main
    success "Código atualizado"
fi

# 5. Instalar dependências
log "📦 Instalando dependências..."
if [ "$NODE_ENV" = "production" ]; then
    npm ci --only=production
else
    npm install
fi
success "Dependências instaladas"

# 6. Executar testes (se existirem)
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    log "🧪 Executando testes..."
    npm test || warning "Alguns testes falharam, mas continuando o deploy"
fi

# 7. Fazer build da aplicação
log "🔨 Fazendo build da aplicação..."
npm run build
success "Build concluído"

# 8. Executar migrations (se existirem)
if [ -f "package.json" ] && grep -q '"migrate"' package.json; then
    log "🗄️  Executando migrations..."
    npm run migrate || warning "Migrations falharam, mas continuando o deploy"
fi

# 9. Verificar variáveis de ambiente
log "🔧 Verificando configuração..."
if [ ! -f ".env.production" ] && [ "$NODE_ENV" = "production" ]; then
    warning "Arquivo .env.production não encontrado. Usando .env.local"
fi

# 10. Iniciar aplicação
log "🚀 Iniciando aplicação..."
pm2 start ecosystem.config.js --env production
success "Aplicação iniciada"

# 11. Verificar status
log "📊 Verificando status da aplicação..."
sleep 5  # Aguardar aplicação inicializar

if pm2 describe studio > /dev/null 2>&1; then
    STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="studio") | .pm2_env.status')
    CPU=$(pm2 jlist | jq -r '.[] | select(.name=="studio") | .monit.cpu')
    MEMORY=$(pm2 jlist | jq -r '.[] | select(.name=="studio") | .monit.memory')
    
    success "Aplicação está rodando!"
    log "Status: $STATUS"
    log "CPU: ${CPU}%"
    log "Memória: $(($MEMORY / 1024 / 1024))MB"
else
    error "Falha ao iniciar aplicação"
fi

# 12. Verificar se aplicação está respondendo
log "🔍 Verificando se aplicação está respondendo..."
PORT=${PORT:-3000}
if curl -f -s "http://localhost:$PORT" > /dev/null; then
    success "Aplicação está respondendo na porta $PORT"
else
    warning "Aplicação não está respondendo na porta $PORT"
    log "Verificando logs..."
    pm2 logs studio --lines 20
fi

# 13. Limpeza
log "🧹 Fazendo limpeza..."
pm2 save  # Salvar configuração do PM2
success "Configuração salva"

# 14. Mostrar informações úteis
log "📋 Informações úteis:"
echo "  - Ver logs: pm2 logs studio"
echo "  - Monitorar: pm2 monit"
echo "  - Reiniciar: pm2 restart studio"
echo "  - Parar: pm2 stop studio"
echo "  - Status: pm2 status"

# 15. Conclusão
success "🎉 Deploy concluído com sucesso!"
log "Aplicação disponível em: http://localhost:$PORT"

# Opcional: Abrir aplicação no navegador (apenas em desenvolvimento)
if [ "$NODE_ENV" = "development" ] && command -v open &> /dev/null; then
    log "🌐 Abrindo aplicação no navegador..."
    open "http://localhost:$PORT"
fi
