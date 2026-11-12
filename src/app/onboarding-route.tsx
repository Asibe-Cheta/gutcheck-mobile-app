/**
 * Onboarding Route Wrapper
 * Value first (PRD 6): after O6 a new user gets an anonymous account silently, with no PIN.
 * They are offered a 6-digit passcode ("Protect your History") after their first result.
 */

import React from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from './onboarding';
import { authService } from '@/lib/authService';
import { profileService } from '@/lib/profileService';

export default function OnboardingRoute() {
  const handleComplete = async () => {
    const [userId, isLoggedIn] = await Promise.all([
      AsyncStorage.getItem('user_id'),
      AsyncStorage.getItem('is_logged_in'),
    ]);
    if (userId && isLoggedIn === 'true') {
      router.replace('/subscription');
    } else {
      const result = await authService.createAnonymousAccount();
      if (!result.success) {
        // Fall back to the original PIN screen rather than leaving the user stuck.
        router.replace('/(auth)/anonymous-pin-setup');
        return;
      }
      const ageBand = await AsyncStorage.getItem('user_age_range');
      if (ageBand) {
        await profileService.updateProfile({ age_range: ageBand }).catch(() => undefined);
      }
      router.replace('/subscription');
    }
  };

  return <Onboarding onComplete={handleComplete} />;
}
