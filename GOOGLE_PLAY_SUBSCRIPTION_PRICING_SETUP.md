# Google Play Console: Subscription Pricing Setup Guide

## Overview

This guide shows you how to set up subscription prices (£6.99/month and £59.99/year) and configure the 3-day free trial for your GutCheck subscriptions.

---

## Step 1: Access Subscription Details

1. In Google Play Console, go to **Monetize with Play** → **Products** → **Subscriptions**
2. You should see your two subscriptions:
   - Premium Monthly (`com.gutcheck.app.premium.monthly`)
   - Premium Yearly (`com.gutcheck.app.premium.yearly`)
3. Click on **"Premium Monthly"** (or click the arrow icon on the right)

---

## Step 2: Configure Premium Monthly Subscription

### 2.1: Navigate to Base Plans

1. After clicking "Premium Monthly", you'll see the subscription details page
2. Look for the **"Base plans"** section or tab
3. Click on the base plan (usually shows "1 active base plan")
4. If you see a base plan listed, click on it to edit
5. If no base plan exists, click **"+ Create base plan"**

### 2.2: Set Monthly Price

1. In the base plan configuration, find the **"Price"** section
2. Set the price:
   - **Amount:** `6.99`
   - **Currency:** `GBP` (British Pound)
   - **Billing period:** `1 month` or `Monthly`
3. Save the price settings

### 2.3: Configure 3-Day Free Trial

1. In the same base plan, look for **"Introductory offers"** or **"Offers"** section
2. Click **"+ Add offer"** or **"Create introductory offer"**
3. Configure the offer:
   - **Offer type:** Select **"Free trial"**
   - **Duration:** `3 days`
   - **Price:** `0.00` (free)
   - **Eligibility:** Usually "All users" or "New subscribers"
4. Set availability:
   - **Start date:** Today's date (or when you want it to start)
   - **End date:** Leave blank or set to "No end date" (for ongoing offer)
5. Click **"Save"** or **"Create offer"**

### 2.4: Save Base Plan

1. Review all settings
2. Click **"Save"** or **"Activate"** the base plan
3. The base plan should now show as **"Active"**

---

## Step 3: Configure Premium Yearly Subscription

### 3.1: Navigate to Yearly Subscription

1. Go back to **Subscriptions** list
2. Click on **"Premium Yearly"** (`com.gutcheck.app.premium.yearly`)

### 3.2: Set Yearly Price

1. Go to **"Base plans"** section
2. Click on the base plan (or create one if needed)
3. Set the price:
   - **Amount:** `59.99`
   - **Currency:** `GBP` (British Pound)
   - **Billing period:** `1 year` or `Yearly`
4. Save the price settings

### 3.3: Configure 3-Day Free Trial

1. In the base plan, go to **"Introductory offers"** section
2. Click **"+ Add offer"** or **"Create introductory offer"**
3. Configure the offer:
   - **Offer type:** Select **"Free trial"**
   - **Duration:** `3 days`
   - **Price:** `0.00` (free)
   - **Eligibility:** "All users" or "New subscribers"
4. Set availability:
   - **Start date:** Today's date
   - **End date:** Leave blank (for ongoing offer)
5. Click **"Save"** or **"Create offer"**

### 3.4: Save Base Plan

1. Review all settings
2. Click **"Save"** or **"Activate"** the base plan

---

## Step 4: Verify Configuration

### Check Premium Monthly:

1. Go to **Subscriptions** → **Premium Monthly**
2. Verify:
   - ✅ Base plan shows: **£6.99/month**
   - ✅ Introductory offer shows: **3-day free trial**
   - ✅ Base plan status: **Active**

### Check Premium Yearly:

1. Go to **Subscriptions** → **Premium Yearly**
2. Verify:
   - ✅ Base plan shows: **£59.99/year**
   - ✅ Introductory offer shows: **3-day free trial**
   - ✅ Base plan status: **Active**

---

## Detailed Field Explanations

