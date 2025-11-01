# Native Module Crash Investigation

## Current Status

❌ **App crashes when tapping subscription with native module enabled**
✅ **App works with bypass enabled (mock products)**

## The Problem

When `BYPASS_IAP_NATIVE_MODULE = false`, the app crashes when:
1. User taps "Subscription" button
2. Subscription screen tries to load
3. `require('expo-in-app-purchases')` is called
4. Native-level crash occurs (can't be caught by JavaScript try-catch)

## Root Cause Hypothesis

The native module `expo-in-app-purchases` is crashing at the native level, which suggests:

1. **Module not properly linked** - Native code not included in EAS build
2. **Missing iOS capability** - In-App Purchase capability not enabled
3. **SDK compatibility** - expo-in-app-purchases version incompatible with Expo SDK 54
4. **Build configuration** - EAS build not including native dependencies correctly

## Investigation Steps

### Step 1: Verify Package Installation

```bash
npm list expo-in-app-purchases
```

Should show: `expo-in-app-purchases@14.5.0`

### Step 2: Check Expo Doctor

```bash
npx expo doctor
```

Look for any compatibility warnings or issues with `expo-in-app-purchases`.

### Step 3: Verify App Config

Check `app.config.js` includes the plugin:

```javascript
plugins: [
  'expo-in-app-purchases',
  // ... other plugins
]
```

### Step 4: Check EAS Build Logs

1. Go to EAS Build dashboard
2. Check latest iOS build logs
3. Look for:
   - Errors about `expo-in-app-purchases`
   - CocoaPods installation issues
   - Native module linking failures

### Step 5: Verify iOS Capabilities

In App Store Connect:
1. Check if In-App Purchase capability is enabled
2. This should be automatic, but verify

## Potential Solutions

### Solution 1: Use Expo Prebuild

Sometimes native modules need explicit prebuild:

```bash
npx expo prebuild --platform ios --clean
```

Then rebuild with EAS.

### Solution 2: Check Package Version Compatibility

Current:
- Expo SDK: 54.0.17
- expo-in-app-purchases: 14.5.0

Verify compatibility:
- Check [expo-in-app-purchases documentation](https://docs.expo.dev/versions/latest/sdk/in-app-purchases/)
- Ensure version matches SDK 54 requirements

### Solution 3: Verify Native Module Linking

Check if module is in build:
1. Build app with EAS
2. Download .ipa
3. Extract and check if native libraries include IAP module
4. Or check build logs for module inclusion

### Solution 4: Check iOS Deployment Target

Some native modules require minimum iOS version:
- Check `ios.deploymentTarget` in `app.config.js`
- Ensure it's compatible with expo-in-app-purchases requirements

### Solution 5: Alternative - RevenueCat

If native module continues to fail, consider:
- Using `expo-purchases` (RevenueCat SDK)
- More reliable, cross-platform, easier to debug
- Requires RevenueCat account (free tier available)

## Immediate Workaround

**Current State**: Bypass is enabled, app works with mock products
- ✅ No crashes
- ✅ UI works
- ✅ Can submit app version
- ❌ Real IAP won't work until native module fixed

**For Submission**: 
- App can be submitted with IAP ready to enable
- Once native module is fixed, enable it and resubmit
- OR submit and enable IAP in a follow-up update

## Testing Strategy

### Test 1: Isolate the Crash
1. Create minimal test screen that ONLY calls `require('expo-in-app-purchases')`
2. Navigate to it
3. If crashes, confirms native module issue
4. Check logs for specific native error

### Test 2: Check Build Configuration
1. Check `eas.json` for iOS build configuration
2. Verify native dependencies are included
3. May need `"expo": { "plugins": ["expo-in-app-purchases"] }` in build profile

### Test 3: Verify with Fresh Build
1. Clean build cache
2. Fresh EAS build
3. Test again

## Next Actions

1. ✅ Revert bypass to prevent crashes (DONE)
2. ⏳ Check EAS build logs for native module errors
3. ⏳ Verify app.config.js plugin configuration
4. ⏳ Run `npx expo doctor` to check compatibility
5. ⏳ Consider alternative IAP solution if issue persists

## Decision Point

If native module continues to crash after investigation:
- **Option A**: Fix native linking (may require Expo SDK upgrade/downgrade)
- **Option B**: Use RevenueCat (`expo-purchases`) instead
- **Option C**: Submit app without IAP, enable in update once fixed

## Reference

- [expo-in-app-purchases docs](https://docs.expo.dev/versions/latest/sdk/in-app-purchases/)
- [EAS Build troubleshooting](https://docs.expo.dev/build/troubleshooting/)
- [Native module linking](https://docs.expo.dev/bare/installing-unimodules/)

