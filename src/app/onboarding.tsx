/**
 * Onboarding Flow (PRD section 8, O2 to O6)
 * Value first: the user's reason, how GutChecks helps, a fictional example and its result,
 * then privacy and age. Under-13s are signposted to Childline and never reach the paywall.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { profileService } from '@/lib/profileService';
import {
  AGE_BANDS,
  AgeBand,
  EXAMPLES,
  EXAMPLE_ORDER,
  ExampleId,
  exampleForReason,
  FEELING_OPTIONS,
  FeelingId,
  HOW_IT_HELPS_HEADLINE,
  ONBOARDING_KEYS,
  PRIVACY_POINTS,
  REASONS,
  ReasonId,
} from '@/lib/onboardingContent';
import { generalSupportFor, SUPPORT_SERVICES } from '@/lib/supportDirectory';
import { EmergencyBlock, SupportServiceCard } from '@/components/support/SupportServiceCard';

interface OnboardingProps {
  onComplete: () => void;
}

type Step = 'reason' | 'helps' | 'example' | 'result' | 'privacy' | 'under13';

/** O1 is the welcome screen, so onboarding steps are numbered 2 to 6. */
const STEP_NUMBER: Partial<Record<Step, number>> = { reason: 2, helps: 3, example: 4, result: 5, privacy: 6 };
const TOTAL_STEPS = 6;
const PRIVACY_POLICY_URL = 'https://www.mygutcheck.org/privacy';
const CHILDLINE_UNDER_12_URL = 'https://www.childline.org.uk/kids/';

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const [step, setStep] = useState<Step>('reason');
  const [reason, setReason] = useState<ReasonId | null>(null);
  const [exampleId, setExampleId] = useState<ExampleId>('secrecy');
  const [feelings, setFeelings] = useState<FeelingId[]>([]);
  const [ageBand, setAgeBand] = useState<AgeBand | null>(null);
  const [isParentCarer, setIsParentCarer] = useState(false);
  const [showHelpSheet, setShowHelpSheet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const example = EXAMPLES[exampleId];
  const matchedCount = useMemo(
    () => feelings.filter((f) => example.matches.includes(f)).length,
    [feelings, example]
  );

  const goTo = (next: Step) => setStep(next);

  const handleBack = () => {
    switch (step) {
      case 'reason':
        router.back();
        break;
      case 'helps':
        goTo('reason');
        break;
      case 'example':
        goTo('helps');
        break;
      case 'result':
        goTo('example');
        break;
      case 'privacy':
        goTo(feelings.length > 0 ? 'result' : 'example');
        break;
      case 'under13':
        goTo('privacy');
        break;
    }
  };

  const chooseReason = (value: ReasonId) => {
    setReason(value);
    setExampleId(exampleForReason(value));
    setFeelings([]);
  };

  const toggleFeeling = (value: FeelingId) => {
    setFeelings((current) => (current.includes(value) ? current.filter((f) => f !== value) : [...current, value]));
  };

  const tryAnotherExample = () => {
    const next = EXAMPLE_ORDER[(EXAMPLE_ORDER.indexOf(exampleId) + 1) % EXAMPLE_ORDER.length];
    setExampleId(next);
    setFeelings([]);
    goTo('example');
  };

  const finishOnboarding = async () => {
    if (!ageBand) return;
    if (ageBand === 'under-13') {
      // Owner decision: under-13s are signposted and their age choice is not stored.
      goTo('under13');
      return;
    }

    setIsSaving(true);
    try {
      await AsyncStorage.multiSet([
        [ONBOARDING_KEYS.completed, 'true'],
        [ONBOARDING_KEYS.reason, reason ?? 'looking'],
        [ONBOARDING_KEYS.ageBand, ageBand],
        [ONBOARDING_KEYS.parentCarer, isParentCarer ? 'true' : 'false'],
      ]);
      // Only the age band is synced to the profile; the reason stays on this phone.
      if (await AsyncStorage.getItem('user_id')) {
        await profileService.updateProfile({ age_range: ageBand }).catch(() => undefined);
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    } finally {
      setIsSaving(false);
    }
    onComplete();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingTop: 4,
      minHeight: 48,
    },
    headerButton: {
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    helpLink: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    progress: {
      flexDirection: 'row',
      gap: 6,
    },
    progressDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 16,
    },
    exampleLabel: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: colors.primary,
    },
    headline: {
      fontSize: 26,
      fontWeight: '800',
      lineHeight: 33,
      color: colors.textPrimary,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    chip: {
      minHeight: 44,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 22,
      borderWidth: 1.5,
      justifyContent: 'center',
    },
    chipText: {
      fontSize: 15,
      fontWeight: '600',
    },
    stepRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
    },
    stepNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary + '25',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepNumberText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.primary,
    },
    stepText: {
      flex: 1,
      fontSize: 16,
      lineHeight: 24,
      color: colors.textPrimary,
    },
    messageBubble: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderTopLeftRadius: 4,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    messageText: {
      fontSize: 17,
      lineHeight: 25,
      color: colors.textPrimary,
    },
    recognition: {
      fontSize: 17,
      fontWeight: '700',
      lineHeight: 24,
      color: colors.primary,
    },
    signRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
    },
    signTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 8,
    },
    note: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
    },
    bulletRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    radio: {
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1.5,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 48,
    },
    linkText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 16,
      gap: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    primaryButton: {
      minHeight: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    primaryButtonText: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.background,
    },
    secondaryButton: {
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    sheetBackdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },
    sheet: {
      maxHeight: '85%',
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 24,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    sheetTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: colors.textPrimary,
    },
  });

  const PrimaryButton = ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => (
    <TouchableOpacity
      style={[styles.primaryButton, disabled && { opacity: 0.4 }]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );

  const SecondaryButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.secondaryButton} onPress={onPress} accessibilityRole="button">
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );

  const renderReason = () => (
    <>
      <Text style={styles.headline} accessibilityRole="header">
        What brought you to GutChecks today?
      </Text>
      <Text style={styles.body}>
        Pick the closest one. It helps us show you a relevant example, and it stays on this phone.
      </Text>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {REASONS.map((option, index) => {
          const selected = reason === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.chip,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary + '22' : 'transparent',
                },
              ]}
              onPress={() => chooseReason(option.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option.label}, ${index + 1} of ${REASONS.length}`}
            >
              <Text style={[styles.chipText, { color: selected ? colors.primary : colors.textPrimary }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  const renderHelps = () => (
    <>
      <Text style={styles.headline} accessibilityRole="header">
        {HOW_IT_HELPS_HEADLINE[reason ?? 'looking']}
      </Text>
      <Text style={styles.body}>
        Your feelings are a valid reason to look closer. GutChecks won't judge you or tell you what to do.
      </Text>
      <View style={{ gap: 14, marginTop: 4 }} accessibilityRole="list">
        {[
          'Tell us what happened, in your own words or with a screenshot.',
          'See possible warning signs and why they might matter.',
          'Choose a next step that feels right for you, including where to find support.',
        ].map((text, index) => (
          <View key={text} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{text}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const renderExample = () => (
    <>
      <Text style={styles.exampleLabel}>Example · a made-up message</Text>
      <Text style={styles.headline} accessibilityRole="header">
        Here's a made-up message. What feels off to you?
      </Text>
      <View style={styles.messageBubble} accessible accessibilityLabel={`Example message: ${example.message}`}>
        <Text style={styles.messageText}>{example.message}</Text>
      </View>
      <Text style={[styles.body, { color: colors.textPrimary }]}>Tap everything that feels off.</Text>
      <View style={styles.chips}>
        {FEELING_OPTIONS.map((option) => {
          const selected = feelings.includes(option.id);
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.chip,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary + '22' : 'transparent',
                },
              ]}
              onPress={() => toggleFeeling(option.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
            >
              <Text style={[styles.chipText, { color: selected ? colors.primary : colors.textPrimary }]}>
                {selected ? '✓ ' : ''}
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  const renderResult = () => {
    const sample = generalSupportFor(null);
    return (
      <>
        <Text style={styles.exampleLabel}>Example result · not about anyone real</Text>
        <Text style={styles.headline} accessibilityRole="header">
          Here's what GutChecks might point out
        </Text>
        <Text style={styles.recognition}>
          {matchedCount > 0
            ? `You noticed ${matchedCount} of these too. Trust that.`
            : "Your gut picked up on something. That's worth listening to."}
        </Text>

        <Text style={styles.sectionTitle}>Possible warning signs</Text>
        {example.signs.map((sign) => (
          <View key={sign.title} style={styles.signRow}>
            <Ionicons name="flag-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.signTitle}>{sign.title}</Text>
              <Text style={styles.body}>{sign.detail}</Text>
            </View>
          </View>
        ))}

        <View style={styles.note}>
          <Text style={styles.body}>
            Context matters. One message can't tell the whole story. GutChecks describes patterns, not people, and
            can't say whether someone means harm.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Next steps</Text>
        {example.nextSteps.map((stepText) => (
          <View key={stepText} style={styles.bulletRow}>
            <Ionicons name="arrow-forward-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.stepText, { color: colors.textPrimary }]}>{stepText}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>When it might help, we'll show support options like this.</Text>
        <SupportServiceCard service={sample} label="Example" />
      </>
    );
  };

  const renderPrivacy = () => (
    <>
      <Text style={styles.headline} accessibilityRole="header">
        Your privacy, your control
      </Text>
      <View style={{ gap: 10 }} accessibilityRole="list">
        {PRIVACY_POINTS.map((point) => (
          <View key={point} style={styles.bulletRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={[styles.stepText, { fontSize: 15, lineHeight: 22 }]}>{point}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>How old are you?</Text>
      <Text style={styles.body}>We use this only to show support services that fit your age.</Text>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {AGE_BANDS.map((band) => {
          const selected = ageBand === band.id;
          return (
            <TouchableOpacity
              key={band.id}
              style={[
                styles.radio,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary + '18' : 'transparent',
                },
              ]}
              onPress={() => setAgeBand(band.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipText, { color: colors.textPrimary }]}>{band.label}</Text>
              <Ionicons
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={selected ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.toggleRow}>
        <Text style={[styles.stepText, { fontSize: 16 }]}>I'm a parent or carer</Text>
        <Switch
          value={isParentCarer}
          onValueChange={setIsParentCarer}
          trackColor={{ true: colors.primary, false: colors.border }}
          accessibilityLabel="I'm a parent or carer"
        />
      </View>

      <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} accessibilityRole="link">
        <Text style={styles.linkText}>Read our Privacy Policy</Text>
      </TouchableOpacity>
    </>
  );

  const renderUnder13 = () => (
    <>
      <Text style={styles.headline} accessibilityRole="header">
        GutChecks is made for people aged 13 and over
      </Text>
      <Text style={styles.body}>
        If something feels off, please talk to a grown-up you trust. That could be a parent or carer, a teacher or
        school nurse, a youth worker or a coach. If the first person doesn't help, keep telling people until someone
        does.
      </Text>
      <Text style={[styles.body, { color: colors.textPrimary }]}>
        You can also talk to Childline. It's free, and they won't judge you.
      </Text>
      <SupportServiceCard
        service={SUPPORT_SERVICES['uk-childline']}
        showCopyNumber
        extraLink={{ label: 'Childline for under 12s', url: CHILDLINE_UNDER_12_URL }}
      />
      <EmergencyBlock />
    </>
  );

  const renderHelpSheet = () => (
    <Modal visible={showHelpSheet} transparent animationType="slide" onRequestClose={() => setShowHelpSheet(false)}>
      <View style={styles.sheetBackdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle} accessibilityRole="header">
              Need help now?
            </Text>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowHelpSheet(false)}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 16 }}>
            <EmergencyBlock />
            <SupportServiceCard service={SUPPORT_SERVICES['uk-childline']} />
            <SupportServiceCard service={SUPPORT_SERVICES['uk-samaritans']} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const stepNumber = STEP_NUMBER[step];

  const footer = (() => {
    switch (step) {
      case 'reason':
        return (
          <>
            <PrimaryButton label="Continue" onPress={() => goTo('helps')} disabled={!reason} />
            <SecondaryButton
              label="Skip"
              onPress={() => {
                chooseReason('looking');
                goTo('helps');
              }}
            />
          </>
        );
      case 'helps':
        return <PrimaryButton label="Show me an example" onPress={() => goTo('example')} />;
      case 'example':
        return (
          <>
            <PrimaryButton
              label="See what GutChecks notices"
              onPress={() => goTo('result')}
              disabled={feelings.length === 0}
            />
            <SecondaryButton label="Skip example" onPress={() => goTo('privacy')} />
          </>
        );
      case 'result':
        return (
          <>
            <PrimaryButton label="Continue" onPress={() => goTo('privacy')} />
            <SecondaryButton label="Try another example" onPress={tryAnotherExample} />
          </>
        );
      case 'privacy':
        return <PrimaryButton label={isSaving ? 'Saving…' : 'Continue'} onPress={finishOnboarding} disabled={!ageBand || isSaving} />;
      case 'under13':
        return <SecondaryButton label="I chose the wrong age" onPress={() => goTo('privacy')} />;
    }
  })();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>

        {stepNumber ? (
          <View
            style={styles.progress}
            accessible
            accessibilityLabel={`Step ${stepNumber} of ${TOTAL_STEPS}`}
          >
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <View
                key={i}
                style={[styles.progressDot, { backgroundColor: i < stepNumber ? colors.primary : colors.border }]}
              />
            ))}
          </View>
        ) : (
          <View />
        )}

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowHelpSheet(true)}
          accessibilityRole="button"
        >
          <Text style={styles.helpLink}>Need help now?</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 'reason' && renderReason()}
        {step === 'helps' && renderHelps()}
        {step === 'example' && renderExample()}
        {step === 'result' && renderResult()}
        {step === 'privacy' && renderPrivacy()}
        {step === 'under13' && renderUnder13()}
      </ScrollView>

      <View style={styles.footer}>{footer}</View>

      {renderHelpSheet()}
    </SafeAreaView>
  );
}