### Base Plan Pricing Fields:

- **Price:** The recurring subscription price
  - Monthly: `6.99 GBP`
  - Yearly: `59.99 GBP`

- **Billing period:** How often the user is charged
  - Monthly: `1 month`
  - Yearly: `1 year`

- **Currency:** The currency for pricing
  - Both: `GBP` (British Pound)

### Introductory Offer Fields:

- **Offer type:** The type of promotional offer
  - Select: **"Free trial"**

- **Duration:** How long the free trial lasts
  - Set to: **3 days**

- **Price:** The price during the trial (should be free)
  - Set to: **0.00**

- **Eligibility:** Who can use this offer
  - Usually: **"All users"** or **"New subscribers"**

- **Start date:** When the offer becomes available
  - Set to: **Today's date** (or your launch date)

- **End date:** When the offer expires
  - Set to: **Leave blank** (for ongoing offer) or **"No end date"**

---

## Common Issues & Solutions

### Issue: Can't find "Base plans" section

**Solution:**
- Look for tabs at the top: "Overview", "Base plans", "Offers"
- Click on **"Base plans"** tab
- If you see "1 active base plan", click on it to edit

### Issue: Can't create introductory offer

**Solution:**
- Make sure the base plan is **Active** first
- Some Google Play Console versions require base plan to be active before adding offers
- Try activating the base plan, then add the offer

### Issue: Price shows in wrong currency

**Solution:**
- Check the currency dropdown in the price field
- Make sure it's set to **GBP** (British Pound)
- You can set different prices for different countries if needed

### Issue: Free trial not showing

**Solution:**
- Verify the offer is **Active**
- Check the start date is today or in the past
- Ensure end date is blank or in the future
- Wait a few minutes for changes to propagate

---

## Visual Guide: What You Should See

### Premium Monthly Base Plan:
```
Base Plan Configuration:
├── Price: £6.99
├── Currency: GBP
├── Billing period: 1 month
└── Introductory offers:
    └── Free trial: 3 days (0.00 GBP)
```

### Premium Yearly Base Plan:
```
Base Plan Configuration:
├── Price: £59.99
├── Currency: GBP
├── Billing period: 1 year
└── Introductory offers:
    └── Free trial: 3 days (0.00 GBP)
```

---

## Quick Checklist

After setup, verify:

- [ ] Premium Monthly: £6.99/month
- [ ] Premium Monthly: 3-day free trial configured
- [ ] Premium Yearly: £59.99/year
- [ ] Premium Yearly: 3-day free trial configured
- [ ] Both base plans are **Active**
- [ ] Both introductory offers are **Active**
- [ ] Currency is GBP for both

---

## After Configuration

1. **Wait for Sync:**
   - Changes may take a few minutes to sync
   - RevenueCat will automatically pick up the new prices

2. **Verify in RevenueCat:**
   - Go to RevenueCat dashboard
   - Check that products show correct prices
   - Verify free trial information is synced

3. **Test in App:**
   - Build Android app
   - Navigate to subscription screen
   - Verify prices display correctly (£6.99/£59.99)
   - Verify free trial badge shows "3-day free trial"

---

## Important Notes

1. **Price Changes:**
   - Price changes affect **new subscribers only**
   - Existing subscribers keep their current price until they cancel/resubscribe

2. **Free Trial:**
   - Free trial applies to **new subscribers only**
   - Users who previously subscribed won't get the trial again

3. **Currency:**
   - GBP prices will be converted to local currency for international users
   - Google Play handles currency conversion automatically

4. **Activation:**
   - Base plans must be **Active** for subscriptions to work
   - Introductory offers must be **Active** for free trials to work

---

## Support Resources

- **Google Play Console Help:** https://support.google.com/googleplay/android-developer
- **Subscription Setup Guide:** Available in Google Play Console help section
- **RevenueCat Sync:** Products sync automatically after configuration

---

**Last Updated:** 2024-12-19
**Status:** Ready for pricing configuration

