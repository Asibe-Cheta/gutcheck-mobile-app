/**
 * Gaslighting Guide Screen
 * Comprehensive information about recognizing and dealing with gaslighting
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';

export default function GaslightingGuide() {
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
    warningBox: {
      backgroundColor: colors.error + '20',
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
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
    exampleBox: {
      backgroundColor: colors.border,
      padding: 15,
      borderRadius: 8,
      marginBottom: 15,
    },
    exampleLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 8,
    },
    exampleText: {
      fontSize: 14,
      fontStyle: 'italic',
      color: colors.text,
      lineHeight: 20,
    },
    actionBox: {
      backgroundColor: colors.success + '20',
      padding: 15,
      borderRadius: 8,
      marginTop: 10,
    },
    actionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.success,
      marginBottom: 8,
    },
    actionText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
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
        <Text style={styles.headerTitle}>Recognizing Gaslighting</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* What is Gaslighting */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What is Gaslighting?</Text>
          <Text style={styles.description}>
            Gaslighting is a form of psychological manipulation where someone makes you question your own reality, 
            memory, or perceptions. It's a deliberate tactic used to gain power and control over you by making you 
            doubt yourself and become dependent on their version of reality.
          </Text>
        </View>

        {/* Warning Signs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Gaslighting Phrases</Text>
          <Text style={styles.description}>
            These are typical things a gaslighter might say:
          </Text>
          
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>"That never happened."</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>"You're too sensitive."</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>"You're imagining things."</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>"You're crazy / You're overreacting."</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>"Everyone thinks you're wrong."</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>"You're remembering it wrong."</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>"I was just joking, why are you so serious?"</Text>
          </View>
        </View>

        {/* Real Examples */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Real-Life Examples</Text>
          
          <View style={styles.exampleBox}>
            <Text style={styles.exampleLabel}>EXAMPLE 1:</Text>
            <Text style={styles.exampleText}>
              They promise to pick you up at 7pm. At 7:30pm they arrive and say "I told you 7:30, you must have 
              misheard." Even though you're certain they said 7pm, they insist you're wrong until you start 
              doubting your own memory.
            </Text>
          </View>

          <View style={styles.exampleBox}>
            <Text style={styles.exampleLabel}>EXAMPLE 2:</Text>
            <Text style={styles.exampleText}>
              They make a hurtful comment about your appearance. When you express hurt, they say "I never said that, 
              you're making things up" or "It was obviously a joke, you're too sensitive."
            </Text>
          </View>

          <View style={styles.exampleBox}>
            <Text style={styles.exampleLabel}>EXAMPLE 3:</Text>
            <Text style={styles.exampleText}>
              You catch them lying about where they were. They flip it around: "You're so paranoid and jealous. 
              This is why I don't tell you things - you always twist everything."
            </Text>
          </View>
        </View>

        {/* Warning Box */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ If you constantly feel confused, question your own judgment, or find yourself apologizing for things 
            that aren't your fault, you may be experiencing gaslighting.
          </Text>
        </View>

        {/* Signs You're Being Gaslit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signs You're Being Gaslit</Text>
          
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>You constantly second-guess yourself</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>You feel confused and question your reality</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>You apologize all the time, even for small things</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>You make excuses for their behavior to others</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>You feel like everything is your fault</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>You've lost confidence and self-esteem</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>You wonder if you're "too sensitive"</Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>You feel isolated from friends and family</Text>
          </View>
        </View>

        {/* What To Do */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You Can Do</Text>
          
          <View style={styles.actionBox}>
            <Text style={styles.actionTitle}>1. Trust Your Reality</Text>
            <Text style={styles.actionText}>
              Keep a journal or notes of events, conversations, and promises. This helps you validate your own 
              memory and reality when someone tries to deny it.
            </Text>
          </View>

          <View style={styles.actionBox}>
            <Text style={styles.actionTitle}>2. Seek Outside Perspective</Text>
            <Text style={styles.actionText}>
              Talk to trusted friends or family about what's happening. Gaslighters often isolate you - reconnecting 
              with others helps you see the situation clearly.
            </Text>
          </View>

          <View style={styles.actionBox}>
            <Text style={styles.actionTitle}>3. Set Boundaries</Text>
            <Text style={styles.actionText}>
              When they deny something, calmly state your perspective once, then disengage: "I remember it 
              differently" or "I'm not going to argue about what happened."
            </Text>
          </View>

          <View style={styles.actionBox}>
            <Text style={styles.actionTitle}>4. Don't Argue About Reality</Text>
            <Text style={styles.actionText}>
              You can't win an argument with a gaslighter. They're not trying to find truth - they're trying to 
              control you. State your truth once, then stop engaging.
            </Text>
          </View>

          <View style={styles.actionBox}>
            <Text style={styles.actionTitle}>5. Consider Professional Help</Text>
            <Text style={styles.actionText}>
              A therapist can help you rebuild your sense of reality and self-trust. They can also help you decide 
              whether to stay in the relationship or leave safely.
            </Text>
          </View>
        </View>

        {/* Remember */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remember</Text>
          <Text style={styles.description}>
            Gaslighting is abuse. It's not about misunderstandings or different perspectives - it's about someone 
            deliberately undermining your reality to control you. You're not crazy, too sensitive, or imagining things. 
            Your feelings and perceptions are valid.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

