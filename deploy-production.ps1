# Quick Deployment Script for PWA + Billing Integration
# Run: .\deploy-production.ps1

Write-Host "🚀 eVoucher Production Deployment" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Validate PWA
Write-Host "Step 1: Validating PWA configuration..." -ForegroundColor Yellow
node scripts/validate-pwa.mjs
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ PWA validation failed. Fix errors above." -ForegroundColor Red
    exit 1
}
Write-Host "✅ PWA validation passed" -ForegroundColor Green
Write-Host ""

# Step 2: Check billing files exist
Write-Host "Step 2: Checking billing integration files..." -ForegroundColor Yellow
if (-not (Test-Path "src\lib\billing\billing-event-recorder.ts")) {
    Write-Host "❌ billing-event-recorder.ts not found" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Billing integration files present" -ForegroundColor Green
Write-Host ""

# Step 3: Show current status
Write-Host "Step 3: Current status..." -ForegroundColor Yellow
$branch = git branch --show-current
Write-Host "Current branch: $branch" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files changed:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Step 4: Confirm deployment
$confirm = Read-Host "Deploy these changes to production? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 1
}

# Step 5: Commit and push
Write-Host "Step 4: Deploying to production..." -ForegroundColor Yellow
git add .
git commit -m "Production deployment: PWA fix + Billing integration

- Fix service worker path (/service-worker.js)
- Enable PWA in development mode  
- Add billing event recorder service
- Update voucher purchase route
- Add PWA validation script
- Ready for production demo"

git push origin main

Write-Host "✅ Pushed to Git" -ForegroundColor Green
Write-Host ""

# Step 6: Wait for deployment
Write-Host "⏳ Waiting for Vercel deployment (3 minutes)..." -ForegroundColor Yellow
Write-Host "   Check: https://vercel.com/your-account/evoucher-website-2026" -ForegroundColor Cyan
Write-Host ""

for ($i = 180; $i -gt 0; $i--) {
    $minutes = [math]::Floor($i / 60)
    $seconds = $i % 60
    Write-Host -NoNewline ("`r   Time remaining: {0:D2}:{1:D2}" -f $minutes, $seconds)
    Start-Sleep -Seconds 1
}
Write-Host ""
Write-Host ""

# Step 7: Test production
Write-Host "Step 5: Testing production deployment..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 Testing https://www.evoucher.co.za..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "https://www.evoucher.co.za" -Method Head -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Website is live (HTTP 200)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Website returned HTTP $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not reach website: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Step 8: Manual verification instructions
Write-Host "📋 Manual verification required:" -ForegroundColor Cyan
Write-Host ""
Write-Host "PWA Verification:" -ForegroundColor Yellow
Write-Host "  1. Open: https://www.evoucher.co.za"
Write-Host "  2. Press F12 → Application → Service Workers"
Write-Host "  3. Verify: service-worker.js is activated"
Write-Host "  4. Check: Install prompt appears"
Write-Host ""
Write-Host "Billing Integration Verification:" -ForegroundColor Yellow
Write-Host "  1. Start Billing Engine:"
Write-Host "     cd billing-engine-portal"
Write-Host "     npm run dev"
Write-Host "  2. Process payment on website"
Write-Host "  3. Check transaction appears in Billing Engine"
Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  - Test PWA installation"
Write-Host "  - Process test payment"
Write-Host "  - Verify Billing Engine"
Write-Host "  - Prepare for demo!"
Write-Host ""

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
