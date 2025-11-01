# Fix "Missing Metadata" Status - Step by Step

## UPDATE: Pricing IS Configured ✅

**Correction**: Your screenshots show pricing IS set for multiple countries/regions. The issue is NOT missing pricing.

## The Real Problem

Since pricing and Review Notes are both complete, "Missing Metadata" is likely due to:

1. **Subscription Group Localization** - The GROUP needs localization, not just subscriptions
2. **Not linked to app version** - First subscriptions must be linked to version
3. **Pending agreements** - Agreements/Tax/Banking may need completion
4. **Processing delay** - Apple's system may take time to update status

See `MISSING_METADATA_REAL_CAUSES.md` for detailed troubleshooting.

## Solution: Set Subscription Pricing

### Step 1: Set Pricing for Premium Monthly (CRITICAL!)

From the "Subscription Pricing" page you showed me, I can see the "Current Prices" section is **completely empty**. Here's how to fix it:

1. **On the "Subscription Pricing" page** (the one showing "Subscription Prices" tab)
2. **Click "All Prices and Currencies"** (blue link on the right) OR
3. **Look for a "+" button or "Set Price" button** to add pricing
4. **Set pricing tier**:
   - For UK/GBP: £9.99/month
   - OR set base price and let Apple calculate other territories
5. **Save** the pricing
6. **Verify** the "Current Prices" section now shows your price

**Important**: Until pricing is set, the subscription cannot be queried or purchased, even in sandbox!

### Step 2: Set Pricing for Premium Yearly

1. **Navigate to "Premium Yearly" subscription**
2. **Go to "Subscription Pricing"** section
3. **Set £99.99/year**
4. **Save**

### Step 3: Verify Both Subscriptions

Repeat Steps 1-2 for **"Premium Yearly"**:
- ✅ Set pricing (£99.99/year)
- ✅ Fill Review Notes

### Step 4: Wait and Check Status

1. **Save all changes** on both subscriptions
2. **Wait 5-10 minutes** for App Store Connect to process
3. **Refresh the page**
4. **Check status** - should change from "Missing Metadata" to "Ready to Submit" or "Waiting for Review"

## Why Pricing is Critical

The screenshot explicitly shows:
> **"No pricing set for this subscription."**

This is why Apple shows "Missing Metadata" - **a subscription cannot exist without pricing**. Even if everything else is filled, pricing is mandatory.

## After Fixing

Once both issues are resolved:

1. **Status should update** to "Ready to Submit" or "Waiting for Review"
2. **Sandbox testing will work** (products will be queryable)
3. **You can enable native module** and test in TestFlight
4. **Submit with app version** for final approval

## Quick Checklist

For **Premium Monthly**:
- [ ] Go to "Subscription Pricing" page
- [ ] Click "All Prices and Currencies" or find "Set Price" button
- [ ] Set £9.99/month (or appropriate pricing tier)
- [ ] Save pricing
- [ ] Verify "Current Prices" section now shows the price
- ✅ Review Notes already filled - no action needed

For **Premium Yearly**:
- [ ] Go to "Subscription Pricing" page
- [ ] Set £99.99/year (or appropriate pricing tier)
- [ ] Save pricing
- [ ] Verify "Current Prices" section now shows the price
- [ ] Fill Review Notes (if not already done)

Then:
- [ ] Wait 5-10 minutes
- [ ] Refresh pages
- [ ] Verify "Missing Metadata" is gone
- [ ] Status should show "Ready to Submit" or "Waiting for Review"

## If Status Still Shows "Missing Metadata"

After fixing pricing and Review Notes:

1. **Double-check pricing saved** - go back and verify it shows the price you set
2. **Verify Review Notes saved** - refresh and confirm text is still there
3. **Check subscription group** - ensure "GutCheck Premium" group has no issues
4. **Wait longer** - sometimes takes 15-20 minutes for status to update
5. **Try submitting anyway** - Apple will tell you exactly what's missing if anything

## Most Likely Scenario

Once you:
1. ✅ Set pricing (fixes empty "Current Prices" section)
2. ✅ Review Notes are already filled ✅

The "Missing Metadata" status should disappear and you'll be able to test in sandbox! 🚀

**The issue is ONLY the missing pricing configuration** - Review Notes are already complete.

