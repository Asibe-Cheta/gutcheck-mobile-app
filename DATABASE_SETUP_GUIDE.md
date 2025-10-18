# 🗄️ Database Setup Guide

## ⚠️ **CRITICAL: Run Database Migration First**

The app is failing because the database schema hasn't been updated yet. You need to run the migration script in Supabase.

### **Step 1: Open Supabase SQL Editor**
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**

### **Step 2: Run Migration Script**
1. Copy the entire contents of `database_migration_simple.sql`
2. Paste into the SQL Editor
3. Click **Run** button

### **Step 3: Verify Migration**
The script will show a success message and display the table structure.

## 🔧 **What the Migration Does**

### **Updates Existing Tables**
- ✅ Adds `user_type` column to `profiles` table
- ✅ Adds `age_range`, `goal` columns
- ✅ Adds timestamp columns (`created_at`, `updated_at`)
- ✅ Sets existing records to `user_type = 'anonymous'`

### **Creates New Tables**
- ✅ `conversations` - Chat conversation tracking
- ✅ `messages` - Individual message storage
- ✅ `subscription_tracking` - Payment analytics

### **Sets Up Security**
- ✅ Row Level Security (RLS) policies
- ✅ Proper indexing for performance
- ✅ Automatic timestamp updates

## 🚨 **If Migration Fails**

### **Common Issues:**
1. **"Column already exists"** - This is normal, the script uses `IF NOT EXISTS`
2. **"Permission denied"** - Make sure you're using the correct Supabase project
3. **"Table doesn't exist"** - The script creates tables if they don't exist

### **Troubleshooting:**
- Check your Supabase project URL and keys
- Ensure you have admin access to the database
- Try running the script in smaller chunks if it's too large

## ✅ **After Migration**

### **Test the App:**
1. **Anonymous users** should work without errors
2. **Username users** should work without errors
3. **Onboarding** should appear for both user types
4. **Profile screen** should display data correctly

### **Expected Behavior:**
- ✅ No more database errors in console
- ✅ User profiles created successfully
- ✅ Onboarding flow works properly
- ✅ Profile data syncs correctly

## 🎯 **Production Readiness**

Once the migration is complete:
- ✅ Database schema is production-ready
- ✅ All user types supported
- ✅ Chat system fully functional
- ✅ Payment system ready
- ✅ App Store deployment ready

**The app will work perfectly after running the migration!** 🚀
