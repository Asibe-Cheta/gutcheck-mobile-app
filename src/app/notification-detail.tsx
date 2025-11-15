/**
 * Notification Detail Screen
 * Shows AI-generated elaboration on a specific notification
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { aiService } from '@/lib/ai';

export default function NotificationDetailScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const params = useLocalSearchParams();
  
  const [elaboration, setElaboration] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateElaboration();
  }, []);

  const generateElaboration = async () => {
    try {
      setIsLoading(true);
      
      // Generate AI elaboration based on notification content
      const prompt = `I received this notification: "${params.title}: ${params.body}". 
      
Please elaborate on this message and provide:
1. What this notification means
2. Why it's important
3. How I can apply this to my life
4. Specific actionable steps I can take

Keep your response helpful, insightful, and practical.`;

      const result = await aiService.handleNotificationResponse(
        prompt,
        params.title as string,
        params.body as string,
        params.type as string
      );

      setElaboration(result.response);
    } catch (error) {
      console.error('Error generating elaboration:', error);
      setElaboration('Sorry, I couldn\'t generate an elaboration for this notification. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      flex: 1,
    },
    content: {
      flex: 1,
    },
    notificationCard: {
      margin: 16,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    notificationTitleContainer: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    notificationMeta: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    notificationBody: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
      marginTop: 8,
    },
    elaborationSection: {
      margin: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    aiIcon: {
      marginRight: 8,
    },
    elaborationCard: {
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    elaborationText: {
      fontSize: 15,
      color: colors.textPrimary,
      lineHeight: 24,
    },
    loadingContainer: {
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 14,
      color: colors.textSecondary,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Details</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Original Notification */}
        <View style={styles.notificationCard}>
          <View style={styles.notificationHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="notifications" size={24} color={colors.primary} />
            </View>
            <View style={styles.notificationTitleContainer}>
              <Text style={styles.notificationTitle}>{params.title}</Text>
              <Text style={styles.notificationMeta}>Received notification</Text>
            </View>
          </View>
          <Text style={styles.notificationBody}>{params.body}</Text>
        </View>

        {/* AI Elaboration */}
        <View style={styles.elaborationSection}>
          <View style={styles.sectionTitle}>
            <Ionicons name="sparkles" size={20} color={colors.primary} style={styles.aiIcon} />
            <Text style={styles.sectionTitle}>AI Insight</Text>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Generating insights...</Text>
            </View>
          ) : (
            <View style={styles.elaborationCard}>
              <Text style={styles.elaborationText}>{elaboration}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

