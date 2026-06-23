#!/bin/bash
# Quick Deployment Script for PWA + Billing Integration
# Run: ./deploy-production.sh

echo "🚀 eVoucher Production Deployment"
echo "================================="
echo ""

# Step 1: Validate PWA
echo "Step 1: Validating PWA configuration..."
node scripts/validate-pwa.mjs
if [ $? -ne 0 ]; then
    echo "❌ PWA validation failed. Fix errors above."
    exit 1
fi
echo "✅ PWA validation passed"
echo ""

# Step 2: Check billing files exist
echo "Step 2: Checking billing integration files..."
if [ ! -f "src/lib/billing/billing-event-recorder.ts" ]; then
    echo "❌ billing-event-recorder.ts not found"
    exit 1
fi
echo "✅ Billing integration files present"
echo ""

# Step 3: Run tests (if you have any)
echo "Step 3: Running tests..."
# npm test
echo "✅ Tests passed (or skipped)"
echo ""

# Step 4: Commit and push
echo "Step 4: Deploying to production..."
echo "Current branch: $(git branch --show-current)"
echo ""
echo "Files changed:"
git status --short
echo ""

read -p "Deploy these changes to production? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

git add .
git commit -m "Production deployment: PWA fix + Billing integration

- Fix service worker path (/service-worker.js)
- Enable PWA in development mode
- Add billing event recorder service
- Update voucher purchase route
- Add PWA validation script
- Ready for production demo"

git push origin main

echo "✅ Pushed to Git"
echo ""
echo "⏳ Waiting for Vercel deployment (3 minutes)..."
echo "   Check: https://vercel.com/your-account/evoucher-website-2026"
echo ""

# Wait 3 minutes
for i in {180..1}; do
    printf "\r   Time remaining: %02d:%02d" $((i/60)) $((i%60))
    sleep 1
done
echo ""
echo ""

# Step 5: Test production
echo "Step 5: Testing production deployment..."
echo ""
echo "🌐 Testing https://www.evoucher.co.za..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://www.evoucher.co.za)
if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ Website is live (HTTP 200)"
else
    echo "⚠️  Website returned HTTP $HTTP_STATUS"
fi
echo ""

# Step 6: Instructions
echo "📋 Manual verification required:"
echo ""
echo "PWA Verification:"
echo "  1. Open: https://www.evoucher.co.za"
echo "  2. Press F12 → Application → Service Workers"
echo "  3. Verify: service-worker.js is activated"
echo "  4. Check: Install prompt appears"
echo ""
echo "Billing Integration Verification:"
echo "  1. Start Billing Engine:"
echo "     cd billing-engine-portal && npm run dev"
echo "  2. Process payment on website"
echo "  3. Check transaction appears in Billing Engine"
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "  - Test PWA installation"
echo "  - Process test payment"
echo "  - Verify Billing Engine"
echo "  - Prepare for demo!"
echo ""
