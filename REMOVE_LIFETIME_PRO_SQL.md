# Remove Lifetime Pro SQL Query

## IMPORTANT: Type Mismatch Issue

Your `lifetime_pro_users` table has `user_id` as **UUID** (references `profiles.id`), 
but `profiles.user_id` is **TEXT**. The code uses `profiles.user_id` (TEXT).

## Two Options:

### Option 1: Use profiles.user_id (TEXT) - Recommended

For user with `profiles.user_id = '3b775701-e50e-466d-b6b8-1580123de4fd'`:

```sql
-- Step 1: Find the profiles.id (UUID) that matches profiles.user_id (TEXT)
-- Run this first to find the UUID:
SELECT id, user_id, username 
FROM profiles 
WHERE user_id = '3b775701-e50e-466d-b6b8-1580123de4fd';
-- Result will show: id = '8f0a151e-d293-4868-9cb7-ecd41fe6c031' (UUID)

-- Step 2: Remove from lifetime_pro_users using the UUID (profiles.id)
DELETE FROM lifetime_pro_users 
WHERE user_id = '8f0a151e-d293-4868-9cb7-ecd41fe6c031';

-- Step 3: Update profiles table using the TEXT user_id
UPDATE profiles 
SET is_lifetime_pro = FALSE, 
    subscription_plan = 'free',
    subscription_status = 'inactive'
WHERE user_id = '3b775701-e50e-466d-b6b8-1580123de4fd';

-- Step 4: Verify removal
SELECT 
    p.id as profile_id,
    p.user_id as profile_user_id_text,
    p.username,
    p.is_lifetime_pro,
    p.subscription_plan,
    p.subscription_status,
    CASE WHEN lpu.user_id IS NOT NULL THEN 'YES' ELSE 'NO' END as in_lifetime_pro_table
FROM profiles p
LEFT JOIN lifetime_pro_users lpu ON p.id = lpu.user_id AND lpu.is_active = true
WHERE p.user_id = '3b775701-e50e-466d-b6b8-1580123de4fd';
```

### Option 2: Use profiles.id (UUID) Directly - Faster

If you already know `profiles.id = '8f0a151e-d293-4868-9cb7-ecd41fe6c031'`:

```sql
-- Step 1: Remove from lifetime_pro_users
DELETE FROM lifetime_pro_users 
WHERE user_id = '8f0a151e-d293-4868-9cb7-ecd41fe6c031';

-- Step 2: Update profiles table (using id UUID to find the row)
UPDATE profiles 
SET is_lifetime_pro = FALSE, 
    subscription_plan = 'free',
    subscription_status = 'inactive'
WHERE id = '8f0a151e-d293-4868-9cb7-ecd41fe6c031';

-- Step 3: Verify removal
SELECT 
    p.id as profile_id,
    p.user_id as profile_user_id_text,
    p.username,
    p.is_lifetime_pro,
    p.subscription_plan,
    p.subscription_status,
    CASE WHEN lpu.user_id IS NOT NULL THEN 'YES' ELSE 'NO' END as in_lifetime_pro_table
FROM profiles p
LEFT JOIN lifetime_pro_users lpu ON p.id = lpu.user_id AND lpu.is_active = true
WHERE p.id = '8f0a151e-d293-4868-9cb7-ecd41fe6c031';
```

## Important Notes:

1. **Use `user_id` NOT `id`**: The `profiles` table has two ID columns:
   - `id` (UUID) - auto-generated primary key
   - `user_id` (TEXT) - the actual user identifier we use in the code
   
2. **Run all 3 steps**: 
   - Step 1 removes from `lifetime_pro_users`
   - Step 2 updates the `profiles` table
   - Step 3 verifies the removal worked

3. **After running SQL**: The app should respect the removal and NOT re-grant lifetime pro (thanks to the code fix we just made).

