# Script PowerShell para testar API de mensagens
Write-Host "Testando API de Mensagens..."

# Canal ID do "geralzao"
$channelId = "be9f6b21-ccbb-4673-b5de-495e7b52e51a"

Write-Host "GET http://localhost:9002/api/messages?channelId=$channelId"
Write-Host ""

$response = Invoke-RestMethod -Uri "http://localhost:9002/api/messages?channelId=$channelId" -Method Get -ContentType "application/json"

Write-Host "Resposta recebida:"
$response | ConvertTo-Json -Depth 10

Write-Host ""
Write-Host "Teste concluido!"

