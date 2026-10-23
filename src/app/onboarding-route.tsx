/**
 * Onboarding Route Wrapper
 * Onboarding now runs before account creation: a new user creates their PIN after O6,
 * while someone who is already signed in goes straight to the plan choice.
 */

import React from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from './onboarding';

export default function OnboardingRoute() {
  const handleComplete = async () => {
    const [userId, isLoggedIn] = await Promise.all([
      AsyncStorage.getItem('user_id'),
      AsyncStorage.getItem('is_logged_in'),
    ]);
    if (userId && isLoggedIn === 'true') {
      router.replace('/subscription');
    } else {
      router.replace('/(auth)/anonymous-pin-setup');
    }
  };

  return <Onboarding onComplete={handleComplete} />;
}
