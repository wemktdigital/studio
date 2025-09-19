# Como Limpar o Cache do Navegador

O erro "Unable to find snippet with ID 47272a78-c81a-488b-ad5f-cc716974786d" pode ser causado por cache do navegador.

## Chrome/Edge
1. Pressione `Ctrl+Shift+Delete` (Windows) ou `Cmd+Shift+Delete` (Mac)
2. Selecione "Todo o período"
3. Marque todas as opções:
   - Histórico de navegação
   - Cookies e outros dados de sites
   - Imagens e arquivos em cache
   - Senhas e outros dados de login
4. Clique em "Limpar dados"

## Firefox
1. Pressione `Ctrl+Shift+Delete` (Windows) ou `Cmd+Shift+Delete` (Mac)
2. Selecione "Tudo"
3. Clique em "Limpar agora"

## Safari
1. Vá em Safari > Preferências > Privacidade
2. Clique em "Remover todos os dados de sites"

## Alternativa: Modo Incógnito
- Abra uma janela anônima/privada
- Acesse http://localhost:9002
- Teste se o problema persiste

## Limpar Cache do Next.js
```bash
# Parar o servidor
Ctrl+C

# Limpar cache
rm -rf .next
rm -rf node_modules/.cache

# Reiniciar
npm run dev
```

## Verificar Console do Navegador
1. Pressione F12
2. Vá na aba "Console"
3. Procure por erros relacionados ao snippet
4. Limpe o console e recarregue a página
