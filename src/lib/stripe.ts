/**
 * Stripe Subscription Service
 * Handles subscription management and payment processing
 */

import { db } from './supabase';
import Constants from 'expo-constants';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripe_price_id: string;
  is_popular?: boolean;
}

export interface SubscriptionStatus {
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
  plan: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end?: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  is_default: boolean;
}

class StripeService {
  private apiUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_STRIPE_API_URL || 'https://api.stripe.com/v1';
  private publishableKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  constructor() {
    // Silent initialization
  }

  // Available subscription plans (DEPRECATED - Using Apple IAP now)
  private plans: SubscriptionPlan[] = [
    {
      id: 'premium',
      name: 'Premium Monthly',
      description: 'Just for 33p a day',
      price: 9.99,
      currency: 'gbp',
      interval: 'month',
      features: [
        'Unlimited AI conversations',
        'Advanced relationship analysis',
        'Priority support',
        'Image analysis',
        'Pattern tracking',
        'Export conversations',
        'Crisis detection',
      ],
      stripe_price_id: Constants.expoConfig?.extra?.EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID || '',
      is_popular: true,
    },
    {
      id: 'premium-yearly',
      name: 'Premium Yearly',
      description: 'Just for 27p a day',
      price: 99.99,
      currency: 'gbp',
      interval: 'year',
      features: [
        'Unlimited AI conversations',
        'Advanced relationship analysis',
        'Priority support',
        'Image analysis',
        'Pattern tracking',
        'Export conversations',
        'Crisis detection',
        'Save 17% vs monthly',
      ],
      stripe_price_id: Constants.expoConfig?.extra?.EXPO_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
    },
  ];

  // Get available plans
  getPlans(): SubscriptionPlan[] {
    return this.plans;
  }

  // Get plan by ID
  getPlan(planId: string): SubscriptionPlan | null {
    return this.plans.find(plan => plan.id === planId) || null;
  }

