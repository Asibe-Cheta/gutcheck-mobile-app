# Database Migration Guide for Anonymous Users

## Problem
The app was failing with error: `invalid input syntax for type uuid: "anonymous_user_1759858384009"`

This happened because:
- The database schema required `user_id` to be a UUID
- The app was passing a string like `'anonymous_user_1759858384009'` for anonymous users
- There was a type mismatch

## Solution
Make `user_id` **nullable** in the database to support anonymous analyses.

## Migration Steps

### 1. Run the Migration Script

Connect to your Supabase project and run the SQL migration:

```bash
# Option A: Via Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: qxodyqgtpbykcuvscfew
3. Go to SQL Editor
4. Copy and paste the contents of: database/migration_nullable_user_id.sql
5. Click "Run"

# Option B: Via psql command line
psql "postgresql://postgres:[YOUR-PASSWORD]@db.qxodyqgtpbykcuvscfew.supabase.co:5432/postgres" -f database/migration_nullable_user_id.sql
```

### 2. Verify the Migration

Run this query to verify:

```sql
SELECT 
  column_name, 
  is_nullable, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'analyses' 
  AND column_name = 'user_id';
```

You should see `is_nullable: YES`

### 3. Test Anonymous Analysis

After running the migration:
1. Restart the Expo server: `npx expo start --clear`
2. Reload your app
3. Try creating an analysis
4. It should now work without the UUID error!

## Code Changes Made

### Files Updated:
1. **`src/app/(tabs)/index.tsx`** - Changed from `'anonymous_user_' + Date.now()` to `null`
2. **`src/lib/stores/analysisStore.ts`** - Updated types to accept `string | null`
3. **`src/lib/ai.ts`** - Updated function signatures to accept `userId: string | null`
4. **`src/lib/supabase.ts`** - Updated `getAnalyses` to filter by `user_id IS NULL` for anonymous users

### Database Schema Changes:
- `user_id` column in `analyses` table is now **nullable**
- RLS policies updated to allow anonymous access
- Added index for better query performance on null user_ids

## Testing

After migration, test these scenarios:

1. **Anonymous Analysis**: Create an analysis without logging in ✅
2. **Retrieve Analyses**: Check that anonymous analyses are returned ✅
3. **Pattern Detection**: Verify AI analysis completes successfully ✅
4. **Database Queries**: Confirm no UUID errors in logs ✅

## Rollback (if needed)

If you need to revert:

```sql
-- Remove the nullable constraint
ALTER TABLE public.analyses 
ALTER COLUMN user_id SET NOT NULL;

-- Restore original RLS policy
DROP POLICY IF EXISTS "Users can access their own analyses or anonymous analyses" ON public.analyses;

CREATE POLICY "Users can access their own analyses" ON public.analyses
  FOR ALL USING (user_id = auth.uid());
```

## Next Steps

After this migration works:
- Consider implementing proper anonymous user tracking (using device IDs or session tokens)
- Add data cleanup for old anonymous analyses
- Implement user account creation for users who want to save their history

---

**Status**: Ready to migrate 🚀

