/**
 * Upgrade Screen
 * Custom design based on provided HTML
 * Premium subscription and pricing
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { privacyPaymentService } from '@/lib/payment';

const { width } = Dimensions.get('window');

// Comparison Table Component
const ComparisonTable = () => {
  const features = [
    { name: 'Interactions', free: '10', premium: 'unlimited' },
    { name: 'Analysis', free: 'Limited', premium: 'unlimited' },
    { name: 'Reports', free: 'Limited', premium: 'unlimited' },
    { name: 'Support', free: 'Email', premium: 'Priority' },
  ];

  return (
    <View style={styles.comparisonCard}>
      <View style={styles.comparisonHeader}>
        <View style={styles.comparisonColumn}>
          <Text style={styles.comparisonLabel}></Text>
        </View>
        <View style={styles.comparisonColumn}>
          <Text style={styles.comparisonTitle}>Free</Text>
        </View>
        <View style={styles.comparisonColumn}>
          <Text style={[styles.comparisonTitle, { color: theme.colors.primary }]}>Premium</Text>
        </View>
      </View>
      
      {features.map((feature, index) => (
        <View key={index} style={styles.comparisonRow}>
          <View style={styles.comparisonColumn}>
            <Text style={styles.featureName}>{feature.name}</Text>
          </View>
          <View style={styles.comparisonColumn}>
            <Text style={styles.featureValue}>{feature.free}</Text>
          </View>
          <View style={styles.comparisonColumn}>
            {feature.premium === 'unlimited' ? (
              <View style={styles.unlimitedIcon}>
                <Ionicons name="infinite" size={20} color={theme.colors.success} />
              </View>
            ) : (
              <Text style={[styles.featureValue, { color: theme.colors.primary }]}>
                {feature.premium}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

// Security Features Component
const SecurityFeatures = () => (
  <View style={styles.securitySection}>
    <Text style={styles.securityText}>Join 1000+ users who feel safer</Text>
    <View style={styles.securityBadges}>
      <View style={styles.securityBadge}>
        <Ionicons name="shield-checkmark" size={16} color={theme.colors.textSecondary} />
        <Text style={styles.securityBadgeText}>End-to-End Encrypted</Text>
      </View>
      <View style={styles.securityBadge}>
        <Ionicons name="lock-closed" size={16} color={theme.colors.textSecondary} />
        <Text style={styles.securityBadgeText}>100% Private</Text>
      </View>
    </View>
  </View>
);

export default function UpgradeScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartTrial = async () => {
    setIsLoading(true);
    try {
      // Generate anonymous user ID for this session
      const anonymousUserId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create privacy-focused payment session
      const { sessionId, error } = await privacyPaymentService.createAnonymousPaymentSession(
        anonymousUserId,
        9.47, // £9.47 per month
        'GBP'
      );

      if (error) {
        Alert.alert('Payment Error', error);
        return;
      }

      // Show privacy message
      Alert.alert(
        'Privacy Protected Payment',
        `${privacyPaymentService.getPrivacyMessage()}\n\nYour payment information is processed separately from your analysis data.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => {
              // In a real app, this would redirect to Stripe Checkout
              Alert.alert('Payment Started', 'Redirecting to secure payment...');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to start payment process');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    // TODO: Navigate back
    console.log('Navigate back');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Upgrade your protection</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pricing Section */}
        <View style={styles.pricingSection}>
          <Text style={styles.pricingSubtitle}>Unlimited peace of mind for</Text>
          <Text style={styles.pricingAmount}>33p a day</Text>
        </View>

        {/* Comparison Table */}
        <ComparisonTable />

        {/* Subscription Details */}
        <View style={styles.subscriptionSection}>
          <Text style={styles.subscriptionPrice}>
            £9.99<span style={styles.subscriptionPeriod}>/month</span>
          </Text>
          <TouchableOpacity 
            style={styles.trialButton}
            onPress={handleStartTrial}
            activeOpacity={0.8}
          >
            <Text style={styles.trialButtonText}>Start 7-day free trial</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Section */}
        <View style={styles.privacySection}>
          <View style={styles.privacyHeader}>
            <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
            <Text style={styles.privacyTitle}>Privacy Protected Payment</Text>
          </View>
          <Text style={styles.privacyText}>
            {privacyPaymentService.getPrivacyMessage()}
          </Text>
          <View style={styles.privacyFeatures}>
            <View style={styles.privacyFeature}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
              <Text style={styles.privacyFeatureText}>Payment data never linked to analysis content</Text>
            </View>
            <View style={styles.privacyFeature}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
              <Text style={styles.privacyFeatureText}>Anonymous billing descriptions</Text>
            </View>
            <View style={styles.privacyFeature}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
              <Text style={styles.privacyFeatureText}>Secure payment processing</Text>
            </View>
          </View>
        </View>

        {/* Security Features */}
        <SecurityFeatures />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <View style={styles.navContainer}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={24} color={theme.colors.textSecondary} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="time" size={24} color={theme.colors.textSecondary} />
            <Text style={styles.navLabel}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="book" size={24} color={theme.colors.textSecondary} />
            <Text style={styles.navLabel}>Resources</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="diamond" size={24} color={theme.colors.primary} />
            <Text style={[styles.navLabel, { color: theme.colors.primary }]}>Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingVertical: 16, // h-16
    paddingHorizontal: 16, // px-4
    backgroundColor: `${theme.colors.background}CC`, // backdrop-blur effect
  },
  backButton: {
    padding: 8, // p-2
    marginLeft: -8, // -ml-2
  },
  title: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: theme.colors.textPrimary,
    fontFamily: 'Inter',
  },
  headerSpacer: {
    width: 32, // w-8
  },
  content: {
    flex: 1,
    paddingHorizontal: 16, // px-4
    paddingTop: 24, // py-6
    paddingBottom: 96, // pb-24
  },
  // Pricing Section
  pricingSection: {
    alignItems: 'center',
    marginBottom: 40, // mb-10
  },
  pricingSubtitle: {
    fontSize: 18, // text-lg
    color: theme.colors.textSecondary,
    fontFamily: 'Inter',
  },
  pricingAmount: {
    fontSize: 36, // text-4xl
    fontWeight: '700', // font-bold
    color: theme.colors.primary,
    marginTop: 4, // mt-1
    fontFamily: 'Inter',
  },
  // Comparison Table
  comparisonCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8, // rounded-lg
    padding: 24, // p-6
    marginBottom: 40, // mb-10
  },
  comparisonHeader: {
    flexDirection: 'row',
    marginBottom: 16, // gap-y-4
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8, // gap-y-4
  },
  comparisonColumn: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    fontFamily: 'Inter',
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    fontFamily: 'Inter',
  },
  featureName: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontFamily: 'Inter',
  },
  featureValue: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontFamily: 'Inter',
  },
  unlimitedIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Subscription Section
  subscriptionSection: {
    alignItems: 'center',
    marginBottom: 24, // mb-6
  },
  subscriptionPrice: {
    fontSize: 48, // text-5xl
    fontWeight: '700', // font-bold
    color: theme.colors.textPrimary,
    marginBottom: 8, // mb-2
    fontFamily: 'Inter',
  },
  subscriptionPeriod: {
    fontSize: 20, // text-xl
    fontWeight: '500', // font-medium
    color: theme.colors.textSecondary,
    fontFamily: 'Inter',
  },
  trialButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16, // py-4
    borderRadius: 8, // rounded-lg
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  trialButtonText: {
    color: theme.colors.background,
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    fontFamily: 'Inter',
  },
  // Privacy Section
  privacySection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter',
  },
  privacyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  privacyFeatures: {
    gap: 8,
  },
  privacyFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyFeatureText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: 'Inter',
  },
  // Security Section
  securitySection: {
    alignItems: 'center',
    gap: 16, // space-y-4
  },
  securityText: {
    fontSize: 14, // text-sm
    color: theme.colors.textSecondary,
    fontFamily: 'Inter',
  },
  securityBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16, // space-x-4
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // space-x-1
  },
  securityBadgeText: {
    fontSize: 12, // text-xs
    color: theme.colors.textSecondary,
    fontFamily: 'Inter',
  },
  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: `${theme.colors.surface}CC`, // backdrop-blur effect
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)', // border-white/10
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 80, // h-20
    paddingHorizontal: 16, // px-4
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4, // space-y-1
  },
  navLabel: {
    fontSize: 12, // text-xs
    fontWeight: '500', // font-medium
    color: theme.colors.textSecondary,
    fontFamily: 'Inter',
  },
});
