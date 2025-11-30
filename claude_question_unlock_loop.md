# Question for Claude: App Lock Infinite Loop After Biometric Unlock

## Context
I'm building a React Native app using Expo SDK with Expo Router. I've implemented an app locking feature that requires biometric authentication when the app returns from background. The locking mechanism works, but there's a critical bug: **after successfully unlocking with biometrics, the app keeps requesting biometric authentication in an infinite loop**, even though the user is now actively using the app and hasn't switched away.

## Current Implementation

### AppLockContext (`src/contexts/AppLockContext.tsx`)
Manages global lock state and listens to AppState changes:

```typescript
export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [shouldShowLock, setShouldShowLock] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const lastUnlockTimeRef = useRef<number>(0);
  const UNLOCK_COOLDOWN_MS = 2000; // 2 seconds cooldown

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;
      
      // App coming to foreground
      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        // Check cooldown period
        const timeSinceUnlock = Date.now() - lastUnlockTimeRef.current;
        if (timeSinceUnlock < UNLOCK_COOLDOWN_MS) {
          console.log('[AppLock] ⏱️ Skipping lock - within unlock cooldown period');
          return;
        }
        
        const isLoggedIn = await AsyncStorage.getItem('is_logged_in');
        const isBiometricEnabled = await biometricAuthService.isBiometricEnabled();
        
        if (isLoggedIn === 'true' && isBiometricEnabled) {
          setIsLocked(true);
          setShouldShowLock(true);
        }
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  const unlock = () => {
    console.log('[AppLock] 🔓 Unlocking app');
    setIsLocked(false);
    setShouldShowLock(false);
    lastUnlockTimeRef.current = Date.now();
  };

  return (
    <AppLockContext.Provider value={{ isLocked, setIsLocked, shouldShowLock, checkAndLock, unlock }}>
      {children}
    </AppLockContext.Provider>
  );
}
```

### BiometricLockScreen (`src/components/BiometricLockScreen.tsx`)
Shows lock screen and handles authentication:

```typescript
export function BiometricLockScreen() {
  const { unlock } = useAppLock();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Auto-trigger authentication when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      handleAuthenticate();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleAuthenticate = async () => {
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    
    try {
      const userId = await biometricAuthService.authenticateAndGetUserId();
      
      if (userId) {
        console.log('[LockScreen] ✅ Authentication successful');
        unlock(); // Calls unlock() which sets both isLocked and shouldShowLock to false
      }
    } catch (error) {
      console.error('[LockScreen] Authentication error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    // Lock screen UI...
  );
}
```

### Tab Screen Implementation
Each protected tab screen checks for lock state:

```typescript
export default function HomeScreen() {
  const { isLocked, shouldShowLock } = useAppLock();
  
  // Show lock screen if app is locked
  if (isLocked && shouldShowLock) {
    return <BiometricLockScreen />;
  }
  
  return (
    // Normal screen content...
  );
}
```

## The Problem

**Symptoms:**
1. User switches away from app (background)
2. User returns to app → Lock screen appears ✅
3. User authenticates with biometrics → `unlock()` is called ✅
4. **Problem:** Lock screen immediately reappears and keeps looping ❌
5. User is stuck in infinite authentication loop, even while they're already on the app.

**What I've Tried:**
1. ✅ Added `unlock()` method that clears both `isLocked` and `shouldShowLock`
2. ✅ Added 2-second cooldown period after unlock
3. ✅ Updated `BiometricLockScreen` to use `unlock()` method
4. ❌ **Issue still persists** - loop continues

## Potential Causes I'm Considering

1. **Component Re-render Issue**: When `unlock()` is called, the component re-renders, and the `useEffect` in `BiometricLockScreen` might be triggering again?

2. **AppState Listener Firing Multiple Times**: The AppState listener might be firing multiple times even though we're checking the cooldown?

3. **State Update Race Condition**: There might be a race condition where the state updates aren't happening synchronously?

4. **Biometric Prompt Triggering AppState Change**: The biometric authentication prompt itself might be causing AppState changes (inactive → active) which retriggers the lock?

5. **Component Not Unmounting**: The `BiometricLockScreen` component might not be properly unmounting when `isLocked` becomes false, causing the auto-trigger `useEffect` to run again?

## Specific Questions

1. **Why might the lock screen keep reappearing after successful unlock?**
   - Is the `BiometricLockScreen` component's `useEffect` with auto-trigger causing the issue?
   - Should I add a dependency array or condition to prevent re-triggering?

2. **AppState Listener Behavior:**
   - Could the biometric authentication prompt itself cause AppState changes?
   - Should I add additional guards to prevent re-locking immediately after unlock?

3. **Component Lifecycle:**
   - When `isLocked` becomes `false`, does the component properly unmount?
   - Should I use a different pattern (like a key prop) to force remount?

4. **State Management:**
   - Is there a better way to manage the lock state to prevent loops?
   - Should I use a ref to track if we're currently in an unlock process?

5. **Best Practices:**
   - What's the recommended pattern for app locking in React Native/Expo?
   - Are there known issues with AppState listeners and biometric prompts?

## Technical Stack
- React Native (via Expo)
- Expo Router (file-based routing)
- `expo-local-authentication` for biometrics
- `@react-native-async-storage/async-storage` for persistence
- TypeScript

## Expected Behavior
1. User switches away → App goes to background
2. User returns → Lock screen appears
3. User authenticates → App unlocks **once**
4. User can use app normally → **No more lock prompts until they switch away again**

## Current Behavior (Bug)
1. User switches away → App goes to background
2. User returns → Lock screen appears ✅
3. User authenticates → App unlocks
4. **Lock screen immediately reappears** ❌
5. **Infinite loop of authentication prompts** ❌

Please provide:
1. Root cause analysis of why the loop is happening
2. Specific code fixes to prevent the loop
3. Best practices for implementing app locking without loops
4. Any additional safeguards I should add

Thank you!

