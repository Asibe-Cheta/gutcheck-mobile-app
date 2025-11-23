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
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [shouldShowLock, setShouldShowLock] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const lastUnlockTimeRef = useRef<number>(0);
  const UNLOCK_COOLDOWN_MS = 2000; // 2 seconds cooldown after unlock to prevent immediate re-lock

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;
      
      console.log('[AppLock] State changed:', previousState, '→', nextAppState);
      
      // App coming to foreground
      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[AppLock] 🔓 App returned from background to foreground');
        
        // Check if we just unlocked (cooldown period to prevent immediate re-lock)
        const timeSinceUnlock = Date.now() - lastUnlockTimeRef.current;
        if (timeSinceUnlock < UNLOCK_COOLDOWN_MS) {
          console.log('[AppLock] ⏱️ Skipping lock - within unlock cooldown period');
          return;
        }
        
        try {
          const isLoggedIn = await AsyncStorage.getItem('is_logged_in');
          const isBiometricEnabled = await biometricAuthService.isBiometricEnabled();
          
          console.log('[AppLock] Auth check:', {
            isLoggedIn: isLoggedIn === 'true',
            isBiometricEnabled
          });
          
          // Only lock if user is logged in and has biometrics enabled
          if (isLoggedIn === 'true' && isBiometricEnabled) {
            console.log('[AppLock] 🔒 Locking app - biometrics required');
            setIsLocked(true);
            setShouldShowLock(true);
          } else {
            console.log('[AppLock] ℹ️ No lock required - not logged in or biometrics disabled');
            setIsLocked(false);
            setShouldShowLock(false);
          }
        } catch (error) {
          console.error('[AppLock] Error checking lock status:', error);
        }
      }
      // App going to background - prepare for lock
      else if (nextAppState.match(/inactive|background/)) {
        console.log('[AppLock] 📱 App going to background - preparing lock state');
        // Don't show lock screen yet, just mark that we should on return
        setShouldShowLock(false);
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
  };

  return (
    <AppLockContext.Provider value={{ isLocked, setIsLocked, shouldShowLock, checkAndLock, unlock }}>
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

