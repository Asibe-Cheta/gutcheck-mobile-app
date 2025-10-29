/**
 * Login with PIN Screen
 * For logging in with username + PIN
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { authService } from '@/lib/authService';

export default function LoginPinScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const pinInputRef = useRef<TextInput>(null);

  const handlePinChange = (value: string) => {
    // Only allow digits
    const filtered = value.replace(/[^0-9]/g, '').slice(0, 4);
    setPin(filtered);
  };

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Username Required', 'Please enter your username');
      return;
    }

    if (pin.length !== 4) {
      Alert.alert('Invalid PIN', 'PIN must be exactly 4 digits');
      return;
    }

    setIsLoggingIn(true);
    const result = await authService.login(username.trim(), pin);
    setIsLoggingIn(false);

    if (result.success) {
      // Navigate to main app
      router.replace('/(tabs)');
    } else {
      Alert.alert('Login Failed', result.error || 'Invalid username or PIN');
      setPin(''); // Clear PIN on error
    }
  };

  const renderPinDots = () => {
    return (
      <View style={styles.pinDotsContainer}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              { 
                backgroundColor: pin.length > index ? colors.primary : 'transparent',
                borderColor: colors.border
              }
            ]}
          />
        ))}
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 48,
    },
    inputContainer: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.textPrimary,
    },
    pinInputArea: {
      marginBottom: 32,
      marginTop: 16,
    },
    pinDotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
    },
    pinDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
    },
    hiddenInput: {
      position: 'absolute',
      opacity: 0,
      height: 1,
      width: 1,
    },
    loginButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 16,
    },
    loginButtonDisabled: {
      opacity: 0.5,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    forgotPinButton: {
      marginTop: 24,
      alignItems: 'center',
    },
    forgotPinText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 32,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 14,
      color: colors.textSecondary,
    },
    createAccountButton: {
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    createAccountButtonText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const canLogin = username.trim().length > 0 && pin.length === 4 && !isLoggingIn;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Login</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Enter your username and PIN to continue</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your username"
            placeholderTextColor={colors.textSecondary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>PIN</Text>
          <TouchableOpacity 
            style={styles.pinInputArea}
            onPress={() => {
              // Focus the hidden input when PIN area is tapped
              pinInputRef.current?.focus();
            }}
          >
            {renderPinDots()}
          </TouchableOpacity>
          <TextInput
            ref={pinInputRef}
            style={styles.hiddenInput}
            value={pin}
            onChangeText={handlePinChange}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            autoFocus={false}
            placeholder=""
            placeholderTextColor="transparent"
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, !canLogin && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={!canLogin}
        >
          <Text style={styles.loginButtonText}>
            {isLoggingIn ? 'Logging In...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.forgotPinButton}
          onPress={() => Alert.alert(
            'Forgot PIN?',
            'Unfortunately, PINs cannot be recovered for security reasons. You\'ll need to create a new account.',
            [{ text: 'OK' }]
          )}
        >
          <Text style={styles.forgotPinText}>Forgot PIN?</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.createAccountButton}
          onPress={() => router.push('/(auth)/welcome')}
        >
          <Text style={styles.createAccountButtonText}>Create New Account</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
