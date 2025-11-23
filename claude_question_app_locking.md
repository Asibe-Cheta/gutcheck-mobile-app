# Question for Claude: React Native/Expo App Locking on App Switch (TestFlight Testing)

## Context & App Details
I'm building **GutCheck**, a React Native mobile app using **Expo SDK** (with `expo-router` for navigation and `expo-local-authentication` for biometrics). The app is currently in **TestFlight** (iOS, Version 2.0.3, Build 186) and requires biometric authentication (Face ID/Touch ID) to lock the app when users switch away from it or put it in the background.

**Important Context from Development History:**
- Previously attempted using an `AppLockScreen` overlay component and `appLockService` - this was **removed** because it caused problematic overlays during registration and covered other screens
- Current approach uses the existing splash screen (`src/app/index.tsx`) for re-authentication, which works correctly on cold start
- The app is privacy-focused for teenagers, so reliable locking is critical
- This is a **second attempt** at solving app locking - the first approach had UX issues

**Key App Structure:**
- **Expo Router** file-based routing (`src/app/` directory)
- **Splash Screen**: `src/app/index.tsx` - Entry point that handles initial routing and biometric prompts
- **Root Layout**: `src/app/_layout.tsx` - Contains the AppState listener
- **Biometric Service**: `src/lib/biometricAuth.ts` - Uses `expo-local-authentication` and `expo-secure-store`
- **Navigation**: Expo Router with `router.replace('/')` to navigate to splash screen

## Current Implementation

### 1. AppState Listener in Root Layout (`src/app/_layout.tsx`):
```typescript
import { AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { biometricAuthService } from '@/lib/biometricAuth';

function AppContent() {
  const router = useRouter();
  const appStateRef = React.useRef(AppState.currentState);

  useEffect(() => {
    // Setup app state listener for biometric re-authentication
    const appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;
      
      console.log('[LAYOUT] App state changed from', previousState, 'to', nextAppState);
      
      // Check if app is coming to foreground from background
      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[LAYOUT] 🔓 App returned from background to foreground');
        
        try {
          const isLoggedIn = await AsyncStorage.getItem('is_logged_in');
          const isBiometricEnabled = await biometricAuthService.isBiometricEnabled();
          
          console.log('[LAYOUT] Auth check:', {
            isLoggedIn: isLoggedIn === 'true',
            isBiometricEnabled
          });
          
          // If user is logged in and has biometrics enabled, route to splash for re-auth
          if (isLoggedIn === 'true' && isBiometricEnabled) {
            console.log('[LAYOUT] 🔒 Biometrics enabled - routing to splash for re-authentication');
            router.replace('/');
          } else {
            console.log('[LAYOUT] ℹ️ Biometrics not enabled or user not logged in - no lock required');
          }
        } catch (error) {
          console.error('[LAYOUT] Error checking biometric status on foreground:', error);
        }
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('[LAYOUT] 📱 App going to background');
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, []);
}
```

### 2. Splash Screen (`src/app/index.tsx`):
The splash screen checks authentication and shows biometric prompt:
```typescript
useEffect(() => {
  const initializeApp = async () => {
    // Check if user is authenticated
    const userId = await AsyncStorage.getItem('user_id');
    const isLoggedIn = await AsyncStorage.getItem('is_logged_in');
    
    // If not authenticated, go to welcome screen
    if (!userId || isLoggedIn !== 'true') {
      router.replace('/(auth)/welcome');
      return;
    }
    
    // User is authenticated - check for biometric authentication
    const isBiometricEnabled = await biometricAuthService.isBiometricEnabled();
    const biometricAvailable = await biometricAuthService.isAvailable();
    
    if (isBiometricEnabled && biometricAvailable) {
      // Show biometric prompt button
      setShowBiometricPrompt(true);
      return;
    }
    
    // No biometrics, go directly to home
    router.replace('/(tabs)/');
  };

  initializeApp();
}, []);
```

## The Problem (TestFlight Testing)
**Current Behavior:**
- ✅ App locks correctly when **fully closed** and reopened
- ❌ App does **NOT** lock when switching between apps (app switcher, home button, notifications)
- ❌ App does **NOT** lock when going to background and returning

**TestFlight Testing Scenario:**
1. User opens app → logs in with biometrics → sees home screen ✅
2. User presses **home button** (app goes to background)
3. User **reopens app from home screen** → App should show splash + biometric prompt, but it doesn't ❌
4. User **switches to another app** (e.g., Messages) using app switcher
5. User **switches back to GutCheck** → App should show splash + biometric prompt, but it doesn't ❌

**What I'm Seeing:**
- The app state listener logs show the state changes are being detected
- But `router.replace('/')` doesn't seem to trigger the splash screen when coming from background
- The app appears to stay on the current screen (home screen) instead of routing to splash

## Specific Questions

## Specific Questions

1. **AppState Detection Issue**:
   - My logs show state changes are being detected (`[LAYOUT] App state changed from 'background' to 'active'`), but `router.replace('/')` doesn't seem to work when the app is already mounted. Is this a timing issue with Expo Router?
   - Should I be using a different navigation method when the app is already running vs. when it's cold starting?
   - Could the splash screen's `useEffect` be preventing re-initialization when routing from an already-mounted app?

