# Fix: Native Module Not Linked in Build

## Root Cause Confirmed ✅

The crash log analysis proves:
- **`ExpoInAppPurchases` is NOT in the binary images** (not linked in build)
- Crash happens when JavaScript tries to use the missing module
- This is a **build configuration issue**, not a code issue

## Solution Steps

### Step 1: Verify Package Installation ✅

Package is already in `package.json`:
```json
"expo-in-app-purchases": "^14.5.0"
```

### Step 2: Check EAS Build Logs

1. Go to [EAS Build Dashboard](https://expo.dev/accounts/[your-account]/projects/gutcheck-app/builds)
2. Open the latest iOS build (build 71 or newer)
3. Look for the **CocoaPods installation** section
4. Search for `ExpoInAppPurchases` or `expo-in-app-purchases`

**What to look for:**
- ✅ Good: `Installing ExpoInAppPurchases (14.5.0)`
- ❌ Bad: Module not mentioned at all
- ❌ Bad: Errors about missing module

### Step 3: Force Native Module Linking

If the module isn't being installed, try explicit configuration:

#### Option A: Add to `app.config.js` Plugins (Try This First)

Even though we removed it before, let's try a different approach:

```javascript
plugins: [
  'expo-router',
  [
    // Try with explicit config plugin (if it exists)
    '@expo/config-plugins',
    {
      // Empty config - just force inclusion
    }
  ],
],
```

Actually, **don't do that** - let's try Option B instead.

#### Option B: Verify Auto-Linking is Working

Expo SDK 54 should auto-link, but let's verify:

1. Check if `expo-modules-autolinking` is working:
```bash
npx expo config --type public
```

Look for native modules listed.

#### Option C: Use Expo Prebuild (Nuclear Option)

Force native project generation to ensure linking:

```bash
# Generate iOS native project
npx expo prebuild --platform ios --clean

# Check if module appears in Podfile
cat ios/Podfile | grep -i "in-app-purchase"

# If it's there, rebuild with EAS
# If it's NOT there, that's the problem
```

**WARNING**: Prebuild creates `ios/` and `android/` folders. You'll need to:
1. Commit these folders (they're needed for native modules)
2. Or use `--no-install` and let EAS handle it

### Step 4: Check if Module Needs Explicit Pod Installation

In some cases, even with auto-linking, the module needs to be explicitly listed.

If you run prebuild, check `ios/Podfile`:
- Should see: `pod 'ExpoInAppPurchases'` or similar
- If missing, that's the issue

### Step 5: Alternative: Verify in Build Logs

Before trying prebuild, check EAS build logs for:

1. **CocoaPods update/install section**:
   ```
   Running pod install...
   Installing ExpoInAppPurchases (14.5.0)
   ```

2. **Module registration**:
   ```
   Registering module: ExpoInAppPurchases
   ```

3. **Build warnings**:
   ```
   warning: module 'ExpoInAppPurchases' not found
   ```

---

## Immediate Action Plan

### Right Now (Before Next Build):

1. **Check latest EAS build logs** (build 71 or latest)
   - Look for CocoaPods installation
   - Search for "ExpoInAppPurchases" or "in-app-purchase"
   - Screenshot or copy relevant sections

2. **Verify package is installed**:
   ```bash
   npm list expo-in-app-purchases
   ```
   Should show: `expo-in-app-purchases@14.5.0`

3. **Try expo doctor**:
   ```bash
   npx expo doctor
   ```
   Look for any warnings about `expo-in-app-purchases`

### Next Build:

4. **Try clean rebuild**:
   ```bash
   eas build --platform ios --profile production --clear-cache
   ```

5. **If still fails, try prebuild approach**:
   - Run `npx expo prebuild --platform ios --clean`
   - Check if module appears in `ios/Podfile`
   - If missing, we know autolinking is broken

---

## Expected Fix

Once the module is properly linked:
1. `ExpoInAppPurchases` will appear in binary images in crash logs
2. `require('expo-in-app-purchases')` will work instead of crashing
3. IAP functionality will work

---

## Why This Happened

Possible reasons:
1. **Expo SDK 54 autolinking bug** - module not being auto-detected
2. **EAS Build configuration** - missing something that triggers autolinking
3. **Package installation issue** - package installed but not recognized
4. **Native module registration** - module code not being included in build

---

## Next Steps After Checking Logs

Share what you find in EAS build logs:
- Is `ExpoInAppPurchases` mentioned?
- Are there any errors/warnings?
- Does CocoaPods section show it being installed?

Based on that, we'll know if we need:
- Prebuild approach
- Explicit Podfile modification
- Different build configuration
- Package version change

---

**Critical**: The crash log proves the module isn't linked. We need to fix the build process to include it.

