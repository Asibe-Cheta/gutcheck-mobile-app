# Clean Rebuild Instructions

## Problem
Module `expo-in-app-purchases` is installed (CocoaPods) but not linked into final binary.

## Solution: Clean Rebuild

Since we can't run iOS prebuild on Windows, EAS Build will handle it automatically. We need to trigger a clean rebuild.

### Step 1: Trigger Clean Build

```bash
eas build --platform ios --profile production --clear-cache
```

### Step 2: Check Build Logs (Critical!)

In the EAS Build dashboard, check these specific sections:

#### A. Prebuild Phase
- Should see: "Running expo prebuild"
- Look for: Native project generation
- Check: Module autolinking detection

#### B. CocoaPods Installation (Already Confirmed ✅)
- ✅ We know: `Installing EXInAppPurchases (14.5.0)` appears
- This is good - module is being installed

#### C. Xcode Build Phase (NEW - Check This!)
- Look for: Compilation of `ExpoInAppPurchases`
- Look for: Linking errors or warnings
- Check: Does `EXInAppPurchases` appear in linker output?
- Look for: Missing symbol errors related to IAP

#### D. Linker Phase (Critical!)
- Look for: Final binary creation
- Check: Does `ExpoInAppPurchases` framework/library appear?
- Look for: Warnings about missing frameworks

### Step 3: What to Look For

**Good Signs:**
- ✅ Module compiles successfully
- ✅ No linker errors
- ✅ Module framework included in final binary

**Bad Signs:**
- ❌ Linking errors mentioning `ExpoInAppPurchases`
- ❌ Missing symbol errors
- ❌ Framework not found warnings
- ❌ Module not in linker output

### Step 4: After Build

1. **Test the build** in TestFlight
2. **If it still crashes**, get new crash log
3. **Check `usedImages` section** - should now include `ExpoInAppPurchases` or `EXInAppPurchases`
4. **Share findings** - especially linker errors if any

## Alternative: If Clean Rebuild Doesn't Work

If module still doesn't link, we may need to:

1. **Check Expo SDK 54 compatibility** - known issue?
2. **Contact Expo Support** - autolinking bug?
3. **Try explicit prebuild** on macOS machine
4. **Consider alternative** - `expo-purchases` (RevenueCat) instead

---

**Action**: Run clean build and carefully check the Xcode build/linker phase logs for any errors or warnings related to `ExpoInAppPurchases`.

