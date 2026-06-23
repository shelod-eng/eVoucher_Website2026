# GitHub Commit & Vercel Deploy Script
# Commits to: https://github.com/shelod-eng/eVoucher_Website2026
# Triggers: Vercel deployment at https://vercel.com/shelod-engs-projects

Write-Host "🚀 Deploying to GitHub & Vercel" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current status
Write-Host "Step 1: Checking repository status..." -ForegroundColor Yellow
$branch = git branch --show-current
Write-Host "Current branch: $branch" -ForegroundColor Cyan
Write-Host ""

# Verify remote
$remote = git remote get-url origin 2>$null
if ($remote -match "shelod-eng/eVoucher_Website2026") {
    Write-Host "✅ Remote verified: $remote" -ForegroundColor Green
} else {
    Write-Host "⚠️  Remote: $remote" -ForegroundColor Yellow
    Write-Host "Expected: https://github.com/shelod-eng/eVoucher_Website2026" -ForegroundColor Yellow
    $confirm = Read-Host "Continue anyway? (y/n)"
    if ($confirm -ne 'y') { exit 1 }
}
Write-Host ""

# Step 2: Show changes
Write-Host "Step 2: Files to be committed:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Step 3: Validate PWA
Write-Host "Step 3: Validating PWA configuration..." -ForegroundColor Yellow
node scripts/validate-pwa.mjs
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ PWA validation failed" -ForegroundColor Red
    $continue = Read-Host "Continue deployment anyway? (y/n)"
    if ($continue -ne 'y') { exit 1 }
}
Write-Host ""

# Step 4: Confirm deployment
Write-Host "Step 4: Ready to deploy" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:" -ForegroundColor Cyan
Write-Host "  1. Commit all changes to Git"
Write-Host "  2. Push to: https://github.com/shelod-eng/eVoucher_Website2026"
Write-Host "  3. Trigger GitHub Actions"
Write-Host "  4. Trigger Vercel deployment"
Write-Host "  5. Deploy to: www.evoucher.co.za"
Write-Host ""

$confirm = Read-Host "Proceed with deployment? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Commit changes
Write-Host "Step 5: Committing changes..." -ForegroundColor Yellow

git add .

$commitMessage = @"
Production deployment: PWA fix + Billing Engine integration

🔧 PWA Fixes:
- Fix service worker path from /sw.js to /service-worker.js
- Enable PWA in development mode (NEXT_PUBLIC_ENABLE_PWA_DEV=true)
- Add PWA validation script for permanent monitoring
- Ensure offline functionality works

💰 Billing Engine Integration:
- Create billing-event-recorder.ts service
- Update voucher purchase route to record billing events
- All payments now create entries in billing_events table
- Real-time updates to Billing Engine dashboard
- Support for all 9 payment methods

📊 Demo Preparation:
- Add seed script for demo data (seed-billing-demo.mjs)
- Create deployment automation scripts
- Add comprehensive documentation
- Prepare for production demo

✅ Ready for: www.evoucher.co.za demo
🎯 Target: Billing Engine real-time transaction display
🔗 GitHub: https://github.com/shelod-eng/eVoucher_Website2026
🚀 Vercel: https://vercel.com/shelod-engs-projects
"@

git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git commit failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Changes committed" -ForegroundColor Green
Write-Host ""

# Step 6: Push to GitHub
Write-Host "Step 6: Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "Repository: https://github.com/shelod-eng/eVoucher_Website2026" -ForegroundColor Cyan

git push origin $branch

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git push failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible solutions:" -ForegroundColor Yellow
    Write-Host "  1. Check your Git credentials"
    Write-Host "  2. Verify internet connection"
    Write-Host "  3. Try: git push origin $branch --force"
    Write-Host ""
    exit 1
}

Write-Host "✅ Pushed to GitHub" -ForegroundColor Green
Write-Host ""

