/**
 * Payment Form Component
 * Handles Stripe payment processing with British Pounds
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
// DEPRECATED: Stripe not used - using Apple IAP instead
// import { useStripe } from '@stripe/stripe-react-native';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';

interface PaymentFormProps {
  planId: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function PaymentForm({ planId, amount, currency, onSuccess, onError }: PaymentFormProps) {
  // DEPRECATED: Stripe not used - using Apple IAP instead
  // const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { colors } = getThemeColors(useTheme().isDark);
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    // DEPRECATED: This component is not used - Apple IAP is used instead
    setIsLoading(true);
    onError('This payment method is deprecated. Please use Apple In-App Purchase.');
    setIsLoading(false);
    return;
    
    // Original Stripe code (commented out):
    /*
    setIsLoading(true);
    
    try {
      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'GutCheck',
        paymentIntentClientSecret: '', // This will be provided by your backend
        defaultBillingDetails: {
          name: 'Customer Name',
        },
        allowsDelayedPaymentMethods: true,
      });

      if (initError) {
        onError(initError.message);
        return;
      }

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        onError(presentError.message);
        return;
      }

      // Payment succeeded
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
    */
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.paymentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.planName, { color: colors.textPrimary }]}>
          {planId === 'premium' ? 'Premium Plan' : 'Premium Yearly Plan'}
        </Text>
        
        <Text style={[styles.price, { color: colors.primary }]}>
          {formatPrice(amount, currency)}
          <Text style={[styles.interval, { color: colors.textSecondary }]}>
            /{planId === 'premium' ? 'month' : 'year'}
          </Text>
        </Text>

        <TouchableOpacity
          style={[
            styles.payButton,
            { backgroundColor: colors.primary },
            isLoading && styles.payButtonDisabled
          ]}
          onPress={handlePayment}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>
              Subscribe Now
            </Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.securityText, { color: colors.textSecondary }]}>
          🔒 Secure payment powered by Stripe
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  paymentCard: {
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  interval: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  payButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  securityText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
