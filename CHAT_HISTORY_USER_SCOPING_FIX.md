# Chat History User Scoping Fix

## Problem
Chat history was being stored in a single AsyncStorage key (`gutcheck_saved_chats`) that was shared across all users on the device. When switching between accounts, users would see conversation history from other accounts.

## Root Cause
The chat history was stored without any user-specific scoping:
- All users shared the same storage key
- No isolation between different user accounts
- Logout didn't clear the shared chat history

## Solution

### 1. User-Specific Storage Keys
Modified `src/lib/stores/chatHistoryStore.ts` to use user-specific storage keys:

```typescript
const getStorageKey = async (): Promise<string> => {
  const userId = await AsyncStorage.getItem('user_id');
  return userId ? `gutcheck_saved_chats_${userId}` : 'gutcheck_saved_chats';
};
```

Now each user has their own isolated chat history:
- `gutcheck_saved_chats_user1-id`
- `gutcheck_saved_chats_user2-id`
- etc.

### 2. Updated All Chat Operations
All chat operations now use the user-specific storage key:
- `saveChat()` - saves to user's own key
- `loadChats()` - loads from user's own key
- `updateChatTitle()` - updates user's own key
- `deleteChat()` - deletes from user's own key
- `clearAllChats()` - NEW method to clear user's own chats

### 3. Enhanced Logout Process
Modified `src/lib/authService.ts` to properly clean up all user data on logout:

```typescript
async logout(): Promise<{ success: boolean; error?: string }> {
  try {
    // Clear RevenueCat user data
    const { revenueCatService } = await import('./revenueCatService');
    await revenueCatService.logOut();

    // Clear chat history (user-specific)
    const { useChatHistoryStore } = await import('./stores/chatHistoryStore');
    await useChatHistoryStore.getState().clearAllChats();

    // Clear all auth-related data from local storage
    await AsyncStorage.multiRemove([
      'user_id',
      'username',
      'user_type',
      'is_logged_in',
      'subscription_status',
      'subscription_plan',
      'user_profile',
      'user_age_range',
      'user_goal'
    ]);

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'Failed to logout' };
  }
}
```

## Benefits

1. **User Isolation** - Each user has their own chat history
2. **Privacy** - Users can't see other users' conversations
3. **Clean Logout** - All user data is properly cleared on logout
4. **RevenueCat Integration** - RevenueCat user is properly logged out
5. **Data Integrity** - No cross-contamination between accounts

## Testing

To verify the fix works:

1. Create account A, have some conversations
2. Logout from account A
3. Create account B, verify no conversations from account A show up
4. Login back to account A, verify your conversations are still there
5. Logout from account A again
6. Login to account A, verify conversations are cleared

## Migration Notes

Existing users will still have chat history in the old `gutcheck_saved_chats` key. We could optionally migrate this data, but since it's local storage and accounts are isolated, the old data will simply not be accessible to new users. Each user will get a fresh start.

If you want to preserve old chat history, you could implement a one-time migration on `loadChats()` to move data from the old key to the new user-specific key.

## Files Modified

1. `src/lib/stores/chatHistoryStore.ts` - Added user-specific storage keys
2. `src/lib/authService.ts` - Enhanced logout to clear all user data

## Free Trial Note

The free trial is now working! The 7-day intro offer is configured and showing:
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

## Sandbox Testing

**Important**: When testing with sandbox accounts, make sure to:
1. Use DIFFERENT sandbox Apple IDs for each test account
2. Don't reuse the same sandbox Apple ID across different app user accounts
3. Apple ties purchases to the sandbox Apple ID, not the app account

If you want to test a fresh subscription with the same sandbox account:
1. Sign out of the sandbox Apple ID on your device
2. Create a NEW sandbox Apple ID in App Store Connect
3. Sign in with the new sandbox Apple ID on your device
4. Test the purchase flow again

