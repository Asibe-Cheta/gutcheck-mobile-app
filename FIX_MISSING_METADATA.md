# Fix "Missing Metadata" Status - Step by Step

## The Problem

Your subscription shows "Missing Metadata" because of **two specific issues** visible in your screenshot:

1. ❌ **"No pricing set for this subscription"** (Most Critical!)
2. ❌ **Review Notes field is empty**

## Solution: Fix Both Issues

### Step 1: Set Subscription Pricing (CRITICAL - Do This First!)

1. **On the "Premium Monthly" subscription page**, scroll to **"Subscription Prices"** section
2. **Expand the section** (click to open it)
3. You should see options to set pricing. Click **"Set Up Pricing"** or similar button
4. **Choose your pricing tier**:
   - For UK: £9.99/month
   - For other territories: Set default pricing or territory-specific prices
5. **Save** the pricing
6. **Repeat for "Premium Yearly"**:
   - Set £99.99/year

**Important**: Until pricing is set, the subscription cannot be queried or purchased, even in sandbox!

### Step 2: Fill Review Notes

1. **Scroll to "Review Information"** section (at bottom of page)
2. **Click in the "Review Notes"** text field
3. **Paste this text**:
   ```
   This auto-renewable subscription provides unlimited AI conversations, image and document analysis, personalized guidance tailored to user needs, priority customer support, and advanced insights into conversations.
   
   The subscription auto-renews monthly/yearly unless cancelled. Users can test the subscription during review using their Apple ID. This subscription offers a 7-day free trial period for new subscribers.
   
   Previous rejection issues have been resolved:
   - IAP crash has been fixed - subscription screen now loads properly
   - Image has been updated to be clear and high resolution
   ```
4. **Save** changes

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
- [ ] Expand "Subscription Prices" section
- [ ] Set £9.99/month (or appropriate pricing tier)
- [ ] Save pricing
- [ ] Fill Review Notes
- [ ] Save all changes

For **Premium Yearly**:
- [ ] Expand "Subscription Prices" section
- [ ] Set £99.99/year (or appropriate pricing tier)
- [ ] Save pricing
- [ ] Fill Review Notes
- [ ] Save all changes

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
1. ✅ Set pricing (fixes "No pricing set" message)
2. ✅ Fill Review Notes

The "Missing Metadata" status should disappear and you'll be able to test in sandbox! 🚀