# Step 7: Monitor deployment
Write-Host "Step 7: Deployment triggered!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Monitor deployment progress:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  GitHub Actions:" -ForegroundColor Yellow
Write-Host "  https://github.com/shelod-eng/eVoucher_Website2026/actions" -ForegroundColor White
Write-Host ""
Write-Host "  Vercel Deployments:" -ForegroundColor Yellow
Write-Host "  https://vercel.com/shelod-engs-projects" -ForegroundColor White
Write-Host ""
Write-Host "⏱️  Expected deployment time: 2-3 minutes" -ForegroundColor Cyan
Write-Host ""

# Step 8: Countdown
Write-Host "Waiting for deployment to complete..." -ForegroundColor Yellow
Write-Host ""

for ($i = 180; $i -gt 0; $i--) {
    $minutes = [math]::Floor($i / 60)
    $seconds = $i % 60
    Write-Host -NoNewline ("`r  ⏳ Time remaining: {0:D2}:{1:D2}  " -f $minutes, $seconds)
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host ""

# Step 9: Test production
Write-Host "Step 9: Testing production deployment..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Testing website availability..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://www.evoucher.co.za" -Method Head -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Website is live (HTTP 200)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Website returned HTTP $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not reach website yet. May still be deploying..." -ForegroundColor Yellow
}
Write-Host ""

# Step 10: Verification instructions
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "🌐 Production URL:" -ForegroundColor Yellow
Write-Host "   https://www.evoucher.co.za" -ForegroundColor White
Write-Host ""

Write-Host "📋 Manual Verification Required:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1️⃣  Verify PWA:" -ForegroundColor Cyan
Write-Host "   • Open: https://www.evoucher.co.za"
Write-Host "   • Press: F12 → Application → Service Workers"
Write-Host "   • Check: service-worker.js shows 'activated'"
Write-Host "   • Wait: Install prompt appears (30 seconds)"
Write-Host ""

Write-Host "2️⃣  Test Payment:" -ForegroundColor Cyan
Write-Host "   • Sign in to website"
Write-Host "   • Go to: /shop"
Write-Host "   • Add R100 voucher to cart"
Write-Host "   • Checkout with Wallet payment"
Write-Host "   • Complete payment"
Write-Host "   • Save voucher code"
Write-Host ""

Write-Host "3️⃣  Verify Billing Engine:" -ForegroundColor Cyan
Write-Host "   • Open terminal: cd billing-engine-portal"
Write-Host "   • Start portal: npm run dev"
Write-Host "   • Open: http://localhost:5173"
Write-Host "   • Check: Recent Website Transactions"
Write-Host "   • Verify: Your transaction appears"
Write-Host ""

Write-Host "4️⃣  Test on Mobile:" -ForegroundColor Cyan
Write-Host "   • Open site on phone"
Write-Host "   • Install PWA to home screen"
Write-Host "   • Test offline mode"
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔗 Useful Links:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Production Site:" -ForegroundColor Cyan
Write-Host "  https://www.evoucher.co.za" -ForegroundColor White
Write-Host ""
Write-Host "  GitHub Repository:" -ForegroundColor Cyan
Write-Host "  https://github.com/shelod-eng/eVoucher_Website2026" -ForegroundColor White
Write-Host ""
Write-Host "  GitHub Actions:" -ForegroundColor Cyan
Write-Host "  https://github.com/shelod-eng/eVoucher_Website2026/actions" -ForegroundColor White
Write-Host ""
Write-Host "  Vercel Dashboard:" -ForegroundColor Cyan
Write-Host "  https://vercel.com/shelod-engs-projects" -ForegroundColor White
Write-Host ""
Write-Host "  Supabase Dashboard:" -ForegroundColor Cyan
Write-Host "  https://supabase.com/dashboard/project/tfpujpskfyqeikjkzjru" -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎉 Next Steps:" -ForegroundColor Green
Write-Host ""
Write-Host "  1. Open the links above to verify deployment"
Write-Host "  2. Test PWA installation"
Write-Host "  3. Process test payment"
Write-Host "  4. Start Billing Engine portal"
Write-Host "  5. Verify transaction appears"
Write-Host "  6. Take screenshots for backup"
Write-Host "  7. Install PWA on your phone"
Write-Host "  8. Get good sleep!"
Write-Host "  9. CRUSH TOMORROW'S DEMO! 🚀"
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
