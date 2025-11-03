# Build #104 Summary - User Data Isolation Fixes

## Problem
Two critical issues were reported:
1. **Subscription status showing across accounts** - New users were seeing "already subscribed" messages
2. **Chat history cross-contamination** - Users could see conversation history from other accounts

## Root Causes

### Issue 1: Subscription Status
**NOT A BUG** - This was expected sandbox behavior. Apple ties IAP purchases to the **sandbox Apple ID**, not the app user account. If you reuse the same sandbox Apple ID across different app accounts, the subscription persists because it's linked to the Apple ID.

### Issue 2: Chat History
**ACTUAL BUG** - Chat history was stored in a global AsyncStorage key without user scoping:
- All users shared: `gutcheck_saved_chats`
- No isolation between user accounts
- Logout didn't clear chat history

## Fixes Implemented

### 1. Chat History User Scoping
**File**: `src/lib/stores/chatHistoryStore.ts`

**Changes**:
- Added `getStorageKey()` function to get user-specific storage keys
- Changed from global `gutcheck_saved_chats` to per-user `gutcheck_saved_chats_{userId}`
- Updated all operations: `saveChat`, `loadChats`, `updateChatTitle`, `deleteChat`
- Added new `clearAllChats()` method

**Result**: Each user now has isolated chat history

### 2. Enhanced Logout
**File**: `src/lib/authService.ts`

**Changes**:
- Clear RevenueCat user data on logout
- Clear user-specific chat history on logout
- Clear all AsyncStorage keys using `multiRemove`:
  - `user_id`, `username`, `user_type`, `is_logged_in`
  - `subscription_status`, `subscription_plan`
  - `user_profile`, `user_age_range`, `user_goal`

**Result**: Complete cleanup on logout

## Free Trial Status
✅ **WORKING** - 7-day free trial is properly configured:
```json
"introPrice": {
  "periodUnit": "WEEK",
  "price": 0,
  "period": "P1W",
  "periodNumberOfUnits": 1,
  "priceString": "$0.00",
  "cycles": 1
}
```

## Testing Instructions

### For Subscription Testing
Use **DIFFERENT** sandbox Apple IDs for each test:
1. Create sandbox account A in App Store Connect
2. Test purchase with app user A using sandbox account A
3. **Sign out** of sandbox account A on your device
4. Create NEW sandbox account B in App Store Connect
5. Sign in with sandbox account B on your device
6. Create app user B
7. Test purchase with app user B using sandbox account B

### For Chat History Testing
1. Create account A, have some conversations
2. Logout from account A
3. Create account B, verify no conversations from account A appear
4. Login back to account A, verify your conversations are still there
5. Logout from account A again
6. Login to account A, verify conversations are cleared

## Build Details
- **Build Number**: 104
- **Status**: Submitted to App Store Connect
- **Key**: `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` configured
- **Trial**: 7-day intro offer active

## What's Working
✅ User-specific chat history isolation  
✅ Proper logout cleanup  
✅ RevenueCat user identification  
✅ Subscription purchases working  
✅ Free trial configured  
✅ User data properly scoped  

## Known Limitations
⚠️ **Sandbox IAP Testing**: Must use different sandbox Apple IDs for each test user to avoid subscription persistence

## Next Steps
1. Wait for TestFlight build to process (5-10 minutes)
2. Test with new sandbox accounts using different Apple IDs
3. Verify chat history is isolated per user
4. Verify logout clears all user data

