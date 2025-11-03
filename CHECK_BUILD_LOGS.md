# Checking EAS Build Logs for Native Module Linking

After the clean rebuild completes, check the EAS build logs for these critical sections:

## 1. Prebuild Phase
**What to look for:**
- Search for "expo-in-app-purchases" or "ExpoInAppPurchases"
- Should see: `✓ expo-in-app-purchases` in the prebuild output
- Should NOT see any errors about missing native modules

## 2. CocoaPods Installation
**What to look for:**
- Search for "Installing ExpoInAppPurchases"
- Should see: `Installing ExpoInAppPurchases (X.X.X)`
- Should see the pod being added to `ios/Podfile`

## 3. Xcode Build Phase - Linking
**What to look for:**
- Search for "Ld" or "Linking"
- Should see references to `ExpoInAppPurchases` in the linker command
- Look for: `-framework ExpoInAppPurchases` or similar
- Should NOT see "undefined symbol" errors for `ExpoInAppPurchases`

## 4. Final Binary Check
**What to look for:**
- Search for "ExpoInAppPurchases.framework" or "libExpoInAppPurchases"
- Should see the framework/library being copied into the app bundle

## What Success Looks Like

If linking is successful, you should see:
1. ✅ Prebuild includes `expo-in-app-purchases`
2. ✅ CocoaPods installs `ExpoInAppPurchases`
3. ✅ Linker includes `ExpoInAppPurchases` framework
4. ✅ No undefined symbol errors
5. ✅ Framework included in final app bundle

## What Failure Looks Like

If linking fails, you might see:
1. ❌ Prebuild skips or errors on `expo-in-app-purchases`
2. ❌ CocoaPods installs but doesn't link
3. ❌ Linker reports "undefined symbol" for `ExpoInAppPurchases`
4. ❌ Framework missing from app bundle

## After the Build

1. **If build succeeds:** Upload to TestFlight and test the subscription screen
2. **If build succeeds but app still crashes:** Check the new crash log - if `ExpoInAppPurchases` is still missing from `usedImages`, the linking issue persists
3. **If build fails:** Share the EAS build log error message

