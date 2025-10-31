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
      
      // First, query products from App Store Connect (required before purchase)
      console.log('[IAP] Querying products from App Store Connect...');
      const productsResult = await appleIAPService.getProducts();
      
      if (!productsResult.success) {
        console.error('[IAP] ❌ Failed to query products from App Store Connect:', productsResult.error);
        console.warn('[IAP] ⚠️ Falling back to static plan data. This should NOT happen in production!');
        // Fall back to static plans if query fails
      }
      
      // Define our subscription plans (using App Store Connect product data if available)
      const appStoreProducts = productsResult.products || [];
      
      if (appStoreProducts.length === 0) {
        console.warn('[IAP] ⚠️ No products returned from App Store Connect. Using fallback data.');
      } else {
        console.log('[IAP] ✅ Using real product data from App Store Connect:', appStoreProducts.length, 'products');
      }
      
      const monthlyProduct = appStoreProducts.find((p: any) => p.productId === PRODUCT_IDS.PREMIUM_MONTHLY);
      const yearlyProduct = appStoreProducts.find((p: any) => p.productId === PRODUCT_IDS.PREMIUM_YEARLY);
      
      // Log which data source we're using
      if (monthlyProduct) {
        console.log('[IAP] ✅ Monthly product from App Store:', {
          productId: monthlyProduct.productId,
          title: monthlyProduct.title,
          price: monthlyProduct.price,
          currency: monthlyProduct.currency
        });
      } else {
        console.warn('[IAP] ⚠️ Monthly product NOT found in App Store Connect. Using fallback data.');
      }
      
      if (yearlyProduct) {
        console.log('[IAP] ✅ Yearly product from App Store:', {
          productId: yearlyProduct.productId,
          title: yearlyProduct.title,
          price: yearlyProduct.price,
          currency: yearlyProduct.currency
        });
      } else {
        console.warn('[IAP] ⚠️ Yearly product NOT found in App Store Connect. Using fallback data.');
      }
      
      const plans: AppleSubscriptionPlan[] = [
        {
          id: 'monthly',
          name: monthlyProduct?.title || 'Premium Monthly',
          price: monthlyProduct?.price || 9.99,
          currency: monthlyProduct?.currency || 'GBP',
          interval: 'month',
          productId: PRODUCT_IDS.PREMIUM_MONTHLY,
          description: monthlyProduct?.description || 'Full access to all features',
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
          name: yearlyProduct?.title || 'Premium Yearly',
          price: yearlyProduct?.price || 99.99,
          currency: yearlyProduct?.currency || 'GBP',
          interval: 'year',
          productId: PRODUCT_IDS.PREMIUM_YEARLY,
          description: yearlyProduct?.description || 'Full access to all features - Save 17%',
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
      
      console.log('[IAP] Plans loaded. Products queried:', appStoreProducts.length);
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
      
      // First, check current status from database (bypasses cache) - this is the source of truth
      const currentStatus = await lifetimeProService.checkUserLifetimeProStatus(userId);
      
      // Then check eligibility to get count
      const { isEligible, isLifetimePro, count } = await lifetimeProService.checkLifetimeProEligibility(userId);
      
      // CRITICAL: Use database status as source of truth
      // If database says false, user is NOT lifetime pro (even if they're in first 20)
      // This prevents re-granting after explicit removal for testing
      const actualIsLifetimePro = currentStatus;
      
      set({ 
        isLifetimePro: actualIsLifetimePro, 
        lifetimeProCount: count, 
        isLoading: false 
      });
      
      // Only grant if eligible AND database confirms they're not already lifetime pro
      // This prevents re-granting after removal
      if (isEligible && !actualIsLifetimePro && !currentStatus) {
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
      
      // Defense in depth: Check database directly before blocking (not just store state)
      // This prevents stale store state from blocking purchases after removal
      const userId = await AsyncStorage.getItem('user_id');
      console.log('[IAP] subscribeToPlan called for user:', userId);
      
      if (userId) {
        const dbStatus = await lifetimeProService.checkUserLifetimeProStatus(userId);
        console.log('[IAP] Database lifetime pro status:', dbStatus);
        
        if (dbStatus) {
          // Database says user has lifetime pro, update store and block
          console.log('[IAP] Blocking purchase - user has lifetime pro in database');
          set({ isLifetimePro: true, isLoading: false });
          return { 
            success: false, 
            error: 'You already have lifetime pro access! No subscription needed.' 
          };
        }
        // Database says no lifetime pro, ensure store matches
        const currentStoreState = get().isLifetimePro;
        console.log('[IAP] Store state before update:', currentStoreState);
        if (currentStoreState) {
          console.log('[IAP] Updating store state to false (database says no lifetime pro)');
          set({ isLifetimePro: false });
        }
      }
      
      // Also check store state as secondary defense
      const state = get();
      console.log('[IAP] Final store state check:', state.isLifetimePro);
      if (state.isLifetimePro) {
        console.log('[IAP] Blocking purchase - store state says lifetime pro');
        set({ isLoading: false });
        return { 
          success: false, 
          error: 'You already have lifetime pro access! No subscription needed.' 
        };
      }
      
      console.log('[IAP] Proceeding with purchase...');
      
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
