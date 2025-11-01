# Fix: Module Installed But Not Linked

## Problem Confirmed

**Build 90 Crash Log Analysis:**
- ✅ CocoaPods installed: `EXInAppPurchases (14.5.0)`
- ❌ Module NOT in binary images (still missing)
- ❌ App crashes with `SIGABRT` when trying to use module

**Root Cause:** Module is **installed** (CocoaPods) but **not linked** (not in final binary).

## Solution: Use Expo Prebuild

Expo prebuild generates the native iOS project and ensures modules are properly linked.

### Steps:

1. **Run Prebuild:**
   ```bash
   npx expo prebuild --platform ios --clean
   ```

2. **Verify Module in Podfile:**
   ```bash
   type ios\Podfile | findstr /i "inapppurchase"
   ```
   
   Should see: `pod 'ExpoInAppPurchases'` or similar

3. **Check Xcode Project:**
   - The `ios/` folder will be created
   - Module should be referenced in the project

4. **Commit Native Project:**
   ```bash
   git add ios/
   git commit -m "Add iOS native project with ExpoInAppPurchases linked"
   git push origin main
   ```

5. **Rebuild with EAS:**
   ```bash
   eas build --platform ios --profile production --clear-cache
   ```

6. **Verify in Next Crash Log:**
   - Check `usedImages` section
   - Should see `ExpoInAppPurchases` or `EXInAppPurchases`

## Why Prebuild Works

- Forces native project generation
- Ensures CocoaPods integration
- Links modules into Xcode project
- Includes modules in final binary

## Expected Result

After prebuild + rebuild:
- ✅ Module appears in binary images
- ✅ App doesn't crash (or crashes with different error)
- ✅ IAP functionality works (or shows proper errors)

---

**Action Required:** Run prebuild and rebuild. This should fix the linking issue.

