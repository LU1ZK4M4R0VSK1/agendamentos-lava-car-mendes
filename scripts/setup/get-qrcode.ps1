$uri = "http://localhost:8080/instance/connect/aero-lanches"
$headers = @{
    "apikey" = "teste123api"
}

$response = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers
$response | ConvertTo-Json -Depth 10
