# Lifetime Pro Testing Guide

## How to Test the First 20 Users Lifetime Pro Feature

### 1. Database Setup
Run the SQL migration script in your Supabase SQL editor:
```sql
-- Copy and paste the contents of lifetime_pro_migration.sql
```

### 2. Testing Steps

#### Test 1: First User (Should get lifetime pro)
1. Clear app data: `AsyncStorage.clear()`
2. Create a new user account
3. Complete onboarding
4. Check subscription screen - should show "Lifetime Pro Active"
5. Check database: `SELECT * FROM lifetime_pro_users;` - should show 1 record

#### Test 2: Second User (Should get lifetime pro)
1. Clear app data: `AsyncStorage.clear()`
2. Create another new user account
3. Complete onboarding
4. Check subscription screen - should show "Lifetime Pro Active"
5. Check database: `SELECT * FROM lifetime_pro_users;` - should show 2 records

#### Test 3: 21st User (Should NOT get lifetime pro)
1. Clear app data: `AsyncStorage.clear()`
2. Create another new user account
3. Complete onboarding
4. Check subscription screen - should show regular subscription options
5. Check database: `SELECT * FROM lifetime_pro_users;` - should still show 20 records

### 3. Database Queries for Testing

```sql
-- Check current lifetime pro users count
SELECT COUNT(*) as lifetime_pro_count FROM lifetime_pro_users WHERE is_active = TRUE;

-- Check specific user's lifetime pro status
SELECT * FROM lifetime_pro_users WHERE user_id = 'your-user-id-here';

-- Check all lifetime pro users
SELECT 
    lpu.id,
    lpu.user_id,
    p.username,
    lpu.granted_at,
    lpu.is_active
FROM lifetime_pro_users lpu
JOIN profiles p ON lpu.user_id = p.id
WHERE lpu.is_active = TRUE
ORDER BY lpu.granted_at ASC;

-- Test eligibility function
SELECT check_lifetime_pro_eligibility('your-user-id-here');
```

### 4. Expected Behavior

#### For First 20 Users:
- ✅ Automatically granted lifetime pro status
- ✅ Shows "Lifetime Pro Active" in subscription screen
- ✅ No need to purchase subscription
- ✅ Access to all premium features
- ✅ Special congratulations message

#### For 21st+ Users:
- ❌ No automatic lifetime pro status
- ✅ Must purchase subscription to access premium features
- ✅ Regular subscription flow

### 5. Troubleshooting

#### If lifetime pro is not working:
1. Check database connection
2. Verify SQL migration was run successfully
3. Check console logs for errors
4. Ensure user_id is properly stored in AsyncStorage

#### If user gets lifetime pro when they shouldn't:
1. Check the count in database
2. Verify the eligibility logic
3. Check if user was already granted lifetime pro

### 6. Reset for Testing

To reset the lifetime pro count for testing:
```sql
-- WARNING: This will delete all lifetime pro users
DELETE FROM lifetime_pro_users;
```

### 7. Production Notes

- The first 20 users will be automatically granted lifetime pro status
- This is a one-time benefit for early adopters
- The system tracks who has been granted lifetime pro status
- Users can see their lifetime pro status in the subscription screen
- Lifetime pro users don't need to purchase any subscription
