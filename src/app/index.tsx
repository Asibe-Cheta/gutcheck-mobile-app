/**
 * App Entry Point / Splash Screen
 * Shows logo briefly then routes to appropriate screen based on auth/subscription state
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Animated } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemeColors } from '@/lib/theme';
import { revenueCatService } from '@/lib/revenueCatService';
import { getLifetimeProService } from '@/lib/lifetimeProService';

export default function IndexPage() {
  const [isInitializing, setIsInitializing] = useState(true);
  const colors = getThemeColors(true); // Use dark theme for splash to match app
  
  // Animation values for pulse glow effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Start pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    
    return () => pulse.stop();
  }, []);

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
        
        // No subscription flag found - do a full check here instead of delegating to home
        console.log('[SPLASH] No subscription flag found, performing full subscription check...');
        
        try {
          // Check RevenueCat subscription status
          await revenueCatService.initialize(userId);
          const hasActiveSubscription = await revenueCatService.hasActiveSubscription();
          
          if (hasActiveSubscription) {
            console.log('[SPLASH] Active subscription found via RevenueCat, setting permanent flag');
            await AsyncStorage.setItem('_has_active_subscription', 'true');
            setIsInitializing(false);
            router.replace('/(tabs)/');
            return;
          }
          
          // Check lifetime pro status
          const lifetimeProStatus = await getLifetimeProService().checkUserLifetimeProStatus(userId);
          if (lifetimeProStatus) {
            console.log('[SPLASH] Lifetime pro found, setting permanent flag');
            await AsyncStorage.setItem('_has_active_subscription', 'true');
            setIsInitializing(false);
            router.replace('/(tabs)/');
            return;
          }
          
          // No active subscription found - redirect to subscription screen
          console.log('[SPLASH] No active subscription found, routing to subscription');
          setIsInitializing(false);
          router.replace('/subscription-wrapper');
        } catch (error) {
          console.error('[SPLASH] Error checking subscription:', error);
          // On error, route to subscription screen to be safe
          setIsInitializing(false);
          router.replace('/subscription-wrapper');
        }
        
      } catch (error) {
        console.error('[SPLASH] Error during initialization:', error);
        // On error, go to welcome screen to be safe
        setIsInitializing(false);
        router.replace('/(auth)/welcome');
      }
    };

    initializeApp();
  }, []);

  // Show splash screen with logo and pulse glow effect
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.logoContainer}>
        {/* Animated glow effect layers */}
        <Animated.View style={[styles.glowContainer, {
          transform: [{ scale: pulseAnim }],
        }]}>
          {/* Pulse glow effect */}
          <View style={[styles.glowOuter, { 
            shadowColor: colors.primary,
            shadowOpacity: 0.6,
            shadowRadius: 60,
          }]} />
          <View style={[styles.glowMiddle, { 
            shadowColor: colors.primary,
            shadowOpacity: 0.5,
            shadowRadius: 40,
          }]} />
          <View style={[styles.glowInner, { 
            shadowColor: colors.primary,
            shadowOpacity: 0.4,
            shadowRadius: 20,
          }]} />
        </Animated.View>
        
        {/* Large logo with gc-dark.png */}
        <Image 
          source={require('../../assets/gc-dark.png')} 
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
    position: 'relative',
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'transparent',
  },
  glowMiddle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'transparent',
  },
  glowInner: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'transparent',
  },
  logo: {
    width: 280,
    height: 280,
    zIndex: 10,
  },
  loader: {
    marginTop: 40,
  },
});
