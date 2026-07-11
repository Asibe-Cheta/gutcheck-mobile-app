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
  const acknowledgement = payload.acknowledgement || payload.summary || '';
  const groundingLine =
    payload.groundingLine || 'If you are in immediate danger, please call emergency services now.';
  const primary = payload.helplines[0];
  const rest = payload.helplines.slice(1);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.acknowledgement, { color: colors.textPrimary }]}>{acknowledgement}</Text>

      {primary ? (
        <TouchableOpacity
          style={[styles.primaryCard, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => {
            if (primary.dialNumber) openTel(primary.dialNumber, primary.displayNumber);
            else if (primary.smsNumber) openSms(primary.smsNumber, primary.smsBody);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Call ${primary.name} ${primary.displayNumber}`}
        >
          <Ionicons name="call" size={22} color="#fff" />
          <View style={styles.primaryBody}>
            <Text style={styles.primaryTitle}>
              {primary.dialNumber
                ? `Call ${primary.name} now — ${primary.displayNumber}`
                : `${primary.name} — ${primary.displayNumber}`}
            </Text>
            <Text style={styles.primarySub}>{primary.description}</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {rest.map((line) => (
        <TouchableOpacity
          key={line.name}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            if (line.dialNumber) openTel(line.dialNumber, line.displayNumber);
            else if (line.smsNumber) openSms(line.smsNumber, line.smsBody);
          }}
          accessibilityRole="button"
          accessibilityLabel={
            line.smsNumber
              ? `Text ${line.name} ${line.displayNumber}`
              : `Call ${line.name} ${line.displayNumber}`
          }
        >
          <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}22` }]}>
            <Ionicons
              name={(line.icon as keyof typeof Ionicons.glyphMap) || 'call'}
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={styles.cardBody}>
            <Text style={[styles.cardName, { color: colors.textPrimary }]}>{line.name}</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{line.description}</Text>
            <Text style={[styles.cardNumber, { color: colors.primary }]}>{line.displayNumber}</Text>
          </View>
          <Ionicons
            name={line.smsNumber ? 'chatbubble' : 'call'}
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>
      ))}

      <Text style={[styles.grounding, { color: colors.error }]}>{groundingLine}</Text>
      <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>{payload.disclaimer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    marginBottom: 8,
  },
  acknowledgement: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  primaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  primaryBody: {
    flex: 1,
  },
  primaryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  primarySub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 4,
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
  grounding: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 4,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
  },
});
