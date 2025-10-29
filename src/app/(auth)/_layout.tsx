/**
 * Authentication Stack Layout
 * Handles welcome, login, username, PIN setup, and onboarding screens
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="login-pin" />
      <Stack.Screen name="username" />
      <Stack.Screen name="pin-setup" />
      <Stack.Screen name="anonymous-pin-setup" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
