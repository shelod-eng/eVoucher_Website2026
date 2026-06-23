# Quick Install to Android Studio Emulator

## Install Command

```powershell
cd "C:\Users\mpeta\Desktop\eVoucher_Builds\June2026_Builds\21-June-2026 APK Builds"
adb install -r eVoucher_APK_Build_22-June2026.apk
```

## If app already installed, uninstall first:

```powershell
adb uninstall com.mpetalebo.evoucher
adb install -r eVoucher_APK_Build_22-June2026.apk
```

## Launch app after install:

```powershell
adb shell am start -n com.mpetalebo.evoucher/.MainActivity
```

## One-liner (uninstall + install + launch):

```powershell
adb uninstall com.mpetalebo.evoucher; adb install -r eVoucher_APK_Build_22-June2026.apk; adb shell am start -n com.mpetalebo.evoucher/.MainActivity
```
