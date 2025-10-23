/**
 * Apple In-App Purchase Service
 * Handles Apple IAP with graceful fallback for development
 */

// Dynamic import to prevent native module errors in development
let InAppPurchases: any = null;

try {
  InAppPurchases = require('expo-in-app-purchases').InAppPurchases;
} catch (error) {
  console.log('expo-in-app-purchases not available - using mock mode');
  InAppPurchases = null;
}

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
      if (!this.isInitialized) {
        await this.initialize();
      }

      // In development/Expo Go, simulate purchase failure
      if (!InAppPurchases) {
        return {
          success: false,
          error: 'In-App Purchases not available in development mode. Use a development build for testing.'
        };
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
        return { success: false, error: 'Purchase failed' };
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      return { success: false, error: 'Purchase failed' };
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