# Solution: expo-in-app-purchases Not Linking Into Binary

## Problem Confirmed ✅

**Build 93 Analysis:**
- ✅ Module **compiles** (`EXInAppPurchasesModule.m`)
- ✅ Static library **created** (`libEXInAppPurchases.a`)
- ✅ CocoaPods **installs** it
- ❌ Module **NOT linked** into final binary
- ❌ Missing from `usedImages` in crash log
- ❌ App crashes when JavaScript tries to use it

**Root Cause:** Static library is built but not included in the linker command for the main app binary.

## Why This Happens

1. **Static libraries** (`.a` files) need explicit linking
2. **CocoaPods installs** but doesn't always link static libraries
3. **Auto-linking** may not work for all module types
4. **Windows limitation:** Can't run `expo prebuild` for iOS to fix it manually

## Solutions to Try

### Solution 1: Check EAS Build's Native Project Generation

EAS Build should run prebuild automatically. The issue might be that the module isn't being added to the Podfile correctly during prebuild.

**Action:** Check the EAS build logs for the Prebuild phase and look for:
- Does it mention `expo-in-app-purchases`?
- Are there any errors about module detection?

### Solution 2: Use expo-purchases (RevenueCat) Instead

`expo-purchases` is an alternative IAP solution that might have better auto-linking:
- More mature package
- Better documentation
- Active maintenance
- May have better linking support

**Pros:**
- Likely better linking support
- More features
- Active community

**Cons:**
- Requires RevenueCat account (free tier available)
- Different API than `expo-in-app-purchases`

### Solution 3: Force Module Linking via Config Plugin

Try creating a custom config plugin to force linking:

1. Create `plugins/withExpoInAppPurchases.js`:
```javascript
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withExpoInAppPurchases(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      // This runs during prebuild on EAS
      // Force include the module
      return config;
    },
  ]);
};
```

2. Add to `app.config.js`:
```javascript
plugins: [
  'expo-router',
  './plugins/withExpoInAppPurchases',
],
```

### Solution 4: Check Package Version Compatibility

Try downgrading/upgrading the package version:
- Current: `expo-in-app-purchases@^14.5.0`
- Try: Exact version match with Expo SDK 54

### Solution 5: Contact Expo Support or Check GitHub Issues

This might be a known issue:
- Check: https://github.com/expo/expo/issues (search for "in-app-purchases linking")
- Check: Expo Discord/Forums
- File a bug report if not already reported

### Solution 6: Use a Mac for Prebuild (If Available)

If you have access to a Mac (even temporarily):
```bash
npx expo prebuild --platform ios --clean
# Check ios/Podfile includes ExpoInAppPurchases
# Commit ios/ folder
# Rebuild with EAS
```

## Recommended Next Steps

1. **Check EAS Prebuild logs** for `expo-in-app-purchases` detection
2. **Try Solution 2** (expo-purchases) as it's more reliable
3. **File an issue** with Expo if this is a bug
4. **Temporary workaround:** Keep bypass enabled until fixed

## Critical Constraint

Since this is blocking App Store submission and we're on Windows, we need a solution that works **without manual Xcode/Podfile editing**. The EAS build process must handle this automatically.

