/**
 * Anonymous PIN Setup Screen
 * For creating a 4-digit PIN for anonymous accounts
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { authService } from '@/lib/authService';

export default function AnonymousPinSetupScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [isCreating, setIsCreating] = useState(false);
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

      console.log('Creating anonymous account with PIN:', pin);
      
      // Create anonymous account with PIN
      setIsCreating(true);
      const result = await authService.createAnonymousAccount(pin);
      console.log('Anonymous account creation result:', result);
      setIsCreating(false);

      if (result.success) {
        console.log('Anonymous account created successfully, navigating to onboarding');
        // Clear onboarding flag to show onboarding
        await AsyncStorage.removeItem('onboarding_completed');
        
        // Navigate directly to onboarding screen
        router.replace('/onboarding');
      } else {
        console.error('Anonymous account creation failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to create account');
      }
    }
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
  });

  const currentValue = step === 'enter' ? pin : confirmPin;
  const canContinue = currentValue.length === 4 && !isCreating;
  
  console.log('Anonymous PIN Setup Debug:', {
    step,
    pin,
    confirmPin,
    currentValue,
    canContinue,
    isCreating
  });

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
              ? 'Choose a 4-digit PIN to secure your anonymous account'
              : 'Enter your PIN again to confirm'
            }
          </Text>

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
