# RevenueCat Android Setup Guide

## Overview

You need to add Android (Google Play) products to your existing "GutCheck Premium" entitlement in RevenueCat. Currently, only iOS (App Store) products are attached.

**Product IDs (same for both platforms):**
- Monthly: `com.gutcheck.app.premium.monthly`
- Yearly: `com.gutcheck.app.premium.yearly`

---

## Step 1: Verify Products Exist in Google Play Console

**Before adding to RevenueCat, ensure your products exist in Google Play Console:**

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your **GutCheck** app
3. Navigate to **Monetize** → **Subscriptions**
4. Verify both products exist:
   - `com.gutcheck.app.premium.monthly` (Premium Monthly)
   - `com.gutcheck.app.premium.yearly` (Premium Yearly)

**If products don't exist in Google Play Console:**
- Create them first (this is required before RevenueCat can sync them)
- Set pricing: Monthly = £6.99, Yearly = £59.99
- Configure 3-day free trial as introductory offer

---

## Step 2: Connect Google Play to RevenueCat

**Ensure Google Play is connected as a provider:**

1. In RevenueCat dashboard, go to **Apps & providers** (left sidebar)
2. Look for **"GutCheck App"** in the apps list
3. Check if **Google Play** is listed as a provider
4. If not connected:
   - Click **"+ Add provider"** or **"Connect Google Play"**
   - Follow the OAuth flow to connect your Google Play account
   - Grant RevenueCat access to your Google Play Console

**Note:** RevenueCat needs API access to sync products from Google Play.

---

## Step 3: Add Android Products to RevenueCat

**Option A: Products Auto-Sync (Recommended)**

If Google Play is connected, RevenueCat should automatically discover your products:

1. Go to **Product catalog** → **Products** tab
2. Look for products with **"GutCheck App (Google Play)"** label
3. If you see them, proceed to Step 4
4. If not visible, wait a few minutes for sync, or use Option B

**Option B: Manually Create Products**

If products don't auto-sync:

1. Go to **Product catalog** → **Products** tab
2. Click **"+ New Product"** button
3. Fill in the details:
   - **Product ID**: `com.gutcheck.app.premium.monthly` (for monthly)
   - **App**: Select "GutCheck App (Google Play)"
   - **Type**: Subscription
   - **Name**: Premium Monthly
   - Click **"Create"**
4. Repeat for yearly product:
   - **Product ID**: `com.gutcheck.app.premium.yearly`
   - **App**: Select "GutCheck App (Google Play)"
   - **Type**: Subscription
   - **Name**: Premium Yearly
   - Click **"Create"**

---

## Step 4: Attach Android Products to "GutCheck Premium" Entitlement

**This is the key step - attach Android products to the same entitlement:**

1. Go to **Product catalog** → **Entitlements** tab
2. Click on **"GutCheck Premium"** entitlement
3. Scroll down to **"Associated products"** section
4. Click **"+ New"** or **"Attach"** button
5. You'll see a list of available products

**For each Android product:**

1. Find the product with identifier:
   - `com.gutcheck.app.premium.monthly` (should show "GutCheck App (Google Play)")
   - `com.gutcheck.app.premium.yearly` (should show "GutCheck App (Google Play)")
2. Click **"Attach"** or check the box next to it
3. Click **"Save"** or **"Attach Products"**

**Expected Result:**
After attaching, your "Associated products" section should show **4 products total**:
- ✅ Premium Monthly (App Store) - `com.gutcheck.app.premium.monthly`
- ✅ Premium Yearly (App Store) - `com.gutcheck.app.premium.yearly`
- ✅ Premium Monthly (Google Play) - `com.gutcheck.app.premium.monthly`
- ✅ Premium Yearly (Google Play) - `com.gutcheck.app.premium.yearly`

---

## Step 5: Verify Offerings Configuration

**Ensure your offerings include Android products:**

1. Go to **Product catalog** → **Offerings** tab
2. Click on your default offering (usually "default" or "main")
3. Check the **Packages** section
4. Verify you have packages for both platforms:
   - `$rc_monthly` package should include both iOS and Android products
   - `$rc_annual` package should include both iOS and Android products

**If packages only show iOS products:**

1. Click **"Edit"** on the offering
2. For each package (`$rc_monthly`, `$rc_annual`):
   - Click **"Edit"** on the package
   - In the product selection, ensure both iOS and Android products are selected
   - Save the package
