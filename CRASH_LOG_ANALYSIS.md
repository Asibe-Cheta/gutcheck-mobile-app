# Crash Log Analysis - Build 71 (Oct 31, 2025)

## Critical Findings

### 1. Exception Type
```
Exception Type: EXC_BAD_ACCESS
Subtype: KERN_INVALID_ADDRESS at 0x000000000000000d
```

**What this means:**
- Trying to access memory at address `0xd` (13 in decimal)
- This is a **null pointer dereference** or **uninitialized variable**
- The address is extremely small, suggesting a null pointer being used as an offset

### 2. Crash Location
**Faulting Thread**: Thread 6 (`com.facebook.react.runtime.JavaScript`)

**Stack Trace shows:**
- Crash happens in **Hermes JavaScript engine** (not native IAP module)
- `hermes::vm::HadesGC::writeBarrierSlow` - Garbage collector trying to write
- `hermes::vm::JSObject::addOwnPropertyImpl` - Adding property to JavaScript object
- `hermes::vm::Arguments::create` - Creating function arguments
- `hermes::vm::Interpreter::reifyArgumentsSlowPath` - Converting native arguments to JS
- `hermes::vm::Interpreter::interpretFunction` - Executing JavaScript function

**This means:**
- The crash is happening **during JavaScript execution**, not native module loading
- It's happening when trying to create function arguments or add properties to an object
- This could be happening when a native module **returns data to JavaScript**

### 3. CRITICAL DISCOVERY: No ExpoInAppPurchases Module!

Looking at the `usedImages` section (loaded binaries), I **DO NOT SEE**:
- `ExpoInAppPurchases`
- `expo-in-app-purchases`
- Any IAP-related native module

**This means:**
- The `expo-in-app-purchases` native module is **NOT linked in the build**
- The crash is happening **before** or **during** native module initialization
- OR the crash is happening in JavaScript code that's trying to use the module

### 4. Thread 5 (Secondary Issue)
Thread 5 also shows problems:
- `facebook::react::TurboModuleConvertUtils::convertNSArrayToJSIArray`
- `convertNSExceptionToJSError`
- `ObjCTurboModule::performVoidMethodInvocation`

**This suggests:**
- A native module call is failing
- Native exception is being converted to JavaScript error
- The conversion process itself is crashing

### 5. Build Information
- **Build Version**: 71
- **Date**: Oct 31, 2025 19:39:13
- **iOS Version**: 18.7.1
- **Device**: iPhone 15 (iPhone15,4)

---

## Root Cause Hypothesis

### Most Likely: Native Module Not Linked

The crash suggests:
1. JavaScript code tries to call IAP module
2. Native module isn't actually linked/loaded (missing from binary images)
3. The call fails and tries to convert the error to JavaScript
4. During error conversion, a null pointer is dereferenced
5. App crashes

### Why Module Might Not Be Linked

1. **EAS Build Configuration**:
   - Module might not be included in the build
   - CocoaPods might not be installing the dependency
   - Native module autolinking might be failing

2. **Expo SDK 54 Issue**:
   - The module might need explicit configuration
   - Autolinking might not work as expected

3. **Package Installation**:
   - Package installed but not properly linked
   - Native code not included in build

---

## What to Check

### 1. Check EAS Build Logs

Look in EAS Build dashboard for:
- CocoaPods installation messages
- Warnings about `expo-in-app-purchases`
- Missing module errors
- Native linking failures

### 2. Check if Module is in Build

The crash log should list `ExpoInAppPurchases` in `usedImages` if it's linked. Since it's missing:
- Module is definitely not in the build
- This is a **build configuration issue**, not a code issue

### 3. Verify Package Installation

```bash
npm list expo-in-app-purchases
```

Should show: `expo-in-app-purchases@14.5.0`

### 4. Check Native Dependencies

EAS Build should show:
```
Installing CocoaPods dependencies
...
Installing ExpoInAppPurchases (14.5.0)
...
```

---

## Solution Steps

### Step 1: Verify Package in package.json ✅
- Already present: `"expo-in-app-purchases": "^14.5.0"`

### Step 2: Check EAS Build Logs
- Go to EAS Build dashboard
- Check the latest iOS build (build 71 or newer)
- Look for CocoaPods installation section
- Check if `ExpoInAppPurchases` is being installed

### Step 3: Try Explicit Prebuild (If Needed)
If the module isn't being linked, might need:
```bash
npx expo prebuild --platform ios --clean
```
Then rebuild with EAS.

### Step 4: Check app.config.js
- Verify no conflicting plugin configurations
- Make sure module isn't being excluded

### Step 5: Force Native Module Inclusion
If autolinking fails, might need to:
- Check `ios/Podfile` (after prebuild)
- Verify `ExpoInAppPurchases` is listed
- Manually add if missing

---

## Next Actions

1. **Check EAS Build logs** for build 71 (or latest)
2. Look for CocoaPods installation messages
3. Verify if `ExpoInAppPurchases` appears in the build process
4. If missing, that's the root cause - module isn't being included in the build

---

## Important Notes

- **The crash is NOT in the IAP module itself** (it's not even loaded)
- **The crash IS in JavaScript/React Native bridge** trying to handle a missing module
- **This is a build/linking issue**, not a code issue
- Once the module is properly linked, the crash should stop

---

**Bottom Line**: The native module is missing from the build. We need to fix the build configuration to include it.

