/**
 * Subscription Screen
 * Premium subscription management with Apple In-App Purchases
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscriptionStore } from '@/lib/stores/subscriptionStore';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  productId: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  
  const { 
    plans, 
    currentPlan, 
    subscription, 
    isLifetimePro,
    lifetimeProCount,
    isLoading, 
    error,
    loadPlans,
    loadSubscription,
    checkLifetimePro,
    subscribeToPlan,
    restorePurchases,
    clearError
  } = useSubscriptionStore();

  // Load plans and subscription on mount
  useEffect(() => {
    loadPlans();
    loadSubscription();
    
    // Check for lifetime pro status
    const checkLifetimeProStatus = async () => {
      const userId = await AsyncStorage.getItem('user_id');
      if (userId) {
        await checkLifetimePro(userId);
      }
    };
    
    checkLifetimeProStatus();
  }, []);

  const handleSubscribe = async (planId: string) => {
    try {
      const result = await subscribeToPlan(planId);
      
      if (result.success) {
        Alert.alert(
          '🎉 Subscription Active!',
          'Welcome to Premium! You now have access to all premium features.',
          [
            {
              text: 'Continue to App',
              onPress: () => router.push('/(tabs)')
            }
          ]
        );
      } else {
        Alert.alert('Subscription Failed', result.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
    }
  };

  const handleRestorePurchases = async () => {
    try {
      const result = await restorePurchases();
      
      if (result.success) {
        if (subscription) {
          Alert.alert('Purchases Restored', 'Your previous purchases have been restored.');
        } else {
          Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
        }
      } else {
        Alert.alert('Restore Failed', result.error || 'Failed to restore purchases. Please try again.');
      }
    } catch (error) {
      console.error('Restore purchases error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'To cancel your subscription, please go to your Apple ID settings > Subscriptions. You\'ll keep access until the end of your billing period.',
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isCurrentPlan = currentPlan?.id === plan.id;
    const isPopular = plan.popular;
    
    // Calculate daily cost
    const dailyCost = plan.interval === 'month' 
      ? (plan.price / 30).toFixed(2)  // £9.99 / 30 = £0.33 per day
      : (plan.price / 365).toFixed(2); // £99.99 / 365 = £0.27 per day

    return (
      <View key={plan.id} style={[
        styles.planCard,
        isPopular && styles.popularPlan,
        isCurrentPlan && styles.currentPlan
      ]}>
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>Most Popular</Text>
          </View>
        )}
        
        {isCurrentPlan && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Current Plan</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          
          {/* Prominent Daily Cost */}
          <View style={styles.dailyCostContainer}>
            <Text style={styles.dailyCostLabel}>Just</Text>
            <Text style={styles.dailyCost}>{dailyCost}p</Text>
            <Text style={styles.dailyCostLabel}>a day</Text>
          </View>
          
          {/* Less Prominent Actual Price */}
          <View style={styles.actualPriceContainer}>
            <Text style={styles.actualPrice}>£{plan.price.toFixed(2)}</Text>
            <Text style={styles.actualPeriod}>/{plan.interval}</Text>
          </View>
          
          <Text style={styles.planDescription}>{plan.description}</Text>
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.subscribeButton,
            isCurrentPlan && styles.currentButton,
            isPopular && styles.popularButton
          ]}
          onPress={() => handleSubscribe(plan.id)}
          disabled={isLoading || isCurrentPlan}
        >
          <Text style={[
            styles.subscribeButtonText,
            isCurrentPlan && styles.currentButtonText
          ]}>
            {isCurrentPlan ? 'Current Plan' : isLoading ? 'Processing...' : 'Subscribe'}
          </Text>
        </TouchableOpacity>
      </View>
    );
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
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    headerSpacer: {
      width: 40,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    statusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusText: {
      flex: 1,
      marginLeft: 12,
    },
    statusTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    statusDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    cancelButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.error,
      borderRadius: 6,
    },
    cancelButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '500',
    },
    plansContainer: {
      gap: 16,
    },
    planCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      position: 'relative',
    },
    popularPlan: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    currentPlan: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
    },
    popularBadge: {
      position: 'absolute',
      top: -8,
      left: 24,
      right: 24,
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      alignItems: 'center',
    },
    popularBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    currentBadge: {
      position: 'absolute',
      top: -8,
      left: 24,
      right: 24,
      backgroundColor: colors.success,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      alignItems: 'center',
    },
    currentBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    planHeader: {
      alignItems: 'center',
      marginBottom: 24,
    },
    planName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    planDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 12,
      textAlign: 'center',
    },
    dailyCostContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      marginTop: 16,
      marginBottom: 8,
    },
    dailyCostLabel: {
      fontSize: 20,
      color: colors.textPrimary,
      fontWeight: '500',
      marginHorizontal: 4,
    },
    dailyCost: {
      fontSize: 48,
      fontWeight: 'bold',
      color: colors.primary,
      marginHorizontal: 2,
    },
    actualPriceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      marginBottom: 4,
    },
    actualPrice: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    actualPeriod: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 2,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 8,
    },
    price: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.primary,
    },
    period: {
      fontSize: 18,
      color: colors.primary,
      marginLeft: 4,
      fontWeight: '600',
    },
    featuresContainer: {
      marginBottom: 24,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    featureText: {
      fontSize: 16,
      color: colors.textPrimary,
      marginLeft: 12,
      flex: 1,
    },
    subscribeButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    popularButton: {
      backgroundColor: colors.primary,
    },
    currentButton: {
      backgroundColor: colors.success,
    },
    subscribeButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    currentButtonText: {
      color: '#FFFFFF',
    },
    paymentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginTop: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    paymentInfoText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 12,
      flex: 1,
    },
    restoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      marginTop: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    restoreButtonText: {
      fontSize: 16,
      color: colors.primary,
      marginLeft: 8,
      fontWeight: '600',
    },
    lifetimeProInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '10',
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    lifetimeProText: {
      fontSize: 16,
      color: colors.textPrimary,
      marginLeft: 12,
      flex: 1,
      fontWeight: '500',
    },
    faqSection: {
      marginTop: 32,
      marginBottom: 20,
    },
    faqTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 20,
    },
    faqItem: {
      marginBottom: 20,
    },
    faqQuestion: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    faqAnswer: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
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
        <Text style={styles.title}>Subscription</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Plan Status */}
        {(subscription || isLifetimePro) && (
          <View style={styles.statusCard}>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>
                {isLifetimePro ? 'Lifetime Pro Active' : 'Premium Active'}
              </Text>
              <Text style={styles.statusDescription}>
                {isLifetimePro 
                  ? 'You have lifetime access to all premium features as one of the first 20 users!'
                  : 'You have access to all premium features'
                }
              </Text>
            </View>
            {!isLifetimePro && (
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelSubscription}
              >
                <Text style={styles.cancelButtonText}>Manage</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Lifetime Pro Info */}
        {isLifetimePro && (
          <View style={styles.lifetimeProInfo}>
            <Ionicons name="star" size={20} color={colors.primary} />
            <Text style={styles.lifetimeProText}>
              🎉 Congratulations! You're one of the first 20 users with lifetime pro access!
            </Text>
          </View>
        )}

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map(renderPlanCard)}
        </View>

        {/* Restore Purchases Button */}
        <TouchableOpacity 
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
          disabled={isLoading}
        >
          <Ionicons name="refresh" size={20} color={colors.primary} />
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Payment Info */}
        <View style={styles.paymentInfo}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <Text style={styles.paymentInfoText}>
            Secure payment processing by Apple. Your payment information is handled securely by Apple.
          </Text>
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do I cancel my subscription?</Text>
            <Text style={styles.faqAnswer}>
              Go to your Apple ID settings &gt; Subscriptions to manage your subscription. You'll keep premium access until the end of your billing period.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I restore my purchases?</Text>
            <Text style={styles.faqAnswer}>
              Yes! Use the "Restore Purchases" button above to restore any previous subscriptions on this device.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How does Apple billing work?</Text>
            <Text style={styles.faqAnswer}>
              Your subscription is billed through your Apple ID. You can manage billing and payment methods in your Apple ID settings.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}