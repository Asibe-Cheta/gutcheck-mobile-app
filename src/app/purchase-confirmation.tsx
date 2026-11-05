/**
 * O8 Confirmation (PRD section 8).
 * Dates come from the store's verified entitlement (expirationDate, periodType), never the phone's
 * clock; prices come from the purchased plan as the store reported it.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { useSubscriptionStore } from '@/lib/stores/subscriptionStore';
import { formatLongDate, formatPrice } from '@/lib/subscriptionTrialUtils';

const MANAGE_SUBSCRIPTION_URL =
  Platform.OS === 'android'
    ? 'https://play.google.com/store/account/subscriptions?package=org.mygutcheck.app'
    : 'https://apps.apple.com/account/subscriptions';
const STORE_ACCOUNT = Platform.OS === 'android' ? 'Google Play' : 'Apple Account';
const REMINDER_DAYS_BEFORE_END = 2;

export default function PurchaseConfirmationScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const subscription = useSubscriptionStore((s) => s.subscription);
  const currentPlan = useSubscriptionStore((s) => s.currentPlan);
  const [reminderSet, setReminderSet] = useState(false);

  const endDate = subscription?.expirationDate ? new Date(subscription.expirationDate) : null;
  const isTrial = subscription?.periodType === 'TRIAL' && !!endDate;
  const isYearly = currentPlan?.interval === 'year';
  const price = currentPlan ? formatPrice(currentPlan.price, currentPlan.currency) : null;
  const dateText = endDate ? formatLongDate(endDate) : null;

  const body = (() => {
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

  const handleReminder = async () => {
    if (!endDate) return;
    const remindAt = new Date(endDate.getTime() - REMINDER_DAYS_BEFORE_END * 24 * 60 * 60 * 1000);
    if (remindAt.getTime() <= Date.now()) {
      Alert.alert('Your trial ends soon', `It ends on ${dateText}.`);
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
        content: {
          title: 'Your free trial ends in 2 days',
          body: `It ends on ${dateText}. After that, ${price} a year is charged unless you cancel.`,
          data: { type: 'trial-reminder' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: remindAt },
      });
      setReminderSet(true);
    } catch (error) {
      console.error('[O8] Could not schedule trial reminder:', error);
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
          You're all set
        </Text>
        <Text style={styles.body}>{body}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace({ pathname: '/chat', params: { firstCheck: 'true' } })}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Start my first check</Text>
        </TouchableOpacity>

        {isTrial ? (
          reminderSet ? (
            <Text style={styles.confirmed}>We'll remind you 2 days before your trial ends.</Text>
          ) : (
            <TouchableOpacity style={styles.textButton} onPress={handleReminder} accessibilityRole="button">
              <Text style={styles.textButtonLabel}>Remind me 2 days before my trial ends</Text>
            </TouchableOpacity>
          )
        ) : null}

        <TouchableOpacity
          style={styles.textButton}
          onPress={() => Linking.openURL(MANAGE_SUBSCRIPTION_URL).catch(() => undefined)}
          accessibilityRole="link"
        >
          <Text style={styles.textButtonLabel}>Manage subscription</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
