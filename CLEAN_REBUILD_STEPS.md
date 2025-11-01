# Clean Rebuild Steps - Nuclear Option

## When to Use This

If nothing else works, a complete clean rebuild can resolve:
- Stale native module linking
- Cached build artifacts causing issues
- Package version mismatches
- Native module linking problems

## ⚠️ Important: Backup First

Before running these commands, make sure:
- ✅ All changes are committed to git
- ✅ You have a backup of your code
- ✅ Environment variables are saved (in `.env` or EAS dashboard)

## Step-by-Step Clean Rebuild

### Step 1: Clear Local Caches

```bash
# Remove node_modules
Remove-Item -Recurse -Force node_modules

# Remove iOS build artifacts (if exists)
Remove-Item -Recurse -Force ios -ErrorAction SilentlyContinue

# Remove Expo cache
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# Remove package lock (we'll regenerate it)
Remove-Item package-lock.json -ErrorAction SilentlyContinue
```

### Step 2: Reinstall Dependencies

```bash
# Install fresh dependencies
npm install

# Verify expo-in-app-purchases is installed
npm list expo-in-app-purchases
```

Should show: `expo-in-app-purchases@14.5.0`

### Step 3: Verify Package Versions

```bash
# Check for version mismatches
npx expo-doctor
```

Fix any issues it finds:
```bash
npx expo install --fix
```

### Step 4: Configure EAS Build

```bash
# Ensure EAS is configured correctly
eas build:configure
```

### Step 5: Clean EAS Build Cache and Rebuild

```bash
# Build with cleared cache
eas build --platform ios --profile production --clear-cache
```

## What This Does

1. **Removes all cached dependencies** - Fresh npm install
2. **Clears native build artifacts** - Removes any stale iOS linking
3. **Clears Expo cache** - Removes cached module resolution
4. **Fresh EAS build** - Forces complete rebuild from scratch

## After Rebuild

1. **Test in TestFlight** - Install the new build
2. **Check if IAP module loads** - Tap Subscription button
3. **If still crashes**:
   - Check TestFlight crash logs
   - Verify iOS IAP capability is enabled
   - Review EAS build logs for errors

## Expected Build Time

A clean rebuild with `--clear-cache` takes longer:
- **Normal build**: ~15-20 minutes
- **Clean build**: ~25-35 minutes

Be patient - this is a complete rebuild.

## If Clean Rebuild Doesn't Work

If the crash persists after a clean rebuild:

1. **Check TestFlight crash logs** - They'll show the actual native error
2. **Verify iOS IAP capability** - See `CHECK_IOS_IAP_CAPABILITY.md`
3. **Review EAS build logs** - Look for native module linking errors
4. **Consider alternative solution** - `expo-purchases` (RevenueCat)

## One-Liner Script (PowerShell)

For convenience, here's a one-liner (be careful!):

```powershell
Remove-Item -Recurse -Force node_modules,.expo,ios -ErrorAction SilentlyContinue; Remove-Item package-lock.json -ErrorAction SilentlyContinue; npm install; npx expo-doctor; eas build --platform ios --profile production --clear-cache
```

**Use at your own risk** - Make sure you've committed everything first!

