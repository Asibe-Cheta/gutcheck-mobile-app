# IAP Subscription Testing Guide

## Problem
If you're in the first 20 users, you automatically get lifetime pro access, which prevents testing the subscription purchase flow. Here are three ways to test IAP subscriptions:

## Method 1: Remove Yourself from Lifetime Pro (Recommended for TestFlight)

### Step 1: Check Your User ID
1. Open the app and go to Settings
2. Note your User ID (or check AsyncStorage in debug)

### Step 2: Run SQL in Supabase
Go to Supabase SQL Editor and run:

```sql
-- Replace 'your-user-id-here' with your actual user ID
-- To find your user ID: Check AsyncStorage 'user_id' or check profiles table

-- Remove from lifetime_pro_users table
DELETE FROM lifetime_pro_users 
WHERE user_id = 'your-user-id-here';

-- Update profile to remove lifetime pro status
UPDATE profiles 
SET 
  is_lifetime_pro = FALSE,
  subscription_plan = NULL,
  subscription_status = 'inactive'
WHERE user_id = 'your-user-id-here';
```

### Step 3: Clear App Local Storage
In the app:
1. Clear AsyncStorage or reinstall the app
2. Navigate to subscription screen
3. You should now see subscription options instead of "Lifetime Pro Active"
4. Test the purchase flow

---

## Method 2: Increase Count to 20+ (Simulate 21st User)

### Run SQL to Add Fake Users:
```sql
-- Add 20 fake users to lifetime_pro_users (replace with real user IDs from your profiles)
-- This makes you the 21st user

-- First, get some user IDs from your profiles table
SELECT id FROM profiles LIMIT 20;

-- Then insert them (replace these UUIDs with actual ones from your database)
INSERT INTO lifetime_pro_users (user_id, granted_at, is_active)
VALUES 
  ('user-id-1', NOW(), TRUE),
  ('user-id-2', NOW(), TRUE),
  -- ... add 18 more user IDs
  ('user-id-20', NOW(), TRUE)
ON CONFLICT DO NOTHING;

-- Verify count is now 20+
SELECT COUNT(*) as lifetime_pro_count 
FROM lifetime_pro_users 
WHERE is_active = TRUE;
```

### Then test:
1. Your user will be the 21st user
2. Subscription screen will show regular subscription options
3. Test purchase flow works

---

## Method 3: Use the Test Button (TestFlight/Dev Builds Only)

A test button is available in the subscription screen (only visible in TestFlight/dev builds):

1. Navigate to Subscription screen
2. Scroll to the bottom
3. Look for "Remove Lifetime Pro for Testing" button (dev only)
4. Tap it to remove yourself from lifetime pro
5. Refresh subscription screen
6. Test purchase flow

---

## Restore Lifetime Pro Status After Testing

If you want to restore your lifetime pro status after testing:

```sql
-- Re-add yourself to lifetime_pro_users
INSERT INTO lifetime_pro_users (user_id, granted_at, is_active)
VALUES ('your-user-id-here', NOW(), TRUE)
ON CONFLICT (user_id) DO UPDATE SET is_active = TRUE;

-- Update profile
UPDATE profiles 
SET 
  is_lifetime_pro = TRUE,
  subscription_plan = 'lifetime_pro',
  subscription_status = 'active',
  lifetime_pro_granted_at = NOW()
WHERE user_id = 'your-user-id-here';
```

Then clear app data or reinstall the app.

---

## Quick Test Checklist

- [ ] Removed from lifetime pro (Method 1) OR count is 20+ (Method 2)
- [ ] App shows subscription options (not "Lifetime Pro Active")
- [ ] "Subscribe" buttons are enabled
- [ ] Tapping "Subscribe" shows Apple IAP purchase sheet
- [ ] Complete purchase with sandbox account
- [ ] Purchase succeeds and subscription is active
- [ ] "Restore Purchases" works
- [ ] Subscription persists after app restart

---

## Troubleshooting

### "You already have lifetime pro access" error
- Check: Did you remove yourself from `lifetime_pro_users` table?
- Check: Did you clear AsyncStorage or reinstall app?
- Check: Is `is_lifetime_pro` set to FALSE in profiles table?

### Purchase still blocked
- Ensure you're signed into Sandbox account: Settings → Developer → Sign in to sandbox
- Ensure IAP products are "Cleared for Sale" in App Store Connect
- Check console logs for IAP errors

### Still shows "Lifetime Pro Active"
- Clear app data completely
- Reinstall TestFlight build
- Check database directly to confirm removal

---

## Important Notes

- **Method 1** (remove yourself) is best for testing your actual user
- **Method 2** (increase count) is best for testing as "21st user" without modifying your account
- **Method 3** (test button) is convenient but only available in dev/TestFlight builds
- Always restore lifetime pro status after testing if you want it back
- Production users will never see test buttons - they're dev-only

