$uri = "http://localhost:8080/instance/create"
$headers = @{
    "apikey" = "teste123api"
    "Content-Type" = "application/json"
}
$body = @{
    instanceName = "aero-lanches"
    integration = "WHATSAPP-BAILEYS"
    qrcode = $true
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body
$response | ConvertTo-Json -Depth 10
