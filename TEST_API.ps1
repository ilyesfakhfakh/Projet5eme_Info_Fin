# Test des endpoints de la roulette
Write-Host "`n🎰 TESTING ROULETTE API ENDPOINTS...`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3200/api/v1/roulette"

# Test 1: Config
Write-Host "1️⃣ Testing /config..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/config" -Method Get
    Write-Host "   ✅ Config OK" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Config FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Wallet
Write-Host "`n2️⃣ Testing /wallet..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/wallet?userId=demo-user" -Method Get
    Write-Host "   ✅ Wallet OK - Balance: `$$($response.wallet.balance)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Wallet FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Jackpot
Write-Host "`n3️⃣ Testing /jackpot..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/jackpot" -Method Get
    Write-Host "   ✅ Jackpot OK - Amount: `$$($response.jackpot.current_amount)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Jackpot FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Create Game
Write-Host "`n4️⃣ Testing /game/create..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/game/create" -Method Post -ContentType "application/json"
    Write-Host "   ✅ Game Created - ID: $($response.game.game_id)" -ForegroundColor Green
    Write-Host "   Game Number: $($response.game.game_number)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Create Game FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Volatility
Write-Host "`n5️⃣ Testing /volatility..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/volatility" -Method Get
    Write-Host "   ✅ Volatility OK - Index: $($response.volatility)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Volatility FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ ALL TESTS COMPLETED!`n" -ForegroundColor Cyan
