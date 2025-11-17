/**
 * Contact Screen
 * Provides contact information and links to reach the GutCheck team
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';

export default function ContactScreen() {
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
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Inter',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 32,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 12,
      fontFamily: 'Inter',
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 40,
      fontFamily: 'Inter',
      paddingHorizontal: 20,
    },
    contactCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    contactHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    contactIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    contactTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Inter',
    },
    contactValue: {
      fontSize: 16,
      color: colors.primary,
      fontFamily: 'Inter',
      marginBottom: 8,
    },
    contactDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      fontFamily: 'Inter',
    },
    footerNote: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 32,
      paddingHorizontal: 20,
      fontFamily: 'Inter',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon and intro */}
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubbles" size={64} color={colors.primary} />
        </View>

        <Text style={styles.title}>Get in Touch</Text>
        <Text style={styles.description}>
          Have questions, feedback, or need support? We're here to help! Reach out to us through any of the following channels.
        </Text>

        {/* Email Card */}
        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="mail" size={24} color={colors.primary} />
            </View>
            <Text style={styles.contactTitle}>Email</Text>
          </View>
          
          <Text style={styles.contactValue}>contact@mygutcheck.org</Text>
          <Text style={styles.contactDescription}>
            Send us an email for inquiries about the app, technical support, or general questions. We aim to respond within 24-48 hours.
          </Text>
        </View>

        {/* Website Card */}
        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="globe" size={24} color={colors.primary} />
            </View>
            <Text style={styles.contactTitle}>Website</Text>
          </View>
          
          <Text style={styles.contactValue}>https://mygutcheck.org</Text>
          <Text style={styles.contactDescription}>
            Visit our website for extensive resources, FAQs, blog posts, and learn more about how GutCheck can help you navigate relationships safely.
          </Text>
        </View>

        {/* Footer note */}
        <Text style={styles.footerNote}>
          Your feedback helps us improve GutCheck and make it more helpful for everyone. We'd love to hear from you!
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

