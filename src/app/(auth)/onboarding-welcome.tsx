/**
 * Initial Onboarding Welcome Screen
 * Custom design based on provided HTML
 * Welcome screen that leads to the main onboarding
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/lib/theme';

const { width, height } = Dimensions.get('window');

export default function OnboardingWelcomeScreen() {
  const handleContinue = () => {
    router.push('/(auth)/onboarding');
  };

  return (
    <View style={styles.container}>
      {/* Background overlay */}
      <View style={styles.backgroundOverlay} />
      
      {/* Main content */}
      <View style={styles.content}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar} />
        </View>
        
        {/* Step indicators */}
        <View style={styles.stepIndicators}>
          <View style={[styles.stepDot, styles.activeStep]} />
          <View style={styles.stepDot} />
          <View style={styles.stepDot} />
        </View>
        
        {/* Welcome content */}
        <View style={styles.welcomeContent}>
          <Text style={styles.title}>Welcome to GutCheck!</Text>
          <Text style={styles.description}>
            We're here to help you navigate relationships with confidence. Let's get started!
          </Text>
        </View>
        
        {/* Continue button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // bg-black/30
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 12, // rounded-t-xl
    borderTopRightRadius: 12,
    marginTop: 'auto',
    minHeight: height * 0.4,
  },
  progressContainer: {
    alignItems: 'center',
    paddingTop: 16, // pt-4
  },
  progressBar: {
    width: 40, // w-10
    height: 6, // h-1.5
    backgroundColor: 'rgba(160, 174, 192, 0.2)', // bg-text-secondary/20
    borderRadius: 3, // rounded-full
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8, // space-x-2
    paddingVertical: 24, // py-6
  },
  stepDot: {
    width: 8, // w-2
    height: 8, // h-2
    borderRadius: 4, // rounded-full
    backgroundColor: 'rgba(160, 174, 192, 0.4)', // bg-text-secondary/40
  },
  activeStep: {
    backgroundColor: theme.colors.primary, // bg-primary-accent
  },
  welcomeContent: {
    paddingHorizontal: 24, // px-6
    paddingBottom: 24, // pb-6
    alignItems: 'center',
  },
  title: {
    fontSize: 20, // text-2xl
    fontWeight: '700', // font-bold
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8, // mt-2
    fontFamily: 'Inter',
  },
  description: {
    fontSize: 16, // text-base
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  buttonContainer: {
    paddingHorizontal: 24, // px-6
    paddingBottom: 32, // pb-8
  },
  continueButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12, // py-3
    borderRadius: 8, // rounded-lg
    alignItems: 'center',
  },
  continueButtonText: {
    color: theme.colors.background,
    fontSize: 16, // text-base
    fontWeight: '700', // font-bold
    fontFamily: 'Inter',
  },
});
