/**
 * Biometric Lock Screen
 * Overlay screen that appears when app is locked and requires biometric authentication
 * Uses the same design as splash screen for consistency
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { biometricAuthService } from '@/lib/biometricAuth';
import { useAppLock } from '@/contexts/AppLockContext';
import { useRouter } from 'expo-router';
import { getThemeColors } from '@/lib/theme';

export function BiometricLockScreen() {
  const { setIsLocked } = useAppLock();
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const colors = getThemeColors(true); // Use dark theme to match app
  
  // Animation values for pulse glow effect (same as splash screen)
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
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

  // Get biometric type on mount
  useEffect(() => {
    const getBiometricType = async () => {
      try {
        const bioType = await biometricAuthService.getBiometricType();
        setBiometricType(bioType);
      } catch (error) {
        console.error('[LockScreen] Error getting biometric type:', error);
      }
    };
    getBiometricType();
  }, []);

  // Auto-trigger authentication when component mounts (after short delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleAuthenticate();
    }, 500); // Small delay to ensure UI is ready
    
    return () => clearTimeout(timer);
  }, []);

  const handleAuthenticate = async () => {
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    console.log('[LockScreen] Starting biometric authentication...');
    
    try {
      const userId = await biometricAuthService.authenticateAndGetUserId();
      
      if (userId) {
        console.log('[LockScreen] ✅ Authentication successful');
        setIsLocked(false);
      } else {
        console.log('[LockScreen] ❌ Authentication failed or canceled');
        // Don't automatically route to login - let user try again or use skip button
      }
    } catch (error) {
      console.error('[LockScreen] Authentication error:', error);
      Alert.alert('Error', 'An error occurred during authentication. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSkipBiometric = () => {
    console.log('[LockScreen] User skipped biometric, routing to login');
    setIsLocked(false);
    router.replace('/(auth)/login-pin');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          {/* Animated glow effect layers (same as splash screen) */}
          <Animated.View style={[styles.glowContainer, {
            transform: [{ scale: pulseAnim }],
          }]}>
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
          
          {/* Large logo */}
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
        
        {/* Biometric Button */}
        <View style={styles.biometricContainer}>
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleAuthenticate}
            activeOpacity={0.8}
            disabled={isAuthenticating}
          >
            <Ionicons name="finger-print" size={48} color={colors.primary} />
            <Text style={styles.biometricButtonText}>
              {isAuthenticating ? 'Authenticating...' : `Use ${biometricType} to Log In`}
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

