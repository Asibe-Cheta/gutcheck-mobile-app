/**
 * Subscription Store
 * Manages subscription state and operations using Zustand with Apple In-App Purchases
 */

import { create } from 'zustand';
import { lifetimeProService } from '@/lib/lifetimeProService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Apple IAP service (with graceful fallback for development)
import { appleIAPService, AppleSubscription, PRODUCT_IDS } from '@/lib/appleIAPService';

interface AppleSubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  productId: string;
  description: string;
}

interface SubscriptionState {
  plans: AppleSubscriptionPlan[];
  currentPlan: AppleSubscriptionPlan | null;
  subscription: AppleSubscription | null;
  isLifetimePro: boolean;
  lifetimeProCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadPlans: () => Promise<void>;
  loadSubscription: () => Promise<void>;
  checkLifetimePro: (userId: string) => Promise<void>;
  subscribeToPlan: (planId: string) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  plans: [],
  currentPlan: null,
  subscription: null,
  isLifetimePro: false,
  lifetimeProCount: 0,
  isLoading: false,
  error: null,

  loadPlans: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Define our subscription plans
      const plans: AppleSubscriptionPlan[] = [
        {
          id: 'monthly',
          name: 'Premium Monthly',
          price: 9.99,
          currency: 'GBP',
          interval: 'month',
          productId: PRODUCT_IDS.PREMIUM_MONTHLY,
          description: 'Full access to all features',
          features: [
            'Unlimited AI conversations',
            'Image and document analysis',
            'Personalized guidance',
            'Priority support',
            'Advanced insights'
          ],
          popular: false,
        },
        {
          id: 'yearly',
          name: 'Premium Yearly',
          price: 99.99,
          currency: 'GBP',
          interval: 'year',
          productId: PRODUCT_IDS.PREMIUM_YEARLY,
          description: 'Full access to all features - Save 17%',
          features: [
            'Unlimited AI conversations',
            'Image and document analysis',
            'Personalized guidance',
            'Priority support',
            'Advanced insights',
            'Exclusive yearly features'
          ],
          popular: true,
        },
      ];
      
      set({ plans, isLoading: false });
    } catch (error) {
      console.error('Load plans error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load plans',
      });
    }
  },

  loadSubscription: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // First check for lifetime pro status (always check database, not cache)
      const userId = await AsyncStorage.getItem('user_id');
      if (userId) {
        try {
          // Force database check (bypasses AsyncStorage cache)
          const isLifetimePro = await lifetimeProService.checkUserLifetimeProStatus(userId);
          if (isLifetimePro) {
            set({ 
              isLifetimePro: true, 
              subscription: null, 
              currentPlan: null, 
              isLoading: false 
            });
            return;
          } else {
            // If not lifetime pro, ensure cache is cleared
            set({ isLifetimePro: false });
          }
        } catch (lifetimeProError) {
          console.warn('Lifetime pro check failed (non-critical):', lifetimeProError);
          // Continue with regular subscription check
        }
      }
      
      // If not lifetime pro, check for regular subscription
      // Note: Apple IAP service doesn't have getActiveSubscription method
      // We'll check subscription status from local storage for now
      const subscriptionStatus = await AsyncStorage.getItem('subscription_status');
      const subscriptionPlan = await AsyncStorage.getItem('subscription_plan');
      const subscription = subscriptionStatus === 'active' ? {
        productId: subscriptionPlan === 'monthly' ? PRODUCT_IDS.PREMIUM_MONTHLY : PRODUCT_IDS.PREMIUM_YEARLY,
        transactionId: 'local_storage',
        purchaseDate: new Date().toISOString(),
        isActive: true
      } : null;
      
      if (subscription) {
        set({ subscription, isLoading: false });
        
        // Find current plan based on product ID
        const plans = get().plans;
        const plan = plans.find(p => p.productId === subscription.productId);
        if (plan) {
          set({ currentPlan: plan });
        }
      } else {
        set({ subscription: null, currentPlan: null, isLoading: false });
      }
    } catch (error) {
      console.error('Load subscription error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load subscription',
      });
    }
  },

  checkLifetimePro: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // First, check current status from database (bypasses cache)
      const currentStatus = await lifetimeProService.checkUserLifetimeProStatus(userId);
      
      // Then check eligibility
      const { isEligible, isLifetimePro, count } = await lifetimeProService.checkLifetimeProEligibility(userId);
      
      // Use database status as source of truth (not eligibility check, which may be stale)
      const actualIsLifetimePro = currentStatus || isLifetimePro;
      
      set({ 
        isLifetimePro: actualIsLifetimePro, 
        lifetimeProCount: count, 
        isLoading: false 
      });
      
      // If eligible and not already lifetime pro, grant it
      if (isEligible && !actualIsLifetimePro) {
        const result = await lifetimeProService.grantLifetimePro(userId);
        if (result.success) {
          set({ isLifetimePro: true });
          
          // Save to local storage
          await AsyncStorage.setItem('subscription_status', 'active');
          await AsyncStorage.setItem('subscription_plan', 'lifetime_pro');
        }
      }
    } catch (error) {
      console.error('Check lifetime pro error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check lifetime pro status',
      });
    }
  },

  subscribeToPlan: async (planId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Defense in depth: Prevent lifetime pro users from attempting purchases
      const state = get();
      if (state.isLifetimePro) {
        set({ isLoading: false });
        return { 
          success: false, 
          error: 'You already have lifetime pro access! No subscription needed.' 
        };
      }
      
      const plans = get().plans;
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        set({ isLoading: false, error: 'Plan not found' });
        return { success: false, error: 'Plan not found' };
      }

      // Try to purchase through Apple IAP
      const result = await appleIAPService.purchaseProduct(plan.productId);
      const subscription = result.success ? result.subscription : null;
      
      if (subscription) {
        set({ subscription, currentPlan: plan, isLoading: false });
        
        // Save subscription status to AsyncStorage
        await AsyncStorage.setItem('subscription_status', 'active');
        await AsyncStorage.setItem('subscription_plan', planId);
        
        return { success: true };
      } else {
        set({ isLoading: false, error: result.error || 'Purchase failed' });
        return { success: false, error: result.error || 'Purchase failed' };
      }
    } catch (error) {
      console.error('Subscribe to plan error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe to plan',
      });
      return { success: false, error: 'Failed to subscribe to plan' };
    }
  },

  restorePurchases: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Restore purchases through Apple IAP
      const result = await appleIAPService.restorePurchases();
      const subscriptions = result.success ? result.subscriptions || [] : [];
      
      if (subscriptions && subscriptions.length > 0) {
        const activeSubscription = subscriptions.find(sub => sub.isActive);
        
        if (activeSubscription) {
          set({ subscription: activeSubscription, isLoading: false });
          
          // Find current plan
          const plans = get().plans;
          const plan = plans.find(p => p.productId === activeSubscription.productId);
          if (plan) {
            set({ currentPlan: plan });
          }
          
          // Save subscription status
          await AsyncStorage.setItem('subscription_status', 'active');
          await AsyncStorage.setItem('subscription_plan', plan?.id || '');
          
          return { success: true };
        } else {
          set({ subscription: null, currentPlan: null, isLoading: false });
          return { success: true };
        }
      } else {
        set({ subscription: null, currentPlan: null, isLoading: false });
        return { success: true };
      }
    } catch (error) {
      console.error('Restore purchases error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to restore purchases',
      });
      return { success: false, error: 'Failed to restore purchases' };
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      plans: [],
      currentPlan: null,
      subscription: null,
      isLifetimePro: false,
      lifetimeProCount: 0,
      isLoading: false,
      error: null,
    });
  },
}));
