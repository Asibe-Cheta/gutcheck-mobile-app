# Solution: Switch to expo-purchases (RevenueCat)

## Why Switch?

The `expo-in-app-purchases` module has a persistent linking issue:
- ✅ Module compiles successfully
- ✅ Static library created
- ❌ **Module NOT linked into binary** (confirmed by crash logs)
- ❌ Auto-linking not working properly
- ❌ No config plugin available
- ❌ Can't manually fix on Windows

**expo-purchases** offers:
- ✅ More mature and reliable package
- ✅ Better auto-linking support
- ✅ Active maintenance and support
- ✅ Free tier available
- ✅ Better documentation
- ✅ Works with Expo SDK 54

## Migration Steps

### Step 1: Install expo-purchases

```bash
npx expo install expo-purchases
```

### Step 2: Remove expo-in-app-purchases (Optional)

```bash
npm uninstall expo-in-app-purchases
```

### Step 3: Sign Up for RevenueCat (Free)

1. Go to https://www.revenuecat.com/
2. Sign up (free tier is sufficient)
3. Create a project
4. Get your API key

### Step 4: Update Code

Replace `src/lib/appleIAPService.ts` with RevenueCat implementation.

**Key Differences:**
- RevenueCat uses "Offerings" instead of direct product IDs
- Better error handling
- Cross-platform (works on Android too)
- More features (webhooks, analytics)

### Step 5: Update App Store Connect

RevenueCat uses the same Product IDs, so no changes needed in App Store Connect.

### Step 6: Update Subscription Store

Update `src/lib/stores/subscriptionStore.ts` to use RevenueCat API.

## Time Estimate

- **Installation & Setup:** 30 minutes
- **Code Migration:** 1-2 hours
- **Testing:** 1 hour
- **Total:** 2.5-3.5 hours

## Resources

- RevenueCat Docs: https://docs.revenuecat.com/docs/expo
- Expo Purchases: https://docs.expo.dev/versions/latest/sdk/purchases/

## Decision Needed

**Should we:**
1. ✅ **Switch to expo-purchases** (Recommended - most reliable)
2. Continue debugging expo-in-app-purchases (may take longer, no guarantee)

**Recommendation:** Switch to expo-purchases. It's the fastest path to a working IAP solution.

