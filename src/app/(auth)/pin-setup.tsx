/**
 * PIN Setup Screen
 * For creating a 4-digit PIN for username accounts
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { authService } from '@/lib/authService';
import { biometricAuthService } from '@/lib/biometricAuth';
import * as Clipboard from 'expo-clipboard';

export default function PinSetupScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const params = useLocalSearchParams();
  const username = params.username as string;
  const isFresh = params.fresh === 'true'; // coming from "Start Fresh" in account recovery

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm' | 'recovery'>('enter');
  const [isCreating, setIsCreating] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  // Focus the input when step changes
  useEffect(() => {
    const timer = setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [step]);

  const handlePinChange = (value: string) => {
    // Only allow digits
    const filtered = value.replace(/[^0-9]/g, '').slice(0, 4);
    
    if (step === 'enter') {
      setPin(filtered);
      if (filtered.length === 4) {
        // Dismiss keyboard and auto-advance to confirmation
        Keyboard.dismiss();
        setTimeout(() => setStep('confirm'), 300);
      }
    } else {
      setConfirmPin(filtered);
      if (filtered.length === 4) {
        // Dismiss keyboard when PIN confirmation is complete
        Keyboard.dismiss();
      }
    }
  };

  const handleContinue = async () => {
    console.log('Continue button pressed, step:', step);
    console.log('PIN:', pin, 'Confirm PIN:', confirmPin);
    
    if (step === 'enter') {
      if (pin.length !== 4) {
        Alert.alert('Invalid PIN', 'PIN must be exactly 4 digits');
        return;
      }
      setStep('confirm');
    } else {
      if (confirmPin !== pin) {
        Alert.alert('PINs Don\'t Match', 'Please try again');
        setConfirmPin('');
        return;
      }

      console.log('Creating account with username:', username, 'PIN:', pin);
      
      // Create account with PIN
      setIsCreating(true);
      const result = await authService.createUsernameAccount(username, pin);
      console.log('Account creation result:', result);
      setIsCreating(false);

      if (result.success) {
        console.log('Account created successfully');
        await AsyncStorage.removeItem('onboarding_completed');

        // Generate and save recovery code
        const code = authService.generateRecoveryCode();
        setRecoveryCode(code);

        // Save to Supabase (best-effort — requires recovery_code_hash column)
        const savedUserId = await AsyncStorage.getItem('user_id');
        if (savedUserId) {
          authService.saveRecoveryCode(savedUserId, code).catch(e =>
            console.warn('[PIN_SETUP] Could not persist recovery code:', e),
          );
        }

        setIsCreating(false);
        setStep('recovery');
      } else {
        console.error('Account creation failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to create account');
      }
    }
  };

  // Called when user taps "I've written this down" on the recovery code screen
  const handleProceedAfterSetup = async () => {
    // If this is a fresh-start account, restore any existing Apple subscription
    if (isFresh) {
      try {
        const { useSubscriptionStore } = await import('@/lib/stores/subscriptionStore');
        await useSubscriptionStore.getState().restorePurchases();
        console.log('[PIN_SETUP] Purchase restore triggered for fresh account');
      } catch (e) {
        console.warn('[PIN_SETUP] Purchase restore failed (non-critical):', e);
      }
    }

    // Offer biometric enrolment
    const biometricAvailable = await biometricAuthService.isAvailable();
    if (biometricAvailable) {
      const biometricType = await biometricAuthService.getBiometricType();
      Alert.alert(
        `Enable ${biometricType}?`,
        `Use ${biometricType} for quick and secure sign-in next time.`,
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => router.replace('/onboarding-route'),
          },
          {
            text: 'Enable',
            onPress: async () => {
              const userId = await AsyncStorage.getItem('user_id');
              const uname = await AsyncStorage.getItem('username');
              if (userId) {
                await biometricAuthService.enableBiometricAuth(userId, uname || undefined);
              }
              router.replace('/onboarding-route');
            },
          },
        ],
      );
    } else {
      router.replace('/onboarding-route');
    }
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(recoveryCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 3000);
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('enter');
      setConfirmPin('');
    } else {
      router.back();
    }
  };

  const renderPinDots = (value: string) => {
    return (
      <View style={styles.pinDotsContainer}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              { 
                backgroundColor: value.length > index ? colors.primary : 'transparent',
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
      fontSize: 28,
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
    usernameText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 32,
    },
    pinDotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginBottom: 32,
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
    numberPad: {
      gap: 12,
    },
    numberRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    numberButton: {
      width: 75,
      height: 75,
      borderRadius: 37.5,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    numberButtonText: {
      fontSize: 28,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    continueButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 32,
    },
    continueButtonDisabled: {
      opacity: 0.5,
    },
    continueButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    securityNote: {
      marginTop: 24,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    securityNoteText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    // Recovery code reveal step
    recoveryTitle: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 10,
    },
    recoverySubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 32,
    },
    recoveryCodeBox: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingVertical: 28,
      paddingHorizontal: 24,
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    recoveryCodeLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      marginBottom: 14,
    },
    recoveryCodeText: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 2,
      fontFamily: 'Inter',
    },
    copyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      gap: 6,
    },
    copyButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    recoveryWarning: {
      backgroundColor: 'rgba(255, 180, 0, 0.08)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 28,
    },
    recoveryWarningText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    proceedButton: {
      backgroundColor: colors.primary,
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },
    proceedButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const currentValue = step === 'enter' ? pin : confirmPin;
  const canContinue = currentValue.length === 4 && !isCreating;
  
  console.log('PIN Setup Debug:', {
    step,
    pin,
    confirmPin,
    currentValue,
    canContinue,
    isCreating
  });

  // Recovery code reveal screen
  if (step === 'recovery') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { justifyContent: 'center' }]}>
          <Text style={styles.recoveryTitle}>Save Your Recovery Code</Text>
          <Text style={styles.recoverySubtitle}>
            This is the only way to recover your account if you forget your PIN.
            Write it down and keep it somewhere safe — it will not be shown again.
          </Text>

          <View style={styles.recoveryCodeBox}>
            <Text style={styles.recoveryCodeLabel}>Your Recovery Code</Text>
            <Text style={styles.recoveryCodeText}>{recoveryCode}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
              <Ionicons
                name={codeCopied ? 'checkmark-circle' : 'copy-outline'}
                size={16}
                color={codeCopied ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.copyButtonText, codeCopied && { color: colors.primary }]}>
                {codeCopied ? 'Copied!' : 'Copy to clipboard'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recoveryWarning}>
            <Text style={styles.recoveryWarningText}>
              There is no other way to recover your account. If you lose this code and forget your PIN, your account cannot be restored.
            </Text>
          </View>

          <TouchableOpacity style={styles.proceedButton} onPress={handleProceedAfterSetup}>
            <Text style={styles.proceedButtonText}>I've written this down — Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 'enter' ? 'Create PIN' : 'Confirm PIN'}
        </Text>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          <Text style={styles.title}>
            {step === 'enter' ? 'Create Your PIN' : 'Confirm Your PIN'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'enter' 
              ? 'Choose a 4-digit PIN to secure your account'
              : 'Enter your PIN again to confirm'
            }
          </Text>

          <Text style={styles.usernameText}>@{username}</Text>

          <TouchableOpacity onPress={() => textInputRef.current?.focus()}>
            {renderPinDots(currentValue)}
          </TouchableOpacity>

          {/* Hidden input for keyboard */}
          <TextInput
            ref={textInputRef}
            style={styles.hiddenInput}
            value={currentValue}
            onChangeText={handlePinChange}
            keyboardType="number-pad"
            maxLength={4}
            autoFocus
            secureTextEntry
            showSoftInputOnFocus={true}
            caretHidden={true}
          />

          <TouchableOpacity
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            onPress={() => {
              console.log('Button pressed, canContinue:', canContinue, 'isCreating:', isCreating);
              handleContinue();
            }}
            disabled={!canContinue}
          >
            <Text style={styles.continueButtonText}>
              {isCreating ? 'Creating Account...' : 'Continue'}
            </Text>
          </TouchableOpacity>

          {step === 'enter' && (
            <View style={styles.securityNote}>
              <Text style={styles.securityNoteText}>
                🔒 Your PIN is encrypted and stored securely. You'll need it to log in from other devices.
              </Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
