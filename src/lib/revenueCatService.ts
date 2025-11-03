/**
 * RevenueCat IAP Service
 * Handles Apple In-App Purchases via RevenueCat SDK
 * Replaces expo-in-app-purchases for better reliability and linking support
 */

import Purchases, {
  CustomerInfo,
  Offerings,
  PurchasesOffering,
  PurchasesPackage,
  PurchaseError,
} from 'react-native-purchases';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Product IDs (same as before - matches App Store Connect)
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com.gutcheck.app.premium.monthly',
  PREMIUM_YEARLY: 'com.gutcheck.app.premium.yearly',
};

export interface AppleSubscription {
  productId: string;
  transactionId: string;
  purchaseDate: string;
  expirationDate?: string;
  isActive: boolean;
}

class RevenueCatService {
  private isInitialized = false;
  private apiKey: string | null = null;
  private currentAppUserID: string | null = null;

  /**
   * Initialize RevenueCat SDK
   * Get API key from environment variable: EXPO_PUBLIC_REVENUECAT_API_KEY
   */
  async initialize(appUserID?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.isInitialized) {
        console.log('[RevenueCat] Already initialized.');
        // If already initialized but a new appUserID is provided, log in
        if (appUserID && appUserID !== this.currentAppUserID) {
          console.log(`[RevenueCat] App User ID changed from ${this.currentAppUserID} to ${appUserID}. Logging in...`);
          await Purchases.logIn(appUserID);
          this.currentAppUserID = appUserID;
        }
        return { success: true };
      }

      // Get API key from environment based on platform
      // For iOS, use: EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
      // For Android, use: EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY
      // Set these in EAS environment variables
      const isIOS = Platform.OS === 'ios';
      const apiKeyEnvName = isIOS ? 'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY' : 'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY';
      
      const apiKey = 
        Constants.expoConfig?.extra?.[apiKeyEnvName] ||
        process.env[apiKeyEnvName];

      if (!apiKey) {
        console.warn(`[RevenueCat] No API key found for ${Platform.OS}. Set ${apiKeyEnvName} in EAS environment variables.`);
        console.warn('[RevenueCat] Continuing with mock mode for development.');
        this.isInitialized = true; // Allow app to continue
        return { success: true }; // Return success so app doesn't crash
      }

      console.log(`[RevenueCat] Using ${Platform.OS} API key (${apiKey.substring(0, 10)}...)`);

      this.apiKey = apiKey;

      // Initialize RevenueCat
      await Purchases.configure({ apiKey });
      
      // Enable debug logging
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      
      // Log in with appUserID if provided
      if (appUserID) {
        console.log(`[RevenueCat] Logging in with provided appUserID: ${appUserID}`);
        await Purchases.logIn(appUserID);
        this.currentAppUserID = appUserID;
      }

