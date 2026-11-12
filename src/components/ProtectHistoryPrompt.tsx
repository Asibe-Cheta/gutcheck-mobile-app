/**
 * "Protect your History" (PRD 6): accounts are created anonymously with no PIN, so after the first
 * result we offer a 6-digit passcode. Without one, the account and its History can't be reached
 * from another phone. Shown as a small card, never on top of a result.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, NEEDS_PASSCODE_KEY } from '@/lib/authService';
import { biometricAuthService } from '@/lib/biometricAuth';

const DISMISSED_KEY = 'protect_history_dismissed_at';
const SHOW_AGAIN_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/** True when this account has no passcode yet and the card wasn't dismissed in the last 7 days. */
export async function shouldOfferPasscode(): Promise<boolean> {
  try {
    const [needs, dismissedAt] = await Promise.all([
      AsyncStorage.getItem(NEEDS_PASSCODE_KEY),
      AsyncStorage.getItem(DISMISSED_KEY),
    ]);
    if (needs !== 'true') return false;
    return !dismissedAt || Date.now() - Number(dismissedAt) > SHOW_AGAIN_AFTER_MS;
  } catch {
    return false;
  }
}

export default function ProtectHistoryPrompt({ colors, onDone }: { colors: any; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [passcode, setPasscode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('username').then(setUsername).catch(() => undefined);
  }, []);

  const dismiss = async () => {
    await AsyncStorage.setItem(DISMISSED_KEY, String(Date.now())).catch(() => undefined);
    onDone();
  };

  const save = async () => {
    if (passcode.length !== 6) return setError('Your passcode must be 6 digits.');
    if (passcode !== confirm) return setError("The two passcodes don't match.");
    setBusy(true);
    setError(null);
    const result = await authService.setFirstPasscode(passcode);
    setBusy(false);
    if (!result.success) return setError(result.error || 'Please try again.');

    setOpen(false);
    const name = result.username || username;
    const offerFaceId = await biometricAuthService.isAvailable().catch(() => false);
    const finish = () => onDone();
    Alert.alert(
      'Passcode saved',
      `To use GutChecks on another phone, log in with your username ${name} and this passcode. Keep a note of your username somewhere safe.`,
      offerFaceId
        ? [
            { text: 'Done', onPress: finish },
            {
              text: 'Also lock with Face ID',
              onPress: async () => {
                const userId = await AsyncStorage.getItem('user_id');
                if (userId) await biometricAuthService.enableBiometricAuth(userId, name || undefined).catch(() => undefined);
                finish();
              },
            },
          ]
        : [{ text: 'Done', onPress: finish }],
    );
  };

  const input = {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 24,
    letterSpacing: 10,
    textAlign: 'center' as const,
  };

  return (
    <>
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 8,
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.primary,
          backgroundColor: colors.surface,
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>Protect your History</Text>
        <Text style={{ fontSize: 15, lineHeight: 21, color: colors.textSecondary }}>
          Set a 6-digit passcode so you can get back to your checks if you change or lose your phone.
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={() => setOpen(true)}
            accessibilityRole="button"
            style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 10, backgroundColor: colors.primary, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.background }}>Set a passcode</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={dismiss} accessibilityRole="button" style={{ minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary }}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary }} accessibilityRole="header">
              Set a 6-digit passcode
            </Text>
            {username ? (
              <Text style={{ fontSize: 15, lineHeight: 22, color: colors.textSecondary }}>
                Your username is <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{username}</Text>. You'll need
                it with this passcode to log in on another phone.
              </Text>
            ) : null}
            <TextInput
              value={passcode}
              onChangeText={(t) => setPasscode(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              autoFocus
              accessibilityLabel="New passcode"
              placeholder="Passcode"
              placeholderTextColor={colors.textSecondary}
              style={input}
            />
            <TextInput
              value={confirm}
              onChangeText={(t) => setConfirm(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              accessibilityLabel="Confirm passcode"
              placeholder="Confirm"
              placeholderTextColor={colors.textSecondary}
              style={input}
            />
            {error ? <Text style={{ fontSize: 15, color: colors.warning }}>{error}</Text> : null}
            <TouchableOpacity
              onPress={save}
              disabled={busy}
              accessibilityRole="button"
              style={{ minHeight: 52, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
            >
              {busy ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.background }}>Save passcode</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setOpen(false)} accessibilityRole="button" style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
