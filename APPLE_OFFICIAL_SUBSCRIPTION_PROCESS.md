# Apple's Official Subscription Submission Process

## Based on Official Documentation

Reference: [Offer auto-renewable subscriptions](https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions)

## Key Findings

### 1. Subscriptions Are Created Separately

According to Apple's documentation:
- Subscriptions are created under **"Subscriptions"** in the left sidebar (under Monetization)
- Subscriptions are managed **independently** from app versions
- The subscription group and products are configured in the Subscriptions section

### 2. Linking Happens During Submission

The "In-App Purchases and Subscriptions" section on the app version page **may not always be visible**. Apple's workflow suggests:

1. **Create subscriptions** in the Subscriptions section (✅ Already done)
2. **Complete subscription metadata** (Review Notes, pricing, etc.)
3. **Complete app version metadata** (screenshots, description, etc.)
4. **Submit app version for review**
5. **During submission**, Apple associates subscriptions with the version

### 3. First-Time Subscriptions Requirement

Apple's blue banner states:
> "Your first subscription must be submitted with a new app version"

This means:
- ✅ You cannot submit subscriptions independently on first submission
- ✅ Subscriptions are included when you submit the app version
- ✅ The linking mechanism may not be visible until submission

## What You Should Do

### Step 1: Complete Subscription Metadata

Per Apple's documentation, ensure:

1. **Review Information**:
   - Fill "Review Notes" explaining what the subscription provides
   - Upload screenshot for review

2. **Subscription Prices**:
   - Verify pricing is set for your territories
   - Check "Current Pricing for New Subscribers" is configured

3. **Localization**:
   - Display name: "Premium Monthly" / "Premium Yearly"
   - Description: Clear explanation of benefits

4. **Availability**:
   - Set countries/regions (or "All countries")

### Step 2: Complete App Version Metadata

On the "iOS App Version 1.0" page:
- ✅ Screenshots uploaded
- ✅ App description complete
- ✅ All required fields filled

### Step 3: Submit for Review

1. Click **"Add for Review"** at the top right of the version page
2. **During submission**, Apple will:
   - Check if subscriptions are ready
   - Associate them with the app version
   - Show any missing requirements

### Step 4: If Submission Fails

If Apple rejects or errors during submission:
- The error message will **explicitly state** what's missing
- It will tell you exactly where to link subscriptions
- This will reveal where the "In-App Purchases and Subscriptions" section actually is (if it exists)

## Common Scenario: Section Not Visible

Many developers report the "In-App Purchases and Subscriptions" section **not being visible** until:
- A build is uploaded
- All app metadata is complete
- Subscriptions have all required fields
- During the actual submission process

## Recommended Action

**Try submitting the app version** even if you can't find the linking section. Apple's submission process will:
1. ✅ Tell you if subscriptions need to be linked
2. ✅ Show you exactly where to do it
3. ✅ Or automatically associate ready subscriptions

The worst that happens is Apple tells you what's missing, which gives you the exact answer!

## Official Apple Support

If you're still stuck:
1. Check: [Apple Developer Forums](https://developer.apple.com/forums/)
2. Contact: [Apple Developer Support](https://developer.apple.com/contact/)
3. Reference: Ask about "linking auto-renewable subscriptions to first app version submission"

---

**Summary**: According to Apple's official process, the linking typically happens **during submission**, not before. Try submitting and let Apple guide you through any missing steps.

