# Apple App Store Review Fixes - Summary

## ✅ CODE FIXES (Completed)

### 1. **Annual Plan Name Bug** (Guideline 2.1)
- **Issue:** Annual plan was showing "Premium Monthly" instead of "Premium Yearly"
- **Fix:** 
  - Updated `src/lib/revenueCatService.ts` to force correct title based on product ID
  - Updated `src/lib/stores/subscriptionStore.ts` to use hardcoded "Premium Yearly" name
  - This ensures the correct name is displayed regardless of App Store Connect metadata

### 2. **Free Trial Display** (Guideline 2.1)
- **Issue:** 7-day free trial not displayed for Annual plan
- **Fix:**
  - Updated `src/lib/revenueCatService.ts` to extract free trial information from RevenueCat products
  - Added `hasFreeTrial` and `freeTrialDays` to product data structure
  - Updated `src/app/subscription.tsx` to display free trial badge when available
  - Free trial badge will automatically show if configured in App Store Connect and RevenueCat

### 3. **Terms of Use (EULA) Link** (Guideline 3.1.2)
- **Issue:** Missing functional Terms of Use link in app binary
- **Fix:**
  - Added clickable "Terms of Use (EULA)" link to subscription screen
  - Link opens `https://mygutcheck.org/terms` in browser
  - Added error handling if link fails to open

---

## 📋 APP STORE CONNECT FIXES (You Need to Do)

### 1. **Free Trial Configuration** (Guideline 2.1)
**Action Required:**
- Go to App Store Connect → Your App → Subscriptions
- Find your Annual subscription product (`com.gutcheck.app.premium.yearly`)
- Ensure a 7-day free trial is configured as an introductory offer
- Verify it's properly linked in RevenueCat dashboard

**Where to Check:**
- App Store Connect → Subscriptions → Your Annual Product → Introductory Offers
- RevenueCat Dashboard → Products → Verify free trial period is shown

---

### 2. **Paid Content Labeling** (Guideline 2.3.2)
**Action Required:**
- Go to App Store Connect → Your App → App Information
- Update your app description to clearly label which features require a subscription
- Add text like: "Unlock all features with Premium Subscription" or "Premium features include: [list]"
- Update screenshots to add "Premium" badges or labels on paid features

**Example Addition:**
```
Premium Subscription Required:
- Unlimited AI conversations
- Image and document analysis
- Advanced insights
- Priority support
```

---

### 3. **Remove "AI Therapist" Terminology** (Guideline 2.3)
**Action Required:**
- Go to App Store Connect → Your App → App Information
- Find and remove or replace "AI therapist" language in your app description
- Use terms like:
  - "AI assistant"
  - "AI companion"  
  - "AI coach"
  - "AI support"
  - Avoid "therapist" unless the AI is actually a licensed mental health professional

---

### 4. **Add Terms of Use Link to Metadata** (Guideline 3.1.2)
**Action Required:**
- Go to App Store Connect → Your App → App Information
- Add the Terms of Use link to your app description:
  ```
  Terms of Use: https://mygutcheck.org/terms
  ```
- OR if using a custom EULA, add it in the dedicated EULA field in App Store Connect

---

### 5. **Receipt Validation** (Guideline 2.1 - Optional)
**Note:** RevenueCat handles this automatically, but verify:
- RevenueCat Dashboard → Integrations → App Store Connect
- Ensure your App Store Connect API Key is correctly configured
- RevenueCat automatically handles sandbox vs production receipt validation

---

## 🚀 Next Steps

1. **Rebuild the app** with these code fixes:
   ```bash
   eas build --platform ios --profile production
   ```

2. **Make the App Store Connect changes** listed above

3. **Resubmit for review** after both code and metadata changes are complete

4. **Test free trial display** - Ensure the Annual plan shows the 7-day free trial badge after you configure it in App Store Connect

---

## ✅ Verification Checklist

Before resubmitting, verify:

- [ ] Annual plan shows "Premium Yearly" (not "Premium Monthly")
- [ ] Annual plan displays free trial badge (if configured in App Store Connect)
- [ ] Terms of Use link is visible and clickable on subscription screen
- [ ] App Store Connect description clearly labels paid features
- [ ] App Store Connect description doesn't use "AI therapist"
- [ ] Terms of Use link is in App Store Connect metadata
- [ ] Free trial is configured for Annual plan in App Store Connect
- [ ] New build uploaded to App Store Connect

---

## 📝 Files Modified

**Code Changes:**
- `src/lib/revenueCatService.ts` - Extract free trial info, force correct product titles
- `src/lib/stores/subscriptionStore.ts` - Force "Premium Yearly" name, include free trial data
- `src/app/subscription.tsx` - Display free trial badge, add Terms of Use link

**No changes needed to:**
- `app.config.js`
- `package.json`
- Other files

---

## 🔗 Related Documentation

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [RevenueCat Free Trial Setup](https://docs.revenuecat.com/docs/ios-subscription-offers)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)

