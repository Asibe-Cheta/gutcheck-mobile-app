/**
 * App Entry Point / Splash Screen
 * Shows logo briefly then routes to appropriate screen based on auth/subscription state
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Animated, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemeColors } from '@/lib/theme';
import { revenueCatService } from '@/lib/revenueCatService';
import { getLifetimeProService } from '@/lib/lifetimeProService';
import { biometricAuthService } from '@/lib/biometricAuth';

export default function IndexPage() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');
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
        
        // Check if biometric authentication is enabled
        const isBiometricEnabled = await biometricAuthService.isBiometricEnabled();
        const biometricAvailable = await biometricAuthService.isAvailable();
        
        if (isBiometricEnabled && biometricAvailable) {
          console.log('[SPLASH] Biometric auth enabled, showing prompt');
          const bioType = await biometricAuthService.getBiometricType();
          setBiometricType(bioType);
          setShowBiometricPrompt(true);
          setIsInitializing(false);
          return;
        }
        
        // Check if user is authenticated (traditional flow)
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
        
        // Always do a full subscription check (don't rely on cached flag after logout)
        console.log('[SPLASH] Performing full subscription check...');
        
        try {
          // Initialize RevenueCat with userId
          console.log('[SPLASH] Initializing RevenueCat...');
          await revenueCatService.initialize(userId);
          
          // Check RevenueCat subscription status
          console.log('[SPLASH] Checking RevenueCat subscription...');
          const hasRevenueCatSub = await revenueCatService.hasActiveSubscription();
          console.log('[SPLASH] RevenueCat result:', hasRevenueCatSub);
          
          if (hasRevenueCatSub) {
            console.log('[SPLASH] Active subscription found via RevenueCat, routing to home');
            await AsyncStorage.setItem('_has_active_subscription', 'true');
            setIsInitializing(false);
            router.replace('/(tabs)/');
            return;
          }
          
          // Check lifetime pro status
          console.log('[SPLASH] Checking lifetime pro status...');
          const lifetimeProStatus = await getLifetimeProService().checkUserLifetimeProStatus(userId);
          console.log('[SPLASH] Lifetime pro result:', lifetimeProStatus);
          
          if (lifetimeProStatus) {
            console.log('[SPLASH] Lifetime pro found, routing to home');
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
          // On error, check if we have a cached flag as fallback
          const cachedSubscription = await AsyncStorage.getItem('_has_active_subscription');
          if (cachedSubscription === 'true') {
            console.log('[SPLASH] Using cached subscription flag, routing to home');
            setIsInitializing(false);
            router.replace('/(tabs)/');
            return;
          }
          // No cached flag, route to subscription screen
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

  // Handle biometric authentication
  const handleBiometricAuth = async () => {
    try {
      console.log('[SPLASH] User initiated biometric authentication');
      const userId = await biometricAuthService.authenticateAndGetUserId();
      
      if (!userId) {
        Alert.alert(
          'Authentication Failed',
          'Unable to authenticate with biometrics. Please sign in manually.',
          [
            {
              text: 'Sign In',
              onPress: () => {
                setShowBiometricPrompt(false);
                router.replace('/(auth)/signin');
              },
            },
          ]
        );
        return;
      }

      console.log('[SPLASH] Biometric authentication successful, checking subscription...');
      
      // Check subscription status (always do full check)
      try {
        console.log('[SPLASH] Initializing RevenueCat...');
        await revenueCatService.initialize(userId);
        
        console.log('[SPLASH] Checking RevenueCat subscription...');
        const hasRevenueCatSub = await revenueCatService.hasActiveSubscription();
        console.log('[SPLASH] RevenueCat result:', hasRevenueCatSub);
        
        if (hasRevenueCatSub) {
          console.log('[SPLASH] Active subscription found, routing to home');
          await AsyncStorage.setItem('_has_active_subscription', 'true');
          router.replace('/(tabs)/');
          return;
        }
        
        console.log('[SPLASH] Checking lifetime pro status...');
        const lifetimeProStatus = await getLifetimeProService().checkUserLifetimeProStatus(userId);
        console.log('[SPLASH] Lifetime pro result:', lifetimeProStatus);
        
        if (lifetimeProStatus) {
          console.log('[SPLASH] Lifetime pro found, routing to home');
          await AsyncStorage.setItem('_has_active_subscription', 'true');
          router.replace('/(tabs)/');
          return;
        }
        
        // No active subscription
        console.log('[SPLASH] No subscription found, routing to subscription screen');
        router.replace('/subscription-wrapper');
      } catch (error) {
        console.error('[SPLASH] Error checking subscription:', error);
        // On error, check for cached flag
        const cachedSubscription = await AsyncStorage.getItem('_has_active_subscription');
        if (cachedSubscription === 'true') {
          console.log('[SPLASH] Using cached subscription flag, routing to home');
          router.replace('/(tabs)/');
          return;
        }
        router.replace('/subscription-wrapper');
      }
    } catch (error) {
      console.error('[SPLASH] Biometric authentication error:', error);
      Alert.alert('Error', 'An error occurred during authentication. Please try again.');
    }
  };

  const handleSkipBiometric = () => {
    console.log('[SPLASH] User skipped biometric, routing to sign in');
    setShowBiometricPrompt(false);
    router.replace('/(auth)/signin');
  };

  // Show splash screen with logo, welcome text, and pulse glow effect
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
        
        {/* Welcome Text */}
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeTitle}>
            <Text style={styles.boldText}>Welcome back to GutCheck!</Text>
          </Text>
          
          <Text style={styles.welcomeBody}>
            Your confidential ally for untangling complex and difficult situations. Whether it's{' '}
            <Text style={styles.boldText}>bullying</Text>, <Text style={styles.boldText}>abuse</Text>,{' '}
            <Text style={styles.boldText}>blackmail</Text>, or any form of{' '}
            <Text style={styles.boldText}>exploitation</Text>, we are here to help you see the patterns clearly and guide you on what to do next.
          </Text>
          
          <Text style={styles.welcomeBody}>
            This is your safe space—with <Text style={styles.italicText}>zero judgment</Text> and{' '}
            <Text style={styles.boldText}>complete anonymity</Text>. Your feelings are valid. Let's get started.
          </Text>
        </View>
        
        {isInitializing && (
          <ActivityIndicator 
            size="large" 
            color={colors.primary} 
            style={styles.loader}
          />
        )}
        
        {showBiometricPrompt && (
          <View style={styles.biometricContainer}>
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricAuth}
              activeOpacity={0.8}
            >
              <Ionicons name="finger-print" size={48} color={colors.primary} />
              <Text style={styles.biometricButtonText}>
                Use {biometricType} to Sign In
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.skipBiometricButton}
              onPress={handleSkipBiometric}
              activeOpacity={0.7}
            >
              <Text style={styles.skipBiometricText}>
                Sign in with email instead
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 32,
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
    width: 220,
    height: 220,
    zIndex: 10,
  },
  welcomeTextContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    lineHeight: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  welcomeBody: {
    fontSize: 16,
    lineHeight: 24,
    color: '#D1D5DB',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  boldText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  italicText: {
    fontStyle: 'italic',
    color: '#FFFFFF',
  },
  loader: {
    marginTop: 32,
  },
  biometricContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 16,
    marginTop: 32,
  },
  biometricButton: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(67, 184, 151, 0.15)',
    borderWidth: 2,
    borderColor: '#43B897',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  biometricButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#43B897',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  skipBiometricButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipBiometricText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'Inter',
    textDecorationLine: 'underline',
  },
});