3. Save the offering

---

## Step 6: Verify API Keys

**Ensure Android API key is configured:**

1. Go to **API Keys** (left sidebar)
2. Look for **"GutCheck App (Google Play)"** API key
3. Verify it starts with `goog_` (Android format)
4. Copy this key - you'll need it for EAS environment variables

**If Android API key doesn't exist:**
- RevenueCat should generate it automatically when Google Play is connected
- If missing, contact RevenueCat support or check your app configuration

---

## Step 7: Test Configuration

**Verify the setup works:**

1. In RevenueCat dashboard, go to **Customers** → **Test** tab
2. Create a test user or use an existing test user
3. Try to make a test purchase
4. Verify both iOS and Android products are available

**Or test in your app:**
1. Build Android app with RevenueCat Android API key
2. Navigate to subscription screen
3. Verify products load correctly
4. Verify prices match Google Play Console (£6.99/£59.99)
5. Verify free trial badge shows (if configured)

---

## Troubleshooting

### Problem: Android products don't appear in RevenueCat

**Solutions:**
1. **Check Google Play Connection:**
   - Go to **Apps & providers**
   - Verify Google Play is connected
   - Reconnect if needed

2. **Check Product IDs Match:**
   - Google Play Console product IDs must exactly match:
     - `com.gutcheck.app.premium.monthly`
     - `com.gutcheck.app.premium.yearly`
   - Case-sensitive, no typos

3. **Wait for Sync:**
   - RevenueCat syncs products periodically
   - Wait 5-10 minutes after creating products in Google Play
   - Click **"Refresh"** or **"Sync"** button if available

4. **Check Product Status:**
   - Products must be **Active** in Google Play Console
   - Draft products won't sync to RevenueCat

### Problem: Can't attach Android products to entitlement

**Solutions:**
1. **Verify Products Exist:**
   - Go to **Products** tab
   - Confirm Android products are listed
   - If missing, create them manually (Step 3, Option B)

2. **Check App Association:**
   - Products must be associated with "GutCheck App (Google Play)"
   - Not "GutCheck App (App Store)"

3. **Verify Product IDs:**
   - Must exactly match: `com.gutcheck.app.premium.monthly` and `com.gutcheck.app.premium.yearly`
   - No extra characters or spaces

### Problem: Android API key missing

**Solutions:**
1. **Check App Configuration:**
   - Go to **Apps & providers**
   - Click on "GutCheck App"
   - Verify Google Play is listed as a provider

2. **Generate API Key:**
   - Go to **API Keys**
   - Look for "GutCheck App (Google Play)"
   - If missing, RevenueCat should auto-generate when Google Play is connected

3. **Manual Generation:**
   - Contact RevenueCat support if key doesn't appear
   - They can manually generate it for you

---

## Visual Guide: What You Should See

### Before (Current State):
```
GutCheck Premium Entitlement
├── Premium Monthly (App Store) ✅
└── Premium Yearly (App Store) ✅
```

### After (Target State):
```
GutCheck Premium Entitlement
├── Premium Monthly (App Store) ✅
├── Premium Yearly (App Store) ✅
├── Premium Monthly (Google Play) ✅ ← ADD THIS
└── Premium Yearly (Google Play) ✅ ← ADD THIS
```

---

## Quick Checklist

- [ ] Products exist in Google Play Console
- [ ] Google Play connected to RevenueCat
- [ ] Android products visible in RevenueCat Products tab
- [ ] Android products attached to "GutCheck Premium" entitlement
- [ ] Offerings include Android products in packages
- [ ] Android API key exists and starts with `goog_`
- [ ] Test purchase works on Android

---

## Next Steps After Setup

1. **Update EAS Environment Variables:**
   - Set `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` in EAS dashboard
   - Use the key from RevenueCat API Keys section

2. **Build Android App:**
   ```bash
   eas build --platform android --profile preview
   ```

3. **Test on Android Device:**
   - Verify products load
   - Verify prices are correct
   - Test purchase flow
   - Test restore purchases

---

## Support Resources

- **RevenueCat Docs:** https://docs.revenuecat.com/docs/android
- **RevenueCat Support:** Available in dashboard (Help section)
- **Google Play Console:** https://play.google.com/console

---

**Last Updated:** 2024-12-19
**Status:** Ready for Android product setup

