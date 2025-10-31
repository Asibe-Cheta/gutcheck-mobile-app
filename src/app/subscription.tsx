/**
 * Subscription Screen
 * Premium subscription management with Apple In-App Purchases
 */

import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Lazy import store to prevent crash if module fails to load
let useSubscriptionStore: any = null;
let lifetimeProService: any = null;

try {
  console.log('[SUB] Attempting to import subscriptionStore...');
  const storeModule = require('@/lib/stores/subscriptionStore');
  useSubscriptionStore = storeModule.useSubscriptionStore;
  console.log('[SUB] ✅ subscriptionStore imported successfully');
} catch (error: any) {
  console.error('[SUB] ❌ Failed to import subscriptionStore:', error);
  console.error('[SUB] Error stack:', error?.stack);
}

try {
  console.log('[SUB] Attempting to import lifetimeProService...');
  const lifetimeModule = require('@/lib/lifetimeProService');
  lifetimeProService = lifetimeModule.lifetimeProService;
  console.log('[SUB] ✅ lifetimeProService imported successfully');
} catch (error: any) {
  console.error('[SUB] ❌ Failed to import lifetimeProService:', error);
  console.error('[SUB] Error stack:', error?.stack);
}

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
  console.log('[SUB] Subscription screen component mounting...');
  
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [mountError, setMountError] = useState<string | null>(null);
  
  // Check if imports succeeded
  if (!useSubscriptionStore) {
    const errorMsg = 'Failed to load subscription store module. Check logs for details.';
    console.error('[SUB] ❌ useSubscriptionStore is null');
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1d29', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#ff4444', fontSize: 18, marginBottom: 10 }}>❌ Error Loading Subscription</Text>
        <Text style={{ color: '#ffffff', textAlign: 'center', marginBottom: 10 }}>{errorMsg}</Text>
        <Text style={{ color: '#888', textAlign: 'center', fontSize: 12, marginBottom: 20 }}>
          Check Debug Info screen for error logs
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 10, backgroundColor: '#4CAF50', borderRadius: 5 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#ffffff' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  // Initialize store with error handling
  let subscriptionStore;
  try {
    console.log('[SUB] Calling useSubscriptionStore()...');
    subscriptionStore = useSubscriptionStore();
    console.log('[SUB] ✅ Store initialized successfully');
  } catch (error: any) {
    console.error('[SUB] ❌ Error calling useSubscriptionStore:', error);
    console.error('[SUB] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    setMountError(`Store initialization failed: ${error?.message || 'Unknown error'}`);
    // Return error UI early if store fails
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1d29', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#ff4444', fontSize: 18, marginBottom: 10 }}>❌ Error Loading Subscription</Text>
        <Text style={{ color: '#ffffff', textAlign: 'center' }}>{mountError}</Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 10, backgroundColor: '#4CAF50', borderRadius: 5 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#ffffff' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  const { 
    plans = [], 
    currentPlan, 
    subscription, 
    isLifetimePro = false,
    lifetimeProCount = 0,
    isLoading = false, 
    error,
    loadPlans,
    loadSubscription,
    checkLifetimePro,
    subscribeToPlan,
    restorePurchases,
    clearError
  } = subscriptionStore || {};

  // Debug: Log execution environment for troubleshooting test button visibility
  useEffect(() => {
    try {
      console.log('[SUB] Subscription Screen - Debug Info:', {
        executionEnvironment: Constants.executionEnvironment,
        isDEV: __DEV__,
        isLifetimePro,
        shouldShowTestButton: (Constants.executionEnvironment !== 'storeClient' || __DEV__) && isLifetimePro
      });
    } catch (error: any) {
      console.error('[SUB] Error in debug useEffect:', error);
      setMountError(`Debug error: ${error?.message || 'Unknown error'}`);
    }
  }, [isLifetimePro]);

  // Load plans and subscription on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('[SUB] Initializing subscription screen...');
        
        if (!loadPlans || !loadSubscription || !checkLifetimePro) {
          throw new Error('Store methods not available');
        }
        
        console.log('[SUB] Loading plans...');
        await loadPlans();
        console.log('[SUB] ✅ Plans loaded');
        
        console.log('[SUB] Loading subscription...');
        await loadSubscription();
        console.log('[SUB] ✅ Subscription loaded');
        
        // Check for lifetime pro status
        const userId = await AsyncStorage.getItem('user_id');
        console.log('[SUB] User ID:', userId);
        if (userId) {
          console.log('[SUB] Checking lifetime pro status...');
          await checkLifetimePro(userId);
          console.log('[SUB] ✅ Lifetime pro checked');
        } else {
          console.warn('[SUB] ⚠️ No user ID found');
        }
        
        console.log('[SUB] ✅ Subscription screen initialized successfully');
      } catch (error: any) {
        console.error('[SUB] ❌ Error initializing subscription screen:', error);
        console.error('[SUB] Error stack:', error?.stack);
        setMountError(`Initialization failed: ${error?.message || 'Unknown error'}\nStack: ${error?.stack || 'No stack trace'}`);
      }
    };
    
    initialize();
  }, []);

  const handleSubscribe = async (planId: string) => {
    try {
      console.log('[SUB] Subscribe button pressed for plan:', planId);
      if (!subscribeToPlan) {
        throw new Error('subscribeToPlan method not available');
      }
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
          
          {/* Most Prominent: Billed Amount */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>£{plan.price.toFixed(2)}</Text>
            <Text style={styles.period}>/{plan.interval}</Text>
          </View>
          
          {/* Subordinate: Daily Cost */}
          <View style={styles.dailyCostContainer}>
            <Text style={styles.dailyCostLabel}>Just {dailyCost}p per day</Text>
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
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      marginTop: 16,
      marginBottom: 8,
    },
    price: {
      fontSize: 48,
      fontWeight: 'bold',
      color: colors.primary,
    },
    period: {
      fontSize: 24,
      color: colors.primary,
      marginLeft: 4,
      fontWeight: '600',
    },
    dailyCostContainer: {
      alignItems: 'center',
      marginBottom: 8,
    },
    dailyCostLabel: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '400',
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

  // Show error UI if mount error occurred
  if (mountError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1d29', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#ff4444', fontSize: 18, marginBottom: 10 }}>❌ Error Loading Subscription</Text>
        <Text style={{ color: '#ffffff', textAlign: 'center', marginBottom: 10 }}>{mountError}</Text>
        <Text style={{ color: '#888', fontSize: 12, marginBottom: 20, textAlign: 'center' }}>
          Check Debug Info screen for detailed logs
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 10, padding: 15, backgroundColor: '#4CAF50', borderRadius: 5 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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

        {/* Test Button: Remove Lifetime Pro for IAP Testing (TestFlight/Dev only) */}
        {/* Show button if: NOT Expo Go AND has lifetime pro (TestFlight/Production builds only) */}
        {(Constants.executionEnvironment !== 'storeClient' || __DEV__) && isLifetimePro && (
          <TouchableOpacity 
            style={[
              styles.restoreButton, 
              { 
                marginTop: 16, 
                marginBottom: 8,
                backgroundColor: '#FFA50020',
                borderWidth: 2,
                borderColor: '#FFA500',
                borderStyle: 'solid'
              }
            ]}
            onPress={async () => {
              Alert.alert(
                'Remove Lifetime Pro for Testing?',
                'This will remove your lifetime pro status so you can test IAP subscriptions. You can restore it later via SQL.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Remove', 
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        const userId = await AsyncStorage.getItem('user_id');
                        if (!userId) {
                          Alert.alert('Error', 'User ID not found');
                          return;
                        }
                        
                        console.log('[TEST] Removing lifetime pro for user:', userId);
                        const result = await lifetimeProService.removeUserFromLifetimePro(userId);
                        console.log('[TEST] Remove result:', result);
                        if (result.success) {
                          // CRITICAL: Immediately update Zustand store state BEFORE showing alert
                          // This prevents the subscribe button from checking stale state
                          useSubscriptionStore.setState({ isLifetimePro: false });
                          console.log('[TEST] Zustand store updated: isLifetimePro = false');
                          
                          Alert.alert(
                            'Success',
                            'Lifetime pro removed. Refreshing subscription screen...',
                            [
                              {
                                text: 'OK',
                                onPress: async () => {
                                  // Force refresh subscription and lifetime pro status
                                  await loadSubscription();
                                  await checkLifetimePro(userId);
                                  // Also reload plans to ensure fresh state
                                  await loadPlans();
                                }
                              }
                            ]
                          );
                        } else {
                          Alert.alert('Error', result.error || 'Failed to remove lifetime pro');
                        }
                      } catch (error) {
                        console.error('Error removing lifetime pro:', error);
                        Alert.alert('Error', 'Failed to remove lifetime pro status');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="flask" size={24} color="#FFA500" />
            <Text style={[
              styles.restoreButtonText, 
              { 
                color: '#FFA500', 
                fontSize: 16,
                fontWeight: '700',
                marginLeft: 12
              }
            ]}>
              🧪 Remove Lifetime Pro for Testing
            </Text>
          </TouchableOpacity>
        )}

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