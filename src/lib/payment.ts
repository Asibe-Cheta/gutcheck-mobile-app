/**
 * Privacy-Focused Payment Service
 * Maintains user anonymity while processing payments
 */

import { supabase } from './supabase';
import Constants from 'expo-constants';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  anonymousUserId: string;
  createdAt: Date;
}

export interface AnonymousPayment {
  id: string;
  anonymousUserId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: 'card' | 'apple_pay' | 'google_pay';
  billingInfo: {
    // Only collect minimal required info
    country: string;
    postalCode?: string; // Optional for some countries
  };
  createdAt: Date;
  completedAt?: Date;
}

class PrivacyPaymentService {
  private apiUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_STRIPE_API_URL || 'https://api.stripe.com/v1';
  private publishableKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  constructor() {
    // Silent initialization
  }

  /**
   * Create anonymous payment session
   * Separates payment data from user analysis data
   */
  async createAnonymousPaymentSession(
    anonymousUserId: string,
    amount: number,
    currency: string = 'gbp'
  ): Promise<{ sessionId: string; error: string | null }> {
    try {
      if (!this.publishableKey) {
        return { sessionId: '', error: 'Payment system not configured' };
      }

      // Create anonymous payment record
      const paymentRecord = await this.createAnonymousPaymentRecord({
        anonymousUserId,
        amount,
        currency,
        status: 'pending',
        paymentMethod: 'card',
        billingInfo: {
          country: 'GB', // Default to UK
        },
      });

      if (!paymentRecord) {
        return { sessionId: '', error: 'Failed to create payment record' };
      }

      // Create Stripe session with minimal data
      const sessionData = {
        payment_method_types: ['card', 'apple_pay', 'google_pay'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: 'GutCheck Premium',
                description: 'Anonymous relationship analysis service',
              },
              unit_amount: amount * 100, // Convert to pence
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `gutcheck://payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `gutcheck://payment/cancel`,
        metadata: {
          anonymousUserId: anonymousUserId,
          paymentRecordId: paymentRecord.id,
          // No personal information in metadata
        },
        // Privacy-focused settings
        billing_address_collection: 'auto', // Let Stripe handle this
        customer_creation: 'if_required', // Only create customer if needed
        payment_intent_data: {
          metadata: {
            anonymousUserId: anonymousUserId,
            // No personal data
          },
        },
      };

      // In a real implementation, this would call your backend
      // For now, return a mock session ID
      const mockSessionId = `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return { sessionId: mockSessionId, error: null };
    } catch (error) {
      console.error('Create payment session error:', error);
      return { sessionId: '', error: 'Failed to create payment session' };
    }
  }

  /**
   * Create anonymous payment record
   * Stores payment info separately from user data
   */
  private async createAnonymousPaymentRecord(
    paymentData: Omit<AnonymousPayment, 'id' | 'createdAt'>
  ): Promise<AnonymousPayment | null> {
    try {
      const { data, error } = await supabase
        .from('anonymous_payments')
        .insert({
          anonymous_user_id: paymentData.anonymousUserId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: paymentData.status,
          payment_method: paymentData.paymentMethod,
          billing_info: paymentData.billingInfo,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Create payment record error:', error);
        return null;
      }

      return {
        id: data.id,
        anonymousUserId: data.anonymous_user_id,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        paymentMethod: data.payment_method,
        billingInfo: data.billing_info,
        createdAt: new Date(data.created_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      };
    } catch (error) {
      console.error('Create payment record error:', error);
      return null;
    }
  }

  /**
   * Update payment status
   * Called when payment is completed
   */
  async updatePaymentStatus(
    sessionId: string,
    status: 'completed' | 'failed'
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('anonymous_payments')
        .update({
          status: status,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
        })
        .eq('stripe_session_id', sessionId);

      if (error) {
        console.error('Update payment status error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Update payment status error:', error);
      return { success: false, error: 'Failed to update payment status' };
    }
  }

  /**
   * Get payment status for anonymous user
   * Returns only payment status, no personal data
   */
  async getPaymentStatus(anonymousUserId: string): Promise<{
    hasActivePayment: boolean;
    paymentStatus: string | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('anonymous_payments')
        .select('status, created_at')
        .eq('anonymous_user_id', anonymousUserId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Get payment status error:', error);
        return { hasActivePayment: false, paymentStatus: null, error: error.message };
      }

      return {
        hasActivePayment: !!data,
        paymentStatus: data?.status || null,
        error: null,
      };
    } catch (error) {
      console.error('Get payment status error:', error);
      return { hasActivePayment: false, paymentStatus: null, error: 'Failed to get payment status' };
    }
  }

  /**
   * Privacy-focused payment messaging
   */
  getPrivacyMessage(): string {
    return `Your payment information is processed securely and separately from your analysis data. We never link your payment details to your relationship analysis content.`;
  }

  /**
   * Get anonymous billing description
   */
  getBillingDescription(): string {
    return 'GutCheck Premium - Anonymous Analysis Service';
  }
}

export const privacyPaymentService = new PrivacyPaymentService();
