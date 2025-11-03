# Sandbox Account Setup - Simplified Guide

You **DON'T** need to sign out of your real Apple ID! Here's the easy way to add a sandbox account for testing.

## The Simple Solution

You can have **BOTH** your real Apple ID AND a sandbox account on the same device. They work separately.

## Step 1: Create a Sandbox Tester in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click **"Users and Access"** in the top navigation bar
3. Click **"Sandbox Testers"** in the left sidebar
4. Click the **"+"** button (or **"Create Sandbox Tester"**)
5. Fill in the form:
   - **First Name**: Test1
   - **Last Name**: User
   - **Email**: Use a **NEW, UNIQUE email** that you control (e.g., `test1.gutcheck@yourdomain.com` or `sboxtest123@gmail.com`)
   - **Password**: Create a secure password (at least 8 characters, including uppercase, lowercase, and numbers)
   - **Country**: Select a country (e.g., "United Kingdom")
6. Click **"Save"** or **"Create"**

**Important**: The email **must not** be used anywhere else - not for a real Apple ID, not for iCloud, not for anything Apple-related.

## Step 2: Add the Sandbox Account to Your iPhone

**You DON'T sign out of your real Apple ID!** You add the sandbox account separately:

1. On your iPhone, open **Settings**
2. Scroll down and tap **"App Store"** (below "Passwords" and "Safari")
3. Scroll to the **very bottom** of the App Store settings
4. You'll see **"Sandbox Account"** section at the bottom
5. Tap **"Sign In"** under "Sandbox Account"
6. Enter the email and password you created in Step 1
7. Tap **"Sign In"**

Now you have:
- **Your real Apple ID**: Signed in at the top (for iCloud, App Store, etc.)
- **Sandbox Account**: Signed in at the bottom (for testing purchases)

## Step 3: Test Your App

1. Open your TestFlight build
2. The app uses your **real Apple ID** for everything (app ownership, iCloud, etc.)
3. When you try to make a purchase in the app, iOS will **automatically use your sandbox account** for the purchase
4. You won't be charged - it's all sandbox testing!

## Why This Matters for Your Issue

When you create sandbox testers with different emails:
- Each sandbox tester has their own **separate purchase history**
- When you test with `asibejustice@gmail.com` sandbox account, it remembers previous purchases
- When you create a NEW sandbox tester (e.g., `test1.gutcheck@email.com`), they have a clean slate
- This lets you test "new user" scenarios, free trials, etc.

## Multiple Sandbox Testers

You can create **multiple** sandbox testers:
- `test1.gutcheck@email.com` - New user, never purchased
- `test2.gutcheck@email.com` - Used for testing renewals
- `test3.gutcheck@email.com` - Used for testing cancellations
- etc.

Each one has its own purchase history!

## Switching Between Sandbox Accounts

If you have multiple sandbox accounts:

1. Go to **Settings → App Store**
2. Scroll to **"Sandbox Account"**
3. Tap **"Sign Out"** to remove the current sandbox account
4. Tap **"Sign In"** and enter a different sandbox account

This lets you test different user scenarios easily!

## Troubleshooting

### "This email is already in use"
- The email you're trying to use is already associated with an Apple ID (real or sandbox)
- Use a completely different email address
- Try adding a number: `testuser123@gmail.com` instead of `testuser@gmail.com`

### Purchases still showing for new accounts
- Make sure you're using a **different sandbox account** in Settings → App Store → Sandbox Account
- Each sandbox account remembers its own purchases
- You need a unique sandbox account for each "new user" test

### Can't find "Sandbox Account" in Settings
- Update your iOS to the latest version
- Make sure you're looking under **Settings → App Store** (not Settings → [Your Name])
- Scroll to the very bottom of the App Store settings

## Summary

**You keep your real Apple ID signed in.**

**You add a sandbox account separately in Settings → App Store → Sandbox Account.**

When testing purchases, iOS uses the sandbox account automatically.

Create multiple sandbox accounts to test different scenarios without conflicts.