2. **Expo Router Behavior**:
   - When I call `router.replace('/')` from `_layout.tsx` while the app is already on a tab screen, does Expo Router properly unmount the current screen and remount the splash screen?
   - Should I use `router.push('/')` instead, or is there a way to force a full remount?
   - Could the navigation stack be preventing the splash screen from showing because it's already in the history?

3. **iOS App State Transitions**:
   - On iOS, when switching apps, what's the exact sequence of AppState changes?
   - Does iOS go: `active` → `inactive` → `background` when switching away, and `background` → `inactive` → `active` when returning?
   - Should I be checking for `inactive` → `active` transitions as well, or only `background` → `active`?

4. **Splash Screen Re-initialization**:
   - The splash screen (`index.tsx`) has a `useEffect` that runs on mount. When I route to it from `_layout.tsx`, does this `useEffect` run again?
   - Should I add a key or prop to force the splash screen to re-initialize when coming from background?
   - Is there a way to detect if the splash screen is being shown due to app state change vs. cold start?

5. **Alternative Implementation Patterns**:
   - Should I use a global state/context to track "app locked" status instead of routing?
   - Would it be better to show an overlay/modal lock screen instead of routing to splash?
   - Are there Expo-specific hooks or utilities for handling app lifecycle that I should be using?

6. **TestFlight vs Development**:
   - Could there be differences in AppState behavior between development builds and TestFlight/production builds?
   - Are there any iOS-specific behaviors in TestFlight that might affect app state detection?

7. **Race Conditions**:
   - Could there be a race condition where the app state changes but the navigation hasn't completed yet?
   - Should I add a small delay before routing, or use a flag to prevent multiple rapid state changes?

8. **Best Practices for Expo Apps**:
   - What's the recommended pattern for app locking in Expo apps using Expo Router?
   - Are there any Expo SDK limitations or known issues with AppState in production builds?

## Technical Stack Details
- **Expo SDK**: Latest (with `expo-router` ~6.0.14, `expo-local-authentication` ~17.0.7)
- **React Native**: Via Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: AsyncStorage for persistence
- **Biometrics**: `expo-local-authentication` + `expo-secure-store`
- **Platform**: iOS (TestFlight), Android planned
- **Build**: EAS Build, currently on Build 186 (Version 2.0.3)

## Expected Behavior (What Should Happen)
**Scenario 1: App Switch**
1. User is on home screen with biometrics enabled
2. User presses home button (app goes to background)
3. User taps app icon to reopen
4. **Expected**: Splash screen appears → "Welcome back to GutCheck!" → Biometric prompt button → User authenticates → Home screen
5. **Actual**: App stays on home screen, no lock ❌

**Scenario 2: App Switcher**
1. User is on home screen
2. User opens app switcher and switches to Messages
3. User switches back to GutCheck
4. **Expected**: Splash screen appears → Biometric prompt → Home screen after auth
5. **Actual**: App stays on home screen, no lock ❌

**Scenario 3: Full Close (This Works ✅)**
1. User closes app completely (swipe up in app switcher)
2. User reopens app
3. **Expected**: Splash screen → Biometric prompt → Home screen
4. **Actual**: Works correctly ✅

## Code Flow Analysis Needed
I need to understand:
1. Why `router.replace('/')` works on cold start but not when app is already running
2. Whether the splash screen's `useEffect` dependencies need to be adjusted
3. If there's a better pattern for forcing re-authentication in Expo Router apps
4. Whether I should use a different approach (overlay, modal, or navigation guard) instead of routing

## What I've Tried
- ✅ Added `appStateRef` to track previous state (to distinguish between state transitions)
- ✅ Checking for `previousState.match(/inactive|background/) && nextAppState === 'active'` pattern
- ✅ Logging shows state changes are being detected correctly
- ❌ `router.replace('/')` doesn't seem to trigger splash screen when app is already mounted
- ❌ Previous attempt with overlay/modal approach (`AppLockScreen`) was removed due to UX issues (covered registration screens)

## Previous Implementation (Removed)
We previously tried using an overlay component (`AppLockScreen`) that would appear on top of the current screen when the app came to foreground. This was removed because:
- It caused overlays during the registration/onboarding flow
- It interfered with other screens and navigation
- It created a poor user experience

The current approach of routing to the splash screen was chosen because:
- It works perfectly on cold start (app fully closed and reopened)
- It provides a clean, consistent re-authentication experience
- It doesn't interfere with other screens

However, it's not working when the app is already running and just switching between apps.

Please provide:
1. **Root cause analysis** - Why might `router.replace('/')` not work when app is already running?
2. **Expo Router-specific solutions** - Best practices for forcing navigation/remounting in Expo Router
3. **Alternative patterns** - Should I use overlays, modals, or navigation guards instead?
4. **Code examples** - Specific implementation patterns that work reliably in TestFlight/production
5. **iOS-specific considerations** - Any iOS behaviors that might affect this in production builds

Thank you for your help!