      this.isInitialized = true;
      console.log('[RevenueCat] ✅ Initialized successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[RevenueCat] Failed to initialize:', error);
      // Don't crash - allow app to continue with mock mode
      this.isInitialized = true;
      return { success: true, error: error?.message || 'Failed to initialize RevenueCat' };
    }
  }

  /**
   * Get available products/offerings from RevenueCat
   * RevenueCat uses "Offerings" which map to your products
   */
  async getProducts(): Promise<{ success: boolean; products?: any[]; error?: string }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // If no API key, return mock products
      if (!this.apiKey) {
        console.log('[RevenueCat] No API key - returning mock products');
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

      // Fetch offerings from RevenueCat
      const offerings: Offerings = await Purchases.getOfferings();
      
      console.log('[RevenueCat] Offerings response:', JSON.stringify(offerings, null, 2));
      
      if (!offerings.current) {
        console.warn('[RevenueCat] No current offering available');
        return {
          success: false,
          error: 'No offerings available. Please check RevenueCat dashboard configuration.'
        };
      }

      // Extract products from packages
      const packages = offerings.current.availablePackages;
      console.log('[RevenueCat] Available packages:', packages?.length || 0);
      console.log('[RevenueCat] Packages details:', JSON.stringify(packages?.map(p => ({ 
        id: p?.identifier, 
        type: p?.packageType,
        productId: p?.product?.identifier 
      })), null, 2));
      
      if (!packages || packages.length === 0) {
        console.error('[RevenueCat] No packages in current offering');
        return {
          success: false,
          error: 'Current offering has no packages. Please check RevenueCat dashboard.'
        };
      }
      
      const products = packages.map(pkg => {
        if (!pkg || !pkg.product) {
          console.error('[RevenueCat] Invalid package:', pkg);
          throw new Error('Package or product is undefined');
        }
        return {
          productId: pkg.product.identifier,
          title: pkg.product.title,
          description: pkg.product.description,
          price: pkg.product.price,
          currency: pkg.product.currencyCode,
          // RevenueCat-specific fields
          packageIdentifier: pkg.identifier,
          packageType: pkg.packageType,
        };
      });

      console.log('[RevenueCat] ✅ Loaded', products.length, 'products from RevenueCat');
      return { success: true, products };
    } catch (error: any) {
      console.error('[RevenueCat] Failed to get products:', error);
      console.error('[RevenueCat] Error type:', typeof error);
      console.error('[RevenueCat] Error keys:', Object.keys(error || {}));
      console.error('[RevenueCat] Error message:', error?.message);
      console.error('[RevenueCat] Error code:', error?.code);
      console.error('[RevenueCat] Full error object:', JSON.stringify(error, null, 2));
      return {
        success: false,
        error: error?.message || 'Failed to get products'
      };
    }
  }

  /**
   * Purchase a product
   */
  async purchaseProduct(productId: string): Promise<{ success: boolean; subscription?: AppleSubscription; error?: string }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Re-check API key - it might not have been loaded properly
      if (!this.apiKey) {
        const apiKeyEnvName = Platform.OS === 'ios' 
          ? 'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY' 
          : 'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY';
        
        // Try to get the key directly as a fallback
        const apiKey = 
          Constants.expoConfig?.extra?.[apiKeyEnvName] ||
          process.env[apiKeyEnvName];
        
        console.log(`[RevenueCat] purchaseProduct: Platform.OS = ${Platform.OS}`);
        console.log(`[RevenueCat] purchaseProduct: Looking for key: ${apiKeyEnvName}`);
        console.log(`[RevenueCat] purchaseProduct: Key found in Constants: ${!!Constants.expoConfig?.extra?.[apiKeyEnvName]}`);
        console.log(`[RevenueCat] purchaseProduct: Key found in process.env: ${!!process.env[apiKeyEnvName]}`);
        console.log(`[RevenueCat] purchaseProduct: Available keys in extra:`, Object.keys(Constants.expoConfig?.extra || {}));
        
        if (!apiKey) {
          return {
            success: false,
            error: `RevenueCat not configured. Please set ${apiKeyEnvName} in EAS environment variables.`
          };
        }
        
        // If we found the key, use it
        this.apiKey = apiKey;
        await Purchases.configure({ apiKey });
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
        this.isInitialized = true;
        console.log(`[RevenueCat] ✅ Configured with ${Platform.OS} API key after re-check`);
      }

      // Get current offerings to find the package for this product
      const offerings: Offerings = await Purchases.getOfferings();
      
      if (!offerings.current) {
        return {
          success: false,
          error: 'No offerings available. Please check RevenueCat dashboard.'
        };
      }

      // Find package containing this product
      const packageToPurchase = offerings.current.availablePackages.find(
        pkg => pkg.product.identifier === productId
      );

      if (!packageToPurchase) {
        return {
          success: false,
          error: `Product ${productId} not found in RevenueCat offerings. Please configure it in RevenueCat dashboard.`
        };
      }

      // Purchase the package
      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);

      // Check if purchase was successful (user has active entitlement)
      const entitlement = customerInfo.entitlements.active['GutCheck Premium'];
      
      if (entitlement) {
        const subscription: AppleSubscription = {
          productId: productIdentifier,
          transactionId: entitlement.transactionIdentifier || '',
          purchaseDate: entitlement.latestPurchaseDate || new Date().toISOString(),
          expirationDate: entitlement.expirationDate || undefined,
          isActive: true,
        };
        
        console.log('[RevenueCat] ✅ Purchase successful');
        return { success: true, subscription };
      } else {
        return {
          success: false,
          error: 'Purchase completed but entitlement not active. Please contact support.'
        };
      }
    } catch (error: any) {
      console.error('[RevenueCat] Purchase failed:', error);
      console.error('[RevenueCat] Purchase error type:', typeof error);
      console.error('[RevenueCat] Purchase error keys:', Object.keys(error || {}));
      console.error('[RevenueCat] Purchase error message:', error?.message);
      console.error('[RevenueCat] Purchase error code:', error?.code);
      console.error('[RevenueCat] Full purchase error:', JSON.stringify(error, null, 2));
      
      // Handle specific purchase errors
      if (error instanceof PurchaseError) {
        if (error.userCancelled) {
          return { success: false, error: 'Purchase cancelled' };
        }
        return { success: false, error: error.message || 'Purchase failed' };
      }

      return {
        success: false,
        error: error?.message || 'Purchase failed. Please try again.'
      };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<{ success: boolean; subscriptions?: AppleSubscription[]; error?: string }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.apiKey) {
        return {
          success: false,
          error: 'RevenueCat not configured.'
        };
      }

      // Restore purchases
      const customerInfo: CustomerInfo = await Purchases.restorePurchases();

      // Get active entitlements
      const activeEntitlements = Object.values(customerInfo.entitlements.active);
      
      const subscriptions: AppleSubscription[] = activeEntitlements.map(entitlement => ({
        productId: entitlement.productIdentifier,
        transactionId: entitlement.transactionIdentifier || '',
        purchaseDate: entitlement.latestPurchaseDate || new Date().toISOString(),
        expirationDate: entitlement.expirationDate || undefined,
        isActive: true,
      }));

      console.log('[RevenueCat] ✅ Restored', subscriptions.length, 'active subscriptions');
      return { success: true, subscriptions };
    } catch (error: any) {
      console.error('[RevenueCat] Failed to restore purchases:', error);
      return {
        success: false,
        error: error?.message || 'Failed to restore purchases'
      };
    }
  }

  /**
   * Get current customer info (subscription status)
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      console.log('[RevenueCat] getCustomerInfo: Starting...');
      if (!this.isInitialized) {
        console.log('[RevenueCat] getCustomerInfo: Not initialized, initializing now...');
        await this.initialize();
      }

      if (!this.apiKey) {
        console.log('[RevenueCat] getCustomerInfo: No API key, returning null');
        return null;
      }

      console.log('[RevenueCat] getCustomerInfo: Fetching customer info from RevenueCat...');
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('[RevenueCat] getCustomerInfo: Received customer info');
      return customerInfo;
    } catch (error) {
      console.error('[RevenueCat] Failed to get customer info:', error);
      return null;
    }
  }

  /**
   * Set the RevenueCat app user ID to identify this user
   * Should be called after user logs in or creates account
   */
  async setAppUserID(userId: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        // If not initialized, initialize with the user ID
        await this.initialize(userId);
        return;
      }

      if (!this.apiKey) {
        console.warn('[RevenueCat] Cannot set user ID - not initialized');
        return;
      }

      if (userId === this.currentAppUserID) {
        console.log(`[RevenueCat] User ID ${userId} already set.`);
        return;
      }

      console.log('[RevenueCat] Setting app user ID:', userId);
      await Purchases.logIn(userId);
      this.currentAppUserID = userId;
      console.log('[RevenueCat] ✅ App user ID set successfully');
    } catch (error: any) {
      console.error('[RevenueCat] Failed to set app user ID:', error);
      // Don't throw - allow app to continue
    }
  }

  /**
   * Log out the current RevenueCat user
   * Should be called when user logs out
   */
  async logOut(): Promise<void> {
    try {
      if (!this.isInitialized || !this.apiKey) {
        return;
      }

      console.log('[RevenueCat] Logging out current user');
      await Purchases.logOut();
      this.currentAppUserID = null;
      console.log('[RevenueCat] ✅ User logged out successfully');
    } catch (error: any) {
      console.error('[RevenueCat] Failed to log out:', error);
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    try {
      console.log('[RevenueCat] hasActiveSubscription: Checking for active subscription...');
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) {
        console.log('[RevenueCat] hasActiveSubscription: No customerInfo returned');
        return false;
      }

      console.log('[RevenueCat] hasActiveSubscription: Got customerInfo, checking entitlements...');
      console.log('[RevenueCat] Active entitlements:', Object.keys(customerInfo.entitlements.active));
      
      const entitlement = customerInfo.entitlements.active['GutCheck Premium'];
      const hasActive = !!entitlement;
      
      console.log('[RevenueCat] hasActiveSubscription result:', hasActive);
      if (entitlement) {
        console.log('[RevenueCat] Active entitlement details:', JSON.stringify({
          productIdentifier: entitlement.productIdentifier,
          expirationDate: entitlement.expirationDate,
          latestPurchaseDate: entitlement.latestPurchaseDate,
        }, null, 2));
      }
      
      return hasActive;
    } catch (error) {
      console.error('[RevenueCat] Failed to check subscription status:', error);
      return false;
    }
  }
}

export const revenueCatService = new RevenueCatService();

// Export for backward compatibility (can be removed after migration)
export const appleIAPService = revenueCatService;

