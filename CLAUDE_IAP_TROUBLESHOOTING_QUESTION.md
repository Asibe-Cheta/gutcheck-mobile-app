# IAP Native Module Crash - Complete Troubleshooting Context

## Problem Statement

I'm using `expo-in-app-purchases@14.5.0` in an Expo SDK 54 app. When I try to load the native module by calling `require('expo-in-app-purchases')`, the app crashes immediately at the native iOS level. The crash cannot be caught by JavaScript try-catch blocks, indicating it's happening during native module initialization.

**Critical Requirement**: IAP must work for App Store approval - this is blocking app submission.

## Environment Details

- **Expo SDK**: 54.0.21 (just updated from 54.0.17)
- **expo-in-app-purchases**: 14.5.0
- **Platform**: iOS (TestFlight builds)
- **Build System**: EAS Build
- **React Native**: 0.81.5
- **Node**: (check with `node --version`)
- **App**: React Native app using Expo Router

## Current Implementation

### Code Location: `src/lib/appleIAPService.ts`

```typescript
// Bypass flag to prevent crashes
const BYPASS_IAP_NATIVE_MODULE = true; // Set to false causes crash

function loadIAPModule(): boolean {
  if (BYPASS_IAP_NATIVE_MODULE) {
    return false; // Bypass to prevent crash
  }
  
  try {
    if (!isExpoGo) {
      console.log('[IAP] Attempting to require expo-in-app-purchases...');
      let expoIAP: any = null;
      try {
        // THIS LINE CAUSES CRASH:
        expoIAP = require('expo-in-app-purchases');
        // Crash happens here - never reaches next line
      } catch (requireError: any) {
        // This catch never fires - crash is native-level
        console.error('[IAP] ❌ require() failed:', requireError);
        throw requireError;
      }
      // ... rest of initialization
    }
  } catch (error) {
    // This catch also never fires
    console.error('[IAP] expo-in-app-purchases not available:', error);
    InAppPurchases = null;
  }
  
  return !!InAppPurchases;
}
```

### When Crash Occurs

1. User taps "Subscription" button in app
2. Navigation to subscription screen
3. Component mounts and calls `useSubscriptionStore()`
4. Store calls `getIAPService()` which imports `appleIAPService.ts`
5. First call to any IAP method triggers `loadIAPModule()`
6. **CRASH**: `require('expo-in-app-purchases')` causes immediate native crash
7. App terminates (not caught by any JavaScript error handler)

## What I've Already Tried

### 1. Package Updates ✅
- Updated Expo SDK from 54.0.17 to 54.0.21
- Updated expo-router from 6.0.13 to ~6.0.14
- Updated React Navigation packages to match SDK requirements
- Verified `expo-in-app-purchases@14.5.0` is installed correctly

### 2. App Configuration ✅
- Initially tried adding `'expo-in-app-purchases'` to `plugins` array in `app.config.js`
- **Result**: Build failed with "Unable to resolve a valid config plugin"
- **Fix**: Removed from plugins (expo-in-app-purchases auto-links in SDK 54+)
- Config now validates correctly

### 3. Lazy Loading ✅
- Module is lazy-loaded (not imported at module evaluation time)
- Only loaded when IAP methods are actually called
- Tried wrapping `require()` in multiple try-catch blocks
- **Result**: Crash still happens - native-level crash bypasses JavaScript error handling

### 4. Bypass Flag - Circular Problem ⚠️
- Created `BYPASS_IAP_NATIVE_MODULE` flag to toggle IAP module loading
- **When `BYPASS_IAP_NATIVE_MODULE = true`**:
  - ✅ App works perfectly
  - ✅ Subscription screen loads without crashing
  - ✅ Mock products display correctly
  - ❌ Shows error message: "IAP functionality is currently disabled for testing"
  - ❌ Cannot test real IAP purchases
  - ❌ App Store will reject because IAP doesn't work
  
- **When `BYPASS_IAP_NATIVE_MODULE = false`**:
  - ❌ App crashes immediately when user taps "Subscription" button
  - ❌ Crash happens at native level (not catchable by JavaScript)
  - ❌ App terminates completely
  - ❌ No way to test IAP functionality

**This creates a circular problem**: 
- We MUST enable IAP for App Store approval
- But enabling IAP causes the app to crash
- So we're stuck: Can't submit without IAP, but can't enable IAP without crashing

**We've repeatedly tried:**
1. Enable IAP (`BYPASS_IAP_NATIVE_MODULE = false`) → App crashes
2. Disable IAP (`BYPASS_IAP_NATIVE_MODULE = true`) → App works but IAP doesn't function
3. This cycle has repeated multiple times with no resolution

### 5. App Store Connect Setup ✅
- Subscriptions created in App Store Connect
- Product IDs match code: `com.gutcheck.app.premium.monthly` and `com.gutcheck.app.premium.yearly`
- Subscriptions are "Ready to Submit"
- All metadata complete (pricing, localization, Review Notes)
- Subscription group localized

### 6. iOS Capability ✅
- **In-App Purchase capability is ENABLED** in Apple Developer Portal
- Verified in Certificates, Identifiers & Profiles → Identifiers → com.gutcheck.app
- This is NOT the issue - capability was enabled from the start

## Current Status

### Working ✅
- App builds successfully with EAS
- App runs in TestFlight
- Subscription screen loads (with bypass enabled)
- Mock products display correctly
- Navigation works
- All other app functionality works

