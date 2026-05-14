import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/themeContext';
import { getThemeColors } from '@/lib/theme';

interface Props {
  visible: boolean;
  steps: string[];
  onSubmit: (payload: { selectedStepIndexes: number[]; barrierText?: string }) => Promise<void>;
  onSkip: () => Promise<void>;
}

export default function ActionStepFollowUpModal({ visible, steps, onSubmit, onSkip }: Props) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const [selected, setSelected] = useState<number[]>([]);
  const [didNotAct, setDidNotAct] = useState(false);
  const [barrierText, setBarrierText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleStep = (index: number) => {
    setDidNotAct(false);
    setSelected((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        selectedStepIndexes: didNotAct ? [] : selected,
        barrierText: didNotAct ? barrierText.trim().slice(0, 280) : undefined,
      });
      setSelected([]);
      setDidNotAct(false);
      setBarrierText('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSkip();
      setSelected([]);
      setDidNotAct(false);
      setBarrierText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Ionicons name="checkmark-done-circle" size={24} color={colors.primary} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Welcome back. Last time, GutChecks suggested some steps. How did it go?
            </Text>
          </View>
          <Text style={[styles.transparencyText, { color: colors.textSecondary }]}>
            This check-in is anonymous. GutChecks stores only minimal feedback metadata to improve action-step guidance.
          </Text>
          <Text style={[styles.transparencyText, { color: colors.textSecondary }]}>
            It is designed to take under a minute.
          </Text>

          <ScrollView style={styles.stepList} contentContainerStyle={{ gap: 10 }}>
            {steps.map((step, index) => {
              const checked = selected.includes(index) && !didNotAct;
              return (
                <TouchableOpacity
                  key={`${step}-${index}`}
                  style={[
                    styles.stepRow,
                    {
                      borderColor: checked ? colors.primary : colors.border,
                      backgroundColor: checked ? `${colors.primary}1A` : 'transparent',
                    },
                  ]}
                  onPress={() => toggleStep(index)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={checked ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.stepText, { color: colors.textPrimary }]}>{step}</Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[
                styles.stepRow,
                {
                  borderColor: didNotAct ? colors.primary : colors.border,
                  backgroundColor: didNotAct ? `${colors.primary}1A` : 'transparent',
                },
              ]}
              onPress={() => {
                setDidNotAct((prev) => !prev);
                setSelected([]);
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={didNotAct ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={didNotAct ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.stepText, { color: colors.textPrimary }]}>I did not act on any of these</Text>
            </TouchableOpacity>

            {didNotAct && (
              <TextInput
                style={[
                  styles.barrierInput,
                  { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background },
                ]}
                placeholder="Optional: what got in the way? (anonymous, max 280)"
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={280}
                value={barrierText}
                onChangeText={setBarrierText}
              />
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={handleSkip}>
              <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.primaryText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    maxHeight: '86%',
  },
  header: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  stepList: {
    maxHeight: 360,
    marginTop: 8,
  },
  transparencyText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  stepRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  barrierInput: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 80,
    padding: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  actions: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

