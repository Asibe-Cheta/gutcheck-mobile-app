# How to Link Subscriptions - Updated Instructions

## The Problem

You're on the "iOS App Version 1.0" page but can't find the "In-App Purchases and Subscriptions" section. You see:
- ✅ "In-App Purchases" in left sidebar (under MONETIZATION)
- ✅ "Subscriptions" in left sidebar (under MONETIZATION)
- ❌ No "In-App Purchases and Subscriptions" section on the version page

## Solution: Try These Approaches

### Approach 1: Click "Subscriptions" in Sidebar

1. **On your app version page** (iOS App Version 1.0)
2. **Look at the left sidebar** - you should see:
   ```
   MONETIZATION
   - Pricing and Availability
   - In-App Purchases
   - Subscriptions  ← CLICK THIS
   ```
3. **Click "Subscriptions"** - this takes you to the subscriptions management page
4. **Look for**:
   - A list of your subscription groups (should show "GutCheck Premium")
   - Click on "GutCheck Premium"
   - Inside the group, you should see "Premium Monthly" and "Premium Yearly"
   - Look for any option to link to app version or associate with submission

### Approach 2: Scroll to Very Bottom

The section might be hidden or at the very bottom:

1. **On the "iOS App Version 1.0" page**
2. **Scroll ALL the way down** - past:
   - App Store information
   - Previews and Screenshots
   - Description
   - Keywords
   - Support URL
   - Marketing URL
   - Version information
   - Build selection
   - Export compliance
   - Content rights
3. **At the very bottom**, there might be:
   - "In-App Purchases" section
   - Or it might only appear if you have builds uploaded
   - Or it appears after other required fields are filled

### Approach 3: Check "In-App Purchases" Sidebar Item

1. **Click "In-App Purchases"** in the left sidebar (under MONETIZATION)
2. This might show a page where you can:
   - See all IAPs AND subscriptions together
   - Link them to app versions
   - Add them to submissions

### Approach 4: It Might Auto-Link

For first-time subscriptions with an app version:

1. **Ensure subscriptions are complete** (fill Review Notes if needed)
2. **Complete all app version requirements** (screenshots, description, etc.)
3. **Click "Add for Review"** at the top right
4. **During submission**, Apple might:
   - Show you a screen to select subscriptions
   - Auto-link subscriptions that are ready
   - Or reject if subscriptions aren't linked, telling you how to link them

## What Apple Actually Requires

Based on the blue banner you saw:
> "Your first subscription must be submitted with a new app version"

This means:
- ✅ You CANNOT submit subscriptions separately
- ✅ Subscriptions must be included when submitting the app version
- ⚠️ The linking might happen during submission, not before

## Recommended Action Plan

### Step 1: Fill Review Notes (If Not Done)
1. Go to **"Subscriptions"** in sidebar
2. Click **"GutCheck Premium"** → **"Premium Monthly"**
3. Scroll to **"Review Information"**
4. Fill **"Review Notes"** with:
   ```
   This auto-renewable subscription provides unlimited AI conversations, image/document analysis, personalized guidance, priority support, and advanced insights. The subscription auto-renews monthly unless cancelled. Users can test using their Apple ID during review. Previous IAP crash has been fixed.
   ```
5. **Save**
6. **Repeat for "Premium Yearly"**

### Step 2: Complete App Version Requirements
On the "iOS App Version 1.0" page:
1. ✅ Fill all required fields (screenshots, description, etc.)
2. ✅ Upload a build if needed
3. ✅ Complete all sections

### Step 3: Try Submitting
1. **Click "Add for Review"** at the top right
2. **See what happens**:
   - If it shows a screen to select subscriptions → select them
   - If it submits → Apple will review and tell you if subscriptions need linking
   - If it errors → the error message will tell you what's missing

### Step 4: If Submission Fails
Apple's error message will explicitly tell you:
- "Subscriptions must be linked to app version"
- And provide instructions on how to do it
- This will reveal where the section actually is

## Alternative: Contact Apple Support

If none of the above works:
1. Go to **App Store Connect** → **Help** → **Contact Us**
2. Ask: "How do I link auto-renewable subscriptions to my app version for first-time submission?"
3. They can provide specific guidance for your account setup

## Most Likely Scenario

Based on recent Apple interface changes:
- The "In-App Purchases and Subscriptions" section might **only appear** after:
  - You have a build uploaded
  - All app metadata is complete
  - Subscriptions have all required fields filled (including Review Notes)
- OR it appears **during submission** when you click "Add for Review"
- OR Apple automatically associates subscriptions that are ready when you submit

**Try filling Review Notes first, then attempt submission - Apple will guide you!**

