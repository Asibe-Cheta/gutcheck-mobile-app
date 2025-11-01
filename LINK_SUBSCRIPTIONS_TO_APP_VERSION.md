# How to Link Subscriptions to App Version

## Overview
Apple requires that your **first subscription must be submitted with an app version**. You cannot submit subscriptions alone. This must be done in App Store Connect (web interface).

## Step-by-Step Instructions

### Step 1: Navigate to Your App Version

1. **Go to App Store Connect**: [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **Click "My Apps"** in the top navigation
3. **Select "GutCheck App"** (or whatever your app name is)
4. **Click on your current app version** (or create a new version if needed)
   - This is usually under the "App Store" tab
   - Look for a version number like "1.0.0" or "1.1.0"

### Step 2: Find Where to Link Subscriptions

The "In-App Purchases and Subscriptions" section might not be visible yet. Try these approaches:

**Option A: Scroll Down on Version Page**
1. **On your app version page** (where you see "iOS App Version 1.0")
2. **Scroll ALL the way down** - it's usually at the very bottom
3. Look for sections like:
   - **"In-App Purchases"** (might list both IAP and subscriptions here)
   - **"In-App Purchases and Subscriptions"**
   - **"Associated Subscriptions"**
   - Any section about monetization or purchases

**Option B: Check Left Sidebar "Subscriptions" Link**
1. In the left sidebar, you see **"Subscriptions"** under "MONETIZATION"
2. **Click on "Subscriptions"** in the sidebar
3. This might take you to a page where you can link subscriptions to versions
4. Look for options like:
   - **"Link to App Version"**
   - **"Associate with Version"**
   - **"Add to Submission"**

**Option C: It Might Auto-Link**
For first-time subscriptions, Apple sometimes automatically links them when you submit the app version. The section might only appear AFTER you select subscriptions.

### Step 3: Select Your Subscriptions

In the "In-App Purchases and Subscriptions" section:

1. **Click the "+" button** or **"Add"** or **"Select Subscriptions"** button
2. A modal or list will appear showing available subscriptions
3. **Select both**:
   - ✅ **Premium Monthly**
   - ✅ **Premium Yearly**
4. **Save** or **Confirm** your selection

### Step 4: Verify Subscriptions Are Linked

After selecting:

1. You should see both subscriptions listed in the section
2. They should show as **"Ready to Submit"** or **"Complete"**
3. Status should change from "Missing Metadata" to something else

### Step 5: Submit App Version

Once subscriptions are linked:

1. **Review all app version details** (screenshots, description, etc.)
2. **Scroll to the bottom** of the version page
3. Click **"Submit for Review"** or **"Add for Review"**
4. This will submit **both the app version AND the subscriptions together**

## Alternative: The Section Might Not Exist Yet

**Important Discovery**: Apple may have changed how subscriptions are linked. Try these steps:

### Method 1: Click "Subscriptions" in Left Sidebar
1. **On the app version page**, look at the left sidebar
2. Under **"MONETIZATION"**, click **"Subscriptions"**
3. This should show your subscription group "GutCheck Premium"
4. Check if there's a way to link/associate with the app version from this page
5. Look for buttons like:
   - **"Add to App Version"**
   - **"Link to Version"**
   - **"Associate with Version"**
   - Or a dropdown/selector for app versions

### Method 2: Scroll to Bottom of Version Page
1. On the "iOS App Version 1.0" page
2. **Scroll all the way to the bottom**
3. Look past all sections (App Store, Screenshots, etc.)
4. The subscription linking might be at the very end, or might appear after you fill other required fields

### Method 3: It Auto-Links When Submitting
Some users report that subscriptions automatically link when you:
1. Complete all app version metadata
2. Have subscriptions ready (not "Missing Metadata")
3. Click **"Add for Review"**
4. Apple associates the subscriptions automatically

**Try submitting the app version** - if subscriptions aren't linked, Apple will tell you during review.

### Method 4: Check Subscription Group Page
1. Click **"Subscriptions"** in left sidebar
2. Click on **"GutCheck Premium"** (your subscription group)
3. Look for version linking options there
4. Check if subscriptions show which app version they're associated with

## What This Does

By linking subscriptions to an app version:
- ✅ Subscriptions become part of the app submission
- ✅ Apple can review both together
- ✅ "Missing Metadata" status should resolve
- ✅ First subscription requirement is satisfied

## Important Notes

1. **You cannot submit subscriptions without an app version** (first time only)
2. **After first approval**, you can submit subscription changes independently
3. **Both subscriptions must be linked** (monthly and yearly)
4. **App version must also be ready** (screenshots, description, etc.)

## After Linking

1. **Check subscription status** - should update within 5-10 minutes
2. **Verify "Missing Metadata" disappears**
3. **Complete any remaining app version requirements**
4. **Submit the entire app version for review**

## Troubleshooting

### "In-App Purchases and Subscriptions" Section Not Visible

**Possible causes:**
- App version hasn't been created yet
- You're looking at the wrong tab/page
- Your app might need to be in "Prepare for Submission" state first

**Solution:**
- Create a new app version
- Make sure app version has at least basic metadata (name, description)
- Try accessing from different tabs (App Store, TestFlight, etc.)

### Subscriptions Don't Appear in Selection List

**Possible causes:**
- Subscriptions still have "Missing Metadata"
- Subscriptions aren't saved properly
- Subscription group has issues

**Solution:**
- Go back to subscription pages and ensure all fields are saved
- Check if Review Notes need to be filled
- Verify subscription group is configured

### Status Still Shows "Missing Metadata" After Linking

**Possible causes:**
- App Store Connect needs time to update (5-10 minutes)
- There's still a missing field somewhere
- Subscription group needs configuration

**Solution:**
- Wait and refresh the page
- Double-check Review Notes are filled
- Submit anyway - Apple will tell you exactly what's missing

## Next Steps After Linking

1. ✅ Wait for status to update
2. ✅ Ensure app version is complete
3. ✅ Submit app version for review
4. ✅ Apple will review both app and subscriptions together

---

**You'll need to do this in App Store Connect yourself** - it's a manual process through Apple's web interface. I can help troubleshoot if you encounter any issues! 🚀

