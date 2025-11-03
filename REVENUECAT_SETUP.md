# RevenueCat Setup Guide

## Overview

We've migrated from `expo-in-app-purchases` to `react-native-purchases` (RevenueCat) for better reliability and linking support.

## Step 1: Create RevenueCat Account

1. Go to https://www.revenuecat.com/
2. Sign up for a free account
3. Create a new project called "GutCheck"
4. Select **Apple Platforms** (iOS, macOS, watchOS, tvOS, visionOS)
5. Check **"Setup with App Store Connect"**
6. Click **"Get Started"**

## Step 2: Configure Apple App Store Connect API

**During the RevenueCat onboarding, when prompted to configure App Store Connect:**

1. Click **"Go to Team Keys"** button
2. This will open App Store Connect in a new tab
3. If you don't see the Team Keys section, click **"Request API Access"** first
4. **Note:** You need to be an Account Holder to create API keys

**You'll need to create two API keys:**

### A. App Store Connect API Key (Team Keys)
1. Go to **Team Keys** tab
2. Click the **+** button
3. Name it (e.g., "RevenueCat GutCheck")
4. Generate and copy the **Key ID**
5. Download the **private key (.p8 file)** - you can only download this once!

### B. In-App Purchase API Key
1. Go to **In-App Purchase** tab
2. Click the **+** button
3. Name it (e.g., "In-App Purchase Key GutCheck")
4. Generate and copy the **Key ID**
5. Download the **private key (.p8 file)** - you can only download this once!

### Connect to RevenueCat
1. Go back to RevenueCat onboarding tab
2. Paste the **Issuer ID** (same for both keys)
3. Paste the **App Store Connect API Key ID** and **private key**
4. Paste the **In-App Purchase Key ID** and **private key**
5. Click **"Next"** to continue

RevenueCat will now connect to your App Store Connect account automatically.

## Step 3: Complete Onboarding

After connecting App Store Connect, RevenueCat onboarding will guide you through:
1. Add your bundle ID: `com.gutcheck.app`
2. Select your app from App Store Connect
3. RevenueCat will automatically import your products/subscriptions
4. Complete any remaining onboarding steps

## Step 4: Verify Products/Subscriptions

1. In RevenueCat dashboard, go to **Products** section
2. Verify your two subscriptions are listed:
   - `com.gutcheck.app.premium.monthly`
   - `com.gutcheck.app.premium.yearly`
3. If missing, add them manually

## Step 5: Verify Entitlement

1. Go to **Entitlements** section
2. Verify an entitlement exists (e.g., "GutCheck Premium")
3. Ensure both products are attached to this entitlement
4. **Note:** The entitlement identifier must match what's used in the code

## Step 6: Create Offering

1. Go to **Offerings** section
2. Create a new offering (e.g., "Default Offering")
3. Add both subscription packages to this offering
4. Set it as the "Current" offering

## Step 7: Get API Key

1. In RevenueCat dashboard, look for **"Apps & providers"** in the left sidebar
2. Under **"Apps & providers"**, click on **"API keys"** 
3. You should see a list of API keys including your **Apple App Store Public Key** (starts with `appl_`)
4. Copy this key - this is your iOS API key that your app needs

## Step 8: Add API Key to EAS

1. Go to your Expo dashboard: https://expo.dev/accounts/justice_asibe/projects/gutcheck
2. Go to **Secrets** or **Environment Variables**
3. Add a new variable:
   - **Key:** `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
   - **Value:** Your RevenueCat Apple API key (from Step 7)
   - **Scope:** Production (and Preview if testing)

## Step 9: Rebuild App

After adding the API key, rebuild:

```bash
eas build --platform ios --profile production --clear-cache
```

## Step 10: Test

1. Upload build to TestFlight
2. Test subscription purchase flow
3. Verify purchases appear in RevenueCat dashboard

## Differences from expo-in-app-purchases

### Product IDs
- **Same:** Product IDs remain the same (`com.gutcheck.app.premium.monthly`, etc.)
- No changes needed in App Store Connect

### API Changes
- **Offerings:** RevenueCat uses "Offerings" instead of direct product queries
- **Packages:** Products are grouped into "Packages" within Offerings
- **Entitlements:** RevenueCat tracks active subscriptions via "Entitlements"

### Benefits
- ✅ Better linking support (no linking issues)
- ✅ Cross-platform (works on Android too)
- ✅ Better analytics and webhooks
- ✅ Customer support tools
- ✅ Free tier available

## Code Migration

The code has been updated in:
- `src/lib/revenueCatService.ts` - New RevenueCat service (replaces `appleIAPService.ts`)
- `src/lib/stores/subscriptionStore.ts` - Updated to use RevenueCat

The old `appleIAPService.ts` can be removed after testing confirms RevenueCat works.

## Troubleshooting

### "No offerings available"
- Check RevenueCat dashboard → Offerings
- Ensure an offering is marked as "Current"
- Verify products are added to the offering

### "Product not found"
- Check RevenueCat → Products section
- Verify product IDs match App Store Connect
- Ensure products are linked to an entitlement

### API Key Issues
- Verify `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` is set in EAS
- Check it's the Apple API key (starts with `appl_`)
- Rebuild after adding the key

## Next Steps

1. Complete RevenueCat setup (Steps 1-10)
2. Add API key to EAS (Step 8)
3. Rebuild app (Step 9)
4. Test purchases (Step 10)
5. Remove old `expo-in-app-purchases` package (optional, after confirming RevenueCat works)

