# Clear Lifetime Pro Cache - SQL Fix

## Problem
After removing lifetime pro via SQL, the app still shows "Lifetime Pro Active" because:
1. **AsyncStorage cache** stores the old status
2. **SQL UPDATE didn't work** - you used placeholder `'your-user-id'` instead of actual user_id

## Quick Fix (Run This SQL)

Replace `'8f0a151e-d293-4868-9cb7-ecd41fe6c031'` with your actual user_id if different:

```sql
-- Step 1: Remove from lifetime_pro_users table
DELETE FROM lifetime_pro_users 
WHERE user_id = '8f0a151e-d293-4868-9cb7-ecd41fe6c031';

-- Step 2: Update profiles table (IMPORTANT: Use actual user_id, not 'your-user-id')
UPDATE profiles 
SET 
  is_lifetime_pro = FALSE,
  subscription_plan = NULL,
  subscription_status = 'inactive'
WHERE user_id = '8f0a151e-d293-4868-9cb7-ecd41fe6c031';  -- Use your actual user_id here!
```

## Clear App Cache

After running SQL, clear the app's local cache:

### Option A: Delete and Reinstall App (Easiest)
1. Delete the TestFlight app from your device
2. Reinstall from TestFlight
3. Log in again
4. Check subscription screen

### Option B: Clear AsyncStorage Programmatically
Add this to a debug screen or run in console:
```javascript
// In React Native Debugger or via a debug button
await AsyncStorage.multiRemove([
  'lifetime_pro_8f0a151e-d293-4868-9cb7-ecd41fe6c031',
  'subscription_status',
  'subscription_plan'
]);
```

## Verify SQL Worked

Run this to check:
```sql
-- Check if user is in lifetime_pro_users
SELECT * FROM lifetime_pro_users 
WHERE user_id = '8f0a151e-d293-4868-9cb7-ecd41fe6c031';
-- Should return 0 rows

-- Check profile status
SELECT user_id, is_lifetime_pro, subscription_plan, subscription_status 
FROM profiles 
WHERE user_id = '8f0a151e-d293-4868-9cb7-ecd41fe6c031';
-- Should show: is_lifetime_pro = FALSE, subscription_plan = NULL
```

## For New Accounts

New accounts will still get lifetime pro if count < 20. To test subscriptions with a new account:

1. **Check current count:**
```sql
SELECT COUNT(*) as current_count 
FROM lifetime_pro_users 
WHERE is_active = TRUE;
```

2. **If count < 20**, manually add 20 fake users OR use the test button in the app (if visible)

## Test Button Location

The test button appears at the bottom of the Subscription screen (below "Restore Purchases" button), **only if**:
- You're in TestFlight or dev build
- AND you currently have lifetime pro status

If you don't see it:
1. The button only shows when `isLifetimePro === true`
2. Scroll to the very bottom of the subscription screen
3. It has an orange/flask icon and says "Remove Lifetime Pro for Testing"

