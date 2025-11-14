# Free Trial Setup Guide for GutCheck

This guide explains how to configure the 7-day free trial for your GutCheck app subscriptions in App Store Connect.

## Overview

Your subscription products are configured in **App Store Connect**, and RevenueCat automatically syncs and presents these offers to users. You need to add "Introductory Offers" (free trials, discounted prices, etc.) in App Store Connect.

## Prerequisites

- App Store Connect access with Admin or App Manager permissions
- Your subscriptions already created in App Store Connect
- RevenueCat dashboard configured and synced with App Store Connect

## Step-by-Step Instructions

### Step 1: Access Your App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click **"My Apps"** in the top navigation
3. Select **"GutCheck"** from your list of apps

### Step 2: Navigate to Subscriptions

1. In the left sidebar, under **"Monetization"**, click **"Subscriptions"**
2. You should see your subscription group **"GutCheck Premium"** with **2** subscriptions in it
3. Click on **"GutCheck Premium"** to view the subscription group
4. You'll see your subscription products:
   - `com.gutcheck.app.premium.monthly` (Premium Monthly)
   - `com.gutcheck.app.premium.yearly` (Premium Yearly)

### Step 3: Add Introductory Offer to Monthly Subscription

1. Click on **"Premium Monthly"** (or `com.gutcheck.app.premium.monthly`)
2. Scroll down to find the **"Subscription Prices"** section
3. Click **"View All Subscription Pricing"** or look for **"Introductory Offers"**
4. Click the **"+"** button next to **"Introductory Offers"** (or **"Add Introductory Offer"**)
5. **Select Territories**: Choose **"All Territories"** (or specific countries), then click **"Next"**
6. **Set Availability Dates**: 
   - Start Date: Choose today's date
   - End Date: Select **"No End Date"** (or pick an end date)
   - Click **"Next"**
7. **Choose Offer Type**: Select **"Free Trial"**
8. **Set Duration**: Select **"3 Days"** for your 3-day free trial
9. Click **"Next"** to review
10. **Review your settings** and click **"Confirm"** or **"Save"**

### Step 4: Add Introductory Offer to Yearly Subscription (Optional)

Repeat **Step 3** for your **"Premium Yearly"** subscription:
- Territories: **All Territories**
- End Date: **No End Date**
- Offer Type: **Free Trial**
- Duration: **3 Days**

### Step 5: Sync Changes to RevenueCat

1. Go to your **RevenueCat Dashboard** (https://app.revenuecat.com/)
2. Navigate to your **GutCheck** project
3. Click on **"Products"** in the left sidebar
4. Wait a few minutes for automatic sync, or click **"Sync Products"** or **"Refresh"** button
5. Verify that the introductory offers appear in your products

### Step 6: Test the Free Trial

**Important**: You MUST use a **NEW sandbox tester account** to test the trial, as eligibility is tied to the Apple ID.

#### Create a New Sandbox Tester

1. In App Store Connect, go to **"Users and Access"** in the top navigation
2. Click **"Sandbox Testers"** in the left sidebar
3. Click the **"+"** button to add a new tester
4. Fill in the form:
   - **First Name**: Any (e.g., "Test")
   - **Last Name**: Any (e.g., "Trial")
   - **Email**: Use a unique email that is **NOT** associated with a real Apple ID (e.g., `sbox-trial-test123@example.com`)
   - **Password**: Create a secure password
   - **Country**: Select a country (e.g., "United Kingdom")
5. Click **"Save"** or **"Create"**

#### Sign Out of Current Sandbox Account on Your Device

1. On your iOS test device, open **Settings**
2. Tap on **"[Your Name]"** at the top
3. Scroll down and tap **"App Store"**
4. Tap on your Apple ID
5. Tap **"Sign Out"**

#### Sign In with the New Sandbox Tester

1. Launch your app from TestFlight
2. When prompted to sign in for a purchase, use the credentials of your **NEW** sandbox tester
3. Alternatively, sign in via **Settings → App Store** with the new sandbox account before launching the app

#### Test the Flow

1. Create a new account in your app
2. Complete onboarding
3. Click **"Start My 3-Day Free Trial"**
4. You should see the subscription offer with a **"Try 3 Days Free"** button or similar text
5. Complete the purchase flow (you won't be charged in sandbox)
6. Verify the subscription shows the trial period in your app
7. Check RevenueCat dashboard to confirm the purchase is recorded

## Troubleshooting

### Trial Not Showing

- **Wait a few hours**: Changes in App Store Connect can take 1-3 hours to propagate
- **Check RevenueCat sync**: Manually trigger a product sync in RevenueCat dashboard
- **Verify sandbox tester**: Make sure you're using a **NEW** sandbox tester account that has never been used for this app before
- **Check eligibility**: Ensure "New Subscribers" is checked in App Store Connect

### Subscription Shows as Already Active

- **Use a different sandbox tester**: Each sandbox Apple ID remembers previous purchase history
- **Sign out and sign in**: Make sure you're signed out of old sandbox accounts on your device

### RevenueCat Not Syncing

- **Check API keys**: Verify both App Store Connect API keys are still valid in RevenueCat
- **Manual refresh**: Try clicking "Sync Products" or "Refresh" in RevenueCat dashboard
- **Wait**: Sometimes it takes 5-10 minutes for changes to sync

## Additional Resources

- [Apple's Guide to Subscription Groups](https://developer.apple.com/documentation/storekit/in-app_purchase/original_api_for_in-app_purchase/subscription_offers)
- [RevenueCat: Intro Offers Documentation](https://www.revenuecat.com/docs/entitlements/introductory-offers)

## Notes

- Free trials are configured **per-territory**, so make sure to select all territories where you want to offer the trial
- You can offer different trial lengths in different territories
- Trials can only be used once per subscriber unless you check "Previous Subscribers" eligibility
- RevenueCat automatically handles the complexity of presenting the correct offer based on user eligibility

