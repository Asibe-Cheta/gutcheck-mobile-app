/**
 * Login Screen
 * Privacy-focused authentication options
 * Two sign-in options: Email, Username only
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import Svg, { Path } from 'react-native-svg';

// Email Icon Component
const EmailIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 256 256" fill={color}>
    <Path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM98.71,128,40,181.81V74.19Zm11.84,10.85a8,8,0,0,0,10.82,0l44.82-41.06L216,181.82V74.19l-88.45,53.81a8,8,0,0,0-10.82,0L40,74.19v107.63l58.71-53.82Z" />
  </Svg>
);

// User Icon Component
const UserIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 256 256" fill={color}>
    <Path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z" />
  </Svg>
);

// Anonymous Icon Component
const AnonymousIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 256 256" fill={color}>
    <Path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM74.08,197.5a64,64,0,0,1,107.84,0,87.83,87.83,0,0,1-107.84,0ZM128,120a32,32,0,1,1,32-32A32,32,0,0,1,128,120Z" />
  </Svg>
);

export default function LoginScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  
  const handleEmailSignUp = () => {
    router.push('/(auth)/register');
  };

  const handleUsernameSignUp = () => {
    router.push('/(auth)/register');
  };

  const handleAnonymousAccess = () => {
    // Direct access to app without authentication
    router.push('/(tabs)');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'space-between',
      padding: 24,
    },
    header: {
      paddingTop: 64,
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      letterSpacing: -0.5,
      fontFamily: 'Inter',
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      fontFamily: 'Inter',
    },
    main: {
      flex: 1,
      justifyContent: 'center',
      gap: 16,
    },
    buttonGroup: {
      gap: 8,
    },
    signInButton: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: colors.border,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      fontFamily: 'Inter',
    },
    primaryButton: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      fontFamily: 'Inter',
    },
    buttonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      fontFamily: 'Inter',
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      fontFamily: 'Inter',
    },
    buttonDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      fontFamily: 'Inter',
    },
    footer: {
      paddingBottom: 32,
      alignItems: 'center',
      gap: 16,
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      fontFamily: 'Inter',
    },
    footerLink: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      textAlign: 'center',
      fontFamily: 'Inter',
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Join your safe space</Text>
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
            <AnonymousIcon color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Get Started Anonymously</Text>
          </TouchableOpacity>
          <Text style={styles.buttonDescription}>No account needed • Maximum privacy</Text>
        </View>

        {/* Email Sign Up */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={handleEmailSignUp}
            activeOpacity={0.8}
          >
            <EmailIcon color={colors.text} />
            <Text style={styles.buttonText}>Sign up with email</Text>
          </TouchableOpacity>
          <Text style={styles.buttonDescription}>Anonymous emails welcome</Text>
        </View>

        {/* Username Only */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={handleUsernameSignUp}
            activeOpacity={0.8}
          >
            <UserIcon color={colors.text} />
            <Text style={styles.buttonText}>Create username only</Text>
          </TouchableOpacity>
          <Text style={styles.buttonDescription}>Minimal data collection</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>We protect your anonymity completely</Text>
        <Text style={styles.footerLink}>Already have an account? Sign in</Text>
      </View>
    </View>
  );
}
