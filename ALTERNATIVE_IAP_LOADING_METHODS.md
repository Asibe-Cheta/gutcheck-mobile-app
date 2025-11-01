# Alternative IAP Module Loading Methods

## Current Problem

Standard `require('expo-in-app-purchases')` causes immediate native crash.

## Alternative Approaches to Try

### Method 1: Delayed Loading with setTimeout

Sometimes native modules need the app to be fully initialized first:

```typescript
// Instead of immediate require, wait for app to stabilize
function loadIAPModule(): boolean {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const expoIAP = require('expo-in-app-purchases');
        // ... rest of loading
        resolve(true);
      } catch (error) {
        resolve(false);
      }
    }, 100); // Small delay
  });
}
```

### Method 2: Check Expo Modules Core First

Verify Expo modules core is initialized:

```typescript
import { NativeModulesProxy } from 'expo-modules-core';

// Check if Expo modules are ready
if (NativeModulesProxy.ExpoModulesCore) {
  // Then try loading IAP module
}
```

### Method 3: Use Expo Modules Autoloading

Expo modules have an autoloading mechanism. Instead of manual require:

```typescript
// Let Expo handle module loading
import * as ExpoModules from 'expo-modules-core';

// Check if IAP module is available
const IAPModule = ExpoModules.NativeModulesProxy?.ExpoInAppPurchases;
```

### Method 4: Check Build-Time Linking

The issue might be that the module isn't being linked during EAS build. Check:

1. **EAS Build Logs**: Look for messages about `expo-in-app-purchases`
2. **Pod Installation**: Should see CocoaPods installing the module
3. **Module Registration**: Should see module registered during build

### Method 5: Initialize on App Start (Not Lazy)

Instead of lazy loading, try initializing at app startup:

```typescript
// In _layout.tsx or App.tsx
useEffect(() => {
  // Pre-load IAP module when app starts
  // This might work better than lazy loading
}, []);
```

## Most Promising: Delayed Initialization

Given that the crash happens immediately on `require()`, the module might need:
1. App to be fully initialized
2. React Native bridge to be ready
3. Native modules to be registered

Try wrapping the require in a delay or checking if the bridge is ready first.

## Code to Try

Add this check before require:

```typescript
// Wait for React Native bridge to be ready
const waitForBridge = () => {
  return new Promise((resolve) => {
    if (NativeModules && Object.keys(NativeModules).length > 0) {
      resolve(true);
    } else {
      setTimeout(() => waitForBridge().then(resolve), 50);
    }
  });
};

// Then after bridge is ready:
await waitForBridge();
const expoIAP = require('expo-in-app-purchases');
```

