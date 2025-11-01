# "Missing Metadata" - Real Causes (When Pricing is Already Set)

## Current Status ✅

From your screenshots, I can confirm:
- ✅ **Pricing IS configured** - Multiple countries/regions have prices set ($99.99, €99.99, etc.)
- ✅ **Review Notes ARE filled** - Complete description provided
- ⚠️ **Status still shows "Missing Metadata"**

## Common Causes When Pricing is Complete

Based on [Apple's documentation](https://developer.apple.com/help/app-store-connect/manage-subscriptions/manage-pricing-for-auto-renewable-subscriptions) and common issues:

### 1. **Subscription Group Localization** (Most Likely)

The **subscription group itself** needs localization, not just individual subscriptions:

1. Go to **"Subscriptions"** in left sidebar
2. Click **"GutCheck Premium"** (your subscription group)
3. Check if there's a **localization section** for the group
4. Add **group display name and description** in English (U.K.)
5. Save

**Why this matters**: Apple requires both:
- Individual subscription localizations ✅ (you have this)
- Subscription GROUP localizations ❓ (check this)

### 2. **Not Linked to App Version** (Critical for First Subscriptions)

The blue banner states:
> "Your first subscription must be submitted with a new app version"

Even if metadata is complete, **first-time subscriptions** may show "Missing Metadata" until linked to an app version:

1. Go to your **app version page** ("iOS App Version 1.0")
2. Look for **"In-App Purchases and Subscriptions"** section
3. If you can't find it, try **submitting the app version anyway**
4. Apple will either auto-link or tell you how to link them

### 3. **Pending Agreements** (Check This)

Ensure all agreements are signed:

1. Go to **App Store Connect** → **"Agreements, Tax, and Banking"**
2. Check if any agreements show **"Pending"** or need action
3. Complete any required agreements
4. Especially check **"Paid Applications Agreement"** (required for IAP)

### 4. **Processing Delay**

Apple's system may take time to process:

- Wait **1-2 hours** after making all changes
- Refresh the subscription page
- Status may update automatically

### 5. **Subscription Screenshot Issue**

Even if you uploaded an image:
- Verify it's exactly **1024x1024 pixels**
- Ensure it's high resolution (not compressed)
- Check if there are any validation errors on the image

### 6. **Availability Not Set Properly**

Check the **"Availability"** section:
1. Ensure it's set to **"All countries or regions"** OR specific countries selected
2. Verify it's not set to **"Remove from sale"**

## Action Plan - Check These in Order

### Step 1: Check Subscription Group Localization ⭐ (Most Likely Fix)

1. **"Subscriptions"** → **"GutCheck Premium"**
2. Look for **"App Store Localizations"** or **"Localization"** section
3. Click **"+"** to add localization if missing
4. Add:
   - **Display Name**: "GutCheck Premium"
   - **Description**: "Premium subscription plans for GutCheck App"
5. **Save**

### Step 2: Check Agreements

1. **App Store Connect** → **"Agreements, Tax, and Banking"**
2. Verify all agreements are **"Active"** or **"In Effect"**
3. Sign any pending agreements
4. Complete banking/tax information if required

### Step 3: Try Submitting App Version

Since this is your first subscription:
1. Complete **app version metadata** (screenshots, description, etc.)
2. Click **"Add for Review"**
3. During submission, Apple may:
   - Auto-link subscriptions
   - Reveal what's actually missing
   - Change status from "Missing Metadata"

### Step 4: Wait and Refresh

1. **Wait 1-2 hours** after making changes
2. **Refresh** subscription pages
3. Check if status updates

### Step 5: Contact Apple Support (If Still Stuck)

If all above are complete and status still shows "Missing Metadata":
1. Go to **App Store Connect** → **Help** → **Contact Us**
2. Ask: "Why does my subscription show 'Missing Metadata' when all fields appear complete?"
3. Provide subscription Product IDs: `com.gutcheck.app.premium.monthly` and `com.gutcheck.app.premium.yearly`

## Quick Verification Checklist

Since pricing is set, verify:

- [ ] Subscription Group ("GutCheck Premium") has localization
- [ ] All agreements are signed (Agreements, Tax, and Banking)
- [ ] Subscription is linked to app version (or submitted with version)
- [ ] Availability is set correctly (not "Remove from sale")
- [ ] Screenshot is valid (1024x1024, high resolution)
- [ ] Wait 1-2 hours after changes for status to update

## Most Likely Cause ✅ RESOLVED

Given that pricing and Review Notes are complete, **Subscription Group Localization** is the most common remaining cause. 

**✅ CONFIRMED**: Adding subscription group localization ("GutCheck Premium") resolved the "Missing Metadata" status. Both subscriptions now show "Ready to Submit"!

## Reference

- [Manage pricing for auto-renewable subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/manage-pricing-for-auto-renewable-subscriptions)
- Apple's status can be delayed, so sometimes it's best to try submitting anyway

