# Sandbox Testing - Next Steps

## ✅ Native Module Enabled

The IAP native module has been enabled:
- `BYPASS_IAP_NATIVE_MODULE = false` in `src/lib/appleIAPService.ts`
- Ready for sandbox testing

## Next Steps to Test

### Step 1: Rebuild the App

Rebuild with EAS to include the enabled native module:

```bash
eas build --platform ios --profile production
```

This will:
- Pull latest code (with native module enabled)
- Build iOS app with `expo-in-app-purchases` linked
- Generate `.ipa` file for TestFlight

### Step 2: Upload to TestFlight

Once build completes:
1. EAS will provide a download link, OR
2. Use `npx eas submit --platform ios --latest` to submit automatically
3. Build will appear in App Store Connect → TestFlight

### Step 3: Create Sandbox Tester Account

1. Go to **App Store Connect** → **Users and Access** → **Sandbox Testers**
2. Click **"+"** to add a new sandbox tester
3. Enter:
   - Email: Use a unique email (e.g., `test+gutcheck@example.com`)
   - Password: Create a secure password
   - Country/Region: Match your testing region
   - Save

**Note**: Sandbox tester accounts are separate from regular Apple IDs

### Step 4: Install TestFlight Build

1. Install **TestFlight** app on your iOS device (if not already)
2. Accept the TestFlight invitation (if external tester)
3. Install the GutCheck app build

### Step 5: Sign In with Sandbox Account

**On your iOS device:**

1. Open **Settings** app
2. Scroll to **"[Your Name]"** section
3. Tap **"Media & Purchases"**
4. **Sign Out** if signed in with a regular Apple ID
5. When you attempt a purchase in the app:
   - Apple will prompt for sign-in
   - **Sign in with your sandbox tester account**
   - This is NOT your regular Apple ID!

**Alternative method:**
- Some iOS versions have **Settings** → **Developer** → **Sandbox Account**
- You can sign in there before testing

### Step 6: Test Subscription Purchase

1. Open the GutCheck app in TestFlight
2. Navigate to **Subscription** screen
3. Tap **"Subscribe"** (monthly or yearly)
4. Apple purchase sheet should appear
5. **Sign in with sandbox account** (if prompted)
6. Complete the purchase
7. Verify:
   - Purchase succeeds
   - Subscription activates in app
   - Status shows as active

### Step 7: Test Restore Purchases

1. Delete and reinstall the app (or clear data)
2. Open app again
3. Navigate to Subscription screen
4. Tap **"Restore Purchases"**
5. Verify subscription restores

## Expected Behavior

### ✅ Success Indicators:
- Products query successfully from App Store Connect
- Purchase sheet appears when tapping "Subscribe"
- Sandbox purchase completes
- Subscription shows as active
- No crashes during IAP flow

### ⚠️ If Issues Occur:

**If app crashes when loading subscription screen:**
- Check logs for specific error
- May indicate native module linking issue
- We can investigate further

**If products don't appear:**
- Verify subscriptions are "Ready to Submit" (they are!)
- Wait 5-10 minutes after status change
- Check sandbox account is signed in correctly

**If purchase fails:**
- Ensure sandbox account is active in App Store Connect
- Verify account country/region matches
- Check device date/time is correct

## Testing Checklist

- [ ] App rebuilt with native module enabled
- [ ] Build uploaded to TestFlight
- [ ] Sandbox tester account created
- [ ] TestFlight build installed on device
- [ ] Signed in with sandbox account
- [ ] Subscription screen loads without crash
- [ ] Products are queryable (no "products not found")
- [ ] Purchase sheet appears
- [ ] Purchase completes successfully
- [ ] Subscription shows as active
- [ ] Restore purchases works

## Important Notes

### Sandbox vs Production:
- **Sandbox testing**: Uses fake payment, accelerated renewals for testing
- **Production**: Real purchases, normal renewal schedules
- Sandbox works even when subscriptions are "Waiting for Review" ✅

### TestFlight IAP Behavior:
- Automatically uses sandbox environment
- Subscriptions renew at accelerated rate (for testing)
- No real charges occur

### If Native Module Still Crashes:
- We can revert `BYPASS_IAP_NATIVE_MODULE = true` temporarily
- Investigate specific error logs
- May need to check native module linking in build

## After Successful Testing

Once sandbox testing confirms IAP works:
- ✅ Submit app version with subscriptions for review
- ✅ Wait for Apple approval
- ✅ Launch to production!

---

**You're ready to test!** Build the app and test in TestFlight with sandbox account. 🚀

