# View TestFlight Crash Logs on Windows

## The Problem

App Store Connect shows crash entries but clicking on them only offers **"Open in Xcode"**, which requires a Mac. You can't view detailed crash logs in the web browser.

## Solution Options

### Option 1: Get Crash Logs from iOS Device (BEST FOR IMMEDIATE ACCESS) ✅

This is the **easiest and fastest** method:

#### Step 1: On Your iPhone/iPad (where the crash occurred)

1. Open **Settings** app
2. Go to **Privacy & Security** → **Analytics & Improvements** → **Analytics Data**
3. Scroll through the list - look for entries that start with **"GutCheck App"** or **"GutCheck"**
4. The crash logs will have names like:
   - `GutCheck App-2025-10-31-211045.ips`
   - `GutCheck App-2025-10-31-203630.ips`
5. **Tap on the crash log** to open it
6. Tap the **Share** button (top right corner)
7. **Email it to yourself** or save to Files/iCloud

#### Step 2: View on Windows

1. Open the `.ips` file in **Notepad** or **VS Code**
2. It will be raw/un-symbolicated (memory addresses, not function names)
3. Look for these key sections:
   - **Exception Type**: `EXC_BAD_ACCESS`, `SIGABRT`, etc.
   - **Crashed Thread**: Which thread crashed
   - **Stack Trace**: Lines showing where it crashed
   - **Binary Images**: Lists loaded libraries (check if `ExpoInAppPurchases` is present)

#### Step 3: Share the Crash Log

- Copy the **Exception Type** and **Stack Trace** sections
- Share them here - even un-symbolicated, they contain valuable info

### Option 2: Get Crash Logs via iTunes Sync (Windows)

If you have iTunes installed on Windows:

1. Connect your iOS device to Windows PC via USB
2. Open **iTunes** (if you have it)
3. Sync the device
4. Navigate to:
   ```
   C:\Users\<YourUsername>\AppData\Roaming\Apple Computer\Logs\CrashReporter\MobileDevice\<DeviceName>
   ```
5. Find crash logs for your app (same `.ips` files)

**Note**: iTunes is deprecated - this method may not work on newer Windows versions.

### Option 3: Integrate Firebase Crashlytics (RECOMMENDED FOR LONG-TERM) 🎯

This is the **best long-term solution** - it gives you detailed crash reports accessible from any browser on any platform.

#### Benefits:
- ✅ Works on Windows (web-based dashboard)
- ✅ Automatic crash collection
- ✅ Symbolicated crash reports (readable function names)
- ✅ Stack traces with line numbers
- ✅ Real-time crash notifications
- ✅ Free tier available

#### Setup Steps:

1. **Create Firebase project** (if you don't have one):
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Add a new project or use existing

2. **Add Firebase to your Expo app**:
   ```bash
   npx expo install @react-native-firebase/app @react-native-firebase/crashlytics
   ```

3. **Configure in app**:
   - See `ADD_FIREBASE_CRASHLYTICS.md` (I'll create this guide)

4. **View crashes**:
   - Go to Firebase Console → Crashlytics
   - All crashes appear with full details
   - Accessible from any browser on Windows

### Option 4: Use Sentry (Alternative to Firebase)

Similar to Firebase but different UI:
- Also cross-platform
- Web-based dashboard
- Good for React Native/Expo apps

```bash
npx expo install sentry-expo
```

---

## What to Look For in Crash Logs (Even Un-Symbolicated)

Even without symbolication, you can find useful information:

### 1. Exception Type
Look for lines like:
```
Exception Type: EXC_BAD_ACCESS (SIGSEGV)
Exception Subtype: KERN_INVALID_ADDRESS at 0x0000000000000000
```

**Meaning**:
- `EXC_BAD_ACCESS` = Trying to access invalid memory
- `SIGABRT` = Abort signal (assertion failure or uncaught exception)
- `EXC_CRASH` = General crash

### 2. Binary Images Section
Look for lines like:
```
Binary Images:
0x102345000 - 0x102456fff ExpoInAppPurchases arm64
```

**Meaning**:
- If `ExpoInAppPurchases` is listed = module is linked
- If NOT listed = module is NOT linked (build issue)

### 3. Stack Trace
Even with addresses, look for:
- Lines mentioning `ExpoInAppPurchases`
- Lines mentioning `StoreKit`
- Any recognizable library names

### 4. Thread Information
```
Triggered by Thread: 0 (Main Thread)
```

**Meaning**:
- Thread 0 = Main thread (UI thread) - more critical
- Other threads = Background threads

---

## Immediate Action Plan

### Right Now (Today):

1. **Get crash log from device** (Option 1):
   - Settings → Privacy → Analytics Data
   - Find "GutCheck App" entries
   - Share the most recent one (Oct 31, 2025)

2. **Share key sections**:
   - Exception Type
   - Binary Images (check if ExpoInAppPurchases is present)
   - First few lines of stack trace

3. **With that info, we can diagnose**:
   - If module isn't linked → build configuration issue
   - If it crashes during init → initialization issue
   - If it crashes on method call → method-specific issue

### Long-Term (This Week):

4. **Set up Firebase Crashlytics**:
   - Automatic crash reporting
   - Detailed, symbolicated logs
   - No need for device access

---

## Quick Reference: Device Crash Log Path

On your iPhone/iPad:
```
Settings → Privacy & Security → Analytics & Improvements → Analytics Data → [Your App Name]
```

The `.ips` files are the crash logs. The most recent one is likely from your latest test.

---

**Next Step**: Get the crash log from your device using Option 1 (Settings method). Even un-symbolicated, it will tell us exactly what's failing!
