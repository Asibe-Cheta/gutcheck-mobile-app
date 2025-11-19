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
        
        // Check cached subscription flag FIRST (for fast app cold starts)
        console.log('[SPLASH] ===== SUBSCRIPTION CHECK START =====');
        console.log('[SPLASH] User ID:', userId);
        
        // Debug: Check ALL stored keys related to subscription
        const allKeys = await AsyncStorage.getAllKeys();
        console.log('[SPLASH] All AsyncStorage keys:', allKeys);
        
        const cachedSubscription = await AsyncStorage.getItem('_has_active_subscription');
        console.log('[SPLASH] Cached subscription flag value:', cachedSubscription);
        console.log('[SPLASH] Cached subscription flag type:', typeof cachedSubscription);
        console.log('[SPLASH] Is cached flag === "true"?', cachedSubscription === 'true');
        console.log('[SPLASH] Is cached flag null?', cachedSubscription === null);
        console.log('[SPLASH] Is cached flag undefined?', cachedSubscription === undefined);
        
        if (cachedSubscription === 'true') {
          // User had a subscription last time - let them in immediately
          console.log('[SPLASH] Cached subscription found, routing to home immediately');
          setIsInitializing(false);
          router.replace('/(tabs)/');
          
          // Verify subscription in background (don't block UI)
          setTimeout(async () => {
            try {
              console.log('[SPLASH] Background: Verifying subscription with RevenueCat...');
              await revenueCatService.initialize(userId);
              const hasRevenueCatSub = await revenueCatService.hasActiveSubscription();
              
              if (!hasRevenueCatSub) {
                // Check lifetime pro as backup
                const lifetimeProStatus = await getLifetimeProService().checkUserLifetimeProStatus(userId);
                
                if (!lifetimeProStatus) {
                  // Subscription expired - clear cached flag
                  console.log('[SPLASH] Background: Subscription expired, clearing cache');
                  await AsyncStorage.removeItem('_has_active_subscription');
                }
              }
            } catch (error) {
              console.error('[SPLASH] Background verification error (non-blocking):', error);
            }
          }, 1000);
          return;
        }
        
        // No cached flag - perform full subscription check
        console.log('[SPLASH] No cached subscription, performing full check...');
        console.log('[SPLASH] ⚠️ WARNING: No cached flag found. This may cause slow cold starts.');
        console.log('[SPLASH] If you have an active subscription, the flag should have been set.');
        
        try {
          // Initialize RevenueCat first (without timeout)
          console.log('[SPLASH] Initializing RevenueCat...');
          await revenueCatService.initialize(userId);
          console.log('[SPLASH] RevenueCat initialized successfully');
          
          // Check RevenueCat subscription status with timeout
          console.log('[SPLASH] Checking RevenueCat subscription...');
          const checkWithTimeout = async () => {
            const timeoutPromise = new Promise<{ hasSubscription: boolean; source: string }>((_, reject) =>
              setTimeout(() => reject(new Error('Subscription check timeout')), 5000)
            );
            
            const checkPromise = (async () => {
              const hasRevenueCatSub = await revenueCatService.hasActiveSubscription();
              console.log('[SPLASH] RevenueCat result:', hasRevenueCatSub);
              
              if (hasRevenueCatSub) {
                console.log('[SPLASH] ✅ Active subscription found in RevenueCat!');
                return { hasSubscription: true, source: 'RevenueCat' };
              }
              
              console.log('[SPLASH] No RevenueCat subscription, checking lifetime pro...');
              const lifetimeProStatus = await getLifetimeProService().checkUserLifetimeProStatus(userId);
              console.log('[SPLASH] Lifetime pro result:', lifetimeProStatus);
              
              if (lifetimeProStatus) {
                console.log('[SPLASH] ✅ Lifetime pro found!');
                return { hasSubscription: true, source: 'Lifetime' };
              }
              
              console.log('[SPLASH] ❌ No subscription found anywhere');
              return { hasSubscription: false, source: 'None' };
            })();
            
            return await Promise.race([checkPromise, timeoutPromise]);
          };
          
          const result = await checkWithTimeout();
          
          if (result.hasSubscription) {
            console.log(`[SPLASH] ✅ Active subscription found via ${result.source}`);
            console.log('[SPLASH] Setting _has_active_subscription flag for future fast starts...');
            await AsyncStorage.setItem('_has_active_subscription', 'true');
            
            // Verify the flag was actually set
            const verifyFlag = await AsyncStorage.getItem('_has_active_subscription');
            console.log('[SPLASH] Flag verification - value after setting:', verifyFlag);
            
            setIsInitializing(false);
            router.replace('/(tabs)/');
            return;
          }
          
          // No active subscription found
          console.log('[SPLASH] ❌ No active subscription found anywhere, routing to subscription');
          await AsyncStorage.removeItem('_has_active_subscription');
          setIsInitializing(false);
          router.replace('/subscription-wrapper');
        } catch (error) {
          console.error('[SPLASH] ❌ Error checking subscription:', error);
          console.error('[SPLASH] Error type:', error instanceof Error ? error.constructor.name : typeof error);
          console.error('[SPLASH] Error message:', error instanceof Error ? error.message : String(error));
          
          // On error (timeout/network issue), route to subscription screen to be safe
          console.log('[SPLASH] Routing to subscription screen due to error');
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
          'Unable to authenticate with biometrics. Please log in manually.',
          [
            {
              text: 'Log In',
              onPress: () => {
                setShowBiometricPrompt(false);
                router.replace('/(auth)/login-pin');
              },
            },
          ]
        );
        return;
      }

      console.log('[SPLASH] Biometric authentication successful, checking subscription...');
      
      // Check cached subscription flag first
      const cachedSubscription = await AsyncStorage.getItem('_has_active_subscription');
      console.log('[SPLASH] Biometric - Cached subscription flag:', cachedSubscription);
      
      if (cachedSubscription === 'true') {
        // User had a subscription - let them in immediately
        console.log('[SPLASH] Biometric - Cached subscription found, routing to home');
        router.replace('/(tabs)/');
        
        // Background verification (non-blocking)
        setTimeout(async () => {
          try {
            await revenueCatService.initialize(userId);
            const hasRevenueCatSub = await revenueCatService.hasActiveSubscription();
            if (!hasRevenueCatSub) {
              const lifetimeProStatus = await getLifetimeProService().checkUserLifetimeProStatus(userId);
              if (!lifetimeProStatus) {
                await AsyncStorage.removeItem('_has_active_subscription');
              }
            }
          } catch (error) {
            console.error('[SPLASH] Biometric - Background verification error:', error);
          }
        }, 1000);
        return;
      }
      
      // No cached flag - do full check with timeout
      try {
        const checkWithTimeout = async () => {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Subscription check timeout')), 5000)
          );
          
          const checkPromise = (async () => {
            await revenueCatService.initialize(userId);
            const hasRevenueCatSub = await revenueCatService.hasActiveSubscription();
            
            if (hasRevenueCatSub) {
              return { hasSubscription: true, source: 'RevenueCat' };
            }
            
            const lifetimeProStatus = await getLifetimeProService().checkUserLifetimeProStatus(userId);
            if (lifetimeProStatus) {
              return { hasSubscription: true, source: 'Lifetime' };
            }
            
            return { hasSubscription: false, source: 'None' };
          })();
          
          return await Promise.race([checkPromise, timeoutPromise]);
        };
        
        const result = await checkWithTimeout();
        
        if (result.hasSubscription) {
          await AsyncStorage.setItem('_has_active_subscription', 'true');
          router.replace('/(tabs)/');
          return;
        }
        
        router.replace('/subscription-wrapper');
      } catch (error) {
        console.error('[SPLASH] Biometric - Error checking subscription:', error);
        router.replace('/subscription-wrapper');
      }
    } catch (error) {
      console.error('[SPLASH] Biometric authentication error:', error);
      Alert.alert('Error', 'An error occurred during authentication. Please try again.');
    }
  };

  const handleSkipBiometric = () => {
    console.log('[SPLASH] User skipped biometric, routing to login');
    setShowBiometricPrompt(false);
    router.replace('/(auth)/login-pin');
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
                Use {biometricType} to Log In
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.skipBiometricButton}
              onPress={handleSkipBiometric}
              activeOpacity={0.7}
            >
              <Text style={styles.skipBiometricText}>
                Log in with username instead
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
