# Fix Lifetime Pro SQL - Correct Query

## The Problem
Your SQL used the placeholder `'your-user-id'` instead of the actual user_id.

## Corrected SQL (Run This)

```sql
-- Replace user_id with your actual user_id if different
-- Your user_id from the image: '8f0a151e-d293-4868-9cb7-ecd41fe6c031'

-- Step 1: Remove from lifetime_pro_users
DELETE FROM lifetime_pro_users 
WHERE user_id = '8f0a151e-d293-4868-9cb7-ecd41fe6c031';

-- Step 2: Update profiles (THIS WAS THE BUG - you had 'your-user-id' here!)
UPDATE profiles 
SET 
  is_lifetime_pro = FALSE,
  subscription_plan = NULL,
  subscription_status = 'inactive'
WHERE user_id = '8f0a151e-d293-4868-9cb7-ecd41fe6c031';  -- Now using actual user_id
```

## Verify It Worked

```sql
-- Should return 0 rows
SELECT * FROM lifetime_pro_users 
WHERE user_id = '8f0a151e-d293-4868-9cb7-ecd41fe6c031';

-- Should show FALSE and NULL
SELECT user_id, is_lifetime_pro, subscription_plan, subscription_status 
FROM profiles 
WHERE user_id = '8f0a151e-d293-4868-9cb7-ecd41fe6c031';
```

## Then Clear App Cache

After SQL is fixed:
1. **Delete the TestFlight app** from your device
2. **Reinstall from TestFlight**
3. **Log in again**
4. Subscription screen should now show purchase options

