/**
 * Support cards under a result (PRD 12.1 and 12.4).
 * Rendered from service IDs so a reopened chat always shows current numbers and links.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { SUPPORT_SERVICES, SupportServiceId } from '@/lib/supportDirectory';
import type { SupportTier } from '@/lib/supportRules';
import { EmergencyBlock, SupportServiceCard } from './SupportServiceCard';

interface ResultSupportCardsProps {
  tier: SupportTier;
  serviceIds: SupportServiceId[];
  /** Set when the screen already pins the 999 banner above the result text. */
  hideEmergency?: boolean;
}

export function ResultSupportCards({ tier, serviceIds, hideEmergency }: ResultSupportCardsProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const services = serviceIds.map((id) => SUPPORT_SERVICES[id]).filter(Boolean);

  if (tier === 0 || (services.length === 0 && (tier < 3 || hideEmergency))) return null;

  return (
    <View style={styles.container}>
      {tier === 3 && !hideEmergency ? <EmergencyBlock /> : null}
      {services.length > 0 ? (
        <Text style={[styles.heading, { color: colors.textPrimary }]} accessibilityRole="header">
          {tier === 1 ? 'If you want to talk to someone' : 'Support that might help'}
        </Text>
      ) : null}
      {services.map((service) => (
        <SupportServiceCard key={service.serviceId} service={service} />
      ))}
      {tier < 3 ? (
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          Talking to someone you trust can help too.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    gap: 10,
    marginTop: 8,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
  },
});
