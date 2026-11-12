/**
 * Access codes (PRD 11, route 1: Apple offer codes).
 *
 * Marlyce creates one-time-use offer codes in App Store Connect (free 1 month or 1 year on the
 * yearly product, "do not auto-renew"). Each code works once, and the free access attaches to the
 * GutChecks account that redeems it (RevenueCat app user = GutChecks user ID), so a code that has
 * been used is worthless to anyone else, and access follows the account to a new phone via Restore.
 *
 * GutChecks never unlocks anything itself (App Store guideline 3.1.1): Apple's own sheet redeems
 * the code and access comes from the store's verified entitlement.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { revenueCatService } from '@/lib/revenueCatService';
import { formatLongDate } from '@/lib/subscriptionTrialUtils';
import { track } from '@/lib/analytics';

type Entitlement = Awaited<ReturnType<typeof revenueCatService.getPremiumEntitlement>>;
type ScreenState = 'loading' | 'ready' | 'waiting' | 'paid' | 'trial' | 'has-free-access' | 'android' | 'signed-out';

const MANAGE_URL = 'https://apps.apple.com/account/subscriptions';

function stateFor(entitlement: Entitlement): ScreenState {
  if (!entitlement) return 'ready';
  if (entitlement.periodType === 'TRIAL') return 'trial';
  if (!entitlement.willRenew) return 'has-free-access';
  return 'paid';
}

export default function AccessCodeScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [state, setState] = useState<ScreenState>(Platform.OS === 'ios' ? 'loading' : 'android');
  const [entitlement, setEntitlement] = useState<Entitlement>(null);
  const userIdRef = useRef<string | null>(null);
  const waitingRef = useRef(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    track('access_code_entry_opened', { source: 'app' });
  }, []);

  // Initial state: a paid plan or trial means a code isn't needed (PRD 11.4).
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void (async () => {
      const userId = await AsyncStorage.getItem('user_id');
      userIdRef.current = userId;
      if (!userId) {
        setState('signed-out');
        return;
      }
      await revenueCatService.setAppUserID(userId);
      const current = await revenueCatService.getPremiumEntitlement();
      setEntitlement(current);
      setState(stateFor(current));
    })();
  }, []);

  // After Apple's sheet: as soon as the store reports access, show the confirmation.
  const checkRedeemed = useCallback(async () => {
    if (!waitingRef.current || finishedRef.current) return;
    const current = await revenueCatService.getPremiumEntitlement();
    if (current && !finishedRef.current) {
      finishedRef.current = true;
      waitingRef.current = false;
      track('code_redeemed', { offer_type: current.willRenew ? 'renewing' : 'free' });
      router.replace({ pathname: '/purchase-confirmation', params: { source: 'code' } });
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const unsubscribe = revenueCatService.onCustomerInfoUpdate(() => void checkRedeemed());
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') void checkRedeemed();
    });
    return () => {
      unsubscribe();
      appState.remove();
    };
  }, [checkRedeemed]);

  const handleRedeem = async () => {
    const userId = userIdRef.current;
    if (!userId) return;
    try {
      waitingRef.current = true;
      setState('waiting');
      track('code_redemption_attempted');
      await revenueCatService.presentCodeRedemptionSheet(userId);
    } catch (error) {
      console.error('[ACCESS_CODE] Could not open the redemption sheet:', error);
      waitingRef.current = false;
      setState('ready');
      Alert.alert("Couldn't open Apple's code screen", 'Please check your connection and try again.');
    }
  };

  const endDate = entitlement?.expirationDate ? formatLongDate(new Date(entitlement.expirationDate)) : null;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, minHeight: 56 },
    backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    content: { padding: 24, gap: 16 },
    headline: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
    body: { fontSize: 17, lineHeight: 25, color: colors.textSecondary },
    note: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
    primaryButton: {
      minHeight: 52,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    primaryButtonText: { fontSize: 17, fontWeight: '700', color: colors.background },
    textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    textButtonLabel: { fontSize: 16, fontWeight: '600', color: colors.primary },
  });

  const manageButton = (
    <TouchableOpacity
      style={styles.textButton}
      onPress={() => Linking.openURL(MANAGE_URL).catch(() => undefined)}
      accessibilityRole="link"
    >
      <Text style={styles.textButtonLabel}>Manage subscription</Text>
    </TouchableOpacity>
  );

  const renderBody = () => {
    switch (state) {
      case 'loading':
        return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;

      case 'android':
        return (
          <>
            <Text style={styles.headline} accessibilityRole="header">Access codes</Text>
            <Text style={styles.body}>
              Access codes work on iPhone for now. If an organisation gave you a code, you can use it in
              GutChecks on an iPhone or iPad.
            </Text>
          </>
        );

      case 'signed-out':
        return (
          <>
            <Text style={styles.headline} accessibilityRole="header">Enter your access code</Text>
            <Text style={styles.body}>
              Create your GutChecks account first, so your free access is linked to it. No name or email needed.
            </Text>
          </>
        );

      case 'paid':
        return (
          <>
            <Text style={styles.headline} accessibilityRole="header">You already have full access</Text>
            <Text style={styles.body}>
              You don't need a code right now. If you'd rather use it, turn off renewal in Manage subscription
              and redeem the code after your plan ends.
            </Text>
            {manageButton}
          </>
        );

      case 'trial':
        return (
          <>
            <Text style={styles.headline} accessibilityRole="header">You're on a free trial</Text>
            <Text style={styles.body}>
              To use your code instead, cancel the trial in Manage subscription (you won't be charged) and redeem
              the code when the trial ends.
            </Text>
            {manageButton}
          </>
        );

      case 'has-free-access':
        return (
          <>
            <Text style={styles.headline} accessibilityRole="header">You already have access</Text>
            <Text style={styles.body}>
              {endDate
                ? `Your access runs until ${endDate}. It won't renew and you won't be charged.`
                : "Your access won't renew and you won't be charged."}
            </Text>
          </>
        );

      case 'ready':
      case 'waiting':
        return (
          <>
            <Text style={styles.headline} accessibilityRole="header">Enter your access code</Text>
            <Text style={styles.body}>
              If a school, youth service or other organisation gave you a code, enter it here. They won't see
              anything you check.
            </Text>
            <Text style={styles.note}>
              Apple will ask you to enter the code and confirm. It's free and won't renew. Each code can only be
              used once, by one account.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, state === 'waiting' && { opacity: 0.6 }]}
              onPress={handleRedeem}
              disabled={state === 'waiting'}
              accessibilityRole="button"
            >
              {state === 'waiting' ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.primaryButtonText}>Redeem code</Text>
              )}
            </TouchableOpacity>
            {state === 'waiting' ? (
              <TouchableOpacity style={styles.textButton} onPress={() => void checkRedeemed()} accessibilityRole="button">
                <Text style={styles.textButtonLabel}>I've redeemed my code</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.textButton}
              onPress={() =>
                Alert.alert(
                  'Where do I find my code?',
                  'Your code comes from the organisation that gave it to you, for example on a card, a letter or in a message.',
                )
              }
              accessibilityRole="button"
            >
              <Text style={styles.textButtonLabel}>Where do I find my code?</Text>
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>{renderBody()}</ScrollView>
    </SafeAreaView>
  );
}
