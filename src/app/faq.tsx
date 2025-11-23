/**
 * FAQ Screen
 * Frequently Asked Questions about GutCheck
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';

interface FAQItem {
  question: string;
  answer: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function FAQScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'What is GutCheck?',
      answer: 'GutCheck is your confidential companion for navigating relationships, social dynamics, and difficult situations. We help you recognize red flags, understand patterns, and stay safe. Everything is anonymous and secure.',
      icon: 'help-circle',
    },
    {
      question: 'How does the Panic Button work?',
      answer: 'The Panic Button is a safety feature designed to help you quickly hide the app. Enable it in Settings, then triple-tap anywhere on the screen to instantly exit to a calculator disguise. This is perfect if you\'re in an unsafe situation and need to hide the app quickly. To return to GutCheck, simply navigate back from the calculator.',
      icon: 'alert-circle',
    },
    {
      question: 'Is my data private and secure?',
      answer: 'Yes! All your conversations are stored locally on your device and are never shared with anyone. We don\'t track your location, show ads, or sell your data. You can export or delete all your data anytime from the Settings screen. Your privacy is our top priority.',
      icon: 'lock-closed',
    },
    {
      question: 'How does the AI analysis work?',
      answer: 'Our AI analyzes your situations to identify patterns, red flags, and concerning behaviors. It provides direct, honest guidance like a trusted friend who always tells you the truth. The AI is trained to recognize manipulation, gaslighting, abuse, and other harmful patterns.',
      icon: 'analytics',
    },
    {
      question: 'Can I export my chat history?',
      answer: 'Yes! You can export any conversation as a PDF from the History tab. Just tap the document icon next to any chat. The PDF includes timestamps and can serve as evidence if needed. This feature is helpful for documentation purposes.',
      icon: 'document-text',
    },
    {
      question: 'What are the daily notifications?',
      answer: 'GutCheck sends supportive daily notifications with insights about relationships, self-worth, and safety. These are designed to remind you that you deserve respect and healthy relationships. You can tap any notification to get AI elaboration and start a conversation.',
      icon: 'notifications',
    },
    {
      question: 'How do I use the app anonymously?',
      answer: 'You can create an account with just a username and PIN - no email or phone number required. Or choose anonymous mode where we automatically assign you a username. Either way, your identity remains completely private.',
      icon: 'eye-off',
    },
    {
      question: 'What if I\'m in immediate danger?',
      answer: 'If you\'re in immediate danger, use the Panic Button (triple-tap) to hide the app, then call emergency services (911 in US, 999 in UK, etc.). You can also access crisis helplines from the Resources tab for your country.',
      icon: 'warning',
    },
    {
      question: 'Can I delete my data?',
      answer: 'Yes! Go to Settings > Privacy > Clear All Data to permanently delete all your conversations and analysis from your device. This action cannot be undone. You can also selectively delete individual chats from the History tab.',
      icon: 'trash',
    },
    {
      question: 'How do I contact support?',
      answer: 'You can reach us at contact@mygutcheck.org for any questions, feedback, or technical support. Visit https://mygutcheck.org for extensive resources, blog posts, and more information about staying safe in relationships.',
      icon: 'mail',
    },
  ];

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.glassBorder,
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    content: {
      flex: 1,
    },
    intro: {
      padding: 20,
      backgroundColor: colors.secondaryDark,
      borderBottomWidth: 1,
      borderBottomColor: colors.glassBorder,
    },
    introTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    introText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    faqItem: {
      borderBottomWidth: 1,
      borderBottomColor: colors.glassBorder,
    },
    faqHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
    },
    faqIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.glassLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    faqQuestionContainer: {
      flex: 1,
      marginRight: 12,
    },
    faqQuestion: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    chevron: {
      marginLeft: 'auto',
    },
    faqAnswer: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      paddingLeft: 76,
    },
    faqAnswerText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    footer: {
      padding: 20,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & FAQs</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Intro */}
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Frequently Asked Questions</Text>
          <Text style={styles.introText}>
            Find answers to common questions about GutCheck, safety features, privacy, and more.
          </Text>
        </View>

        {/* FAQ Items */}
        {faqs.map((faq, index) => (
          <View key={index} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqHeader}
              onPress={() => toggleExpand(index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqIconContainer}>
                <Ionicons name={faq.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.faqQuestionContainer}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
              </View>
              <Ionicons
                name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
                style={styles.chevron}
              />
            </TouchableOpacity>
            {expandedIndex === index && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>{faq.answer}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Still have questions?{'\n'}
            Contact us at contact@mygutcheck.org or visit https://mygutcheck.org for more resources.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