  // Create customer
  async createCustomer(userId: string, email: string): Promise<{ customerId: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.publishableKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email,
          metadata: JSON.stringify({ user_id: userId }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { customerId: '', error: error.message };
      }

      const customer = await response.json();
      return { customerId: customer.id };
    } catch (error) {
      console.error('Create customer error:', error);
      return { customerId: '', error: 'Failed to create customer' };
    }
  }

  // Create subscription
  async createSubscription(
    customerId: string, 
    priceId: string, 
    trialDays?: number
  ): Promise<{ subscriptionId: string; clientSecret?: string; error?: string }> {
    try {
      const params: any = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      };

      if (trialDays) {
        params.trial_period_days = trialDays;
      }

      const response = await fetch(`${this.apiUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.publishableKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
      });

      if (!response.ok) {
        const error = await response.json();
        return { subscriptionId: '', error: error.message };
      }

      const subscription = await response.json();
      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      };
    } catch (error) {
      console.error('Create subscription error:', error);
      return { subscriptionId: '', error: 'Failed to create subscription' };
    }
  }

  // Get subscription status
  async getSubscriptionStatus(subscriptionId: string): Promise<{ status: SubscriptionStatus | null; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.publishableKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return { status: null, error: error.message };
      }

      const subscription = await response.json();
      return {
        status: {
          status: subscription.status,
          plan: subscription.items.data[0].price.id,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : undefined,
        },
      };
    } catch (error) {
      console.error('Get subscription status error:', error);
      return { status: null, error: 'Failed to get subscription status' };
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, immediately = false): Promise<{ success: boolean; error?: string }> {
    try {
      const params = immediately ? { prorate: true } : { cancel_at_period_end: true };
      
      const response = await fetch(`${this.apiUrl}/subscriptions/${subscriptionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.publishableKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Cancel subscription error:', error);
      return { success: false, error: 'Failed to cancel subscription' };
    }
  }

  // Update subscription
  async updateSubscription(
    subscriptionId: string, 
    newPriceId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current subscription
      const { status } = await this.getSubscriptionStatus(subscriptionId);
      if (!status) {
        return { success: false, error: 'Subscription not found' };
      }

      // Update subscription items
      const response = await fetch(`${this.apiUrl}/subscriptions/${subscriptionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.publishableKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          items: JSON.stringify([{
            id: status.plan,
            price: newPriceId,
          }]),
          proration_behavior: 'create_prorations',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update subscription error:', error);
      return { success: false, error: 'Failed to update subscription' };
    }
  }

  // Get payment methods
  async getPaymentMethods(customerId: string): Promise<{ methods: PaymentMethod[]; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/payment_methods?customer=${customerId}&type=card`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.publishableKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return { methods: [], error: error.message };
      }

      const data = await response.json();
      const methods: PaymentMethod[] = data.data.map((method: any) => ({
        id: method.id,
        type: method.type,
        card: method.card ? {
          brand: method.card.brand,
          last4: method.card.last4,
          exp_month: method.card.exp_month,
          exp_year: method.card.exp_year,
        } : undefined,
        is_default: method.id === data.data[0]?.id, // Simplified logic
      }));

      return { methods };
    } catch (error) {
      console.error('Get payment methods error:', error);
      return { methods: [], error: 'Failed to get payment methods' };
    }
  }

  // Create payment intent for one-time payments
  async createPaymentIntent(
    amount: number, 
    currency: string, 
    customerId?: string
  ): Promise<{ clientSecret: string; error?: string }> {
    try {
      const params: any = {
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        automatic_payment_methods: { enabled: true },
      };

      if (customerId) {
        params.customer = customerId;
      }

      const response = await fetch(`${this.apiUrl}/payment_intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.publishableKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
      });

      if (!response.ok) {
        const error = await response.json();
        return { clientSecret: '', error: error.message };
      }

      const paymentIntent = await response.json();
      return { clientSecret: paymentIntent.client_secret };
    } catch (error) {
      console.error('Create payment intent error:', error);
      return { clientSecret: '', error: 'Failed to create payment intent' };
    }
  }

  // Handle webhook events (server-side)
  async handleWebhook(event: any): Promise<{ success: boolean; error?: string }> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
      }

      return { success: true };
    } catch (error) {
      console.error('Webhook handling error:', error);
      return { success: false, error: 'Failed to handle webhook' };
    }
  }

  // Handle subscription updates
  private async handleSubscriptionUpdate(subscription: any): Promise<void> {
    try {
      const userId = subscription.metadata?.user_id;
      if (!userId) return;

      await db.createSubscription({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: subscription.status,
        plan: subscription.items.data[0].price.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      });

      // Update user subscription status
      await db.updateUser(userId, {
        subscription_status: subscription.status,
        subscription_plan: subscription.items.data[0].price.id,
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      });
    } catch (error) {
      console.error('Handle subscription update error:', error);
    }
  }

  // Handle subscription cancellation
  private async handleSubscriptionCancellation(subscription: any): Promise<void> {
    try {
      const userId = subscription.metadata?.user_id;
      if (!userId) return;

      await db.updateUser(userId, {
        subscription_status: 'canceled',
        subscription_plan: 'free',
      });
    } catch (error) {
      console.error('Handle subscription cancellation error:', error);
    }
  }

  // Handle payment success
  private async handlePaymentSuccess(invoice: any): Promise<void> {
    try {
      // Update user's analysis limit if needed
      const subscription = await db.getSubscription(invoice.subscription);
      if (subscription) {
        await db.updateUser(subscription.user_id, {
          analysis_limit: -1, // Unlimited for premium
        });
      }
    } catch (error) {
      console.error('Handle payment success error:', error);
    }
  }

  // Handle payment failure
  private async handlePaymentFailure(invoice: any): Promise<void> {
    try {
      // Handle failed payment
      console.log('Payment failed for invoice:', invoice.id);
    } catch (error) {
      console.error('Handle payment failure error:', error);
    }
  }
}

export const stripeService = new StripeService();
