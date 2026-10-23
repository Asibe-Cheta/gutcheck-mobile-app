/**
 * Free support home (PRD 7.2, "Not now" from the plan choice).
 * Support services and emergency information are never behind the paywall.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { isUnder18Band, SUPPORT_SERVICES, SupportService } from '@/lib/supportDirectory';
import { EmergencyBlock, SupportServiceCard } from '@/components/support/SupportServiceCard';
import { ONBOARDING_KEYS } from '@/lib/onboardingContent';

function servicesFor(ageBand: string | null, isParentCarer: boolean): SupportService[] {
  if (isUnder18Band(ageBand)) {
    return [SUPPORT_SERVICES['uk-childline'], SUPPORT_SERVICES['uk-ceop']];
  }
  const adult = [
    SUPPORT_SERVICES['uk-samaritans'],
    SUPPORT_SERVICES['uk-ndah'],
    SUPPORT_SERVICES['uk-stalking'],
    SUPPORT_SERVICES['uk-rapecrisis'],
  ];
  return isParentCarer ? [SUPPORT_SERVICES['uk-nspcc'], ...adult] : adult;
}

export default function FreeSupportScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [services, setServices] = useState<SupportService[]>([]);

  useEffect(() => {
    AsyncStorage.multiGet([ONBOARDING_KEYS.ageBand, ONBOARDING_KEYS.parentCarer])
      .then(([[, ageBand], [, parentCarer]]) => setServices(servicesFor(ageBand, parentCarer === 'true')))
      .catch(() => setServices(servicesFor(null, false)));
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You will return to the welcome screen. You can sign in again with your username and PIN.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            const { authService } = await import('@/lib/authService');
            await authService.logout();
          } finally {
            router.replace('/(auth)/welcome');
          }
        },
      },
    ]);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, gap: 16 },
    headline: { fontSize: 26, fontWeight: '800', lineHeight: 33, color: colors.textPrimary },
    body: { fontSize: 16, lineHeight: 24, color: colors.textSecondary },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 8 },
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
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headline} accessibilityRole="header">
          You can still get support for free
        </Text>
        <Text style={styles.body}>
          These services are free and confidential. You don't need a plan to use them, and GutChecks never shares what
          you tell them.
        </Text>

        <EmergencyBlock />

        <Text style={styles.sectionTitle}>Support services</Text>
        {services.map((service) => (
          <SupportServiceCard key={service.serviceId} service={service} />
        ))}

        <Text style={styles.sectionTitle}>Want to check something?</Text>
        <Text style={styles.body}>Checks need a plan. You can choose one any time.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/subscription')} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>See plans</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.textButton} onPress={handleSignOut} accessibilityRole="button">
          <Text style={styles.textButtonLabel}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
