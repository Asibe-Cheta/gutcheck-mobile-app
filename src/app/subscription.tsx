/**
 * Subscription Screen
 * Premium subscription management with Apple In-App Purchases
 * 
 * This file uses lazy imports to prevent crashes during module loading
 */

// CRITICAL: Log at the VERY FIRST line to detect if file even loads
console.log('[SUB_FILE] subscription.tsx file is being evaluated/loaded');

// IMPORTANT: Import ONLY lightweight React/RN modules at the top
// Heavy dependencies are lazy-loaded below
import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

console.log('[SUB_FILE] ✅ All basic imports completed successfully');

// Wrap ALL heavy imports in a try-catch that logs immediately
// This must run before React component evaluation
console.log('[SUB_MODULE] Starting subscription module load...');

let useSubscriptionStore: any = null;
let lifetimeProService: any = null;
let importError: string | null = null;

try {
  console.log('[SUB_MODULE] Step 1: Attempting to require subscriptionStore...');
  console.log('[SUB_MODULE] Step 1.0: About to call require()...');
  const storeModule = require('@/lib/stores/subscriptionStore');
  console.log('[SUB_MODULE] Step 1.1: require() completed, module:', typeof storeModule);
  console.log('[SUB_MODULE] Step 1.2: Extracting useSubscriptionStore...');
  useSubscriptionStore = storeModule.useSubscriptionStore;
  console.log('[SUB_MODULE] Step 1.3: useSubscriptionStore extracted:', typeof useSubscriptionStore);
  console.log('[SUB_MODULE] ✅ Step 1: subscriptionStore imported successfully');
} catch (error: any) {
  const errorMsg = `Failed to import subscriptionStore: ${error?.message || 'Unknown error'}`;
  console.error('[SUB_MODULE] ❌ Step 1 FAILED at step:', error?.message);
  console.error('[SUB_MODULE] Error full details:', JSON.stringify({
    message: error?.message,
    stack: error?.stack,
    name: error?.name,
    toString: String(error)
  }, null, 2));
  importError = errorMsg;
  // Don't rethrow - allow component to render with error UI
}

try {
  console.log('[SUB_MODULE] Step 2: Attempting to import lifetimeProService...');
  const lifetimeModule = require('@/lib/lifetimeProService');
  console.log('[SUB_MODULE] Step 2.1: Module loaded, extracting lifetimeProService...');
  lifetimeProService = lifetimeModule.lifetimeProService;
  console.log('[SUB_MODULE] ✅ Step 2: lifetimeProService imported successfully');
} catch (error: any) {
  const errorMsg = `Failed to import lifetimeProService: ${error?.message || 'Unknown error'}`;
  console.error('[SUB_MODULE] ❌ Step 2 FAILED:', errorMsg);
  console.error('[SUB_MODULE] Error stack:', error?.stack);
  console.error('[SUB_MODULE] Error name:', error?.name);
  if (!importError) importError = errorMsg;
}

console.log('[SUB_MODULE] Module load complete. useSubscriptionStore:', !!useSubscriptionStore, 'lifetimeProService:', !!lifetimeProService);

// Lazy import theme and icons - these should be safe but just in case
let getThemeColors: any = null;
let useTheme: any = null;
let Ionicons: any = null;

try {
  console.log('[SUB_MODULE] Step 3: Loading theme utilities...');
  const themeModule = require('@/lib/theme');
  getThemeColors = themeModule.getThemeColors;
  const themeContextModule = require('@/lib/themeContext');
  useTheme = themeContextModule.useTheme;
  const iconsModule = require('@expo/vector-icons');
  Ionicons = iconsModule.Ionicons;
  console.log('[SUB_MODULE] ✅ Step 3: Theme utilities loaded successfully');
} catch (error: any) {
  console.error('[SUB_MODULE] ❌ Step 3 FAILED (theme/icons):', error?.message);
  // These are critical for UI, but we'll handle it in the component
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
  hasFreeTrial?: boolean;
  freeTrialDays?: number | null;
}

