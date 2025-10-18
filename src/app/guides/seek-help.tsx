/**
 * When to Seek Help Guide Screen
 * Comprehensive information about recognizing when professional support is needed
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { HELPLINES } from '@/lib/helplineService';

export default function SeekHelpGuide() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const handleCall = (name: string, number: string) => {
    const dialNumber = number.replace(/\s/g, '');
    Alert.alert(
      `Call ${name}`,
      `This will dial ${number}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${dialNumber}`) }
      ]
    );
  };

  const formatPhoneNumber = (number: string): string => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.length === 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    if (cleaned.length === 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length === 11) return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

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
    emergencyBox: {
      backgroundColor: colors.error + '20',
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
    },
    emergencyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.error,
      marginBottom: 8,
    },
    emergencyText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 12,
    },
    emergencyNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.error,
      textAlign: 'center',
      marginTop: 8,
    },
    signCard: {
      backgroundColor: colors.border,
      padding: 15,
      borderRadius: 8,
      marginBottom: 15,
    },
    signTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.warning,
      marginBottom: 8,
    },
    signText: {
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
    helplineCard: {
      backgroundColor: colors.border,
      padding: 15,
      borderRadius: 8,
      marginBottom: 12,
    },
    helplineHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    helplineName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    helplineNumber: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    helplineDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 8,
    },
    helplineHours: {
      fontSize: 12,
      color: colors.success,
      fontWeight: '600',
    },
    callButton: {
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    callButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
      marginLeft: 8,
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
        <Text style={styles.headerTitle}>When to Seek Help</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Emergency */}
        <View style={styles.emergencyBox}>
          <Text style={styles.emergencyTitle}>🚨 IMMEDIATE DANGER</Text>
          <Text style={styles.emergencyText}>
            If you or someone else is in immediate danger of harm, call emergency services right now:
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL('tel:999')}>
            <Text style={styles.emergencyNumber}>999</Text>
          </TouchableOpacity>
          <Text style={styles.emergencyText} style={{ marginTop: 12, fontSize: 13 }}>
            This includes situations involving violence, weapons, threats of suicide, or any immediate physical danger.
          </Text>
        </View>

        {/* When to Seek Help */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signs You Need Professional Support</Text>
          <Text style={styles.description}>
            It's normal to feel uncertain about whether you need help. Here are clear signs that it's time to reach 
            out to a professional:
          </Text>

          <View style={styles.signCard}>
            <Text style={styles.signTitle}>⚠️ Mental Health Crisis</Text>
            <Text style={styles.signText}>
              • Thoughts of suicide or self-harm{'\n'}
              • Feeling hopeless or worthless{'\n'}
              • Unable to cope with daily life{'\n'}
              • Severe anxiety or panic attacks{'\n'}
              • Substance abuse to cope{'\n'}
              • Disconnection from reality
            </Text>
          </View>

          <View style={styles.signCard}>
            <Text style={styles.signTitle}>⚠️ Ongoing Abuse</Text>
            <Text style={styles.signText}>
              • Physical violence (hitting, pushing, restraining){'\n'}
              • Sexual coercion or assault{'\n'}
              • Constant fear of your partner{'\n'}
              • Being isolated from friends and family{'\n'}
              • Financial control or exploitation{'\n'}
              • Threats against you or loved ones
            </Text>
          </View>

          <View style={styles.signCard}>
            <Text style={styles.signTitle}>⚠️ Emotional Toll</Text>
            <Text style={styles.signText}>
              • Constantly walking on eggshells{'\n'}
              • Loss of self-esteem or identity{'\n'}
              • Severe anxiety about the relationship{'\n'}
              • Depression or feeling numb{'\n'}
              • Can't sleep or sleeping too much{'\n'}
              • Physical symptoms (headaches, stomach issues)
            </Text>
          </View>

          <View style={styles.signCard}>
            <Text style={styles.signTitle}>⚠️ Isolation & Control</Text>
            <Text style={styles.signText}>
              • Prevented from seeing friends or family{'\n'}
              • Monitored constantly (phone, location, social media){'\n'}
              • Not allowed to work or study{'\n'}
              • No access to money or resources{'\n'}
              • Decisions made for you{'\n'}
              • Fear of leaving or consequences if you do
            </Text>
          </View>
        </View>

        {/* It's Okay to Ask for Help */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            💙 You don't have to wait until things are "bad enough." If you're questioning whether you need help, 
            that itself is a sign that reaching out could be beneficial. Early support can prevent situations from 
            escalating.
          </Text>
        </View>

        {/* Types of Help Available */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Types of Professional Help</Text>
          
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Helplines:</Text> Immediate phone support, often available 24/7, 
              completely confidential
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Therapist/Counselor:</Text> Regular sessions to process emotions, 
              develop coping strategies, and work through trauma
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Domestic Abuse Services:</Text> Specialized support including safety 
              planning, shelter, legal advocacy, and counseling
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>GP/Doctor:</Text> Can assess mental health, prescribe medication if 
              needed, and refer to specialists
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Support Groups:</Text> Connect with others who've had similar 
              experiences, share strategies, reduce isolation
            </Text>
          </View>
        </View>

        {/* Helplines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UK Helplines - Available Now</Text>
          
          {HELPLINES.slice(0, 4).map((helpline, index) => (
            <View key={index} style={styles.helplineCard}>
              <View style={styles.helplineHeader}>
                <Text style={styles.helplineName}>{helpline.name}</Text>
                <Text style={styles.helplineNumber}>{formatPhoneNumber(helpline.number)}</Text>
              </View>
              <Text style={styles.helplineDescription}>{helpline.description}</Text>
              <Text style={styles.helplineHours}>📞 {helpline.availableHours}</Text>
              <TouchableOpacity 
                style={styles.callButton}
                onPress={() => handleCall(helpline.name, formatPhoneNumber(helpline.number))}
              >
                <Ionicons name="call" size={18} color="#FFFFFF" />
                <Text style={styles.callButtonText}>Call Now</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* What to Expect */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What to Expect When You Call</Text>
          
          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>It's Confidential:</Text> What you share stays private (unless you or 
              someone else is in immediate danger)
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>No Pressure:</Text> You're in control. They won't tell you what to do 
              or force you to leave a relationship
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Trained Listeners:</Text> They're experienced in supporting people in 
              difficult situations and won't judge you
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Practical Support:</Text> They can help with safety planning, next 
              steps, and connecting you with other services
            </Text>
          </View>

          <View style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>
              <Text style={{ fontWeight: '700' }}>Call Anytime:</Text> Even if you're not sure what to say, or if you 
              just need someone to listen - that's what they're there for
            </Text>
          </View>
        </View>

        {/* Remember */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remember</Text>
          <Text style={styles.description}>
            Asking for help is a sign of strength, not weakness. You deserve support, and there are people ready to 
            help you right now. You don't have to have everything figured out before you reach out - that's what these 
            services are for. Even if you're not ready to take action yet, talking to someone can help you see your 
            situation more clearly and explore your options.
          </Text>
          <Text style={styles.description}>
            Your safety and well-being matter. You're not alone, and you're not being dramatic or overreacting. If 
            something feels wrong, trust that feeling and reach out.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

