# Sandbox IAP Testing in TestFlight - Before Approval

## Short Answer

**YES, you can test IAP with Sandbox in TestFlight BEFORE subscriptions are approved**, BUT:

1. ✅ Subscriptions must have **complete metadata** (no "Missing Metadata" status)
2. ✅ Subscriptions must be in "Ready to Submit" or "Waiting for Review" (not "Missing Metadata")
3. ⚠️ The native module must be working (currently bypassed due to crashes)

## Detailed Explanation

### What Apple Allows

According to [Apple's documentation on testing subscriptions in TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testing-subscriptions-and-in-app-purchases-in-testflight/):

- ✅ **Sandbox testing works before approval**
- ✅ TestFlight automatically uses sandbox environment
- ✅ Subscriptions renew at accelerated rate for testing
- ⚠️ **BUT subscriptions need complete metadata** to be queryable

### Current Status: Two Barriers

#### Barrier 1: Missing Metadata ⚠️
**Status**: Subscriptions show "Missing Metadata"  
**Impact**: Sandbox cannot query products that have incomplete metadata  
**Solution**: Fill Review Notes and complete all required fields

#### Barrier 2: Native Module Crashes 🔴
**Status**: `BYPASS_IAP_NATIVE_MODULE = true`  
**Impact**: Native module is completely disabled to prevent crashes  
**Solution**: Remove bypass once metadata is complete, then test

## Step-by-Step: Enable Sandbox Testing

### Step 1: Complete Subscription Metadata (Do This First)

Even if subscriptions aren't approved, they need complete metadata for sandbox:

1. **Fill Review Notes**:
   - Go to "Subscriptions" → "Premium Monthly" → "Review Information"
   - Add: "This auto-renewable subscription provides unlimited AI conversations, image/document analysis, personalized guidance, priority support, and advanced insights. The subscription auto-renews monthly unless cancelled. Users can test using their Apple ID during review."
   - **Save**
   - Repeat for "Premium Yearly"

2. **Verify All Sections**:
   - ✅ Localization: Display name and description filled
   - ✅ Pricing: At least one price tier active
   - ✅ Availability: Countries/regions set
   - ✅ Review Information: Notes filled, screenshot uploaded

3. **Wait 5-10 minutes** for status to update from "Missing Metadata"

### Step 2: Enable Native Module (Remove Bypass)

Once metadata is complete:

1. **Edit `src/lib/appleIAPService.ts`**:
   ```typescript
   const BYPASS_IAP_NATIVE_MODULE = false; // Change from true to false
   ```

2. **Rebuild app**:
   ```bash
   eas build --platform ios --profile production
   ```

3. **Upload to TestFlight**

### Step 3: Test in Sandbox

1. **Create Sandbox Test Account**:
   - App Store Connect → Users and Access → Sandbox Testers
   - Create a new sandbox tester account

2. **Sign In on Device**:
   - Settings → [Your Name] → Media & Purchases → Sign Out (if signed in)
   - When prompted for purchase in app, sign in with sandbox account
   - OR: Settings → Developer → Sandbox Account (if available)

3. **Test Purchase Flow**:
   - Open app in TestFlight
   - Navigate to Subscription screen
   - Tap "Subscribe"
   - Should show Apple purchase sheet (sandbox)
   - Complete purchase with sandbox account

## What Happens at Each Stage

### Stage 1: Missing Metadata (Current)
- ❌ Sandbox cannot query products
- ❌ Native module crashes (bypassed)
- **Result**: Cannot test

### Stage 2: Metadata Complete, Still Waiting for Review
- ✅ Sandbox CAN query products (if metadata complete)
- ✅ Native module should work (if enabled)
- **Result**: CAN test in sandbox ✅

### Stage 3: Approved
- ✅ Sandbox works
- ✅ Production ready
- **Result**: Full functionality ✅

## Important Notes

### Sandbox Works Before Approval ✅

You **DO NOT need to wait for approval** if:
- Metadata is complete (no "Missing Metadata")
- Subscriptions are in "Ready to Submit" or "Waiting for Review"
- Native module is enabled

### But Approval Still Needed For Production ⚠️

- Sandbox testing can verify functionality
- Production users can only purchase AFTER approval
- Submit subscription with app version for final approval

## Testing Checklist

Once metadata is complete:

- [ ] Review Notes filled for both subscriptions
- [ ] Status changed from "Missing Metadata" to "Ready to Submit" or "Waiting for Review"
- [ ] Set `BYPASS_IAP_NATIVE_MODULE = false`
- [ ] Rebuild app with EAS
- [ ] Upload to TestFlight
- [ ] Create sandbox tester account
- [ ] Sign in with sandbox account on device
- [ ] Test subscription purchase flow
- [ ] Verify subscription activates
- [ ] Test restore purchases

## Quick Test: Verify Metadata is Queryable

After filling Review Notes, wait 5-10 minutes, then:

1. Check subscription status in App Store Connect
2. If "Missing Metadata" is gone, metadata is likely complete
3. Products should be queryable in sandbox (even if "Waiting for Review")

## Summary

| Scenario | Can Test in Sandbox? |
|----------|---------------------|
| Missing Metadata | ❌ No - Products not queryable |
| Metadata Complete + Waiting for Review | ✅ YES - Sandbox works |
| Approved | ✅ YES - Full functionality |

**Bottom Line**: Complete the metadata (especially Review Notes), then you can test in sandbox even before approval! 🚀

