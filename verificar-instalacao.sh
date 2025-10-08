#!/bin/bash

# 🔍 Script de Verificação de Instalação - Studio
# Este script verifica se todos os arquivos necessários estão presentes

echo "🔍 Verificando instalação do Studio..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Função de verificação
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
    else
        echo -e "${RED}❌${NC} $1 - FALTANDO!"
        ((ERRORS++))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $1/"
    else
        echo -e "${RED}❌${NC} $1/ - FALTANDO!"
        ((ERRORS++))
    fi
}

# Verificar diretório raiz
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ ERRO: Execute este script no diretório raiz do projeto!${NC}"
    exit 1
fi

echo "📁 Verificando estrutura de diretórios..."
check_dir "src"
check_dir "src/components"
check_dir "src/components/ui"
check_dir "src/lib"
check_dir "src/lib/supabase"
check_dir "src/app"
check_dir "public"
echo ""

echo "📄 Verificando arquivos críticos..."
check_file "package.json"
check_file "tsconfig.json"
check_file "next.config.ts"
check_file "tailwind.config.ts"
check_file "ecosystem.config.js"
echo ""

echo "🎨 Verificando componentes UI..."
check_file "src/components/ui/card.tsx"
check_file "src/components/ui/button.tsx"
check_file "src/components/ui/input.tsx"
check_file "src/components/ui/label.tsx"
check_file "src/components/ui/dialog.tsx"
check_file "src/components/ui/avatar.tsx"
echo ""

echo "🔌 Verificando serviços Supabase..."
check_file "src/lib/supabase/client.ts"
check_file "src/lib/supabase/server.ts"
check_file "src/lib/supabase/middleware.ts"
check_file "src/lib/supabase/config.ts"
echo ""

echo "📋 Verificando serviços..."
check_file "src/lib/services/message-service.ts"
check_file "src/lib/services/channel-service.ts"
check_file "src/lib/services/user-service.ts"
echo ""

echo "🔐 Verificando configurações de produção..."
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✅${NC} .env.production existe"
    
    # Verificar variáveis obrigatórias
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.production; then
        echo -e "${GREEN}✅${NC} NEXT_PUBLIC_SUPABASE_URL configurado"
    else
        echo -e "${RED}❌${NC} NEXT_PUBLIC_SUPABASE_URL - FALTANDO!"
        ((ERRORS++))
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.production; then
        echo -e "${GREEN}✅${NC} NEXT_PUBLIC_SUPABASE_ANON_KEY configurado"
    else
        echo -e "${RED}❌${NC} NEXT_PUBLIC_SUPABASE_ANON_KEY - FALTANDO!"
        ((ERRORS++))
    fi
    
    if grep -q "NEXT_PUBLIC_SITE_URL" .env.production; then
        echo -e "${GREEN}✅${NC} NEXT_PUBLIC_SITE_URL configurado"
    else
        echo -e "${YELLOW}⚠️${NC}  NEXT_PUBLIC_SITE_URL - FALTANDO (recomendado)"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}❌${NC} .env.production - FALTANDO!"
    echo -e "${YELLOW}    Copie .env.production.example para .env.production e configure${NC}"
    ((ERRORS++))
fi
echo ""

echo "📦 Verificando dependências..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅${NC} node_modules existe"
    
    # Verificar alguns pacotes críticos
    if [ -d "node_modules/next" ]; then
        echo -e "${GREEN}✅${NC} next instalado"
    else
        echo -e "${RED}❌${NC} next - FALTANDO!"
        ((ERRORS++))
    fi
    
    if [ -d "node_modules/react" ]; then
        echo -e "${GREEN}✅${NC} react instalado"
    else
        echo -e "${RED}❌${NC} react - FALTANDO!"
        ((ERRORS++))
    fi
    
    if [ -d "node_modules/@supabase/supabase-js" ]; then
        echo -e "${GREEN}✅${NC} @supabase/supabase-js instalado"
    else
        echo -e "${RED}❌${NC} @supabase/supabase-js - FALTANDO!"
        ((ERRORS++))
    fi
else
    echo -e "${RED}❌${NC} node_modules - FALTANDO!"
    echo -e "${YELLOW}    Execute: npm ci${NC}"
    ((ERRORS++))
fi
echo ""

echo "🔧 Verificando ambiente..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅${NC} Node.js: $NODE_VERSION"
    
    # Verificar se é versão 20+
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 20 ]; then
        echo -e "${YELLOW}⚠️${NC}  Node.js versão 20+ recomendada (atual: $NODE_VERSION)"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}❌${NC} Node.js não instalado!"
    ((ERRORS++))
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅${NC} npm: $NPM_VERSION"
else
    echo -e "${RED}❌${NC} npm não instalado!"
    ((ERRORS++))
fi

if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    echo -e "${GREEN}✅${NC} PM2: $PM2_VERSION"
else
    echo -e "${YELLOW}⚠️${NC}  PM2 não instalado (recomendado para produção)"
    ((WARNINGS++))
fi
echo ""

echo "💾 Verificando espaço em disco..."
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✅${NC} Espaço em disco: ${DISK_USAGE}% usado"
else
    echo -e "${YELLOW}⚠️${NC}  Espaço em disco: ${DISK_USAGE}% usado (acima de 80%)"
    ((WARNINGS++))
fi
echo ""

# Resumo
echo "=================================="
echo "📊 RESUMO DA VERIFICAÇÃO"
echo "=================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ TUDO OK! Instalação completa e pronta para build${NC}"
    echo ""
    echo "📋 Próximos passos:"
    echo "  1. npm run build"
    echo "  2. npm start (ou use PM2)"
    echo ""
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Instalação OK com $WARNINGS aviso(s)${NC}"
    echo -e "${YELLOW}   A aplicação deve funcionar, mas recomenda-se resolver os avisos${NC}"
    echo ""
    echo "📋 Próximos passos:"
    echo "  1. npm run build"
    echo "  2. npm start (ou use PM2)"
    echo ""
else
    echo -e "${RED}❌ PROBLEMAS ENCONTRADOS!${NC}"
    echo -e "${RED}   Erros: $ERRORS${NC}"
    echo -e "${YELLOW}   Avisos: $WARNINGS${NC}"
    echo ""
    echo "🔧 Ações recomendadas:"
    
    if [ ! -d "node_modules" ]; then
        echo "  1. Instalar dependências: npm ci"
    fi
    
    if [ ! -f ".env.production" ]; then
        echo "  2. Criar .env.production: cp .env.production.example .env.production"
        echo "     Depois edite e configure as variáveis"
    fi
    
    if [ $ERRORS -gt 5 ]; then
        echo "  3. Muitos arquivos faltando - considere reenviar projeto completo"
    fi
    
    echo ""
    echo "📚 Consulte: CORRECAO_BUILD_SERVIDOR.md para instruções detalhadas"
    echo ""
    exit 1
fi

exit 0

