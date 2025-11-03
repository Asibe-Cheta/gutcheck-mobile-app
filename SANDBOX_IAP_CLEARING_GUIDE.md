# Sandbox IAP Clearing Guide

## The Problem

When testing IAP subscriptions in sandbox mode, iOS persists the transaction across purchases. Even with a completely new app account, if you use the **same sandbox Apple ID** that previously made a purchase, iOS will show "You are currently subscribed to this" because Apple remembers the transaction.

## Why This Happens

Apple's sandbox IAP system ties subscriptions to the **sandbox Apple ID**, not your app account. This is different from production where subscriptions are tied to the Apple ID but isolated per app.

## The Solution

You need to **delete the sandbox tester** and create a brand new one for each test.

### Step 1: Delete the Sandbox Tester

1. Go to App Store Connect → Users and Access
2. Click "Sandbox Testers" tab
3. Find the sandbox tester you used
4. Click the "Edit" button (pencil icon)
5. Scroll down and click "Remove Sandbox Tester"
6. Confirm the deletion

### Step 2: Sign Out on Your Device

1. On your iPhone/iPad: Settings → App Store → Sandbox Account
2. Tap "Sign Out" or remove the account

### Step 3: Create a Brand New Sandbox Tester

1. Go back to App Store Connect → Users and Access → Sandbox Testers
2. Click "+" to create a new tester
3. Use a **brand new email address** (e.g., `test100@example.com` instead of `test99@example.com`)
4. Fill in the required fields
5. Click "Save"

### Step 4: Sign In with New Account on Device

1. On your iPhone/iPad: Settings → App Store → Sandbox Account
2. Sign in with the NEW sandbox tester credentials

### Step 5: Test Again

1. Open your app
2. Create a new anonymous account
3. Try to purchase subscription
4. The subscription flow should work correctly

## Alternative: Use TestFlight Internal Testing

Instead of using sandbox accounts repeatedly, you can:
1. Build your app to TestFlight
2. Use TestFlight's internal testing
3. Make purchases with your real Apple ID (won't be charged)
4. Transactions won't persist across versions

## Testing Best Practices

### For Development Testing
- Use sandbox testers (free, fast iteration)
- Create **new testers** for each major test cycle
- Delete old testers to clear transaction history

### For Pre-Release Testing
- Use TestFlight internal testing
- Fewer transaction/persistence issues
- More realistic production-like experience

## Understanding the Error Message

If you see "You are currently subscribed to this", it means:
1. That sandbox Apple ID has an active transaction
2. iOS is preventing a duplicate purchase
3. You need to use a **different** sandbox Apple ID

**This is NOT a bug** - it's how Apple prevents duplicate subscriptions. Even with a new app account, if you use an Apple ID that already has a subscription, iOS shows this message.

## Debugging

To check if RevenueCat is properly isolating users:
```javascript
[LOG] Active entitlements: []
```

If you see `[]` (empty array), RevenueCat correctly reports no subscription for that user.

If you still see the iOS message:
1. The Apple ID has an active sandbox transaction
2. Create a NEW sandbox tester
3. Sign in with the new credentials on your device

## Common Mistakes

❌ **Using the same sandbox email with different passwords**  
✅ **Create a completely new sandbox tester with a unique email**

❌ **Only signing out of the sandbox account**  
✅ **Delete the tester AND sign out**

❌ **Reusing test1@example.com across multiple tests**  
✅ **Use test2@, test3@, etc. for each test**

## RevenueCat Isolation

RevenueCat is working correctly - logs show:
- Empty entitlements for new users: `Active entitlements: []`
- Correct user ID tracking: `Setting app user ID: 32b8e1e6...`
- No subscription found: `hasActiveSubscription result: false`

The iOS message is separate from RevenueCat's subscription status.