export default function SubscriptionScreen() {
  console.log('[SUB] Subscription screen component mounting...');
  
  const router = useRouter();
  
  // Safely get theme - with fallbacks if lazy import failed
  let isDark = false;
  let colors: any = {
    background: '#1a1d29',
    textPrimary: '#ffffff',
    textSecondary: '#888888',
    primary: '#4CAF50',
    border: '#333333'
  };
  
  try {
    if (useTheme && getThemeColors) {
      const themeResult = useTheme();
      isDark = themeResult?.isDark || false;
      colors = getThemeColors(isDark);
      console.log('[SUB] ✅ Theme loaded successfully');
    } else {
      console.warn('[SUB] ⚠️ Theme not available, using fallback colors');
    }
  } catch (error: any) {
    console.error('[SUB] ❌ Error loading theme:', error);
    // Use fallback colors already set above
  }
  
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

  // Track if we're navigating to prevent loop
  const isNavigatingRef = React.useRef(false);
  const lastCheckTimeRef = React.useRef(0);

  // Check subscription status when screen comes into focus (ONLY when returning from purchase flow)
  // This should NOT run on normal navigation to the subscription screen
  useFocusEffect(
    React.useCallback(() => {
      // Don't check if we're already navigating
      if (isNavigatingRef.current) {
        console.log('[SUB] Skipping focus check - navigation in progress');
        return;
      }

      const checkAndNavigate = async () => {
        try {
          // CRITICAL: Only auto-navigate if we're explicitly returning from a purchase flow
          // Check for the flag that indicates we just completed a purchase
          const returningFromPurchase = await AsyncStorage.getItem('_returning_from_purchase');
          
          if (!returningFromPurchase) {
            // Normal navigation to subscription screen - don't auto-navigate
            console.log('[SUB] Normal navigation detected - not auto-navigating');
            return;
          }
          
          // Clear the flag immediately to prevent multiple checks
          await AsyncStorage.removeItem('_returning_from_purchase');
          
          // Prevent rapid repeated checks (debounce)
          const now = Date.now();
          const timeSinceLastCheck = now - lastCheckTimeRef.current;
          if (timeSinceLastCheck < 2000) {
            console.log('[SUB] Skipping focus check - checked too recently');
            return;
          }
          
          lastCheckTimeRef.current = Date.now();
          
          const userId = await AsyncStorage.getItem('user_id');
          if (!userId) return;

          // Check if we just navigated from home screen (avoid immediate re-check)
          const justNavigatedFromHome = await AsyncStorage.getItem('_sub_nav_from_home');
          if (justNavigatedFromHome) {
            await AsyncStorage.removeItem('_sub_nav_from_home');
            console.log('[SUB] Skipping auto-navigation - just navigated from home');
            return;
          }

          // Refresh subscription status
          await loadSubscription();
          await checkLifetimePro(userId);

          // After refresh, read fresh values from store (destructured values are stale in closure)
          const currentState = useSubscriptionStore.getState();
          const hasActive = currentState.subscription || currentState.isLifetimePro;
          
          if (hasActive && !isNavigatingRef.current) {
            console.log('[SUB] ✅ Active subscription detected after purchase, navigating to app...');
            isNavigatingRef.current = true;
            
            // Set flag to tell home screen to skip subscription check
            await AsyncStorage.setItem('_skip_sub_check', 'true');
            
            // CRITICAL: Set navigation flag in RevenueCat to prevent native calls
            const { revenueCatService } = require('@/lib/revenueCatService');
            revenueCatService.setNavigating(true);
            
            // Small delay to ensure UI updates and AsyncStorage persistence
            setTimeout(async () => {
              await AsyncStorage.removeItem('_sub_nav_from_home');
              // CRITICAL: Small delay to ensure AsyncStorage is persisted before navigation
              await new Promise(resolve => setTimeout(resolve, 100));
              router.replace('/(tabs)');
              // Reset navigation flag after navigation completes
              setTimeout(() => {
                isNavigatingRef.current = false;
                revenueCatService.setNavigating(false);
              }, 3000);
            }, 500);
          }
        } catch (error) {
          console.error('[SUB] Error checking subscription on focus:', error);
          isNavigatingRef.current = false;
        }
      };

      checkAndNavigate();
    }, [loadSubscription, checkLifetimePro])
  );

  const handleSubscribe = async (planId: string) => {
    try {
      console.log('[SUB] Subscribe button pressed for plan:', planId);
      
      // Set flag to indicate we're starting a purchase flow
      // This allows useFocusEffect to auto-navigate if user returns from external purchase dialog
      await AsyncStorage.setItem('_returning_from_purchase', 'true');
      
      if (!subscribeToPlan) {
        throw new Error('subscribeToPlan method not available');
      }
      const result = await subscribeToPlan(planId);
      
      if (result.success) {
        // Refresh subscription status from RevenueCat (may take a moment to sync)
        console.log('[SUB] Purchase successful, refreshing subscription status...');
        
        // Wait a moment for RevenueCat to sync
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh subscription status from RevenueCat
        await loadSubscription();
        
        // Double-check subscription is active before navigating
        const userId = await AsyncStorage.getItem('user_id');
        if (userId) {
          await checkLifetimePro(userId);
        }
        
        // Check again if we have active subscription or lifetime pro
        // After async operations, read fresh values from store (destructured values are stale)
        const currentState = useSubscriptionStore.getState();
        const isActiveNow = currentState.subscription || currentState.isLifetimePro;
        
                 if (isActiveNow) {
           console.log('[SUB] ✅ Subscription confirmed active, navigating to app...');
           isNavigatingRef.current = true;
           
           // Clear the purchase flag since we're handling navigation directly here
           await AsyncStorage.removeItem('_returning_from_purchase');
           
           Alert.alert(
             '🎉 Subscription Active!',
             'Welcome to Premium! You now have access to all premium features.',
             [
               {
                 text: 'Continue to App',
                onPress: async () => {
                  // Set flag to tell home screen to skip subscription check
                  await AsyncStorage.setItem('_skip_sub_check', 'true');
                  // Clear the navigation flag
                  await AsyncStorage.removeItem('_sub_nav_from_home');
                  
                  // CRITICAL: Set navigation flag in RevenueCat to prevent native calls
                  const { revenueCatService } = require('@/lib/revenueCatService');
                  revenueCatService.setNavigating(true);
                  
                  // CRITICAL: Small delay to ensure AsyncStorage is persisted before navigation
                  await new Promise(resolve => setTimeout(resolve, 100));
                  // Use replace to prevent going back to subscription screen
                  router.replace('/(tabs)');
                  
                  // Reset navigation flag after delay
                  setTimeout(() => {
                    isNavigatingRef.current = false;
                    revenueCatService.setNavigating(false);
                  }, 3000);
                }
               }
             ]
           );
        } else {
          // Subscription might still be syncing, give it another try
          console.log('[SUB] ⚠️ Subscription not immediately available, waiting for sync...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          await loadSubscription();
          
          // After wait, read fresh values from store
          const stateAfterWait = useSubscriptionStore.getState();
          const finalCheck = stateAfterWait.subscription || stateAfterWait.isLifetimePro;
          if (finalCheck) {
            console.log('[SUB] ✅ Subscription synced, navigating...');
            isNavigatingRef.current = true;
            // Clear the purchase flag since we're handling navigation directly here
            await AsyncStorage.removeItem('_returning_from_purchase');
            // Set flag to tell home screen to skip subscription check
            await AsyncStorage.setItem('_skip_sub_check', 'true');
            await AsyncStorage.removeItem('_sub_nav_from_home');
            
            // CRITICAL: Set navigation flag in RevenueCat to prevent native calls
            const { revenueCatService } = require('@/lib/revenueCatService');
            revenueCatService.setNavigating(true);
            
            // CRITICAL: Small delay to ensure AsyncStorage is persisted before navigation
            await new Promise(resolve => setTimeout(resolve, 100));
            router.replace('/(tabs)');
            setTimeout(() => {
              isNavigatingRef.current = false;
              revenueCatService.setNavigating(false);
            }, 3000);
          } else {
            Alert.alert(
              'Subscription Processing',
              'Your subscription is being processed. Please restart the app or wait a moment and try again.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Refresh the screen to show updated status
                    loadSubscription();
                  }
                }
              ]
            );
          }
        }
      } else {
        // Clear the purchase flag if purchase failed
        await AsyncStorage.removeItem('_returning_from_purchase');
        Alert.alert('Subscription Failed', result.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      // Clear the purchase flag on error
      await AsyncStorage.removeItem('_returning_from_purchase').catch(() => {});
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
    
    // Force correct prices (override RevenueCat prices if they're wrong)
    const displayPrice = plan.interval === 'month' ? 6.99 : 59.99;
    
    // Calculate daily cost
    const dailyCost = plan.interval === 'month' 
      ? (displayPrice / 30).toFixed(2)  // £6.99 / 30 = £0.23 per day
      : (displayPrice / 365).toFixed(2); // £59.99 / 365 = £0.16 per day

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
            <Text style={styles.price}>£{displayPrice.toFixed(2)}</Text>
            <Text style={styles.period}>/{plan.interval}</Text>
          </View>
          
          {/* Free Trial Badge - FIXES APPLE REVIEW ISSUE */}
          {plan.hasFreeTrial && plan.freeTrialDays && (
            <View style={styles.freeTrialBadge}>
              <Ionicons name="gift" size={16} color={colors.primary} />
              <Text style={styles.freeTrialText}>
                {plan.freeTrialDays}-day free trial
              </Text>
            </View>
          )}
          
          {/* Subordinate: Daily Cost */}
          <View style={styles.dailyCostContainer}>
            <Text style={styles.dailyCostLabel}>
              {plan.interval === 'month' 
                ? '23p/day billed monthly, £6.99/month' 
                : '16p/day billed annually, Save 28% vs monthly. £59.99/year'}
            </Text>
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
    freeTrialBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginTop: 8,
      marginBottom: 8,
    },
    freeTrialText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: 6,
    },
    legalSection: {
      marginTop: 32,
      marginBottom: 32,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    legalLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    legalLinkText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
      marginRight: 6,
      textDecorationLine: 'underline',
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
          onPress={async () => {
            // Don't check if we're already navigating
            if (isNavigatingRef.current) {
              console.log('[SUB] Already navigating, ignoring back button');
              return;
            }

            // Check CURRENT state from store (no async refresh needed for back button)
            const currentState = useSubscriptionStore.getState();
            const hasActive = currentState.subscription || currentState.isLifetimePro;
            
            if (hasActive) {
              // User has active subscription - navigate to home with flag to skip check
              console.log('[SUB] User has active subscription, navigating to home...');
              isNavigatingRef.current = true;
              
              // Set flag to tell home screen to skip subscription check
              await AsyncStorage.setItem('_skip_sub_check', 'true');
              await AsyncStorage.removeItem('_sub_nav_from_home');
              
              // CRITICAL: Set navigation flag in RevenueCat to prevent native calls
              const { revenueCatService } = require('@/lib/revenueCatService');
              revenueCatService.setNavigating(true);
              
              // CRITICAL: Small delay to ensure AsyncStorage is persisted before navigation
              await new Promise(resolve => setTimeout(resolve, 100));
              
              router.replace('/(tabs)');
              
              setTimeout(() => {
                isNavigatingRef.current = false;
                revenueCatService.setNavigating(false);
              }, 3000);
            } else {
              // No active subscription - just go back normally
              console.log('[SUB] No active subscription, going back...');
              router.back();
            }
          }}
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

        {/* Legal Links - REQUIRED BY APPLE REVIEW */}
        <View style={styles.legalSection}>
          <TouchableOpacity
            onPress={() => {
              const privacyUrl = 'https://mygutcheck.org/privacy';
              Linking.openURL(privacyUrl).catch(err => {
                console.error('Failed to open Privacy Policy:', err);
                Alert.alert('Error', 'Could not open Privacy Policy. Please visit mygutcheck.org/privacy');
              });
            }}
            style={styles.legalLink}
          >
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              const termsUrl = 'https://mygutcheck.org/terms';
              Linking.openURL(termsUrl).catch(err => {
                console.error('Failed to open Terms of Use:', err);
                Alert.alert('Error', 'Could not open Terms of Use. Please visit mygutcheck.org/terms');
              });
            }}
            style={styles.legalLink}
          >
            <Text style={styles.legalLinkText}>Terms of Use (EULA)</Text>
            <Ionicons name="open-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}