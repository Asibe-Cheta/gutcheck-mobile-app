/**
 * Apple In-App Purchase Service
 * Handles Apple IAP with graceful fallback for development
 */

import Constants from 'expo-constants';

// Check if we're in Expo Go (development) or standalone build (production/TestFlight)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Dynamic import to prevent native module errors in development
let InAppPurchases: any = null;

// TEMPORARY: Flag to completely disable IAP native module loading
// Set to true to bypass native module entirely (for testing crash)
// KEEP AS TRUE until we can properly debug the native module crash
// The crash happens when require('expo-in-app-purchases') is called
const BYPASS_IAP_NATIVE_MODULE = true; // Keep bypassed - native module causes crash

// Function to load IAP module - can be called at runtime if initial load fails
function loadIAPModule(): boolean {
  if (InAppPurchases) {
    console.log('[IAP] Module already loaded');
    return true; // Already loaded
  }
  
  // TEMPORARY: Completely bypass native module loading if flag is set
  if (BYPASS_IAP_NATIVE_MODULE) {
    console.log('[IAP] ⚠️ BYPASS_IAP_NATIVE_MODULE is true - skipping native module load');
    console.log('[IAP] This is a test mode to determine if native module is causing crash');
    InAppPurchases = null;
    return false; // Return false but don't crash
  }
  
  try {
    // Only load in standalone builds (production/TestFlight), not Expo Go
    if (!isExpoGo) {
      console.log('[IAP] Attempting to require expo-in-app-purchases...');
      const expoIAP = require('expo-in-app-purchases');
      console.log('[IAP] expo-in-app-purchases module:', expoIAP);
      
      // Try different import structures
      if (expoIAP.InAppPurchases) {
        InAppPurchases = expoIAP.InAppPurchases;
      } else if (expoIAP.default) {
        InAppPurchases = expoIAP.default;
      } else if (typeof expoIAP === 'object' && expoIAP.connectAsync) {
        // Module exports directly
        InAppPurchases = expoIAP;
      } else {
        console.error('[IAP] Unexpected module structure:', Object.keys(expoIAP));
        InAppPurchases = null;
        return false;
      }
      
      console.log('[IAP] Module loaded successfully. Available methods:', Object.keys(InAppPurchases || {}));
      return true;
    } else {
      console.log('[IAP] Skipping load - in Expo Go');
    }
  } catch (error) {
    console.error('[IAP] expo-in-app-purchases not available:', error);
    console.error('[IAP] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    InAppPurchases = null;
  }
  
  return !!InAppPurchases;
}

// DO NOT call loadIAPModule() here - it runs at module evaluation time
// and crashes if the native module isn't ready. Only load when actually needed.
// loadIAPModule() will be called when the service is first used.

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

      // Load IAP module on first use (lazy loading)
      if (!InAppPurchases) {
        const loaded = loadIAPModule();
        if (!loaded) {
          console.log('[IAP] Apple IAP not available - using mock mode');
          return { success: true }; // Allow app to continue without IAP
        }
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
    // If bypass is enabled, return mock products so app doesn't crash
    if (BYPASS_IAP_NATIVE_MODULE) {
      console.log('[IAP] getProducts: Bypass enabled, returning mock products');
      return {
        success: true,
        products: [
          {
            productId: PRODUCT_IDS.PREMIUM_MONTHLY,
            title: 'Premium Monthly',
            description: 'Full access to all features',
            price: 9.99,
            currency: 'GBP',
          },
          {
            productId: PRODUCT_IDS.PREMIUM_YEARLY,
            title: 'Premium Yearly',
            description: 'Full access to all features - Save 17%',
            price: 99.99,
            currency: 'GBP',
          }
        ]
      };
    }
    
    // Load IAP module on first use (lazy loading)
    if (!InAppPurchases) {
      const loaded = loadIAPModule();
      if (!loaded) {
        return {
          success: false,
          error: 'IAP module not available'
        };
      }
    }
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

      console.log('[IAP] Calling getProductsAsync with product IDs:', [
        PRODUCT_IDS.PREMIUM_MONTHLY,
        PRODUCT_IDS.PREMIUM_YEARLY
      ]);
      
      const productsResult = await InAppPurchases.getProductsAsync([
        PRODUCT_IDS.PREMIUM_MONTHLY,
        PRODUCT_IDS.PREMIUM_YEARLY
      ]);
      
      console.log('[IAP] getProductsAsync response:', JSON.stringify(productsResult, null, 2));
      
      // The response structure from expo-in-app-purchases:
      // { results: Array<Product>, responseCode: number }
      const products = productsResult.results || productsResult;
      
      if (products && products.length > 0) {
        console.log('[IAP] ✅ Successfully loaded', products.length, 'products from App Store Connect:');
        products.forEach((product: any) => {
          console.log(`[IAP]   - ${product.productId}: ${product.title} (${product.price} ${product.currency})`);
        });
      } else {
        console.warn('[IAP] ⚠️ No products returned from App Store Connect. Response:', productsResult);
      }
      
      return { success: true, products: Array.isArray(products) ? products : [products] };
    } catch (error) {
      console.error('Failed to get products:', error);
      return { success: false, error: 'Failed to get products' };
    }
  }

  async purchaseProduct(productId: string): Promise<{ success: boolean; subscription?: AppleSubscription; error?: string }> {
    try {
      // If bypass is enabled, return a clear error message
      if (BYPASS_IAP_NATIVE_MODULE) {
        return {
          success: false,
          error: 'IAP functionality is currently disabled for testing. The native module causes crashes. Please contact support or wait for the next update.'
        };
      }
      
      // Only block in Expo Go - TestFlight/App Store builds should have IAP available
      if (isExpoGo) {
        return {
          success: false,
          error: 'In-App Purchases not available in Expo Go. Use a TestFlight or production build for testing.'
        };
      }

      // Try to load module if not already loaded (runtime fallback)
      if (!InAppPurchases) {
        console.log('[IAP] Module not loaded, attempting to load...');
        const loaded = loadIAPModule();
        if (!loaded || !InAppPurchases) {
          console.error('[IAP] Module not available in standalone build - this is unexpected');
          console.error('[IAP] Execution environment:', Constants.executionEnvironment);
          console.error('[IAP] isExpoGo:', isExpoGo);
          return {
            success: false,
            error: 'In-App Purchases are not available. Please ensure the app is built with expo-in-app-purchases included and rebuilt after installing the package.'
          };
        }
      }

      // Verify purchaseItemAsync exists
      if (!InAppPurchases.purchaseItemAsync) {
        console.error('[IAP] purchaseItemAsync not found. Available methods:', Object.keys(InAppPurchases));
        return {
          success: false,
          error: 'In-App Purchase method not found. The expo-in-app-purchases module may not be properly linked. Please rebuild the app.'
        };
      }

      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return {
            success: false,
            error: initResult.error || 'Failed to initialize IAP'
          };
        }
      }

      // CRITICAL: Query products from store before purchase (required by Apple)
      console.log('[IAP] Querying products from store before purchase...');
      try {
        const productsResult = await InAppPurchases.getProductsAsync([
          PRODUCT_IDS.PREMIUM_MONTHLY,
          PRODUCT_IDS.PREMIUM_YEARLY
        ]);
        console.log('[IAP] Products queried successfully:', productsResult.results?.length || 0);
        
        // Verify the product we want to purchase exists
        const productExists = productsResult.results?.some(
          (p: any) => p.productId === productId
        );
        if (!productExists) {
          console.error('[IAP] Product not found in store:', productId);
          return {
            success: false,
            error: `Product ${productId} not found in App Store. Please ensure it's configured in App Store Connect.`
          };
        }
      } catch (queryError: any) {
        console.error('[IAP] Failed to query products:', queryError);
        return {
          success: false,
          error: `Failed to query products from store: ${queryError?.message || 'Unknown error'}`
        };
      }

      console.log('[IAP] Calling purchaseItemAsync for product:', productId);
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
      // Load IAP module on first use (lazy loading)
      if (!InAppPurchases) {
        const loaded = loadIAPModule();
        if (!loaded) {
          return {
            success: false,
            error: 'IAP module not available'
          };
        }
      }

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