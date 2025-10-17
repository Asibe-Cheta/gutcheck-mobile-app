/**
 * Subscription Store
 * Manages subscription state and operations using Zustand
 */

import { create } from 'zustand';
import { stripeService, SubscriptionPlan, SubscriptionStatus, PaymentMethod } from '@/lib/stripe';
import { db } from '@/lib/supabase';
import { useAuthStore } from './authStore';

interface SubscriptionState {
  plans: SubscriptionPlan[];
  currentPlan: SubscriptionPlan | null;
  subscription: SubscriptionStatus | null;
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadPlans: () => Promise<void>;
  loadSubscription: (userId: string) => Promise<void>;
  loadPaymentMethods: (customerId: string) => Promise<void>;
  subscribeToPlan: (planId: string, customerId?: string) => Promise<{ success: boolean; error?: string; clientSecret?: string }>;
  cancelSubscription: (subscriptionId: string, immediately?: boolean) => Promise<{ success: boolean; error?: string }>;
  updateSubscription: (subscriptionId: string, newPlanId: string) => Promise<{ success: boolean; error?: string }>;
  createPaymentIntent: (amount: number, currency: string, customerId?: string) => Promise<{ clientSecret: string; error?: string }>;
  clearError: () => void;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  plans: [],
  currentPlan: null,
  subscription: null,
  paymentMethods: [],
  isLoading: false,
  error: null,

  loadPlans: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const plans = stripeService.getPlans();
      set({ plans, isLoading: false });
    } catch (error) {
      console.error('Load plans error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load plans',
      });
    }
  },

  loadSubscription: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const subscription = await db.getSubscription(userId);
      
      if (subscription) {
        const { status } = await stripeService.getSubscriptionStatus(subscription.stripe_subscription_id);
        
        if (status) {
          set({ subscription: status, isLoading: false });
          
          // Find current plan
          const plan = stripeService.getPlan(subscription.plan);
          if (plan) {
            set({ currentPlan: plan });
          }
        } else {
          set({ subscription: null, currentPlan: null, isLoading: false });
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

  loadPaymentMethods: async (customerId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { methods, error } = await stripeService.getPaymentMethods(customerId);
      
      if (error) {
        set({ isLoading: false, error });
        return;
      }
      
      set({ paymentMethods: methods, isLoading: false });
    } catch (error) {
      console.error('Load payment methods error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load payment methods',
      });
    }
  },

  subscribeToPlan: async (planId: string, customerId?: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const plan = stripeService.getPlan(planId);
      if (!plan) {
        set({ isLoading: false, error: 'Plan not found' });
        return { success: false, error: 'Plan not found' };
      }

      if (plan.price === 0) {
        // Free plan - no payment required
        const user = useAuthStore.getState().user;
        if (user) {
          await db.updateUser(user.id, {
            subscription_plan: planId,
            subscription_status: 'active',
            analysis_limit: 10,
          });
        }
        set({ isLoading: false });
        return { success: true };
      }

      if (!customerId) {
        set({ isLoading: false, error: 'Customer ID required for paid plans' });
        return { success: false, error: 'Customer ID required for paid plans' };
      }

      // Create subscription with 7-day trial
      const { subscriptionId, clientSecret, error } = await stripeService.createSubscription(
        customerId,
        plan.stripe_price_id,
        7 // 7-day trial
      );

      if (error) {
        set({ isLoading: false, error });
        return { success: false, error };
      }

      set({ isLoading: false });
      return { success: true, clientSecret };
    } catch (error) {
      console.error('Subscribe to plan error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe to plan',
      });
      return { success: false, error: 'Failed to subscribe to plan' };
    }
  },

  cancelSubscription: async (subscriptionId: string, immediately = false) => {
    try {
      set({ isLoading: true, error: null });
      
      const { success, error } = await stripeService.cancelSubscription(subscriptionId, immediately);
      
      if (error) {
        set({ isLoading: false, error });
        return { success: false, error };
      }

      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      console.error('Cancel subscription error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
      });
      return { success: false, error: 'Failed to cancel subscription' };
    }
  },

  updateSubscription: async (subscriptionId: string, newPlanId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const newPlan = stripeService.getPlan(newPlanId);
      if (!newPlan) {
        set({ isLoading: false, error: 'Plan not found' });
        return { success: false, error: 'Plan not found' };
      }

      const { success, error } = await stripeService.updateSubscription(subscriptionId, newPlan.stripe_price_id);
      
      if (error) {
        set({ isLoading: false, error });
        return { success: false, error };
      }

      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      console.error('Update subscription error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update subscription',
      });
      return { success: false, error: 'Failed to update subscription' };
    }
  },

  createPaymentIntent: async (amount: number, currency: string, customerId?: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { clientSecret, error } = await stripeService.createPaymentIntent(amount, currency, customerId);
      
      if (error) {
        set({ isLoading: false, error });
        return { clientSecret: '', error };
      }

      set({ isLoading: false });
      return { clientSecret };
    } catch (error) {
      console.error('Create payment intent error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create payment intent',
      });
      return { clientSecret: '', error: 'Failed to create payment intent' };
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
      paymentMethods: [],
      isLoading: false,
      error: null,
    });
  },
}));
