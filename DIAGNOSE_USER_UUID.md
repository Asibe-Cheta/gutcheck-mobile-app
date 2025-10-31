# Diagnose User UUID Issue

## Problem
The code uses `profiles.user_id` (TEXT column), NOT `profiles.id` (UUID column).

## For User: 8f0a151e-d293-4868-9cb7-ecd41fe6c031

From your Supabase table, this row shows:
- **`profiles.id`** = `8f0a151e-d293-4868-9cb7-ecd41fe6c031` (UUID)
- **`profiles.user_id`** = `3b775701-e50e-466d-b6b8-1580123de4fd` (TEXT - this is what the code uses!)

## Correct SQL Queries

Use the **`user_id`** column value, NOT the `id` column value:

```sql
-- Check lifetime pro status for this user (using user_id)
SELECT * FROM lifetime_pro_users 
WHERE user_id = '3b775701-e50e-466d-b6b8-1580123de4fd';

-- Remove lifetime pro (using user_id)
DELETE FROM lifetime_pro_users 
WHERE user_id = '3b775701-e50e-466d-b6b8-1580123de4fd';

-- Update profile (using user_id)
UPDATE profiles 
SET 
  is_lifetime_pro = FALSE,
  subscription_plan = NULL,
  subscription_status = 'inactive'
WHERE user_id = '3b775701-e50e-466d-b6b8-1580123de4fd';
```

## Check What's Stored in App

The app stores `user_id` in AsyncStorage. To check what the app is using:

1. Open the app
2. Check console logs when you go to subscription screen
3. The app should log the `user_id` being used

## Find User ID from Profile ID

If you only have the `profiles.id`, find the corresponding `user_id`:

```sql
SELECT id, user_id, username 
FROM profiles 
WHERE id = '8f0a151e-d293-4868-9cb7-ecd41fe6c031';
```

This will show you the `user_id` to use in lifetime_pro queries.

