# Database Setup Instructions

## Prerequisites
1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key from the Supabase dashboard
3. Add your credentials to `.env` file

## Setup Steps

### 1. Run the Schema
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Run the SQL script

### 2. Configure Authentication
1. Go to Authentication > Settings in your Supabase dashboard
2. Enable the following providers:
   - Email
   - Google (you'll need to configure OAuth)
   - Anonymous (for username-only registration)

### 3. Set up Google OAuth (Optional)
1. Go to Authentication > Providers in Supabase
2. Enable Google provider
3. Add your Google OAuth credentials

### 4. Configure Row Level Security
The schema includes RLS policies, but you may need to verify they're working:
1. Go to Authentication > Policies in Supabase
2. Verify all tables have the correct policies applied

## Environment Variables
Add these to your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## Testing the Setup
1. Run the app
2. Try creating a new account
3. Check the Supabase dashboard to see if data is being inserted correctly

## Troubleshooting
- If you get permission errors, check that RLS policies are correctly applied
- If authentication fails, verify your Supabase URL and anon key
- If Google OAuth doesn't work, check your Google OAuth configuration
