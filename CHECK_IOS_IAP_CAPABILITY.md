# Check iOS In-App Purchase Capability

## Why This Matters

If the In-App Purchase capability is not enabled in your Apple Developer account, the native module will crash when trying to initialize. This is one of the most common causes of native-level IAP crashes.

## Step-by-Step: Check and Enable IAP Capability

### Step 1: Access Apple Developer Portal

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Sign in with your Apple Developer account
3. You need to be Account Holder, Admin, or have App Manager role

### Step 2: Navigate to App Identifiers

1. Click **"Certificates, Identifiers & Profiles"** in the left sidebar
2. Click **"Identifiers"** in the left sidebar
3. You'll see a list of App IDs

### Step 3: Find Your App Identifier

1. Look for **`com.gutcheck.app`** (your bundle identifier)
2. Click on it to view details
3. If you don't see it, you may need to create it first

### Step 4: Check Capabilities

1. Scroll down to the **"Capabilities"** section
2. Look for **"In-App Purchase"**
3. Check if it has a checkmark ✅

### Step 5: Enable If Missing

If **"In-App Purchase"** is NOT checked:

1. Check the checkbox ✅ next to **"In-App Purchase"**
2. Click **"Save"** (top right)
3. You may need to wait a few minutes for changes to propagate

### Step 6: Regenerate Provisioning Profiles (If Changed)

If you just enabled the capability:

1. Go to **"Profiles"** section
2. Find any provisioning profiles for `com.gutcheck.app`
3. They should automatically update, but you can regenerate if needed
4. Download and use updated profiles if you're doing local builds

**Note**: EAS Build handles provisioning automatically, so this step is mainly for local builds.

## Verification

After enabling:

1. **Wait 5-10 minutes** for changes to propagate
2. **Rebuild your app** with EAS:
   ```bash
   eas build --platform ios --profile production --clear-cache
   ```
3. **Test again** - the native module should now initialize correctly

## If Capability Was Already Enabled

If the capability was already enabled, the issue is elsewhere:
- Check EAS build logs for native module linking errors
- Verify package versions are correct
- Try alternative import methods
- Check TestFlight crash logs for specific errors

## Important Notes

- **This capability is separate from App Store Connect subscriptions**
- Enabling it here is required for the native module to work
- The capability must be enabled before you can test IAP
- EAS Build will use this capability automatically

## Troubleshooting

### "I don't see my App Identifier"
- You may need to create it first
- Or it might be under a different name
- Check your bundle identifier matches exactly: `com.gutcheck.app`

### "I can't edit the capability"
- You need Account Holder, Admin, or App Manager role
- Check your account permissions

### "Capability is enabled but still crashes"
- Wait 5-10 minutes for propagation
- Rebuild with `--clear-cache`
- Check other causes in the troubleshooting document

