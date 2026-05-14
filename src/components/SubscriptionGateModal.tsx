/**
 * SubscriptionGateModal
 * Full-screen blocking modal shown when a user's subscription has expired.
 * Cannot be dismissed — the user must subscribe or restore a purchase.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/lib/themeContext';
import { getThemeColors } from '@/lib/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscriptionStore } from '@/lib/stores/subscriptionStore';

interface Props {
  visible: boolean;
  /** Called when restore confirms an active subscription — lets the screen hide the modal */
  onAccessRestored: () => void;
}

export function SubscriptionGateModal({ visible, onAccessRestored }: Props) {
  const [isRestoring, setIsRestoring] = useState(false);
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        Alert.alert(
          'Sign in required',
          'Sign in to GutChecks: Red Flags & Safety first, then restore so your Apple ID subscription can attach to your profile.',
          [{ text: 'OK' }],
        );
        return;
      }

      const restoreResult = await useSubscriptionStore.getState().restorePurchases();
      const state = useSubscriptionStore.getState();

      if (
        restoreResult.success &&
        (state.subscription || state.isLifetimePro)
      ) {
        onAccessRestored();
        return;
      }

      if (!restoreResult.success) {
        Alert.alert(
          'Restore failed',
          restoreResult.error || 'Could not restore purchases. Please try again.',
          [{ text: 'OK' }],
        );
        return;
      }

      Alert.alert(
        'No active subscription',
        'No active GutChecks: Red Flags & Safety subscription was found for this device’s store account. If you use a new GutChecks: Red Flags & Safety profile, make sure you are signed into the same Apple ID that purchased the plan.',
        [{ text: 'OK' }],
      );
    } catch {
      Alert.alert('Error', 'Could not verify your subscription. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Prevent hardware back button (Android) from dismissing the modal
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(67,184,151,0.12)' }]}>
            <Ionicons name="lock-closed" size={36} color="#43B897" />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Subscription Ended
          </Text>

          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Your access has expired. Subscribe to continue using GutChecks: Red Flags & Safety.
          </Text>

          <TouchableOpacity
            style={styles.subscribeBtn}
            activeOpacity={0.85}
            onPress={() => router.replace('/subscription')}
          >
            <Text style={styles.subscribeBtnText}>View Plans</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.restoreBtn, { borderColor: colors.border }]}
            activeOpacity={0.75}
            onPress={handleRestore}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator color="#43B897" size="small" />
            ) : (
              <Text style={[styles.restoreBtnText, { color: colors.textSecondary }]}>
                Restore Purchases
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter',
    marginBottom: 10,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    fontFamily: 'Inter',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  subscribeBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#43B897',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#43B897',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  subscribeBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  restoreBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  restoreBtnText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
});
