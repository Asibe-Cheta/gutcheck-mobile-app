# Subscription Metadata Troubleshooting Guide

## Current Status Analysis

From your screenshot, I can see:
- ✅ Reference Name: "Premium Monthly"
- ✅ Product ID: `com.gutcheck.app.premium.monthly`
- ✅ Subscription Duration: 1 month
- ✅ Localization: English (U.K.) with display name and description
- ✅ Image: Uploaded (1024x1024)
- ✅ Pricing: Should be set (section collapsed)
- ⚠️ **Review Notes**: Empty
- ⚠️ **Status**: "Missing Metadata"

## Common Causes of "Missing Metadata" Status

### 1. **Review Notes Field** (Most Likely Issue)
Even though Review Notes is marked as optional, **Apple sometimes requires it for first-time subscription submissions**, especially if:
- This is your first IAP submission
- You had a previous rejection
- Apple wants clarification on subscription functionality

**Action**: Fill in Review Notes with something like:
```
This subscription provides unlimited AI conversations, image/document analysis, personalized guidance, and priority support. Users can test the subscription using their Apple ID during review. The subscription auto-renews monthly unless cancelled.
```

### 2. **Subscription Pricing Not Fully Configured**
The pricing section is collapsed, but make sure:
- [ ] Base price is set for your primary territory
- [ ] At least one pricing tier is active
- [ ] Pricing is not "Missing" or "Incomplete"

**Action**: 
1. Click "View all Subscription Pricing" or expand "Current Pricing for New Subscribers"
2. Verify pricing shows as "Active" or "Ready to Submit"
3. If any price shows as "Missing", set it

### 3. **Subscription Group Issues**
- [ ] Subscription group "GutCheck Premium" exists
- [ ] Both monthly and yearly subscriptions are in the same group
- [ ] Group settings are configured

**Action**: 
1. Go to "Subscriptions" → "GutCheck Premium" (the group)
2. Verify both subscriptions appear in the group
3. Check if group has any missing configuration

### 4. **Image Requirements Not Met**
Even though you uploaded an image, Apple might flag it if:
- [ ] Image is not exactly 1024x1024 pixels
- [ ] Image is blurry or low quality
- [ ] Image text is not readable
- [ ] Image doesn't clearly represent the subscription

**Previous rejection mentioned**: "Image was not clear"

**Action**:
1. Verify image dimensions are exactly 1024x1024
2. Ensure image is high resolution (not compressed)
3. Make sure text is readable at full size
4. Image should clearly show what the subscription offers

### 5. **Localization Status**
Yellow dot on "Prepare for Submission" suggests:
- [ ] Description might be too short or generic
- [ ] Display name might need adjustment
- [ ] Additional localizations might be required (unlikely for first submission)

**Action**:
1. Review the description - make it specific and clear
2. Current: "Unlimited AI analyses, and personalized guidance"
3. Suggested: "Unlimited AI conversations, image and document analysis, personalized guidance, priority support, and advanced insights"

### 6. **Free Trial Configuration**
If you're offering a 7-day free trial:
- [ ] Free trial is configured in subscription settings
- [ ] Trial duration is set correctly
- [ ] Trial offer appears in subscription details

**Action**: Check if free trial needs to be configured explicitly in subscription settings.

## Step-by-Step Verification Checklist

### Premium Monthly Subscription

1. **Reference Name**: ✅ "Premium Monthly"
2. **Product ID**: ✅ `com.gutcheck.app.premium.monthly`
3. **Subscription Duration**: ✅ 1 month
4. **Localization (English U.K.)**:
   - [ ] Display Name: "Premium Monthly"
   - [ ] Description: Clear and specific (expand if needed)
5. **Subscription Prices**:
   - [ ] Expand "Current Pricing for New Subscribers"
   - [ ] Verify price is set (e.g., £9.99/month)
   - [ ] Status should not be "Missing"
6. **Availability**:
   - [ ] All countries selected (or specific countries)
   - [ ] Not set to "Remove from sale"
7. **Image**:
   - [ ] 1024x1024 pixels
   - [ ] High resolution, clear text
   - [ ] Represents subscription clearly
8. **Review Information**:
   - [ ] **FILL THIS IN**: Add review notes explaining the subscription
   - [ ] Screenshot uploaded (same as subscription image or app screenshot)
9. **Tax Category**: ✅ "Fitness and Health"
10. **Family Sharing**: Optional (can leave off for now)

### Premium Yearly Subscription

Repeat all steps above for the yearly subscription.

## How to Fix "Missing Metadata"

### Option 1: Fill Review Notes (Start Here)
1. Scroll to "Review Information" section
2. Click in the "Review Notes" text area
3. Paste this:
   ```
   This auto-renewable subscription provides unlimited AI conversations, image and document analysis, personalized guidance, priority support, and advanced insights. 
   
   The subscription auto-renews monthly/yearly unless cancelled. Users can test the subscription during review using their Apple ID.
   
   Previous rejection issues have been resolved:
   - IAP crash has been fixed - subscription screen now loads properly
   - Image has been updated to be clear and high resolution
   ```
4. Save changes

### Option 2: Verify Pricing
1. Click "View all Subscription Pricing" or expand pricing section
2. Take a screenshot of what you see
3. If any price shows "Missing" or "Incomplete", click to set it
4. Save changes

### Option 3: Re-upload Image
If the image was previously rejected as "not clear":
1. Create a new 1024x1024 image
2. Use high contrast colors
3. Ensure text is large and readable
4. Upload the new image
5. Also update "Review Information" → Screenshot

### Option 4: Expand Description
If description seems too short:
1. Go to Localization section
2. Edit description to be more specific:
   ```
   Get unlimited AI conversations, image and document analysis, personalized guidance tailored to your needs, priority customer support, and advanced insights into your conversations.
   ```

## After Making Changes

1. **Save** all changes
2. **Wait 5-10 minutes** for App Store Connect to update status
3. **Refresh the page** and check if "Missing Metadata" status changes
4. **Check both subscriptions** (Monthly and Yearly)
5. If status persists, try **submitting for review anyway** - sometimes Apple's status is delayed

## If Status Still Shows "Missing Metadata"

Sometimes Apple's status indicator is delayed. You can:

1. **Try submitting anyway** - Apple will tell you exactly what's missing during review
2. **Contact Apple Support** - They can clarify what metadata is missing
3. **Check Subscription Group** - Make sure the group itself doesn't have missing info
4. **Verify App Version** - First subscriptions must be submitted with an app version (see the blue banner at top of page)

## Important: First Subscription Requirement

The blue banner states:
> "Your first subscription must be submitted with a new app version."

This means:
- You cannot submit subscriptions alone
- You must submit subscriptions **with a new app version**
- Go to your app version page → "In-App Purchases and Subscriptions" section
- Select the subscriptions there
- Then submit the app version for review

**This might be why status shows "Missing Metadata"** - the subscriptions might need to be linked to an app version first!

## Next Steps

1. ✅ Fill in Review Notes (do this first)
2. ✅ Verify pricing is complete
3. ✅ Check if subscription needs to be linked to app version
4. ✅ If status still shows "Missing Metadata", try submitting with app version anyway

Apple's review process will clarify exactly what's missing if there's still an issue.

