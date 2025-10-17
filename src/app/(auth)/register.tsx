/**
 * Register Screen
 * Privacy-focused registration options
 * Two sign-up options: Email, Username only
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/lib/theme';
import Svg, { Path } from 'react-native-svg';

// Email Icon Component
const EmailIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
    <Path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM98.71,128,40,181.81V74.19Zm11.84,10.85a8,8,0,0,0,10.82,0l44.82-41.06L216,181.82V74.19l-88.45,53.81a8,8,0,0,0-10.82,0L40,74.19v107.63l58.71-53.82Z" />
  </Svg>
);

// User Icon Component
const UserIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
    <Path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z" />
  </Svg>
);

// Anonymous Icon Component
const AnonymousIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
    <Path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM74.08,197.5a64,64,0,0,1,107.84,0,87.83,87.83,0,0,1-107.84,0ZM128,120a32,32,0,1,1,32-32A32,32,0,0,1,128,120Z" />
  </Svg>
);

export default function RegisterScreen() {
  const handleEmailSignUp = () => {
    // TODO: Implement email registration form
    Alert.alert('Coming Soon', 'Email registration form will be available soon');
  };

  const handleUsernameSignUp = () => {
    // TODO: Implement username-only registration
    Alert.alert('Coming Soon', 'Username-only registration will be available soon');
  };

  const handleAnonymousAccess = () => {
    // Direct access to app without authentication
    router.push('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create your safe space</Text>
        <Text style={styles.subtitle}>Choose your level of privacy</Text>
      </View>

      {/* Main Content */}
      <View style={styles.main}>
        {/* Anonymous Access - Primary Option */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAnonymousAccess}
            activeOpacity={0.9}
          >
            <AnonymousIcon />
            <Text style={styles.primaryButtonText}>Get Started Anonymously</Text>
          </TouchableOpacity>
          <Text style={styles.buttonDescription}>No account needed • Maximum privacy</Text>
        </View>

        {/* Email Sign Up */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={handleEmailSignUp}
            activeOpacity={0.8}
          >
            <EmailIcon />
            <Text style={styles.buttonText}>Sign up with email</Text>
          </TouchableOpacity>
          <Text style={styles.buttonDescription}>Anonymous emails welcome</Text>
        </View>

        {/* Username Only */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={handleUsernameSignUp}
            activeOpacity={0.8}
          >
            <UserIcon />
            <Text style={styles.buttonText}>Create username only</Text>
          </TouchableOpacity>
          <Text style={styles.buttonDescription}>Minimal data collection</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>We protect your anonymity completely</Text>
        <TouchableOpacity
          style={styles.signInLink}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.signInText}>
            Already have an account? <Text style={styles.signInLinkText}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'space-between',
    padding: 24, // p-6
  },
  header: {
    paddingTop: 64, // pt-16
    alignItems: 'center',
  },
  title: {
    fontSize: 24, // text-3xl
    fontWeight: '700', // font-bold
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5, // tracking-tight
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Inter',
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    gap: 16, // space-y-4
  },
  buttonGroup: {
    gap: 8, // space-y-2
  },
  signUpButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12, // gap-3
    backgroundColor: theme.colors.surface,
    paddingVertical: 12, // py-3
    paddingHorizontal: 16, // px-4
    borderRadius: 12, // rounded-DEFAULT
    fontFamily: 'Inter',
  },
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12, // gap-3
    backgroundColor: theme.colors.primary,
    paddingVertical: 12, // py-3
    paddingHorizontal: 16, // px-4
    borderRadius: 12, // rounded-DEFAULT
    fontFamily: 'Inter',
  },
  buttonText: {
    color: theme.colors.textPrimary,
    fontSize: 16, // font-bold
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  primaryButtonText: {
    color: theme.colors.background,
    fontSize: 16, // font-bold
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  buttonDescription: {
    fontSize: 12, // text-xs
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  footer: {
    paddingBottom: 32, // pb-8
    alignItems: 'center',
    gap: 16,
  },
  footerText: {
    fontSize: 14, // text-sm
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  signInLink: {
    alignSelf: 'center',
  },
  signInText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  signInLinkText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
