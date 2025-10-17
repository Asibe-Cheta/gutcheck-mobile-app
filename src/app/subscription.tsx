/**
 * Subscription Screen
 * Premium subscription management with Stripe integration
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        'Basic relationship analysis',
        'Limited conversation history',
        'Standard AI responses',
        'Basic support'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$9.99',
      period: 'month',
      features: [
        'Advanced AI analysis',
        'Unlimited conversation history',
        'Priority AI responses',
        'Image analysis',
        'Pattern tracking',
        'Premium support',
        'Export conversations'
      ],
      popular: true
    },
    {
      id: 'premium_yearly',
      name: 'Premium Yearly',
      price: '$99.99',
      period: 'year',
      features: [
        'Everything in Premium',
        '2 months free (save $20)',
        'Priority feature access',
        'Advanced analytics',
        'Custom AI training'
      ]
    }
  ];

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
    if (planId === 'free') {
      Alert.alert('Free Plan', 'You\'re already on the free plan!');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate subscription process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save subscription
      await AsyncStorage.setItem('current_subscription_plan', planId);
      setCurrentPlan(planId);
      
      Alert.alert(
        '🎉 Subscription Successful!',
        `Welcome to ${plans.find(p => p.id === planId)?.name}! You now have access to all premium features.`,
        [{ text: 'Great!', style: 'default' }]
      );
    } catch (error) {
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
              await AsyncStorage.setItem('current_subscription_plan', 'free');
              setCurrentPlan('free');
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
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{plan.price}</Text>
            <Text style={styles.period}>/{plan.period}</Text>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Subscription</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Plan Status */}
        {currentPlan && currentPlan !== 'free' && (
          <View style={styles.statusCard}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
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
          <Ionicons name="shield-checkmark" size={20} color={theme.colors.primary} />
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
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
    backgroundColor: `${theme.colors.background}CC`,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(79, 209, 199, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 199, 0.3)',
    marginBottom: 24,
  },
  statusText: {
    flex: 1,
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter',
  },
  statusDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontFamily: 'Inter',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelButtonText: {
    color: theme.colors.warning,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: 'rgba(148, 163, 184, 0.05)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    position: 'relative',
  },
  popularPlan: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(79, 209, 199, 0.05)',
  },
  currentPlan: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(79, 209, 199, 0.1)',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  currentBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  planHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.primary,
    fontFamily: 'Inter',
  },
  period: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginLeft: 4,
    fontFamily: 'Inter',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  subscribeButton: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  popularButton: {
    backgroundColor: theme.colors.primary,
  },
  currentButton: {
    backgroundColor: 'rgba(79, 209, 199, 0.2)',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter',
  },
  currentButtonText: {
    color: theme.colors.primary,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: 'rgba(79, 209, 199, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 199, 0.3)',
    marginTop: 24,
  },
  paymentInfoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  faqSection: {
    marginTop: 32,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  faqAnswer: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
});
