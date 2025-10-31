/**
 * Apple In-App Purchase Service
 * Handles Apple IAP with graceful fallback for development
 */

import Constants from 'expo-constants';

// Check if we're in Expo Go (development) or standalone build (production/TestFlight)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Dynamic import to prevent native module errors in development
let InAppPurchases: any = null;

// Function to load IAP module - can be called at runtime if initial load fails
function loadIAPModule(): boolean {
  if (InAppPurchases) return true; // Already loaded
  
  try {
    // Only load in standalone builds (production/TestFlight), not Expo Go
    if (!isExpoGo) {
      InAppPurchases = require('expo-in-app-purchases').InAppPurchases;
      console.log('IAP module loaded successfully');
      return true;
    }
  } catch (error) {
    console.error('expo-in-app-purchases not available:', error);
    InAppPurchases = null;
  }
  
  return !!InAppPurchases;
}

// Try to load initially
loadIAPModule();

export interface AppleSubscription {
  productId: string;
  transactionId: string;
  purchaseDate: string;
  expirationDate?: string;
  isActive: boolean;
}

export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com.mygutcheck.premium.monthly',
  PREMIUM_YEARLY: 'com.mygutcheck.premium.yearly',
};

class AppleIAPService {
  private isInitialized = false;

  async initialize(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.isInitialized) {
        return { success: true };
      }

      // Check if IAP is available (not in Expo Go)
      if (!InAppPurchases) {
        console.log('Apple IAP not available in Expo Go - using mock mode');
        return { success: true };
      }

      await InAppPurchases.connectAsync();
      this.isInitialized = true;
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize Apple IAP:', error);
      return { success: false, error: 'Failed to initialize IAP' };
    }
  }

  async getProducts(): Promise<{ success: boolean; products?: any[]; error?: string }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // In development/Expo Go, return mock products
      if (!InAppPurchases) {
        return {
          success: true,
          products: [
            {
              productId: PRODUCT_IDS.PREMIUM_MONTHLY,
              price: 9.99,
              currency: 'GBP',
              title: 'Premium Monthly',
              description: 'Monthly premium subscription'
            },
            {
              productId: PRODUCT_IDS.PREMIUM_YEARLY,
              price: 99.99,
              currency: 'GBP',
              title: 'Premium Yearly',
              description: 'Yearly premium subscription'
            }
          ]
        };
      }

      const products = await InAppPurchases.getProductsAsync([
        PRODUCT_IDS.PREMIUM_MONTHLY,
        PRODUCT_IDS.PREMIUM_YEARLY
      ]);

      return { success: true, products };
    } catch (error) {
      console.error('Failed to get products:', error);
      return { success: false, error: 'Failed to get products' };
    }
  }

  async purchaseProduct(productId: string): Promise<{ success: boolean; subscription?: AppleSubscription; error?: string }> {
    try {
      // Only block in Expo Go - TestFlight/App Store builds should have IAP available
      if (isExpoGo) {
        return {
          success: false,
          error: 'In-App Purchases not available in Expo Go. Use a TestFlight or production build for testing.'
        };
      }

      // Try to load module if not already loaded (runtime fallback)
      if (!InAppPurchases) {
        const loaded = loadIAPModule();
        if (!loaded) {
          console.error('IAP module not available in standalone build - this is unexpected');
          return {
            success: false,
            error: 'In-App Purchases are not available. Please ensure the app is built with expo-in-app-purchases included.'
          };
        }
      }

      if (!this.isInitialized) {
        await this.initialize();
      }

      const result = await InAppPurchases.purchaseItemAsync(productId);
      
      if (result.responseCode === 0) { // Success
        const subscription: AppleSubscription = {
          productId: result.productId,
          transactionId: result.transactionId,
          purchaseDate: result.purchaseDate,
          expirationDate: result.expirationDate,
          isActive: true
        };
        return { success: true, subscription };
      } else {
        return { success: false, error: `Purchase failed with code: ${result.responseCode}` };
      }
    } catch (error: any) {
      console.error('Purchase failed:', error);
      return { 
        success: false, 
        error: error?.message || 'Purchase failed. Please try again.' 
      };
    }
  }

  async restorePurchases(): Promise<{ success: boolean; subscriptions?: AppleSubscription[]; error?: string }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // In development/Expo Go, return empty
      if (!InAppPurchases) {
        return {
          success: true,
          subscriptions: []
        };
      }

      const result = await InAppPurchases.getPurchaseHistoryAsync();
      
      const subscriptions: AppleSubscription[] = result.results.map((item: any) => ({
        productId: item.productId,
        transactionId: item.transactionId,
        purchaseDate: item.purchaseDate,
        expirationDate: item.expirationDate,
        isActive: true
      }));

      return { success: true, subscriptions };
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return { success: false, error: 'Failed to restore purchases' };
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (InAppPurchases && this.isInitialized) {
        await InAppPurchases.disconnectAsync();
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('Failed to disconnect IAP:', error);
    }
  }
}

export const appleIAPService = new AppleIAPService();