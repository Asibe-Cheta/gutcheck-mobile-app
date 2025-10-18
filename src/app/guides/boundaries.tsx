/**
 * Boundaries Guide Screen
 * Comprehensive information about setting and maintaining healthy boundaries
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';

export default function BoundariesGuide() {
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
    typeCard: {
      backgroundColor: colors.border,
      padding: 15,
      borderRadius: 8,
      marginBottom: 15,
    },
    typeTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 8,
    },
    typeText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 8,
    },
    exampleLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.success,
      marginTop: 8,
      marginBottom: 4,
    },
    exampleText: {
      fontSize: 13,
      fontStyle: 'italic',
      color: colors.textSecondary,
      lineHeight: 18,
    },
    scriptBox: {
      backgroundColor: colors.primary + '15',
      padding: 15,
      borderRadius: 8,
      marginBottom: 15,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    scriptLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 8,
    },
    scriptText: {
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
        <Text style={styles.headerTitle}>Setting Boundaries</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Are Boundaries?</Text>
          <Text style={styles.description}>
            Boundaries are the limits you set to protect your physical, emotional, and mental well-being. They define 
            where you end and others begin - what you're comfortable with, what you'll accept, and what you won't tolerate. 
            Healthy boundaries are essential for healthy relationships.
          </Text>
          <Text style={styles.description}>
            Having boundaries doesn't make you selfish or mean. It makes you self-aware and self-respecting.
          </Text>
        </View>

        {/* Types of Boundaries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Types of Boundaries</Text>

          <View style={styles.typeCard}>
            <Text style={styles.typeTitle}>Physical Boundaries</Text>
            <Text style={styles.typeText}>
              Your personal space, privacy, and body. This includes who can touch you, when, and how.
            </Text>
            <Text style={styles.exampleLabel}>EXAMPLES:</Text>
            <Text style={styles.exampleText}>
              • "I don't like being hugged without asking first."{'\n'}
              • "Please knock before entering my room."{'\n'}
              • "I need personal space when I'm upset."
            </Text>
          </View>

          <View style={styles.typeCard}>
            <Text style={styles.typeTitle}>Emotional Boundaries</Text>
            <Text style={styles.typeText}>
              Your feelings and emotional energy. Separating your emotions from others' and not taking responsibility 
              for how others feel.
            </Text>
            <Text style={styles.exampleLabel}>EXAMPLES:</Text>
            <Text style={styles.exampleText}>
              • "I care about you, but I can't fix your problems."{'\n'}
              • "Your anger is not my responsibility to manage."{'\n'}
              • "I need time to process my feelings before discussing this."
            </Text>
          </View>

          <View style={styles.typeCard}>
            <Text style={styles.typeTitle}>Time Boundaries</Text>
            <Text style={styles.typeText}>
              How you spend your time and who you spend it with. Protecting your schedule and priorities.
            </Text>
            <Text style={styles.exampleLabel}>EXAMPLES:</Text>
            <Text style={styles.exampleText}>
              • "I need one evening a week for myself."{'\n'}
              • "I can't talk right now, can we schedule a time?"{'\n'}
              • "I need to leave by 10pm on weeknights."
            </Text>
          </View>

          <View style={styles.typeCard}>
            <Text style={styles.typeTitle}>Digital Boundaries</Text>
            <Text style={styles.typeText}>
              Your online presence, privacy, and availability. Control over your devices and social media.
            </Text>
            <Text style={styles.exampleLabel}>EXAMPLES:</Text>
            <Text style={styles.exampleText}>
              • "I don't share my passwords."{'\n'}
              • "I need to turn my phone off after 9pm."{'\n'}
              • "I won't send intimate photos."
            </Text>
          </View>

          <View style={styles.typeCard}>
            <Text style={styles.typeTitle}>Material Boundaries</Text>
            <Text style={styles.typeText}>
              Your possessions, money, and resources. What you're willing to share or lend.
            </Text>
            <Text style={styles.exampleLabel}>EXAMPLES:</Text>
            <Text style={styles.exampleText}>
              • "I don't lend money to friends."{'\n'}
              • "Please ask before borrowing my things."{'\n'}
              • "I can't afford to pay for both of us."
            </Text>
          </View>
        </View>

        {/* How to Set Boundaries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Set Boundaries</Text>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Be Clear and Specific:</Text> Vague boundaries are hard to enforce. 
              "I need space" vs "I need 30 minutes alone when I get home from work."
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Use "I" Statements:</Text> Focus on your needs, not their behavior. 
              "I feel uncomfortable when..." vs "You always..."
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Be Consistent:</Text> If you enforce a boundary sometimes but not 
              others, people won't take it seriously.
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Don't Apologize:</Text> Your boundaries aren't something to apologize 
              for. "I can't do that" is better than "I'm so sorry, but..."
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Expect Pushback:</Text> People who benefited from your lack of 
              boundaries will resist. That's normal.
            </Text>
          </View>
        </View>

        {/* Boundary Scripts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Boundary Scripts</Text>
          <Text style={styles.description}>Here are specific phrases you can use:</Text>

          <View style={styles.scriptBox}>
            <Text style={styles.scriptLabel}>When Someone Pushes Back:</Text>
            <Text style={styles.scriptText}>
              • "I understand you're disappointed, but this is what works for me."{'\n'}
              • "This isn't up for negotiation."{'\n'}
              • "I've made my decision."
            </Text>
          </View>

          <View style={styles.scriptBox}>
            <Text style={styles.scriptLabel}>When You Need Time:</Text>
            <Text style={styles.scriptText}>
              • "I need to think about this before giving you an answer."{'\n'}
              • "Can we revisit this conversation tomorrow?"{'\n'}
              • "I'm not ready to discuss this right now."
            </Text>
          </View>

          <View style={styles.scriptBox}>
            <Text style={styles.scriptLabel}>When Saying No:</Text>
            <Text style={styles.scriptText}>
              • "No, I can't do that."{'\n'}
              • "That doesn't work for me."{'\n'}
              • "I'm not comfortable with that."
            </Text>
          </View>

          <View style={styles.scriptBox}>
            <Text style={styles.scriptLabel}>When Enforcing Consequences:</Text>
            <Text style={styles.scriptText}>
              • "I told you I would leave if you raised your voice. I'm leaving now."{'\n'}
              • "If you continue [behavior], I will [consequence]."{'\n'}
              • "I won't continue this conversation if you speak to me that way."
            </Text>
          </View>
        </View>

        {/* Warning Signs */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ RED FLAGS: If someone consistently ignores your boundaries, gets angry when you set them, or makes you 
            feel guilty for having them, this is a serious warning sign. Healthy people respect boundaries.
          </Text>
        </View>

        {/* When Boundaries Are Violated */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When Boundaries Are Violated</Text>
          
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Restate Clearly:</Text> "I already said I'm not comfortable with that."
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Enforce Consequences:</Text> Follow through with what you said would 
              happen. If you don't, your boundaries become empty threats.
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Remove Yourself:</Text> If someone repeatedly violates your boundaries, 
              you may need to reduce or end contact.
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Don't Argue:</Text> You don't need to justify your boundaries. 
              "Because that's what I need" is a complete answer.
            </Text>
          </View>
        </View>

        {/* Remember */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remember</Text>
          <Text style={styles.description}>
            Setting boundaries is an act of self-respect, not selfishness. You're teaching people how to treat you. 
            The right people will respect your boundaries - those are the people worth keeping in your life. Anyone who 
            consistently violates your boundaries or makes you feel bad for having them is showing you who they are. 
            Believe them.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

