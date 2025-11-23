/**
 * App Lock Context
 * Manages app locking state for biometric re-authentication when app comes to foreground
 */

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { biometricAuthService } from '@/lib/biometricAuth';

interface AppLockContextType {
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  shouldShowLock: boolean;
  checkAndLock: () => Promise<void>;
  unlock: () => void;
  setAuthenticating: (authenticating: boolean) => void;
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [shouldShowLock, setShouldShowLock] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const lastUnlockTimeRef = useRef<number>(0);
  const isAuthenticatingRef = useRef(false); // Track if we're currently authenticating
  const wasInBackgroundRef = useRef(false); // Track if we were truly in background
  const UNLOCK_COOLDOWN_MS = 3000; // 3 seconds to be safe

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;
      
      console.log('[AppLock] State:', previousState, '→', nextAppState, {
        wasInBackground: wasInBackgroundRef.current,
        isAuthenticating: isAuthenticatingRef.current,
        timeSinceUnlock: Date.now() - lastUnlockTimeRef.current
      });
      
      // Track when app goes to background (not just inactive)
      if (nextAppState === 'background') {
        console.log('[AppLock] 📱 App entered background');
        wasInBackgroundRef.current = true;
      }
      
      // Only lock if:
      // 1. We're coming back to active
      // 2. We were actually in background (not just inactive from biometric prompt)
      // 3. We're not currently authenticating
      // 4. Cooldown period has passed
      if (nextAppState === 'active' && wasInBackgroundRef.current && !isAuthenticatingRef.current) {
        const timeSinceUnlock = Date.now() - lastUnlockTimeRef.current;
        
        if (timeSinceUnlock < UNLOCK_COOLDOWN_MS) {
          console.log('[AppLock] ⏱️ Skipping lock - within cooldown period');
          wasInBackgroundRef.current = false; // Reset the flag
          return;
        }
        
        console.log('[AppLock] 🔍 Checking if lock needed...');
        
        try {
          const isLoggedIn = await AsyncStorage.getItem('is_logged_in');
          const isBiometricEnabled = await biometricAuthService.isBiometricEnabled();
          
          console.log('[AppLock] Auth check:', {
            isLoggedIn: isLoggedIn === 'true',
            isBiometricEnabled
          });
          
          if (isLoggedIn === 'true' && isBiometricEnabled) {
            console.log('[AppLock] 🔒 Locking app - biometrics required');
            setIsLocked(true);
            setShouldShowLock(true);
            wasInBackgroundRef.current = false; // Reset after locking
          } else {
            console.log('[AppLock] ℹ️ No lock needed - not logged in or biometrics disabled');
            wasInBackgroundRef.current = false;
            setIsLocked(false);
            setShouldShowLock(false);
          }
        } catch (error) {
          console.error('[AppLock] Error checking lock status:', error);
          wasInBackgroundRef.current = false;
        }
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  const checkAndLock = async () => {
    try {
      const isLoggedIn = await AsyncStorage.getItem('is_logged_in');
      const isBiometricEnabled = await biometricAuthService.isBiometricEnabled();
      
      if (isLoggedIn === 'true' && isBiometricEnabled) {
        setIsLocked(true);
        setShouldShowLock(true);
      } else {
        setIsLocked(false);
        setShouldShowLock(false);
      }
    } catch (error) {
      console.error('[AppLock] Error in checkAndLock:', error);
    }
  };

  const unlock = () => {
    console.log('[AppLock] 🔓 Unlocking app');
    setIsLocked(false);
    setShouldShowLock(false);
    lastUnlockTimeRef.current = Date.now();
    wasInBackgroundRef.current = false; // Important: reset background flag
    isAuthenticatingRef.current = false; // Reset auth flag
  };

  const setAuthenticating = (authenticating: boolean) => {
    console.log('[AppLock] Setting authenticating:', authenticating);
    isAuthenticatingRef.current = authenticating;
  };

  return (
    <AppLockContext.Provider value={{ isLocked, setIsLocked, shouldShowLock, checkAndLock, unlock, setAuthenticating }}>
      {children}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within AppLockProvider');
  }
  return context;
}

