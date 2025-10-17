/**
 * Analysis Results Screen
 * Displays AI analysis results with patterns and recommendations
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '@/lib/theme';
import { useAnalysisStore } from '@/lib/stores/analysisStore';
import { useAuthStore } from '@/lib/stores/authStore';

export default function AnalysisResultsScreen() {
  const router = useRouter();
  const { currentAnalysis, patterns, isLoading, error } = useAnalysisStore();
  const { user } = useAuthStore();
  
  // Use the current analysis from the store
  const analysis = currentAnalysis;

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return theme.colors.warning;
      case 'high': return theme.colors.warning;
      case 'medium': return '#f59e0b';
      case 'low': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'warning';
      case 'high': return 'warning';
      case 'medium': return 'alert-circle';
      case 'low': return 'checkmark-circle';
      default: return 'information-circle';
    }
  };

  const getPatternIcon = (patternType: string) => {
    const iconMap: Record<string, string> = {
      'gaslighting': 'bulb',
      'love-bombing': 'heart',
      'isolation': 'people',
      'coercion': 'lock-closed',
      'negging': 'thumbs-down',
      'guilt-tripping': 'sad',
      'triangulation': 'git-network',
      'stonewalling': 'close-circle',
      'projection': 'eye',
      'darvo': 'refresh',
    };
    return iconMap[patternType] || 'help-circle';
  };

  const getPatternColor = (patternType: string) => {
    const colorMap: Record<string, string> = {
      'gaslighting': '#ef4444',
      'love-bombing': '#f59e0b',
      'isolation': '#8b5cf6',
      'coercion': '#dc2626',
      'negging': '#f97316',
      'guilt-tripping': '#ec4899',
      'triangulation': '#06b6d4',
      'stonewalling': '#6b7280',
      'projection': '#84cc16',
      'darvo': '#f43f5e',
    };
    return colorMap[patternType] || theme.colors.primary;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="analytics" size={48} color={theme.colors.primary} />
          <Text style={styles.loadingText}>Analyzing your interaction...</Text>
          <Text style={styles.loadingSubtext}>This may take a few moments</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.warning} />
          <Text style={styles.errorText}>Analysis Failed</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Analysis Results</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Risk Level Card */}
        <View style={styles.riskCard}>
          <View style={styles.riskHeader}>
            <Ionicons 
              name={getRiskIcon(analysis?.risk_level || 'low')} 
              size={32} 
              color={getRiskColor(analysis?.risk_level || 'low')} 
            />
            <View style={styles.riskInfo}>
              <Text style={styles.riskTitle}>
                {analysis?.risk_level?.toUpperCase() || 'LOW'} RISK
              </Text>
              <Text style={styles.riskSubtitle}>
                {analysis?.confidence_score ? `${Math.round(analysis.confidence_score * 100)}% confidence` : 'Analysis complete'}
              </Text>
            </View>
          </View>
          
          {analysis?.summary && (
            <Text style={styles.riskSummary}>{analysis.summary}</Text>
          )}
        </View>

        {/* Patterns Section */}
        {patterns.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detected Patterns</Text>
            {patterns.map((pattern, index) => (
              <View key={index} style={styles.patternCard}>
                <View style={styles.patternHeader}>
                  <View style={styles.patternIconContainer}>
                    <Ionicons 
                      name={getPatternIcon(pattern.type)} 
                      size={24} 
                      color={getPatternColor(pattern.type)} 
                    />
                  </View>
                  <View style={styles.patternInfo}>
                    <Text style={styles.patternTitle}>
                      {pattern.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                    <Text style={styles.patternConfidence}>
                      {Math.round(pattern.confidence * 100)}% confidence
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.patternDescription}>{pattern.description}</Text>
                
                {pattern.examples && pattern.examples.length > 0 && (
                  <View style={styles.patternExamples}>
                    <Text style={styles.examplesTitle}>Examples:</Text>
                    {pattern.examples.map((example, idx) => (
                      <Text key={idx} style={styles.exampleText}>• {example}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Recommendations Section */}
        {analysis?.recommendations && analysis.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            <View style={styles.recommendationsCard}>
              {analysis.recommendations.map((recommendation: string, index: number) => (
                <View key={index} style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                  <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Educational Content */}
        {analysis?.educational_content && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Learn More</Text>
            <View style={styles.educationCard}>
              <Text style={styles.educationContent}>{analysis.educational_content}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.primaryButton}>
            <Ionicons name="book" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Learn More</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="share" size={20} color={theme.colors.primary} />
            <Text style={styles.secondaryButtonText}>Share Insights</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glassBorder,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 16,
    fontFamily: 'Inter',
  },
  loadingSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    fontFamily: 'Inter',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 16,
    fontFamily: 'Inter',
  },
  errorSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  riskCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskInfo: {
    marginLeft: 12,
    flex: 1,
  },
  riskTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter',
  },
  riskSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontFamily: 'Inter',
  },
  riskSummary: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  patternCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  patternIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 209, 199, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patternInfo: {
    flex: 1,
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter',
  },
  patternConfidence: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontFamily: 'Inter',
  },
  patternDescription: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  patternExamples: {
    marginTop: 8,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  exampleText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
    fontFamily: 'Inter',
  },
  recommendationsCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  educationCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  educationContent: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
