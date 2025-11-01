# ⚠️ CRITICAL: Fix IAP Product Types in App Store Connect

## Problem Found
Your IAP products are configured as **"Non-Consumable"** but should be **"Auto-Renewable Subscription"** for subscription products.

## Current Configuration (WRONG):
- Premium Monthly Subscription: Type = "Non-Consumable" ❌
- Premium Yearly Subscription: Type = "Non-Consumable" ❌

## Correct Configuration (NEEDED):
- Premium Monthly Subscription: Type = "Auto-Renewable Subscription" ✅
- Premium Yearly Subscription: Type = "Auto-Renewable Subscription" ✅

## Why This Matters

1. **Non-Consumable products** are for one-time purchases (like removing ads)
2. **Auto-Renewable Subscriptions** are for recurring monthly/yearly subscriptions
3. The native module expects subscription types and may crash when it encounters non-consumable products
4. Apple requires subscriptions to be Auto-Renewable Subscription type

## How to Fix

### Option 1: Delete and Recreate (Recommended if still in review)

Since the products are "Waiting for Review", you can:

1. **Delete the existing products** (if still in review):
   - Go to each product
   - Click "Delete" or remove them

2. **Create new products** with correct type:
   - Click "+" to create new in-app purchase
   - Select **"Auto-Renewable Subscription"** (NOT Non-Consumable)
   - Set up subscription group
   - Configure pricing and duration
   - Use the same Product IDs:
     - `com.mygutcheck.premium.monthly`
     - `com.mygutcheck.premium.yearly`

### Option 2: Check if Apple will allow type change

Sometimes Apple allows changing the type during review, but this is rare.

## Additional Requirements for Auto-Renewable Subscriptions

1. **Subscription Group**: Create a subscription group and add both products to it
2. **Free Trial**: Can configure 7-day free trial in the subscription settings
3. **Subscription Duration**: 
   - Monthly: 1 month
   - Yearly: 1 year
4. **Pricing**: Set for each territory or use default

## After Fixing

1. Products will need to be resubmitted for review
2. Rebuild the app to test
3. The native module should work correctly once products are the right type

## Why the Native Module Might Crash

The `expo-in-app-purchases` module expects:
- Subscription products to be queryable as subscriptions
- When it finds "Non-Consumable" products with subscription IDs, it may fail
- This could explain the crash when trying to load the module

## Next Steps

1. ✅ Fix product types in App Store Connect
2. ✅ Wait for products to be approved
3. ✅ Rebuild app and test
4. ✅ Try enabling IAP again (remove bypass)

