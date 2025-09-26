// Script para limpar cache e forçar atualização dos workspaces
// Execute este código no console do navegador (F12 > Console)

// 1. Limpar localStorage
localStorage.clear();

// 2. Limpar sessionStorage
sessionStorage.clear();

// 3. Limpar cache do React Query (se disponível)
if (window.__REACT_QUERY_CLIENT__) {
  window.__REACT_QUERY_CLIENT__.clear();
}

// 4. Recarregar a página
window.location.reload();

console.log('Cache limpo! A página será recarregada...');
