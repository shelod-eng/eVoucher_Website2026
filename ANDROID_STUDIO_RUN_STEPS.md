# Run eVoucher on Android Studio - Step by Step

## Prerequisites Check
✅ Android Studio installed
✅ Pixel 5 API 34 emulator created
✅ APK built: `C:\Users\mpeta\Desktop\eVoucher_Builds\June2026_Builds\21-June-2026 APK Builds\build-*.apk`

---

## Step 1: Start Emulator from Android Studio

1. Open **Android Studio**
2. Click **Device Manager** (phone icon on right sidebar)
3. Find **Pixel 5 API 34** in the list
4. Click the **▶️ Play** button next to it
5. Wait 30-60 seconds for emulator to fully boot (you'll see home screen)

---

## Step 2: Install APK via Drag & Drop (EASIEST)

1. Navigate to: `C:\Users\mpeta\Desktop\eVoucher_Builds\June2026_Builds\21-June-2026 APK Builds\`
2. Find your latest APK file: `build-*.apk`
3. **Drag the APK file** onto the emulator window
4. Wait for "App installed" message (5-10 seconds)
5. Done! App appears in app drawer

---

## Step 3: Launch App

1. Click app drawer icon (⚪ circle at bottom center)
2. Find **eVoucher** app icon
3. Tap to open
4. App should start and show login/home screen

---

## Alternative: Install via Command Line

If drag & drop doesn't work, use PowerShell:

```powershell
# Set paths (run once per session)
$env:Path += ";C:\Users\mpeta\AppData\Local\Android\Sdk\emulator;C:\Users\mpeta\AppData\Local\Android\Sdk\platform-tools"

# Check emulator is running
adb devices

# Install APK (replace with your actual APK filename)
cd "C:\Users\mpeta\Desktop\eVoucher_Builds\June2026_Builds\21-June-2026 APK Builds"
adb install -r build-*.apk
```

---

## Troubleshooting

### Emulator won't start
- **Close and restart Android Studio**
- Check Device Manager shows "Pixel 5 API 34"
- Try: Tools → Device Manager → Click ▶️ again

### "App not installed" error
- Uninstall old version first: `adb uninstall com.mpetalebo.evoucher`
- Then install again: `adb install -r build-*.apk`

### APK installs but app doesn't appear
- Check app drawer (swipe up from bottom)
- Or use: `adb shell am start -n com.mpetalebo.evoucher/.MainActivity`

### Emulator is slow
- Close other apps
- Increase emulator RAM in Device Manager → Edit device → Advanced Settings

---

## Quick Test Checklist

Once app opens:
1. ✅ Login screen appears
2. ✅ Navigate to cart
3. ✅ Click "Proceed to Checkout"
4. ✅ All 9 payment methods visible
5. ✅ Card payment opens modal
6. ✅ Test card: 4111 1111 1111 1111

---

## Demo Payment Flow Test

1. Add item to cart (R100)
2. Go to checkout
3. Select "Card Payment"
4. Enter test card details:
   - Card: `4111 1111 1111 1111`
   - Expiry: `12/28`
   - CVV: `123`
   - Name: `Test User`
5. Click "Pay Now"
6. Verify payment processing

---

**Ready for tomorrow's demo! 🚀**
