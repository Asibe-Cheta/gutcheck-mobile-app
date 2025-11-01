# View TestFlight Crash Logs on Windows

## Method 1: App Store Connect (Web Browser) - EASIEST ✅

You can view crash logs directly in App Store Connect without needing Xcode:

### Step 1: Access Crashes in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Sign in with your Apple Developer account
3. Click **"My Apps"** → Select **"GutCheck App"**
4. Click **"TestFlight"** tab (at the top)
5. Click on your **latest build** (the one with crashes)
6. Scroll down to **"Crashes"** section

### Step 2: View Crash Details

1. You'll see a list of crashes with:
   - Crash count
   - Percentage of sessions affected
   - First/last occurrence dates
   - Crash type (e.g., "EXC_BAD_ACCESS", "SIGABRT")

2. **Click on a crash** to see details:
   - Full crash report
   - Stack trace showing exactly where it crashed
   - Thread information
   - Device/iOS version information

### Step 3: Find IAP-Related Crashes

Look for crashes that mention:
- `expo-in-app-purchases`
- `ExpoInAppPurchasesModule`
- `InAppPurchases`
- `StoreKit`
- Symbols related to IAP module loading

### Step 4: Copy Crash Details

1. The crash report will show:
   - **Exception Type**: e.g., `EXC_BAD_ACCESS`
   - **Exception Subtype**: e.g., `KERN_INVALID_ADDRESS`
   - **Crashed Thread**: Which thread crashed
   - **Stack Trace**: Exact code location of crash

2. **Copy the relevant sections**:
   - Exception details
   - Stack trace (especially lines mentioning expo-in-app-purchases)
   - Any error messages

## Method 2: Device Logs via iTunes/Finder (Mac Alternative, but limited on Windows)

If you have the device connected:
- Windows can't use Xcode, but you can:
  1. Connect iOS device to Windows PC
  2. Use iTunes (older Windows) or Finder (if available)
  3. View device logs (limited functionality)

**Not recommended** - App Store Connect is easier.

## Method 3: Third-Party Crash Reporting

If you add a crash reporting service:
- Firebase Crashlytics
- Sentry
- Bugsnag

These work cross-platform and can show detailed crash logs.

## Method 4: Enhanced App Logging

Since we added enhanced logging to `appleIAPService.ts`:
- The app logs will show before the crash
- Check TestFlight logs in the app itself
- Or use console.log capture to see what happens right before crash

## What to Look For in Crash Logs

### Critical Information:

1. **Exception Type**:
   - `EXC_BAD_ACCESS` = Memory access error
   - `SIGABRT` = Abort signal (usually assertion failure)
   - `EXC_CRASH` = General crash

2. **Stack Trace**:
   - Look for lines containing `ExpoInAppPurchases` or `InAppPurchases`
   - This shows exactly where in the native code it crashed

3. **Thread Information**:
   - Which thread crashed (main thread vs background)
   - Other threads' states

4. **Binary Images**:
   - Shows loaded libraries
   - Verify if `expo-in-app-purchases` native library is loaded

## Example of What You'll See

```
Exception Type: EXC_BAD_ACCESS (SIGSEGV)
Exception Subtype: KERN_INVALID_ADDRESS at 0x0000000000000000
Triggered by Thread: 0

Thread 0 Crashed:
0   libobjc.A.dylib              0x00007fff2018c7a8 objc_msgSend
1   ExpoInAppPurchases          0x0000000101234567 -[EXInAppPurchasesModule init]
2   ExpoModulesCore             0x0000000102345678 ...
```

This shows the crash is happening during module initialization.

## Next Steps After Getting Crash Log

1. **Share the crash log** - Post the stack trace here
2. **Identify the error type** - Tells us what kind of failure
3. **Check module linking** - See if module is in binary images
4. **Targeted fix** - We can fix the specific issue

## If You Can't See Crashes Yet

Crashes appear in App Store Connect after:
- Users install the TestFlight build
- Crashes occur and are reported
- Usually appears within 1-2 hours of crash

**To force a crash** (for testing):
- Enable IAP module
- Tap Subscription button
- Crash should appear in App Store Connect within 1-2 hours

---

**Most Important**: The crash log will show the exact native error that's causing the crash. Without it, we're guessing. With it, we can fix it precisely.

