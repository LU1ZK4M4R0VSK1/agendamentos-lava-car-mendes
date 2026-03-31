$global:ProgressPreference = 'SilentlyContinue'

$evoUrl = "http://localhost:8080"
$apiKey = "teste123api" # Altere se usar outra apiKey global na Evolution API
$instanceName = "posto3l"
$webhookUrl = "http://host.docker.internal:3001/webhook" # Ou a URL do bot (http://localhost:3001/webhook se rodando local)

$headers = @{
    "apikey" = $apiKey
    "Content-Type" = "application/json"
}

Write-Host "1️⃣ Criando a instância '$instanceName'..."
$bodyCreate = @{
    instanceName = $instanceName
    integration = "WHATSAPP-BAILEYS"
    qrcode = $true
} | ConvertTo-Json

try {
    $resCreate = Invoke-RestMethod -Uri "$evoUrl/instance/create" -Method Post -Headers $headers -Body $bodyCreate
    Write-Host "Instância criada com sucesso! Verifique a resposta:"
    $resCreate | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Aviso ao criar a instância: $($_.Exception.Message)"
}

Write-Host "`n2️⃣ Configurando o webhook para '$instanceName'..."
$bodyWebhook = @{
    webhook = @{
        url = $webhookUrl
        byEvents = $false
        base64 = $false
        events = @(
            "MESSAGES_UPSERT"
        )
    }
} | ConvertTo-Json -Depth 10

try {
    $resWebhook = Invoke-RestMethod -Uri "$evoUrl/webhook/set/$instanceName" -Method Post -Headers $headers -Body $bodyWebhook
    Write-Host "Webhook configurado com sucesso!"
    $resWebhook | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Erro ao configurar webhook: $($_.Exception.Message)"
}

Write-Host "`n✅ Processo finalizado."
