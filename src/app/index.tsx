/**
 * App Entry Point / Splash Screen
 * Shows logo briefly then routes to appropriate screen based on auth/subscription state
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemeColors } from '@/lib/theme';

export default function IndexPage() {
  const [isInitializing, setIsInitializing] = useState(true);
  const colors = getThemeColors(false); // Always use light theme for splash

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[SPLASH] App initializing...');
        
        // Show logo for 1 second (Barclays-style splash)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user is authenticated
        const userId = await AsyncStorage.getItem('user_id');
        const hasCompletedOnboarding = await AsyncStorage.getItem('has_completed_onboarding');
        
        console.log('[SPLASH] Auth check - userId:', !!userId, 'onboarding:', hasCompletedOnboarding);
        
        // If not authenticated, go to welcome screen
        if (!userId || hasCompletedOnboarding !== 'true') {
          console.log('[SPLASH] Not authenticated, routing to welcome');
          setIsInitializing(false);
          router.replace('/(auth)/welcome');
          return;
        }
        
        // User is authenticated - check subscription status
        // Check permanent subscription flag
        const hasActiveSubscription = await AsyncStorage.getItem('_has_active_subscription');
        
        console.log('[SPLASH] Subscription check - hasActive:', hasActiveSubscription);
        
        if (hasActiveSubscription === 'true') {
          // User has active subscription, go to home
          console.log('[SPLASH] Active subscription found, routing to home');
          setIsInitializing(false);
          router.replace('/(tabs)/');
          return;
        }
        
        // Check if user just completed a purchase
        const skipCheck = await AsyncStorage.getItem('_skip_sub_check');
        if (skipCheck === 'true') {
          console.log('[SPLASH] Skip check flag found, setting permanent flag and routing to home');
          await AsyncStorage.setItem('_has_active_subscription', 'true');
          await AsyncStorage.removeItem('_skip_sub_check');
          setIsInitializing(false);
          router.replace('/(tabs)/');
          return;
        }
        
        // No subscription found, but user is authenticated
        // Route to home screen which will do a full subscription check
        console.log('[SPLASH] No subscription flag found, routing to home for full check');
        setIsInitializing(false);
        router.replace('/(tabs)/');
        
      } catch (error) {
        console.error('[SPLASH] Error during initialization:', error);
        // On error, go to welcome screen to be safe
        setIsInitializing(false);
        router.replace('/(auth)/welcome');
      }
    };

    initializeApp();
  }, []);

  // Show splash screen with logo
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.logoContainer}>
        {/* Large logo - replace with your actual logo */}
        <Image 
          source={require('../../assets/images/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      {isInitializing && (
        <ActivityIndicator 
          size="large" 
          color={colors.primary} 
          style={styles.loader}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  loader: {
    marginTop: 40,
  },
});
