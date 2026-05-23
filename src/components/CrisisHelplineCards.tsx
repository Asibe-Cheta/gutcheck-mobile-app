import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CrisisCardPayload } from '@/lib/safeguardTemplates';

type Props = {
  payload: CrisisCardPayload;
  colors: {
    primary: string;
    textPrimary: string;
    textSecondary: string;
    surface: string;
    border: string;
    error: string;
  };
};

function openTel(dialNumber: string, label: string) {
  const dial = dialNumber.replace(/[^\d+]/g, '');
  Linking.openURL(`tel:${dial}`).catch(() => {
    Alert.alert('Unable to open dialler', `Please call ${label} manually.`);
  });
}

function openSms(smsNumber: string, body?: string) {
  const url = body
    ? `sms:${smsNumber}&body=${encodeURIComponent(body)}`
    : `sms:${smsNumber}`;
  Linking.openURL(url).catch(() => {
    Alert.alert('Unable to open Messages', 'Please text SHOUT to 85258 manually.');
  });
}

export default function CrisisHelplineCards({ payload, colors }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.banner, { backgroundColor: colors.error }]}>
        <Text style={styles.bannerText}>{payload.bannerTitle}</Text>
      </View>
      <Text style={[styles.summary, { color: colors.textPrimary }]}>{payload.summary}</Text>
      {payload.helplines.map((line) => (
        <View
          key={line.name}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}22` }]}>
            <Ionicons name={line.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.primary} />
          </View>
          <View style={styles.cardBody}>
            <Text style={[styles.cardName, { color: colors.textPrimary }]}>{line.name}</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{line.description}</Text>
            <Text style={[styles.cardNumber, { color: colors.primary }]}>{line.displayNumber}</Text>
          </View>
          {line.dialNumber ? (
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: `${colors.primary}22` }]}
              onPress={() => openTel(line.dialNumber!, line.displayNumber)}
              accessibilityLabel={`Call ${line.name}`}
            >
              <Ionicons name="call" size={20} color={colors.primary} />
            </TouchableOpacity>
          ) : line.smsNumber ? (
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: `${colors.primary}22` }]}
              onPress={() => openSms(line.smsNumber!, line.smsBody)}
              accessibilityLabel={`Text ${line.name}`}
            >
              <Ionicons name="chatbubble" size={20} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
      <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>{payload.disclaimer}</Text>
      <Text style={[styles.closer, { color: colors.textPrimary }]}>{payload.closer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    marginBottom: 8,
  },
  banner: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bannerText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  cardNumber: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  closer: {
    fontSize: 13,
    fontWeight: '600',
  },
});
