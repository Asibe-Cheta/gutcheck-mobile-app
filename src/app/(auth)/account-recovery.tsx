/**
 * Account Recovery Screen
 * Lets users recover their account with a recovery code, or start fresh
 * (with automatic subscription restore via RevenueCat / Apple).
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { authService } from '@/lib/authService';

type Stage = 'verify' | 'new_pin' | 'confirm_pin' | 'no_code';

export default function AccountRecoveryScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const [stage, setStage] = useState<Stage>('verify');
  const [username, setUsername] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const pinRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleVerify = async () => {
    if (!username.trim()) {
      Alert.alert('Username Required', 'Please enter your username.');
      return;
    }
    if (!recoveryCode.trim()) {
      Alert.alert('Recovery Code Required', 'Please enter your recovery code.');
      return;
    }

    setIsLoading(true);
    const valid = await authService.verifyRecoveryCode(username.trim(), recoveryCode.trim());
    setIsLoading(false);

    if (!valid) {
      Alert.alert(
        'Code Not Recognised',
        'The username or recovery code is incorrect. Please check and try again.',
      );
      return;
    }

    setStage('new_pin');
    setTimeout(() => pinRef.current?.focus(), 200);
  };

  const handlePinChange = (value: string) => {
    const filtered = value.replace(/[^0-9]/g, '').slice(0, 4);
    if (stage === 'new_pin') {
      setNewPin(filtered);
      if (filtered.length === 4) {
        setStage('confirm_pin');
        setTimeout(() => confirmRef.current?.focus(), 200);
      }
    } else {
      setConfirmPin(filtered);
    }
  };

  const handleResetPin = async () => {
    if (newPin !== confirmPin) {
      Alert.alert("PINs Don't Match", 'Please try again.');
      setConfirmPin('');
      setStage('new_pin');
      return;
    }

    setIsLoading(true);
    const result = await authService.resetPinWithRecoveryCode(
      username.trim(),
      recoveryCode.trim(),
      newPin,
    );
    setIsLoading(false);

    if (result.success) {
      Alert.alert('Account Recovered', 'Your PIN has been reset successfully.', [
        { text: 'Continue', onPress: () => router.replace('/(tabs)/') },
      ]);
    } else {
      Alert.alert('Recovery Failed', result.error || 'Please try again.');
      setStage('verify');
    }
  };

  const handleStartFresh = () => {
    // Navigate to username creation and pass fresh=true so pin-setup
    // automatically triggers restorePurchases() after account creation.
    router.push({ pathname: '/(auth)/username', params: { fresh: 'true' } });
  };

  // ─── Shared UI helpers ─────────────────────────────────────────────────────

  const renderPinDots = (value: string) => (
    <View style={styles.pinDotsContainer}>
      {[0, 1, 2, 3].map(i => (
        <View
          key={i}
          style={[
            styles.pinDot,
            {
              backgroundColor: value.length > i ? colors.primary : 'transparent',
              borderColor: colors.border,
            },
          ]}
        />
      ))}
    </View>
  );

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    backButton: { padding: 8, marginRight: 8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
    scrollContent: { flexGrow: 1 },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 36,
    },
    inputContainer: { marginBottom: 20 },
    label: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.textPrimary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    codeInput: {
      letterSpacing: 3,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },
    primaryButtonDisabled: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
    primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    linkButton: { alignItems: 'center', paddingVertical: 16, marginTop: 4 },
    linkText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
    linkHighlight: { color: colors.primary, fontWeight: '600' },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { marginHorizontal: 16, fontSize: 13, color: colors.textSecondary },
    pinDotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginVertical: 28,
    },
    pinDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
    hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
    // No-code / Start Fresh styles
    lossBox: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    lossTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    lossText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
    },
    safeBox: {
      backgroundColor: 'rgba(79, 209, 199, 0.08)',
      borderRadius: 14,
      padding: 16,
      marginBottom: 24,
    },
    safeText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
    },
    safeHighlight: { color: colors.primary, fontWeight: '700' },
  });

  // ─── Stage: verify ─────────────────────────────────────────────────────────

  if (stage === 'verify') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Recovery</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <Text style={styles.title}>Recover Account</Text>
              <Text style={styles.subtitle}>
                Enter your username and the recovery code shown to you when you first created your account.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your username"
                  placeholderTextColor={colors.textSecondary}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Recovery Code</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="WORD-1234-WORD"
                  placeholderTextColor={colors.textSecondary}
                  value={recoveryCode}
                  onChangeText={setRecoveryCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                onPress={handleVerify}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryButtonText}>Verify Code</Text>
                }
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.linkButton} onPress={() => setStage('no_code')}>
                <Text style={styles.linkText}>
                  I don't have my recovery code —{' '}
                  <Text style={styles.linkHighlight}>what can I do?</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── Stage: new_pin ────────────────────────────────────────────────────────

  if (stage === 'new_pin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStage('verify')}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set New PIN</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>New PIN</Text>
          <Text style={styles.subtitle}>Choose a new 4-digit PIN for your account.</Text>
          {renderPinDots(newPin)}
          <TextInput
            ref={pinRef}
            style={styles.hiddenInput}
            value={newPin}
            onChangeText={handlePinChange}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            autoFocus
          />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Stage: confirm_pin ────────────────────────────────────────────────────

  if (stage === 'confirm_pin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => { setStage('new_pin'); setConfirmPin(''); }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm PIN</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Confirm PIN</Text>
          <Text style={styles.subtitle}>Enter your new PIN again to confirm.</Text>
          {renderPinDots(confirmPin)}
          <TextInput
            ref={confirmRef}
            style={styles.hiddenInput}
            value={confirmPin}
            onChangeText={handlePinChange}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            autoFocus
          />
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (confirmPin.length < 4 || isLoading) && styles.primaryButtonDisabled,
            ]}
            onPress={handleResetPin}
            disabled={confirmPin.length < 4 || isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryButtonText}>Reset PIN & Log In</Text>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Stage: no_code (Start Fresh) ─────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStage('verify')}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>No Recovery Code</Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.content}>
          <Text style={styles.title}>Start Fresh</Text>
          <Text style={styles.subtitle}>
            Without your recovery code, your account cannot be recovered. You can create a new account below.
          </Text>

          <View style={styles.lossBox}>
            <Text style={styles.lossTitle}>What you will lose</Text>
            <Text style={styles.lossText}>
              Your chat history and profile preferences cannot be transferred to a new account.
            </Text>
          </View>

          <View style={styles.safeBox}>
            <Text style={styles.safeText}>
              <Text style={styles.safeHighlight}>Your subscription is safe.</Text>
              {' '}It is linked to your Apple ID and will be automatically restored as soon as your new account is created.
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleStartFresh}>
            <Text style={styles.primaryButtonText}>Create New Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => setStage('verify')}>
            <Text style={[styles.linkText, { color: colors.primary, fontWeight: '600' }]}>
              I found my code — go back
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
