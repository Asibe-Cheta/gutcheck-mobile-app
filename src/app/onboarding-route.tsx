/**
 * Onboarding Route Wrapper
 * Routes to the onboarding component with proper navigation handling
 */

import React from 'react';
import { router } from 'expo-router';
import Onboarding from './onboarding';

export default function OnboardingRoute() {
  const handleComplete = () => {
    // Navigate to subscription screen after onboarding
    router.replace('/subscription');
  };

  return <Onboarding onComplete={handleComplete} />;
}

