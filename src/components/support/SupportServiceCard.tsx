/**
 * Support service card and emergency block (PRD 12.4).
 * Phone numbers are always shown as text as well as a Call action.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { availabilityText, SupportService, SUPPORT_SERVICES } from '@/lib/supportDirectory';

const telUrl = (phone: string) => `tel:${phone.replace(/\s/g, '')}`;

async function openUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open link', url);
  }
}

interface SupportServiceCardProps {
  service: SupportService;
  /** Small label above the card, e.g. "Example". */
  label?: string;
  showCopyNumber?: boolean;
  extraLink?: { label: string; url: string };
}

export function SupportServiceCard({ service, label, showCopyNumber, extraLink }: SupportServiceCardProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const availability = availabilityText(service);

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      accessible={false}
    >
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      ) : null}
      <Text style={[styles.name, { color: colors.textPrimary }]} accessibilityRole="header">
        {service.name}
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{service.description}</Text>
      {service.phone ? (
        <Text style={[styles.phone, { color: colors.textPrimary }]}>{service.phone}</Text>
      ) : null}
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {availability} · {service.eligibilityText}
      </Text>

      <View style={styles.actions}>
        {service.phone ? (
          <TouchableOpacity
            style={[styles.primaryAction, { backgroundColor: colors.primary }]}
            onPress={() => openUrl(telUrl(service.phone!))}
            accessibilityRole="button"
            accessibilityLabel={`Call ${service.name} on ${service.phone}`}
          >
            <Ionicons name="call" size={16} color={colors.background} />
            <Text style={[styles.primaryActionText, { color: colors.background }]}>Call {service.phone}</Text>
          </TouchableOpacity>
        ) : null}
        {service.reportUrl ? (
          <TouchableOpacity
            style={[styles.secondaryAction, { borderColor: colors.primary }]}
            onPress={() => openUrl(service.reportUrl!)}
            accessibilityRole="link"
          >
            <Text style={[styles.secondaryActionText, { color: colors.primary }]}>Report</Text>
          </TouchableOpacity>
        ) : null}
        {service.webUrl ? (
          <TouchableOpacity
            style={[styles.secondaryAction, { borderColor: colors.primary }]}
            onPress={() => openUrl(service.webUrl!)}
            accessibilityRole="link"
          >
            <Text style={[styles.secondaryActionText, { color: colors.primary }]}>
              {service.serviceId === 'uk-childline' ? 'Chat online' : 'Visit website'}
            </Text>
          </TouchableOpacity>
        ) : null}
        {extraLink ? (
          <TouchableOpacity
            style={[styles.secondaryAction, { borderColor: colors.primary }]}
            onPress={() => openUrl(extraLink.url)}
            accessibilityRole="link"
          >
            <Text style={[styles.secondaryActionText, { color: colors.primary }]}>{extraLink.label}</Text>
          </TouchableOpacity>
        ) : null}
        {showCopyNumber && service.phone ? (
          <TouchableOpacity
            style={[styles.secondaryAction, { borderColor: colors.primary }]}
            onPress={async () => {
              await Clipboard.setStringAsync(service.phone!);
              Alert.alert('Number copied', service.phone!);
            }}
            accessibilityRole="button"
          >
            <Text style={[styles.secondaryActionText, { color: colors.primary }]}>Copy number</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

/** Solid, high-contrast 999 block; icon plus text so it never relies on colour alone. */
export function EmergencyBlock() {
  const emergency = SUPPORT_SERVICES['uk-emergency'];
  return (
    <View style={styles.emergency} accessibilityRole="alert">
      <View style={styles.emergencyHeader}>
        <Ionicons name="warning" size={20} color="#1a1d29" />
        <Text style={styles.emergencyTitle}>In immediate danger?</Text>
      </View>
      <Text style={styles.emergencyText}>
        If you or someone else is in immediate danger in the UK, call 999. GutChecks can't contact emergency services
        for you.
      </Text>
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() => openUrl(telUrl(emergency.phone!))}
        accessibilityRole="button"
        accessibilityLabel="Call 999"
      >
        <Ionicons name="call" size={16} color="#ffffff" />
        <Text style={styles.emergencyButtonText}>Call 999</Text>
      </TouchableOpacity>
      <Text style={styles.emergencyHint}>If you can't speak on a mobile, call 999 and press 55 when asked.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
  },
  phone: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryAction: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emergency: {
    backgroundColor: '#ffd166',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emergencyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1d29',
  },
  emergencyText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#1a1d29',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#1a1d29',
  },
  emergencyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  emergencyHint: {
    fontSize: 13,
    color: '#1a1d29',
  },
});
