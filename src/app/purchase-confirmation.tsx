/**
 * O8 Confirmation (PRD section 8), and the access-code success screen (PRD 11.4, source=code).
 * Dates come from the store's verified entitlement (expirationDate, periodType), never the phone's
 * clock; prices come from the purchased plan as the store reported it.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { useSubscriptionStore } from '@/lib/stores/subscriptionStore';
import { revenueCatService } from '@/lib/revenueCatService';
import { formatLongDate, formatPrice } from '@/lib/subscriptionTrialUtils';

const MANAGE_SUBSCRIPTION_URL =
  Platform.OS === 'android'
    ? 'https://play.google.com/store/account/subscriptions?package=org.mygutcheck.app'
    : 'https://apps.apple.com/account/subscriptions';
const STORE_ACCOUNT = Platform.OS === 'android' ? 'Google Play' : 'Apple Account';
const DAY_MS = 24 * 60 * 60 * 1000;

type CodeAccess = { endDate: Date; durationLabel: string | null } | null;

export default function PurchaseConfirmationScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { source } = useLocalSearchParams<{ source?: string }>();
  const isCode = source === 'code';
  const subscription = useSubscriptionStore((s) => s.subscription);
  const currentPlan = useSubscriptionStore((s) => s.currentPlan);
  const [reminderSet, setReminderSet] = useState(false);
  const [codeAccess, setCodeAccess] = useState<CodeAccess>(null);

  // Access codes: read the end date straight from the store's entitlement.
  useEffect(() => {
    if (!isCode) return;
    void (async () => {
      const entitlement = await revenueCatService.getPremiumEntitlement();
      if (!entitlement?.expirationDate) return;
      const end = new Date(entitlement.expirationDate);
      const start = entitlement.latestPurchaseDate ? new Date(entitlement.latestPurchaseDate) : null;
      const days = start ? (end.getTime() - start.getTime()) / DAY_MS : null;
      const durationLabel = days === null ? null : days >= 300 ? '1 year' : days >= 25 ? '1 month' : null;
      setCodeAccess({ endDate: end, durationLabel });
    })();
  }, [isCode]);

  const endDate = isCode
    ? codeAccess?.endDate ?? null
    : subscription?.expirationDate
      ? new Date(subscription.expirationDate)
      : null;
  const isTrial = !isCode && subscription?.periodType === 'TRIAL' && !!endDate;
  const isYearly = currentPlan?.interval === 'year';
  const price = currentPlan ? formatPrice(currentPlan.price, currentPlan.currency) : null;
  const dateText = endDate ? formatLongDate(endDate) : null;

  const headline = isCode
    ? codeAccess?.durationLabel
      ? `You have ${codeAccess.durationLabel} of free access`
      : 'You have free access'
    : "You're all set";

  const body = (() => {
    if (isCode) {
      return dateText
        ? `Your access ends on ${dateText}. It won't renew and you won't be charged.`
        : "Your free access is active. It won't renew and you won't be charged.";
    }
    if (isTrial && price && dateText) {
      return `Your free ${isYearly ? 'week' : 'trial'} has started. It ends on ${dateText}. After that, ${price} ${isYearly ? 'a year' : 'a month'} is charged unless you cancel before ${dateText}. You can cancel any time in your ${STORE_ACCOUNT} settings.`;
    }
    if (price && dateText) {
      return isYearly
        ? `Your yearly plan is active. ${price} is charged each year, next on ${dateText}. You can cancel any time in your ${STORE_ACCOUNT} settings.`
        : `Your monthly plan is active. ${price} is charged each month, next on ${dateText}. You can cancel any time in your ${STORE_ACCOUNT} settings.`;
    }
    return `Your plan is active. You can see your renewal date and cancel any time in your ${STORE_ACCOUNT} settings.`;
  })();

  // Trial: remind 2 days before it ends. Free access: remind 7 days before it ends (PRD 11.4).
  const reminderDays = isCode ? 7 : 2;
  const showReminder = (isTrial || (isCode && !!endDate)) && !!endDate;

  const handleReminder = async () => {
    if (!endDate) return;
    const remindAt = new Date(endDate.getTime() - reminderDays * DAY_MS);
    if (remindAt.getTime() <= Date.now()) {
      Alert.alert(isCode ? 'Your free access ends soon' : 'Your trial ends soon', `It ends on ${dateText}.`);
      return;
    }
    try {
      // Permission is asked only now, after the user chose a reminder (PRD 6: no prompts in onboarding)
      const existing = await Notifications.getPermissionsAsync();
      const status = existing.status === 'granted' ? existing.status : (await Notifications.requestPermissionsAsync()).status;
      if (status !== 'granted') {
        Alert.alert('Notifications are off', 'You can turn them on for GutChecks in your phone settings.');
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: isCode
          ? {
              title: 'Your free access ends in 7 days',
              body: `It ends on ${dateText}. You won't be charged.`,
              data: { type: 'access-code-reminder' },
            }
          : {
              title: 'Your free trial ends in 2 days',
              body: `It ends on ${dateText}. After that, ${price} a year is charged unless you cancel.`,
              data: { type: 'trial-reminder' },
            },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: remindAt },
      });
      setReminderSet(true);
    } catch (error) {
      console.error('[O8] Could not schedule reminder:', error);
      Alert.alert('Reminder not set', 'Please try again.');
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flexGrow: 1, padding: 24, gap: 16, justifyContent: 'center' },
    icon: { alignSelf: 'center', marginBottom: 8 },
    headline: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: colors.textPrimary },
    body: { fontSize: 17, lineHeight: 25, textAlign: 'center', color: colors.textSecondary },
    footer: { padding: 24, gap: 6 },
    primaryButton: {
      minHeight: 52,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: { fontSize: 17, fontWeight: '700', color: colors.background },
    textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    textButtonLabel: { fontSize: 16, fontWeight: '600', color: colors.primary },
    confirmed: { fontSize: 15, textAlign: 'center', color: colors.textSecondary },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Ionicons name="checkmark-circle" size={64} color={colors.primary} style={styles.icon} />
        <Text style={styles.headline} accessibilityRole="header">
          {headline}
        </Text>
        <Text style={styles.body}>{body}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace({ pathname: '/chat', params: { firstCheck: 'true' } })}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>{isCode ? 'Start a check' : 'Start my first check'}</Text>
        </TouchableOpacity>

        {showReminder ? (
          reminderSet ? (
            <Text style={styles.confirmed}>
              {isCode ? "We'll remind you 7 days before your access ends." : "We'll remind you 2 days before your trial ends."}
            </Text>
          ) : (
            <TouchableOpacity style={styles.textButton} onPress={handleReminder} accessibilityRole="button">
              <Text style={styles.textButtonLabel}>
                {isCode ? 'Remind me 7 days before it ends' : 'Remind me 2 days before my trial ends'}
              </Text>
            </TouchableOpacity>
          )
        ) : null}

        {!isCode ? (
          <TouchableOpacity
            style={styles.textButton}
            onPress={() => Linking.openURL(MANAGE_SUBSCRIPTION_URL).catch(() => undefined)}
            accessibilityRole="link"
          >
            <Text style={styles.textButtonLabel}>Manage subscription</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
