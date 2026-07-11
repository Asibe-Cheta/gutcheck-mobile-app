import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PatternResponsePayload } from '@/lib/responsePipeline';

type Props = {
  payload: PatternResponsePayload;
  colors: {
    primary: string;
    textPrimary: string;
    textSecondary: string;
    surface: string;
    border: string;
  };
};

export default function PatternResponseCard({ payload, colors }: Props) {
  const primary = payload.recommended_actions.find((a) => a.priority === 'primary');
  const secondary = payload.recommended_actions.filter((a) => a.priority !== 'primary');

  return (
    <View style={styles.wrap}>
      <Text style={[styles.validation, { color: colors.textPrimary }]}>{payload.validation}</Text>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🚩 RED FLAGS</Text>
      {payload.red_flags.map((flag) => (
        <Text key={flag} style={[styles.bullet, { color: colors.textPrimary }]}>
          • {flag}
        </Text>
      ))}

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>WHY THIS MATTERS</Text>
      <Text style={[styles.body, { color: colors.textPrimary }]}>{payload.why_it_matters}</Text>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>✅ WHAT TO DO</Text>
      {primary ? (
        <View
          style={[
            styles.primaryCard,
            {
              backgroundColor: `${colors.primary}18`,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text style={[styles.primaryLabel, { color: colors.primary }]}>1. Primary step</Text>
          <Text style={[styles.primaryAction, { color: colors.textPrimary }]}>{primary.action}</Text>
        </View>
      ) : null}
      {secondary.map((item, index) => (
        <Text key={`${item.action}-${index}`} style={[styles.bullet, { color: colors.textPrimary }]}>
          {index + 2}. {item.action}
        </Text>
      ))}

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>REALITY CHECK</Text>
      <Text style={[styles.body, { color: colors.textPrimary }]}>{payload.reality_check}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  validation: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: 10,
    marginBottom: 4,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 2,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  primaryCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
  },
  primaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  primaryAction: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
});
