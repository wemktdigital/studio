#!/bin/bash

# 🧹 Script de Limpeza - Arquivos SQL Temporários
# Remove arquivos SQL de debug, teste e fix que não são mais necessários

echo "🧹 Iniciando limpeza dos arquivos SQL temporários..."

# Lista de arquivos para remover (debug, teste, fix temporários)
FILES_TO_REMOVE=(
    # Arquivos de debug e teste
    "basic-check-fixed.sql"
    "basic-check.sql"
    "check-and-create-current-user.sql"
    "check-and-create-test-data.sql"
    "check-channels-exist.sql"
    "check-current-schema-fixed.sql"
    "check-current-schema.sql"
    "check-current-users-schema.sql"
    "check-database-status.sql"
    "check-notifications-status.sql"
    "check-snippets-table.sql"
    "check-table-structures.sql"
    "check-threads-table-fixed.sql"
    "check-threads-table.sql"
    "check-trigger-status.sql"
    "check-user-level.sql"
    "check-user-profile.sql"
    "check-users-table-structure.sql"
    "check-users-table.sql"
    "check-workspace-members.sql"
    "check-workspaces-table.sql"
    
    # Arquivos de debug
    "debug-current-database.sql"
    "debug-dm-creation.sql"
    "debug-message-sending.sql"
    "debug-user-access.sql"
    "debug-users-table.sql"
    
    # Arquivos de teste
    "test-existing-notifications.sql"
    "test-real-structure.sql"
    "test-specific-user.sql"
    "test-users-system.sql"
    
    # Arquivos simples
    "simple-check-database.sql"
    "simple-structure-check-fixed.sql"
    "simple-structure-check.sql"
    
    # Arquivos de diagnóstico
    "diagnose-users-table.sql"
    
    # Arquivos de fix (já aplicados)
    "fix-channels-and-users.sql"
    "fix-layout-issues.sql"
    "fix-rls-policies-complete.sql"
    "fix-rls-policies-ultra-simple.sql"
    "fix-rls-policies.sql"
    "fix-super-admin-permissions.sql"
    "fix-trigger-function.sql"
    "fix-trigger-permanently.sql"
    "fix-user-levels-tables.sql"
    "fix-user-signup-manual.sql"
    "fix-user-trigger-with-level.sql"
    "fix-user-trigger-without-handle.sql"
    "fix-users-insert-policy.sql"
    "fix-users-rls-policy.sql"
    "fix-users-table.sql"
    "fix-workspaces-schema.sql"
    
    # Arquivos de adição (já aplicados)
    "add-is-active-to-workspaces.sql"
    "add-mentions-table.sql"
    "add-mentions-trigger.sql"
    "add-read-status-table.sql"
    "add-threads-system.sql"
    "add-user-level-column.sql"
    "add-user-levels.sql"
    
    # Arquivos de criação temporários
    "create-missing-channels.sql"
    "create-missing-user.sql"
    "create-notifications-system.sql"
    "create-users-only.sql"
    "create-users-table-simple.sql"
    "create-workspace-invites-table.sql"
    "create-workspace-members.sql"
    
    # Arquivos de setup temporários
    "setup-complete-dev-environment.sql"
    "setup-dev-user-complete.sql"
    "setup-dev-user-final.sql"
    "setup-dev-user-safe.sql"
    "setup-users-trigger.sql"
    
    # Arquivos de aplicação temporários
    "apply-is-active-migration.sql"
    
    # Arquivos de migração temporários
    "migrate-users-data.sql"
    
    # Arquivos de emergência
    "emergency-fix.sql"
    "force-columns.sql"
    "force-remove-all-policies.sql"
    "just-columns.sql"
    
    # Arquivos de desabilitação temporários
    "disable-email-confirmation.sql"
    "disable-rls-temporarily.sql"
    
    # Arquivos de verificação
    "verify-trigger-working.sql"
    "show-columns-structure.sql"
    
    # Arquivos de schema antigos/duplicados
    "supabase-presence-schema-fixed.sql"
    "supabase-presence-schema.sql"
    "supabase-read-status-schema-fixed.sql"
    "supabase-read-status-schema.sql"
    "supabase-schema-safe.sql"
    "supabase-threads-schema-fixed.sql"
    "supabase-threads-schema-step-by-step.sql"
    "supabase-threads-schema.sql"
    "supabase-seed-data-corrected.sql"
    
    # Arquivos JavaScript temporários
    "create-user-trigger.js"
    "disable-mock-user.js"
    "enable-mock-user.js"
    "fix-dm-issues.js"
    "test-dm-functionality.js"
)

# Contador de arquivos removidos
REMOVED_COUNT=0

# Remover cada arquivo
for file in "${FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        echo "🗑️  Removendo: $file"
        rm "$file"
        ((REMOVED_COUNT++))
    else
        echo "⚠️  Arquivo não encontrado: $file"
    fi
done

echo ""
echo "✅ Limpeza concluída!"
echo "📊 Arquivos removidos: $REMOVED_COUNT"
echo ""
echo "📁 Arquivos SQL mantidos (essenciais):"
echo "   - supabase-schema.sql (schema principal)"
echo "   - supabase-seed-data.sql (dados iniciais)"
echo "   - supabase/ (pasta de configuração)"
echo ""
echo "🧹 Projeto limpo e organizado!"
