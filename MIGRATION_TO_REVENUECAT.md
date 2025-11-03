# Migration to RevenueCat - Summary

## ✅ Completed Steps

1. **Installed RevenueCat SDK:** `react-native-purchases` package installed
2. **Created RevenueCat Service:** `src/lib/revenueCatService.ts` replaces `appleIAPService.ts`
3. **Updated Subscription Store:** `src/lib/stores/subscriptionStore.ts` now uses RevenueCat
4. **Maintained Compatibility:** Product IDs remain the same, so no App Store Connect changes needed

## 📋 Next Steps (Required Before Testing)

### 1. Set Up RevenueCat Dashboard

1. Sign up at https://www.revenuecat.com/
2. Create a project called "GutCheck"
3. Select Apple Platforms and click "Get Started"
4. **Configure App Store Connect API:**
   - Click "Go to Team Keys" in RevenueCat onboarding
   - In App Store Connect → Users and Access → Integrations → Team Keys
   - Generate/use API key
   - Paste it back into RevenueCat onboarding
5. Complete onboarding:
   - Add bundle ID: `com.gutcheck.app`
   - RevenueCat will auto-import your products
6. Verify entitlement exists (e.g., "GutCheck Premium") with both products
7. Verify offering exists with both products
8. Get Apple API key (starts with `appl_`)

### 2. Add API Key to EAS

1. Go to Expo dashboard: https://expo.dev/accounts/justice_asibe/projects/gutcheck
2. Add environment variable:
   - **Key:** `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
   - **Value:** Your RevenueCat Apple API key
   - **Scope:** Production (and Preview)

### 3. Rebuild App

```bash
eas build --platform ios --profile production --clear-cache
```

### 4. Test

- Upload to TestFlight
- Test subscription purchase
- Verify purchases in RevenueCat dashboard

## 🔄 Code Changes Made

### New Files
- `src/lib/revenueCatService.ts` - RevenueCat implementation
- `REVENUECAT_SETUP.md` - Setup instructions
- `MIGRATION_TO_REVENUECAT.md` - This file

### Modified Files
- `src/lib/stores/subscriptionStore.ts` - Now uses RevenueCat service
- `package.json` - Added `react-native-purchases`

### Files to Remove Later (After Testing)
- `src/lib/appleIAPService.ts` - Old IAP service (keep until RevenueCat is confirmed working)
- Can remove `expo-in-app-purchases` from `package.json` after testing

## 🎯 Benefits

- ✅ **Better Linking:** RevenueCat has better native module linking
- ✅ **More Reliable:** Actively maintained, widely used
- ✅ **Cross-Platform:** Works on Android too
- ✅ **Better Analytics:** Built-in dashboard and webhooks
- ✅ **Free Tier:** No cost for basic usage

## ⚠️ Important Notes

1. **API Key Required:** App won't work until API key is set in EAS
2. **Offerings Must Be Configured:** RevenueCat needs offerings in dashboard
3. **Entitlement Name:** Code expects entitlement named `GutCheck Premium`
4. **Product IDs:** Same as before, no changes needed in App Store Connect

## 📚 Resources

- RevenueCat Docs: https://docs.revenuecat.com/docs/expo
- Setup Guide: See `REVENUECAT_SETUP.md`

