#!/bin/bash

# 📦 Script para Gerar Pacote Completo para Servidor
# Este script cria um arquivo .tar.gz com todos os arquivos necessários

echo "📦 Gerando pacote completo para o servidor..."
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ ERRO: Execute este script no diretório raiz do projeto!"
    exit 1
fi

# Nome do arquivo
PACKAGE_NAME="studio-completo-$(date +%Y%m%d_%H%M%S).tar.gz"
TEMP_DIR="studio-temp"

echo -e "${BLUE}📋 Preparando arquivos...${NC}"

# Criar diretório temporário
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Copiar arquivos necessários
echo "  ✅ Copiando código fonte..."
cp -r src $TEMP_DIR/
cp -r public $TEMP_DIR/ 2>/dev/null || true
cp -r supabase $TEMP_DIR/ 2>/dev/null || true

echo "  ✅ Copiando arquivos de configuração..."
cp package.json $TEMP_DIR/
cp package-lock.json $TEMP_DIR/ 2>/dev/null || true
cp tsconfig.json $TEMP_DIR/
cp next.config.ts $TEMP_DIR/
cp tailwind.config.ts $TEMP_DIR/
cp postcss.config.mjs $TEMP_DIR/ 2>/dev/null || true
cp components.json $TEMP_DIR/ 2>/dev/null || true
cp middleware.ts $TEMP_DIR/ 2>/dev/null || true

echo "  ✅ Copiando arquivos de deploy..."
cp ecosystem.config.js $TEMP_DIR/
cp nginx-studio.conf $TEMP_DIR/ 2>/dev/null || true
cp deploy.sh $TEMP_DIR/ 2>/dev/null || true
cp env.production.example $TEMP_DIR/

echo "  ✅ Copiando documentação..."
cp WEBMASTER_GUIDE.md $TEMP_DIR/ 2>/dev/null || true
cp README_INSTALACAO.md $TEMP_DIR/ 2>/dev/null || true
cp CORRECAO_BUILD_SERVIDOR.md $TEMP_DIR/ 2>/dev/null || true
cp INSTRUCOES_WEBMASTER.md $TEMP_DIR/ 2>/dev/null || true
cp verificar-instalacao.sh $TEMP_DIR/

echo "  ✅ Copiando arquivos SQL..."
cp supabase-schema.sql $TEMP_DIR/ 2>/dev/null || true
cp supabase-seed-data.sql $TEMP_DIR/ 2>/dev/null || true

# Criar arquivo README no pacote
cat > $TEMP_DIR/LEIA-ME-PRIMEIRO.txt << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                 🚀 STUDIO - INSTALAÇÃO                       ║
╚══════════════════════════════════════════════════════════════╝

📋 INÍCIO RÁPIDO:

1. Extrair arquivos:
   tar -xzf studio-completo-XXXXXX.tar.gz
   cd studio

2. Executar verificação:
   chmod +x verificar-instalacao.sh
   ./verificar-instalacao.sh

3. Criar .env.production:
   cp env.production.example .env.production
   nano .env.production  # Editar com suas credenciais

4. Instalar e buildar:
   npm ci
   npm run build

5. Iniciar:
   pm2 start ecosystem.config.js
   pm2 save

═══════════════════════════════════════════════════════════════

📚 DOCUMENTAÇÃO COMPLETA:
   - INSTRUCOES_WEBMASTER.md    (Leia primeiro!)
   - WEBMASTER_GUIDE.md          (Guia completo)
   - CORRECAO_BUILD_SERVIDOR.md  (Solução de problemas)

═══════════════════════════════════════════════════════════════

✅ REQUISITOS:
   - Node.js 20.x
   - PM2
   - Nginx
   - Ubuntu 22.04+ (ou similar)

═══════════════════════════════════════════════════════════════

🆘 SUPORTE:
   Se tiver problemas, execute:
   ./verificar-instalacao.sh

   E consulte: CORRECAO_BUILD_SERVIDOR.md

═══════════════════════════════════════════════════════════════
EOF

echo ""
echo -e "${BLUE}📦 Compactando arquivos...${NC}"
tar -czf $PACKAGE_NAME -C $TEMP_DIR .

# Limpar diretório temporário
rm -rf $TEMP_DIR

# Informações do pacote
PACKAGE_SIZE=$(du -h $PACKAGE_NAME | cut -f1)

echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Pacote gerado com sucesso!${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📦 Arquivo: $PACKAGE_NAME"
echo "📊 Tamanho: $PACKAGE_SIZE"
echo ""
echo "📤 PRÓXIMOS PASSOS:"
echo ""
echo "1. Enviar arquivo para o servidor:"
echo -e "   ${YELLOW}scp $PACKAGE_NAME root@seu-servidor:/tmp/${NC}"
echo ""
echo "2. No servidor, executar:"
echo -e "   ${YELLOW}cd /var/www${NC}"
echo -e "   ${YELLOW}mkdir -p studio${NC}"
echo -e "   ${YELLOW}cd studio${NC}"
echo -e "   ${YELLOW}tar -xzf /tmp/$PACKAGE_NAME${NC}"
echo -e "   ${YELLOW}./verificar-instalacao.sh${NC}"
echo ""
echo "3. Seguir instruções em:"
echo -e "   ${YELLOW}INSTRUCOES_WEBMASTER.md${NC}"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}🎉 Pronto para enviar ao webmaster!${NC}"
echo ""

