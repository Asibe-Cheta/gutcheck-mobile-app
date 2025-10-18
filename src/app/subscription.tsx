/**
 * Subscription Screen
 * Premium subscription management with Stripe integration
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useSubscriptionStore } from '@/lib/stores/subscriptionStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { stripeService } from '@/lib/stripe';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  actualPrice?: string;
  actualPeriod?: string;
  description?: string;
  features: string[];
  popular?: boolean;
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  // Simulate payment for development mode
  const simulatePayment = async (planId: string) => {
    try {
      // Get the plan details
      const plan = stripeService.getPlan(planId);
      if (!plan) {
        Alert.alert('Error', 'Plan not found.');
        return;
      }

      // Simulate payment processing
      Alert.alert(
        'Processing Payment...',
        'Simulating payment processing...',
        [],
        { cancelable: false }
      );

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Set subscription in store
      const subscriptionStore = useSubscriptionStore.getState();
      await subscriptionStore.setSubscription({
        id: `sub_sim_${Date.now()}`,
        planId: planId,
        status: 'active',
        trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        cancelAtPeriodEnd: false
      });

      // Save to local storage
      await AsyncStorage.setItem('current_subscription_plan', planId);
      await AsyncStorage.setItem('subscription_status', 'active');
      await AsyncStorage.setItem('trial_end_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

      Alert.alert(
        'Payment Successful!',
        'Your 7-day free trial has started. You now have access to all premium features.',
        [
          {
            text: 'Continue to App',
            onPress: () => router.push('/(tabs)')
          }
        ]
      );

    } catch (error) {
      console.error('Error simulating payment:', error);
      Alert.alert('Error', 'Failed to process payment simulation.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load plans from Stripe service
  useEffect(() => {
    const loadPlans = () => {
      const stripePlans = stripeService.getPlans();
      const formattedPlans: SubscriptionPlan[] = stripePlans.map(plan => {
        // Calculate daily cost
        const dailyCost = plan.interval === 'month' ? plan.price / 30 : plan.price / 365;
        
        return {
          id: plan.id,
          name: plan.name,
          price: `£${dailyCost.toFixed(2)}`, // Daily cost as main price
          period: plan.interval === 'month' ? 'day' : 'day',
          actualPrice: `£${plan.price.toFixed(2)}`, // Actual monthly/yearly price
          actualPeriod: plan.interval === 'month' ? 'month' : 'year',
          description: plan.description,
          features: plan.features,
          popular: plan.is_popular || false
        };
      });
      setPlans(formattedPlans);
    };
    
    loadPlans();
  }, []);

  useEffect(() => {
    loadCurrentPlan();
  }, []);

  const loadCurrentPlan = async () => {
    try {
      const plan = await AsyncStorage.getItem('current_subscription_plan');
      setCurrentPlan(plan);
    } catch (error) {
      console.error('Error loading current plan:', error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setIsLoading(true);
    
    try {
      // Check if we're in development mode (Expo Go)
      const isDevelopment = __DEV__ || Constants.expoConfig?.extra?.EXPO_PUBLIC_APP_ENV === 'development';
      
      if (isDevelopment) {
        // Development mode - simulate payment
        Alert.alert(
          'Development Mode',
          'This is a development build. Payment simulation will be used.',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Simulate Payment',
              onPress: () => simulatePayment(planId)
            }
          ]
        );
        return;
      }

      // Production mode - real Stripe payment
      // Check if Stripe keys are configured
      const publishableKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey || publishableKey.includes('your_')) {
        Alert.alert(
          'Configuration Required',
          'Stripe payment keys are not configured. Please contact support.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get user from auth store
      const user = useAuthStore.getState().user;
      if (!user) {
        Alert.alert('Authentication Required', 'Please log in to subscribe.');
        return;
      }

      // Get the plan details
      const plan = stripeService.getPlan(planId);
      if (!plan) {
        Alert.alert('Error', 'Plan not found.');
        return;
      }

      // Create customer and subscription
      const { customerId, error: customerError } = await stripeService.createCustomer(
        user.id,
        user.email || 'user@example.com'
      );

      if (customerError) {
        Alert.alert('Error', `Failed to create customer: ${customerError}`);
        return;
      }

      // Create subscription with 7-day trial
      const { subscriptionId, clientSecret, error: subscriptionError } = await stripeService.createSubscription(
        customerId,
        plan.stripe_price_id,
        7 // 7-day trial
      );

      if (subscriptionError) {
        Alert.alert('Error', `Failed to create subscription: ${subscriptionError}`);
        return;
      }

      if (clientSecret) {
        // Payment required - show payment form
        Alert.alert(
          'Payment Required',
          'Please complete your payment to activate your subscription. You have a 7-day free trial.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Continue to Payment', 
              onPress: () => {
                // Here you would navigate to payment form or handle payment
                Alert.alert(
                  'Payment Integration',
                  'Payment form integration required. This would handle the clientSecret for payment completion.',
                  [{ text: 'OK' }]
                );
              }
            }
          ]
        );
      } else {
        // Trial activated successfully
        await AsyncStorage.setItem('current_subscription_plan', planId);
        setCurrentPlan(planId);
        Alert.alert(
          '🎉 Trial Started!',
          `Welcome to ${plan.name}! Your 7-day free trial has started.`,
          [{ text: 'Great!', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You\'ll lose access to premium features at the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        { 
          text: 'Cancel Subscription', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('current_subscription_plan');
              setCurrentPlan(null);
              Alert.alert('Subscription Cancelled', 'Your subscription has been cancelled.');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription.');
            }
          }
        }
      ]
    );
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isCurrentPlan = currentPlan === plan.id;
    const isPopular = plan.popular;

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
          <Text style={styles.planDescription}>{plan.description}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{plan.price}</Text>
            <Text style={styles.period}>/{plan.period}</Text>
          </View>
          <View style={styles.actualPriceContainer}>
            <Text style={styles.actualPrice}>{plan.actualPrice}</Text>
            <Text style={styles.actualPeriod}>/{plan.actualPeriod}</Text>
          </View>
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
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 16,
      textAlign: 'center',
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
    actualPriceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    actualPrice: {
      fontSize: 16,
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
    },
    actualPeriod: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 4,
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
        {currentPlan && (
          <View style={styles.statusCard}>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>Premium Active</Text>
              <Text style={styles.statusDescription}>
                You have access to all premium features
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelSubscription}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map(renderPlanCard)}
        </View>

        {/* Payment Info */}
        <View style={styles.paymentInfo}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <Text style={styles.paymentInfoText}>
            Secure payment processing by Stripe. Your payment information is encrypted and secure.
          </Text>
        </View>

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do I cancel my subscription?</Text>
            <Text style={styles.faqAnswer}>
              You can cancel anytime from this screen or by contacting support. You'll keep premium access until the end of your billing period.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I change my plan later?</Text>
            <Text style={styles.faqAnswer}>
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is there a free trial?</Text>
            <Text style={styles.faqAnswer}>
              We offer a 7-day free trial for all premium plans. No credit card required to start.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}