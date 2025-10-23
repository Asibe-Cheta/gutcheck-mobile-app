# Pre-Submission Checklist for iOS App Store

## 1. Update App Version
Before building for production, increment your app version.

### Update `app.config.js`:
```javascript
export default {
  expo: {
    version: "1.0.0",  // Keep this for first release, or increment to 1.0.1, etc.
    ios: {
      buildNumber: "1",  // EAS will auto-increment this
      // ... rest of config
    }
  }
}
```

## 2. Test All Changes Locally
- [ ] Test new pricing displays correctly (£9.99, £99.99)
- [ ] Test lifetime pro functionality (first 20 users)
- [ ] Test Apple IAP integration
- [ ] Test all screens in both light and dark mode
- [ ] Test image/document upload and analysis
- [ ] Test notifications
- [ ] Test onboarding flow

## 3. Run Database Migrations
Before deploying, run the lifetime pro migration in Supabase:

```sql
-- Copy and paste contents of lifetime_pro_migration_fixed.sql into Supabase SQL Editor
```

## 4. Update Environment Variables on EAS
The pricing changes don't require new environment variables, but verify your current ones are set:

```bash
# Check current environment variables
npx eas env:list
```

Required variables:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_ANTHROPIC_API_KEY`

## 5. Build for Production

### Option A: Clean Build (Recommended)
```bash
cd C:\Users\ivone\OneDrive\Documents\gutcheck-app
npx eas build --platform ios --profile production --clear-cache
```

### Option B: Regular Build
```bash
cd C:\Users\ivone\OneDrive\Documents\gutcheck-app
npx eas build --platform ios --profile production
```

**Note:** Use interactive mode (without `--non-interactive`) so you can:
- Approve Apple Developer credentials
- Handle 2FA prompts
- Configure push notifications

## 6. What Happens During Build

1. **EAS will:**
   - Pull all your latest code changes (including pricing updates)
   - Install dependencies
   - Generate iOS native project
   - Sign with your Apple Developer credentials
   - Create `.ipa` file for App Store submission

2. **Build includes:**
   - ✅ Updated prices (£9.99, £99.99)
   - ✅ Lifetime pro service
   - ✅ Apple IAP integration
   - ✅ All UI improvements
   - ✅ Updated onboarding
   - ✅ All bug fixes

## 7. After Build Completes

### Download the IPA:
```bash
# EAS will provide a download link, or use:
npx eas build:list
```

### Submit to App Store:
```bash
npx eas submit --platform ios --latest
```

Or manually upload the `.ipa` to App Store Connect via Transporter app.

## 8. App Store Connect Updates

### Before submission, update in App Store Connect:
- [ ] App description
- [ ] Screenshots (if needed)
- [ ] What's New text (for updates)
- [ ] Keywords
- [ ] Support URL
- [ ] Privacy policy URL

### For In-App Purchases:
- [ ] Ensure subscription products are approved:
  - Premium Monthly (£9.99)
  - Premium Yearly (£99.99)
- [ ] Add localization for subscriptions
- [ ] Set up billing grace period
- [ ] Configure subscription management URL

## 9. Testing on TestFlight

Before releasing to production:
1. Submit to TestFlight
2. Test all features on real device
3. Test subscription purchases (use Sandbox accounts)
4. Verify lifetime pro feature works
5. Test first 20 users get lifetime pro

### Create Sandbox Test Account:
1. Go to App Store Connect > Users and Access > Sandbox Testers
2. Create test accounts for:
   - First 20 users (should get lifetime pro)
   - 21st user (should see regular subscription)

## 10. Version Increment for Future Updates

When you need to submit updates:

1. **For minor changes (bug fixes):**
   - Keep version: "1.0.0"
   - EAS auto-increments buildNumber

2. **For feature updates:**
   - Update version: "1.1.0"
   - Reset buildNumber to "1" if needed

3. **For major updates:**
   - Update version: "2.0.0"
   - Reset buildNumber to "1"

## 11. Quick Command Reference

```bash
# 1. Navigate to project
cd C:\Users\ivone\OneDrive\Documents\gutcheck-app

# 2. Clear cache and build
npx eas build --platform ios --profile production --clear-cache

# 3. Check build status
npx eas build:list

# 4. Submit to App Store
npx eas submit --platform ios --latest

# 5. View logs if build fails
npx eas build:view [BUILD_ID]
```

## 12. Common Issues and Solutions

### Issue: Build fails due to credentials
**Solution:** Run in interactive mode without `--non-interactive`

### Issue: Dependencies mismatch
**Solution:** 
```bash
npm install --legacy-peer-deps
npx expo-doctor
```

### Issue: Cache issues
**Solution:** Use `--clear-cache` flag

### Issue: Apple Developer 2FA
**Solution:** Keep your device nearby, run interactive build

## 13. Pre-Submission Verification

Run these commands before building:

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Check for linting errors
npx eslint . --ext .ts,.tsx

# Verify environment variables
cat .env

# Test app locally
npx expo start --clear
```

## 14. Final Checklist Before Building

- [ ] All code changes committed
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] App version updated (if needed)
- [ ] Local testing complete
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] Apple Developer account active
- [ ] Subscription products created in App Store Connect
- [ ] Bundle ID matches App Store Connect
- [ ] Privacy policy and terms URLs active

## 15. After Successful Build

1. **Download IPA:** From EAS dashboard or CLI
2. **Test on TestFlight:** Submit for internal testing
3. **Get feedback:** Test all features
4. **Submit for Review:** When ready for production
5. **Monitor:** Check for crashes and issues

## Notes

- Your changes are **already in your code** - no separate "update" needed
- The build process automatically includes all your latest changes
- EAS builds from your latest committed code
- All pricing updates, lifetime pro feature, and Apple IAP are included automatically

## Ready to Build?

When you're ready, run:
```bash
cd C:\Users\ivone\OneDrive\Documents\gutcheck-app
npx eas build --platform ios --profile production --clear-cache
```

This will create a production-ready build with all your latest updates!
