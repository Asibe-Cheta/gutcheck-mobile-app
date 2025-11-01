# IAP Native Module Crash Investigation

## Problem
The `expo-in-app-purchases` native module causes the app to crash when `require('expo-in-app-purchases')` is called, even in TestFlight/production builds.

## Current Status
- ✅ App loads subscription screen (with bypass)
- ✅ Mock products display correctly
- ❌ Native module crashes when loaded
- ⚠️ IAP functionality disabled with bypass flag

## Possible Root Causes

### 1. Native Module Not Properly Linked
- **Check**: Ensure `expo-in-app-purchases` is properly installed and linked
- **Solution**: May need to run `npx pod-install` or rebuild from scratch

### 2. Expo SDK Compatibility
- **Current**: Expo SDK 54, `expo-in-app-purchases@14.5.0`
- **Check**: Verify compatibility between SDK version and IAP package version
- **Solution**: Run `expo doctor` to check for compatibility issues

### 3. Missing Native Dependencies
- **Check**: iOS native code may not be included in EAS build
- **Solution**: May need to ensure the package is in `dependencies` (not `devDependencies`)

### 4. Build Configuration Issue
- **Check**: EAS build may not be including native modules correctly
- **Solution**: May need to use `expo prebuild` or check `app.config.js` plugins

### 5. Missing iOS Capabilities
- **Check**: In-App Purchase capability may not be enabled in Xcode
- **Solution**: May need to add capability in App Store Connect or Xcode project

## Investigation Steps

1. **Check Expo Doctor**:
   ```bash
   npx expo doctor
   ```

2. **Verify Package Installation**:
   ```bash
   npm list expo-in-app-purchases
   ```

3. **Check Build Logs**:
   - Look for errors related to native module linking
   - Check if CocoaPods dependencies are installed
   - Verify iOS build includes the module

4. **Test Module Loading**:
   - Add more detailed logging before the require() call
   - Check if the crash happens during module resolution or initialization

5. **Alternative Approach**:
   - Consider using `expo-purchases` (RevenueCat) instead
   - Or manually implement IAP with React Native StoreKit

## Current Workaround
- `BYPASS_IAP_NATIVE_MODULE = true` prevents crashes
- Mock products allow UI testing
- Purchase attempts show error message

## Next Steps
1. Run `expo doctor` to check for issues
2. Review EAS build logs for native linking errors
3. Consider alternative IAP implementation if module continues to fail

