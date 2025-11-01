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

### Step 2: Find "In-App Purchases and Subscriptions" Section

Once on your app version page:

1. **Scroll down** through the version details
2. Look for a section titled:
   - **"In-App Purchases and Subscriptions"** 
   - OR **"Subscriptions"**
   - It might be near the bottom of the page
3. If you don't see it, it might be:
   - Under a **"Prepare for Submission"** section
   - In a **"Metadata"** or **"App Information"** area
   - Under **"Pricing and Availability"**

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

## If You Can't Find the Section

### Option A: Create a New App Version
Sometimes you need a fresh version to link subscriptions:

1. Go to your app page
2. Click **"+ Version"** or **"Add Version"**
3. Enter a new version number (e.g., "1.1.0")
4. The new version will have the "In-App Purchases and Subscriptions" section

### Option B: Check "Prepare for Submission" Page
1. On your app page, look for **"Prepare for Submission"** tab
2. This page sometimes has subscription linking options
3. It might be in a different location than expected

### Option C: Subscriptions Tab
1. Some apps have a **"Subscriptions"** tab separate from versions
2. Check if there's a way to link subscriptions from there
3. Look for **"Link to App Version"** or similar option

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

