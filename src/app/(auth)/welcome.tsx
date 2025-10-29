/**
 * Welcome Screen
 * First screen users see when opening the app
 * Custom design based on provided HTML
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { authService } from '@/lib/authService';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { isDark } = useTheme();
  const currentTheme = getThemeColors(isDark);

  const handleAnonymousAccess = () => {
    // Navigate to anonymous PIN setup
    router.push('/(auth)/anonymous-pin-setup');
  };

  const handleUsernameSignUp = () => {
    // Navigate to username creation screen
    router.push('/(auth)/username');
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={isDark ? require('../../../assets/gc-dark.png') : require('../../../assets/gc-white.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* Main heading */}
        <Text style={[styles.mainHeading, { color: currentTheme.textPrimary }]}>Visualize your intuition</Text>
        
        {/* Description */}
        <Text style={[styles.description, { color: currentTheme.textSecondary }]}>
          Your private space to decode relationships and trust your instincts
        </Text>
        
        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: currentTheme.primary }]}
            onPress={() => handleAnonymousAccess()}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryButtonText, { color: currentTheme.background }]}>Get Started Anonymously</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.secondaryButton, { 
              backgroundColor: `${currentTheme.primary}20`,
              borderColor: `${currentTheme.primary}50`
            }]}
            onPress={() => handleUsernameSignUp()}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: currentTheme.primary }]}>Create Username Only</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={() => router.push('/(auth)/login-pin')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tertiaryButtonText, { color: currentTheme.primary }]}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Footer text */}
        <Text style={[styles.footerText, { color: currentTheme.textSecondary }]}>
          100% private • No judgment • Just clarity
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8, // Much smaller spacing
  },
  logo: {
    width: 280,
    height: 280,
  },
  appName: {
    fontSize: 24, // text-3xl
    fontWeight: '700', // font-bold
    marginTop: 16, // mt-4
    fontFamily: 'Inter',
  },
  mainHeading: {
    fontSize: 36, // text-4xl
    fontWeight: '700', // font-bold
    textAlign: 'center',
    letterSpacing: -0.5, // tracking-tight
    marginBottom: 16, // mt-4
    fontFamily: 'Inter',
  },
  description: {
    fontSize: 18, // text-lg
    textAlign: 'center',
    maxWidth: 320, // max-w-xl
    lineHeight: 28,
    marginBottom: 40, // mt-10
    fontFamily: 'Inter',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320, // max-w-sm
    gap: 16, // gap-4
    marginBottom: 32, // mt-8
  },
  primaryButton: {
    paddingVertical: 12, // py-3
    paddingHorizontal: 20, // px-5
    borderRadius: 12, // rounded-xl
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: 16, // text-base
    fontWeight: '600', // font-semibold
    fontFamily: 'Inter',
  },
  secondaryButton: {
    paddingVertical: 12, // py-3
    paddingHorizontal: 20, // px-5
    borderRadius: 12, // rounded-xl
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16, // text-base
    fontWeight: '600', // font-semibold
    fontFamily: 'Inter',
  },
  tertiaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  footerText: {
    fontSize: 14, // text-sm
    textAlign: 'center',
    fontFamily: 'Inter',
  },
});
