# Build iOS App for App Store Submission

## Quick Start

All your changes (pricing updates, lifetime pro, Apple IAP) are already in your code. 
You just need to build the app to create the `.ipa` file for App Store submission.

## Step 1: Run Database Migration

**Important:** Before building, run the lifetime pro migration in Supabase:

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `lifetime_pro_migration_fixed.sql`
4. Click "Run" or press Ctrl+Enter
5. Verify no errors

## Step 2: Build the App

Run this command in PowerShell:

```powershell
cd C:\Users\ivone\OneDrive\Documents\gutcheck-app
npx eas build --platform ios --profile production --clear-cache
```

### What This Does:
- ✅ Includes all your latest code changes (pricing, lifetime pro, Apple IAP)
- ✅ Clears cache to ensure fresh build
- ✅ Uses your Apple Developer credentials
- ✅ Creates production-ready `.ipa` file

### During Build:
1. **EAS Login:** You may need to log in to your Expo account
2. **Apple Login:** You'll be prompted to sign in to Apple Developer
3. **2FA:** Keep your iPhone nearby for 2FA approval
4. **Push Notifications:** Choose whether to configure (recommended: Yes)
5. **Wait:** Build takes 15-30 minutes

## Step 3: Monitor Build Progress

The build will run on EAS servers. You'll see:
- Build ID
- Progress updates
- Link to build dashboard

Or check status:
```bash
npx eas build:list
```

## Step 4: Download the IPA

When build completes, download the `.ipa` file:
- Click the download link in terminal
- Or download from EAS dashboard: https://expo.dev/accounts/[your-account]/projects/gutcheck-app/builds

## Step 5: Submit to App Store

### Option A: Using EAS (Recommended)
```bash
npx eas submit --platform ios --latest
```

### Option B: Using Transporter App
1. Download Transporter from Mac App Store
2. Drag and drop the `.ipa` file
3. Click "Deliver"

## What's Included in This Build?

Your build will automatically include:

### ✅ Pricing Updates
- Monthly: £9.99 (33p/day)
- Yearly: £99.99 (27p/day)
- Prominent daily cost display
- Less prominent actual prices

### ✅ Lifetime Pro Feature
- First 20 users get automatic lifetime pro
- Database tracking
- Special UI for lifetime pro users

### ✅ Apple In-App Purchases
- Apple IAP integration
- Product IDs configured
- Subscription management
- Purchase restoration

### ✅ All Features
- Onboarding flow
- Anonymous and username auth
- AI chat with image/document analysis
- Notifications system
- Profile management
- Dark/light mode
- Resources and helplines
- All bug fixes

## Troubleshooting

### Build Fails with Credentials Error
**Solution:** Make sure you run **without** `--non-interactive`:
```bash
npx eas build --platform ios --profile production --clear-cache
```

### Apple 2FA Issues
**Solution:** Keep your iPhone nearby and approve the 2FA prompt quickly

### Dependency Warnings
**Solution:** These are usually safe to ignore during build. EAS handles them.

### Build Takes Too Long
**Solution:** Normal. iOS builds take 15-30 minutes. You can close terminal and check status later:
```bash
npx eas build:list
```

## After Successful Build

1. ✅ Download `.ipa` file
2. ✅ Test on TestFlight (optional but recommended)
3. ✅ Upload to App Store Connect
4. ✅ Submit for review

## Need to Make Changes?

If you need to make changes before building:
1. Make your code changes
2. Test locally: `npx expo start`
3. Run build command again

**EAS always builds from your latest code** - no separate "update" step needed!

## Ready to Build?

Just run:
```bash
cd C:\Users\ivone\OneDrive\Documents\gutcheck-app
npx eas build --platform ios --profile production --clear-cache
```

That's it! Your app with all the latest updates will be built and ready for App Store submission. 🚀
