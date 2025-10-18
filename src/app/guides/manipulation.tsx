/**
 * Manipulation Guide Screen
 * Comprehensive information about recognizing and dealing with manipulation
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';

export default function ManipulationGuide() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: 15,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    content: {
      padding: 20,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    description: {
      fontSize: 15,
      lineHeight: 24,
      color: colors.textSecondary,
      marginBottom: 15,
    },
    tacticCard: {
      backgroundColor: colors.border,
      padding: 15,
      borderRadius: 8,
      marginBottom: 15,
    },
    tacticTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 8,
    },
    tacticText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 8,
    },
    exampleLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.error,
      marginTop: 8,
      marginBottom: 4,
    },
    exampleText: {
      fontSize: 13,
      fontStyle: 'italic',
      color: colors.textSecondary,
      lineHeight: 18,
    },
    responseLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.success,
      marginTop: 8,
      marginBottom: 4,
    },
    responseText: {
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
    },
    warningBox: {
      backgroundColor: colors.warning + '20',
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
    },
    warningText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    listItem: {
      flexDirection: 'row',
      marginBottom: 12,
      paddingLeft: 10,
    },
    bullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginRight: 12,
      marginTop: 8,
    },
    listText: {
      flex: 1,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dealing with Manipulation</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Understanding Manipulation</Text>
          <Text style={styles.description}>
            Emotional manipulation is when someone uses tactics to influence, control, or exploit you for their own 
            benefit. Unlike healthy compromise or persuasion, manipulation is one-sided and often makes you feel guilty, 
            confused, or obligated to do things you don't want to do.
          </Text>
        </View>

        {/* Common Tactics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Manipulation Tactics</Text>

          <View style={styles.tacticCard}>
            <Text style={styles.tacticTitle}>1. Guilt-Tripping</Text>
            <Text style={styles.tacticText}>
              Making you feel guilty or responsible for their emotions, actions, or well-being.
            </Text>
            <Text style={styles.exampleLabel}>EXAMPLE:</Text>
            <Text style={styles.exampleText}>
              "After everything I've done for you, this is how you repay me?" or "I guess I'll just be alone then, 
              since you don't care about me."
            </Text>
            <Text style={styles.responseLabel}>HOW TO RESPOND:</Text>
            <Text style={styles.responseText}>
              "I care about you, but I'm not responsible for your happiness." Don't take the guilt bait.
            </Text>
          </View>

          <View style={styles.tacticCard}>
            <Text style={styles.tacticTitle}>2. Playing the Victim</Text>
            <Text style={styles.tacticText}>
              Always portraying themselves as the victim to avoid accountability and gain sympathy.
            </Text>
            <Text style={styles.exampleLabel}>EXAMPLE:</Text>
            <Text style={styles.exampleText}>
              "Why do bad things always happen to me?" or "Everyone's always against me, even you."
            </Text>
            <Text style={styles.responseLabel}>HOW TO RESPOND:</Text>
            <Text style={styles.responseText}>
              "I understand you're upset, but we need to talk about what actually happened." Stay focused on facts.
            </Text>
          </View>

          <View style={styles.tacticCard}>
            <Text style={styles.tacticTitle}>3. Love Bombing & Withdrawal</Text>
            <Text style={styles.tacticText}>
              Overwhelming you with affection, then withdrawing it to keep you off-balance and seeking their approval.
            </Text>
            <Text style={styles.exampleLabel}>EXAMPLE:</Text>
            <Text style={styles.exampleText}>
              One day: "You're perfect, I've never loved anyone like this!" Next day: Cold, distant, barely responds.
            </Text>
            <Text style={styles.responseLabel}>HOW TO RESPOND:</Text>
            <Text style={styles.responseText}>
              Recognize the pattern. Healthy love is consistent. Don't chase their affection when they withdraw.
            </Text>
          </View>

          <View style={styles.tacticCard}>
            <Text style={styles.tacticTitle}>4. Moving the Goalposts</Text>
            <Text style={styles.tacticText}>
              Constantly changing expectations or requirements so you can never meet them.
            </Text>
            <Text style={styles.exampleLabel}>EXAMPLE:</Text>
            <Text style={styles.exampleText}>
              You: "I got an A on my exam!" Them: "Why not an A+?" or demands that were never discussed before.
            </Text>
            <Text style={styles.responseLabel}>HOW TO RESPOND:</Text>
            <Text style={styles.responseText}>
              "That wasn't what we agreed on. I've met the expectation we discussed." Don't keep trying to please them.
            </Text>
          </View>

          <View style={styles.tacticCard}>
            <Text style={styles.tacticTitle}>5. Triangulation</Text>
            <Text style={styles.tacticText}>
              Bringing a third person into the dynamic to create jealousy, insecurity, or competition.
            </Text>
            <Text style={styles.exampleLabel}>EXAMPLE:</Text>
            <Text style={styles.exampleText}>
              "My ex would never complain about this" or "Everyone else thinks you're being unreasonable."
            </Text>
            <Text style={styles.responseLabel}>HOW TO RESPOND:</Text>
            <Text style={styles.responseText}>
              "This is between us. Other people's opinions aren't relevant." Don't compete with phantom others.
            </Text>
          </View>

          <View style={styles.tacticCard}>
            <Text style={styles.tacticTitle}>6. Silent Treatment</Text>
            <Text style={styles.tacticText}>
              Punishing you by withdrawing all communication, making you desperate to fix things.
            </Text>
            <Text style={styles.exampleLabel}>EXAMPLE:</Text>
            <Text style={styles.exampleText}>
              Completely ignoring you for hours or days after a disagreement, not responding to any messages.
            </Text>
            <Text style={styles.responseLabel}>HOW TO RESPOND:</Text>
            <Text style={styles.responseText}>
              "I'm here when you're ready to talk." Then don't chase them. Silent treatment is emotional abuse.
            </Text>
          </View>

          <View style={styles.tacticCard}>
            <Text style={styles.tacticTitle}>7. Blame-Shifting</Text>
            <Text style={styles.tacticText}>
              Refusing to take responsibility and always making everything your fault.
            </Text>
            <Text style={styles.exampleLabel}>EXAMPLE:</Text>
            <Text style={styles.exampleText}>
              You bring up something they did wrong, and suddenly you're arguing about something you did weeks ago.
            </Text>
            <Text style={styles.responseLabel}>HOW TO RESPOND:</Text>
            <Text style={styles.responseText}>
              "We can discuss that later. Right now we're talking about [original issue]." Don't let them deflect.
            </Text>
          </View>

          <View style={styles.tacticCard}>
            <Text style={styles.tacticTitle}>8. Future Faking</Text>
            <Text style={styles.tacticText}>
              Making elaborate promises about the future to keep you invested, but never following through.
            </Text>
            <Text style={styles.exampleLabel}>EXAMPLE:</Text>
            <Text style={styles.exampleText}>
              "When we move in together..." or "Once I get that job..." - promises that keep you holding on.
            </Text>
            <Text style={styles.responseLabel}>HOW TO RESPOND:</Text>
            <Text style={styles.responseText}>
              Judge them by their actions, not their promises. "Let's talk about this when it's actually happening."
            </Text>
          </View>
        </View>

        {/* Warning Signs */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ If you constantly feel anxious, walk on eggshells, or find yourself doing things you're uncomfortable 
            with to avoid conflict, you may be experiencing manipulation.
          </Text>
        </View>

        {/* Protecting Yourself */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Protect Yourself</Text>
          
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Trust Your Gut:</Text> If something feels wrong, it probably is. 
              Don't dismiss your instincts.
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Set Clear Boundaries:</Text> Be specific about what you will and 
              won't accept. Enforce consequences when boundaries are crossed.
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Document Patterns:</Text> Keep a record of incidents. Manipulators 
              rely on you forgetting or doubting what happened.
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Don't JADE:</Text> Don't Justify, Argue, Defend, or Explain your 
              boundaries. "No" is a complete sentence.
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Maintain Outside Relationships:</Text> Manipulators often try to 
              isolate you. Stay connected with friends and family.
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Take Your Time:</Text> Manipulators pressure you to make quick 
              decisions. "I need time to think about it" is always okay.
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Seek Support:</Text> Talk to a therapist or counselor who can help 
              you recognize patterns and develop strategies.
            </Text>
          </View>
        </View>

        {/* Remember */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remember</Text>
          <Text style={styles.description}>
            Manipulation is about control, not love. Healthy relationships involve mutual respect, open communication, 
            and honesty. You deserve to be with someone who values your autonomy, respects your boundaries, and doesn't 
            use emotional tactics to get their way.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

