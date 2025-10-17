/**
 * Welcome Screen
 * First screen users see when opening the app
 * Custom design based on provided HTML
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/lib/theme';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Custom Logo Component
const GutCheckLogo = () => (
  <Svg width="64" height="64" viewBox="0 0 64 64" fill="none">
    <Path
      d="M32 58C46.3594 58 58 46.3594 58 32C58 17.6406 46.3594 6 32 6C17.6406 6 6 17.6406 6 32C6 46.3594 17.6406 58 32 58Z"
      stroke={theme.colors.primary}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit="10"
      strokeWidth="4"
    />
    <Path
      d="M32 44C38.6274 44 44 38.6274 44 32C44 25.3726 38.6274 20 32 20C25.3726 20 20 25.3726 20 32C20 38.6274 25.3726 44 32 44Z"
      stroke={theme.colors.primary}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit="10"
      strokeWidth="4"
    />
    <Path
      d="M32 38C35.3137 38 38 35.3137 38 32C38 28.6863 35.3137 26 32 26C28.6863 26 26 28.6863 26 32C26 35.3137 28.6863 38 32 38Z"
      stroke={theme.colors.primary}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit="10"
      strokeWidth="4"
    />
  </Svg>
);

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo and app name */}
        <View style={styles.logoContainer}>
          <GutCheckLogo />
          <Text style={styles.appName}>GutCheck</Text>
        </View>
        
        {/* Main heading */}
        <Text style={styles.mainHeading}>Visualize your intuition</Text>
        
        {/* Description */}
        <Text style={styles.description}>
          Your private space to decode relationships and trust your instincts
        </Text>
        
        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started Anonymously</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
        
        {/* Footer text */}
        <Text style={styles.footerText}>
          100% private • No judgment • Just clarity
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    marginBottom: 32, // mb-8 equivalent
  },
  appName: {
    fontSize: 24, // text-3xl
    fontWeight: '700', // font-bold
    color: theme.colors.textPrimary,
    marginTop: 16, // mt-4
    fontFamily: 'Inter',
  },
  mainHeading: {
    fontSize: 36, // text-4xl
    fontWeight: '700', // font-bold
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5, // tracking-tight
    marginBottom: 16, // mt-4
    fontFamily: 'Inter',
  },
  description: {
    fontSize: 18, // text-lg
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.primary,
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
    color: theme.colors.backgroundDark,
    fontSize: 16, // text-base
    fontWeight: '600', // font-semibold
    fontFamily: 'Inter',
  },
  secondaryButton: {
    backgroundColor: 'rgba(72, 213, 199, 0.2)', // bg-primary/20
    paddingVertical: 12, // py-3
    paddingHorizontal: 20, // px-5
    borderRadius: 12, // rounded-xl
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(72, 213, 199, 0.3)',
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16, // text-base
    fontWeight: '600', // font-semibold
    fontFamily: 'Inter',
  },
  footerText: {
    fontSize: 14, // text-sm
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
});