### Not Working ❌
- Native IAP module crashes when `require('expo-in-app-purchases')` is called
- Cannot test real IAP purchases
- App Store approval blocked

## Build Configuration

### `app.config.js`
```javascript
module.exports = {
  expo: {
    name: 'GutCheck',
    slug: 'gutcheck',
    version: '1.0.0',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.gutcheck.app',
      buildNumber: '34',
    },
    plugins: [
      'expo-router',
      // expo-in-app-purchases auto-links in SDK 54+ (no plugin needed)
    ],
  },
};
```

### `eas.json`
```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "env": {
        "EAS_ENABLE_EXPO_DOCTOR": "0",
        "EXPO_PUBLIC_APP_ENV": "production"
      }
    }
  }
}
```

### `package.json` (relevant dependencies)
```json
{
  "dependencies": {
    "expo": "54.0.21",
    "expo-in-app-purchases": "^14.5.0",
    "expo-router": "~6.0.14",
    "react-native": "0.81.5"
  }
}
```

## What I Need Help With

### Primary Question
**Why does `require('expo-in-app-purchases')` cause an immediate native-level crash in EAS-built iOS apps, and how can I fix it?**

### Specific Questions
1. Is `expo-in-app-purchases@14.5.0` compatible with Expo SDK 54.0.21?
2. Does the module need any special configuration in `app.config.js` beyond auto-linking?
3. Are there known issues with this module version that require workarounds?
4. Should I use a different import method instead of `require()`?
5. Could this be an EAS Build configuration issue?
6. Do I need to enable any iOS capabilities manually in App Store Connect?
7. Could this be a React Native 0.81.5 compatibility issue?

## Error Information

**Unfortunately, I don't have specific crash logs because:**
- The crash is native-level (not JavaScript)
- No error messages appear in console before crash
- App terminates immediately
- TestFlight crash reports may exist but I haven't checked them yet

**What I've observed:**
- Crash happens synchronously when `require()` is called
- No JavaScript error is thrown (try-catch doesn't catch it)
- App terminates completely (not just an error state)
- Happens in TestFlight builds (production-like environment)
- Does NOT happen in Expo Go (module not available there anyway)

## Attempted Solutions Summary

1. ❌ Added to plugins array → Build failed
2. ✅ Removed from plugins → Build succeeds
3. ✅ Updated packages (SDK 54.0.17 → 54.0.21) → Testing now, may still crash
4. ✅ Lazy loading → Still crashes
5. ✅ Multiple try-catch blocks → Still crashes (native-level)
6. ⚠️ **Bypass flag creates circular problem**:
   - Enable (`false`): App crashes, unusable
   - Disable (`true`): App works but IAP non-functional, App Store will reject
   - We're stuck in this loop with no solution

**Critical Issue**: We've been going in circles because:
- Every attempt to enable IAP results in crash
- Disabling IAP prevents crash but makes IAP non-functional
- App Store requires functional IAP for approval
- We cannot break out of this cycle

## Next Steps I'm Considering

1. Check TestFlight crash logs in App Store Connect
2. Try `expo prebuild --platform ios --clean` and rebuild
3. Check if iOS In-App Purchase capability is enabled in App Store Connect
4. Verify EAS build logs for native module linking errors
5. Consider alternative: `expo-purchases` (RevenueCat) instead
6. Check if there's a minimum iOS deployment target issue

## Critical Constraints

- **Must work for App Store approval** - cannot submit without functional IAP
- **Using EAS Build** - no local Xcode access for debugging
- **Time-sensitive** - blocking app launch
- **Subscriptions already configured** - switching solutions would require reconfiguring

## Files to Review

- `src/lib/appleIAPService.ts` - Main IAP service implementation
- `src/lib/stores/subscriptionStore.ts` - Zustand store using IAP service
- `src/app/subscription.tsx` - Subscription screen component
- `app.config.js` - Expo configuration
- `eas.json` - EAS Build configuration
- `package.json` - Dependencies

## Additional Context

The app was previously using Stripe for payments, but switched to Apple IAP for iOS. All Stripe code has been removed/disabled. The subscription flow is:
1. User navigates to subscription screen
2. Screen loads subscription plans from store
3. User taps "Subscribe"
4. Store calls `appleIAPService.purchaseProduct()`
5. **CRASH**: Happens when service tries to load native module

### The Circular Problem Explained

We are stuck in a development loop:

**Attempt 1**: Enable IAP (`BYPASS_IAP_NATIVE_MODULE = false`)
- Rebuild app
- Test in TestFlight
- User taps "Subscription"
- **Result**: Immediate crash, app unusable

**Attempt 2**: Disable IAP (`BYPASS_IAP_NATIVE_MODULE = true`)  
- Rebuild app
- Test in TestFlight
- User taps "Subscription"
- **Result**: App works, but shows "IAP functionality is currently disabled"
- **Problem**: Apple will reject because IAP doesn't function

**Attempt 3-N**: Repeated attempts to fix the crash
- Updated packages
- Changed app.config.js
- Modified import methods
- **Result**: Still crashes when enabled, still non-functional when disabled

**Current State**: We've tried multiple iterations but cannot break out of this loop. The crash is reproducible every time IAP is enabled, and the only way to prevent the crash is to disable IAP, which makes the app non-compliant for App Store submission.

---

**Please provide:**
1. Specific steps to diagnose the crash (how to get crash logs)
2. Known compatibility issues with this setup
3. Recommended fix or workaround
4. Alternative solutions if fix is not possible

Thank you!

