/**
 * Subscription Store
 * Manages subscription state and operations using Zustand with Apple In-App Purchases
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Lazy import lifetimeProService to prevent crash if module fails
let lifetimeProService: any = null;
function getLifetimeProService() {
  if (!lifetimeProService) {
    try {
      const lifetimeModule = require('@/lib/lifetimeProService');
      lifetimeProService = lifetimeModule.lifetimeProService;
      console.log('[STORE] lifetimeProService loaded successfully');
    } catch (error: any) {
      console.error('[STORE] Failed to load lifetimeProService:', error);
      lifetimeProService = {
        checkUserLifetimeProStatus: () => Promise.resolve(false),
        getLifetimeProCount: () => Promise.resolve(0),
        grantLifetimePro: () => Promise.resolve({ success: false, error: 'Service not available' }),
        removeUserFromLifetimePro: () => Promise.resolve({ success: false, error: 'Service not available' }),
      };
    }
  }
  return lifetimeProService;
}

// Import RevenueCat IAP service (replaces expo-in-app-purchases)
// Lazy import to prevent crash if module fails to load
let revenueCatService: any = null;
let AppleSubscription: any = null;
let PRODUCT_IDS: any = null;

// Lazy load RevenueCat service
function getIAPService() {
  if (!revenueCatService) {
    try {
      const iapModule = require('@/lib/revenueCatService');
      revenueCatService = iapModule.revenueCatService;
      // Keep backward compatibility
      const appleIAPService = iapModule.appleIAPService || revenueCatService;
      AppleSubscription = iapModule.AppleSubscription;
      PRODUCT_IDS = iapModule.PRODUCT_IDS;
      console.log('[STORE] RevenueCat service loaded successfully');
    } catch (error: any) {
      console.error('[STORE] Failed to load RevenueCat service:', error);
      // Create a mock service that returns errors
      revenueCatService = {
        getProducts: () => Promise.resolve({ success: false, error: 'IAP service not available' }),
        purchaseProduct: () => Promise.resolve({ success: false, error: 'IAP service not available' }),
        restorePurchases: () => Promise.resolve({ success: false, error: 'IAP service not available' }),
      };
      PRODUCT_IDS = {
        PREMIUM_MONTHLY: 'com.gutcheck.app.premium.monthly',
        PREMIUM_YEARLY: 'com.gutcheck.app.premium.yearly',
      };
    }
  }
  return { appleIAPService: revenueCatService, PRODUCT_IDS };
}

interface AppleSubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  productId: string;
  description: string;
  hasFreeTrial?: boolean;
  freeTrialDays?: number | null;
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
      console.log('[STORE] loadPlans: Starting to load subscription plans...');
      
      let iapService: any = null;
      let productIds: any = null;
      let productsResult: any = { success: false, products: [] };
      
      try {
        console.log('[STORE] loadPlans: Getting IAP service...');
        const iapModule = getIAPService();
        iapService = iapModule.appleIAPService;
        productIds = iapModule.PRODUCT_IDS;
        console.log('[STORE] loadPlans: ✅ IAP service obtained');
        
        if (!iapService || !productIds) {
          throw new Error('IAP service or product IDs not available');
        }
        
        console.log('[STORE] loadPlans: Querying products from App Store Connect...');
        productsResult = await iapService.getProducts();
        console.log('[STORE] loadPlans: Product query result:', { 
          success: productsResult.success, 
          productCount: productsResult.products?.length || 0 
        });
      } catch (iapError: any) {
        console.error('[STORE] ❌ Failed to get IAP service or query products:', iapError);
        console.error('[STORE] Error details:', {
          message: iapError?.message,
          stack: iapError?.stack,
          name: iapError?.name
        });
        // Continue with fallback - don't crash the app
        productsResult = { success: false, products: [], error: iapError?.message || 'IAP service unavailable' };
      }
      
      if (!productsResult.success) {
        console.error('[STORE] ❌ Failed to query products from App Store Connect:', productsResult.error);
        console.warn('[STORE] ⚠️ Falling back to static plan data. This should NOT happen in production!');
        // Fall back to static plans if query fails
      }
      
      // Ensure productIds exists even if IAP service failed
      if (!productIds) {
        productIds = {
          PREMIUM_MONTHLY: 'com.gutcheck.app.premium.monthly',
          PREMIUM_YEARLY: 'com.gutcheck.app.premium.yearly',
        };
        console.warn('[STORE] ⚠️ Using fallback product IDs');
      }
      
      // Define our subscription plans (using App Store Connect product data if available)
      const appStoreProducts = productsResult.products || [];
      
      if (appStoreProducts.length === 0) {
        console.warn('[IAP] ⚠️ No products returned from App Store Connect. Using fallback data.');
      } else {
        console.log('[IAP] ✅ Using real product data from App Store Connect:', appStoreProducts.length, 'products');
      }
      
      const monthlyProduct = appStoreProducts.find((p: any) => p.productId === productIds.PREMIUM_MONTHLY);
      const yearlyProduct = appStoreProducts.find((p: any) => p.productId === productIds.PREMIUM_YEARLY);
      
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
          name: 'Premium Monthly', // Force correct name (not from App Store Connect which might be wrong)
          price: monthlyProduct?.price || 6.99,
          currency: monthlyProduct?.currency || 'GBP',
          interval: 'month',
          productId: productIds.PREMIUM_MONTHLY,
          description: monthlyProduct?.description || 'Full access to all features',
          hasFreeTrial: monthlyProduct?.hasFreeTrial || false,
          freeTrialDays: monthlyProduct?.freeTrialDays || null,
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
          name: 'Premium Yearly', // Force correct name - FIXES APPLE REVIEW ISSUE
          price: yearlyProduct?.price || 59.99,
          currency: yearlyProduct?.currency || 'GBP',
          interval: 'year',
          productId: productIds.PREMIUM_YEARLY,
          description: yearlyProduct?.description || 'Full access to all features - Save 28%',
          hasFreeTrial: yearlyProduct?.hasFreeTrial || false,
          freeTrialDays: yearlyProduct?.freeTrialDays || null,
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
          const isLifetimePro = await getLifetimeProService().checkUserLifetimeProStatus(userId);
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
      
      // If not lifetime pro, check for regular subscription from RevenueCat
      console.log('[STORE] loadSubscription: Checking RevenueCat for active subscription...');
      const { appleIAPService: iapService } = getIAPService();
      
      try {
        // Check if user has active subscription via RevenueCat
        const hasActive = await iapService.hasActiveSubscription();
        console.log('[STORE] loadSubscription: hasActiveSubscription result:', hasActive);
        
        if (hasActive) {
          // Get detailed subscription info
          const customerInfo = await iapService.getCustomerInfo();
          if (customerInfo) {
            const entitlement = customerInfo.entitlements.active['GutCheck Premium'];
            if (entitlement) {
              const subscription = {
                productId: entitlement.productIdentifier,
                transactionId: entitlement.transactionIdentifier || '',
                purchaseDate: entitlement.latestPurchaseDate || new Date().toISOString(),
                expirationDate: entitlement.expirationDate || undefined,
                isActive: true,
              };
              
              console.log('[STORE] ✅ Active subscription found:', subscription.productId);
              set({ subscription, isLoading: false });
              
              // Find current plan based on product ID
              const plans = get().plans;
              const plan = plans.find(p => p.productId === subscription.productId);
              if (plan) {
                set({ currentPlan: plan });
              }
              
              return;
            }
          }
        }
        
        // No active subscription found
        console.log('[STORE] loadSubscription: No active subscription found');
        set({ subscription: null, currentPlan: null, isLoading: false });
      } catch (iapError: any) {
        console.error('[STORE] Failed to check subscription status:', iapError);
        // Fallback to local storage if RevenueCat fails
        const subscriptionStatus = await AsyncStorage.getItem('subscription_status');
        const subscriptionPlan = await AsyncStorage.getItem('subscription_plan');
        const subscription = subscriptionStatus === 'active' ? {
          productId: (() => {
            const { PRODUCT_IDS: ids } = getIAPService();
            return subscriptionPlan === 'monthly' ? ids.PREMIUM_MONTHLY : ids.PREMIUM_YEARLY;
          })(),
          transactionId: 'local_storage',
          purchaseDate: new Date().toISOString(),
          isActive: true
        } : null;
        
        if (subscription) {
          set({ subscription, isLoading: false });
          const plans = get().plans;
          const plan = plans.find(p => p.productId === subscription.productId);
          if (plan) {
            set({ currentPlan: plan });
          }
        } else {
          set({ subscription: null, currentPlan: null, isLoading: false });
        }
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
      const currentStatus = await getLifetimeProService().checkUserLifetimeProStatus(userId);
      console.log('[STORE] checkLifetimePro: Database status for user:', userId, 'is:', currentStatus);
      
      // CRITICAL: If database explicitly says FALSE, do NOT re-grant even if eligible
      // This prevents re-granting after explicit removal for testing
      if (currentStatus === false) {
        console.log('[STORE] checkLifetimePro: User has explicitly been removed from lifetime pro. Not re-granting.');
        const { count } = await getLifetimeProService().checkLifetimeProEligibility(userId);
        set({ 
          isLifetimePro: false, 
          lifetimeProCount: count, 
          isLoading: false 
        });
        return; // EXIT EARLY - don't grant even if eligible
      }
      
      // If database says true, user is lifetime pro - just update count
      if (currentStatus === true) {
        console.log('[STORE] checkLifetimePro: User already has lifetime pro in database.');
        const { count } = await getLifetimeProService().checkLifetimeProEligibility(userId);
        set({ 
          isLifetimePro: true, 
          lifetimeProCount: count, 
          isLoading: false 
        });
        return; // EXIT EARLY - already lifetime pro
      }
      
      // If database status is null/undefined (new user), check eligibility
      const { isEligible, isLifetimePro, count } = await getLifetimeProService().checkLifetimeProEligibility(userId);
      
      set({ 
        isLifetimePro: isLifetimePro, 
        lifetimeProCount: count, 
        isLoading: false 
      });
      
      // Only grant if eligible AND user doesn't already have it (for new users only)
      if (isEligible && !isLifetimePro) {
        console.log('[STORE] checkLifetimePro: New user is eligible, granting lifetime pro...');
        const result = await getLifetimeProService().grantLifetimePro(userId);
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
        const dbStatus = await getLifetimeProService().checkUserLifetimeProStatus(userId);
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
      const { appleIAPService: iapService } = getIAPService();
      const result = await iapService.purchaseProduct(plan.productId);
      const subscription = result.success ? result.subscription : null;
      
      if (subscription) {
        // Set subscription in store immediately - purchase result is source of truth
        set({ subscription, currentPlan: plan, isLoading: false });
        
        // Save subscription status to AsyncStorage
        await AsyncStorage.setItem('subscription_status', 'active');
        await AsyncStorage.setItem('subscription_plan', planId);
        
        // DON'T refresh from RevenueCat - purchase result already has subscription
        // Calling RevenueCat here can crash during navigation transitions
        console.log('[STORE] ✅ Subscription set in store from purchase result');
        
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
      
      // SECURITY: Only allow restore if user is logged in (has user_id)
      // This prevents new users from restoring purchases that don't belong to them
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        console.warn('[STORE] Restore purchases blocked - no user ID (user not logged in)');
        set({ isLoading: false, error: 'You must be logged in to restore purchases' });
        return { 
          success: false, 
          error: 'You must be logged in to restore purchases. Please create an account first.' 
        };
      }
      
      console.log('[STORE] Restoring purchases for user:', userId);
      
      // CRITICAL: Set the RevenueCat user ID before restoring
      // This ensures RevenueCat only returns purchases linked to this user
      const { appleIAPService: iapService } = getIAPService();
      
      // Set the RevenueCat user ID to link purchases to this account
      // The iapService is actually the revenueCatService instance
      if (iapService && typeof iapService.setAppUserID === 'function') {
        try {
          await iapService.setAppUserID(userId);
          console.log('[STORE] RevenueCat user ID set before restore');
        } catch (setUserIdError) {
          console.warn('[STORE] Failed to set RevenueCat user ID:', setUserIdError);
          // Continue anyway - RevenueCat might still work
        }
      }
      
      // Restore purchases through Apple IAP/RevenueCat
      const result = await iapService.restorePurchases();
      const subscriptions = result.success ? result.subscriptions || [] : [];
      
      if (subscriptions && subscriptions.length > 0) {
        const activeSubscription = subscriptions.find(sub => sub.isActive);
        
        if (activeSubscription) {
          // SECURITY: Verify the purchase belongs to the current user
          // RevenueCat should only return purchases for the logged-in user,
          // but we double-check by ensuring we have a user_id
          console.log('[STORE] ✅ Active subscription found and verified for user:', userId);
          
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
          console.log('[STORE] No active subscription found in restored purchases');
          set({ subscription: null, currentPlan: null, isLoading: false });
          return { success: true };
        }
      } else {
        console.log('[STORE] No purchases found to restore for user:', userId);
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
