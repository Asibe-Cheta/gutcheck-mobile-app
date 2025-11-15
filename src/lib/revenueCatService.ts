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

      // Trim whitespace in case there's any
      const trimmedApiKey = apiKey.trim();
      
      // Validate key format
      if (Platform.OS === 'android' && !trimmedApiKey.startsWith('goog_')) {
        console.error(`[RevenueCat] Invalid Android API key format. Expected 'goog_' prefix, got: ${trimmedApiKey.substring(0, 5)}...`);
      } else if (Platform.OS === 'ios' && !trimmedApiKey.startsWith('appl_')) {
        console.error(`[RevenueCat] Invalid iOS API key format. Expected 'appl_' prefix, got: ${trimmedApiKey.substring(0, 5)}...`);
      }

      console.log(`[RevenueCat] Using ${Platform.OS} API key (${trimmedApiKey.substring(0, 10)}...)`);
      console.log(`[RevenueCat] API key length: ${trimmedApiKey.length} characters`);

      this.apiKey = trimmedApiKey;

      // Initialize RevenueCat
      await Purchases.configure({ apiKey: trimmedApiKey });
      
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
              price: 6.99,
              currency: 'GBP',
            },
            {
              productId: PRODUCT_IDS.PREMIUM_YEARLY,
              title: 'Premium Yearly',
              description: 'Full access to all features - Save 28%',
              price: 59.99,
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
        
        // Extract introductory pricing (free trial) information
        const introPrice = pkg.product.introPrice;
        const hasFreeTrial = introPrice && introPrice.price === 0 && introPrice.periodUnit && introPrice.periodNumberOfUnits;
        
        // Calculate free trial period in days
        let freeTrialDays: number | null = null;
        if (hasFreeTrial && introPrice) {
          const periodUnit = introPrice.periodUnit; // 'DAY', 'WEEK', 'MONTH', 'YEAR'
          const periodCount = introPrice.periodNumberOfUnits || 0;
          
          if (periodUnit === 'DAY') {
            freeTrialDays = periodCount;
          } else if (periodUnit === 'WEEK') {
            freeTrialDays = periodCount * 7;
          } else if (periodUnit === 'MONTH') {
            freeTrialDays = periodCount * 30; // Approximate
          } else if (periodUnit === 'YEAR') {
            freeTrialDays = periodCount * 365; // Approximate
          }
        }
        
        // Fix: Ensure correct title based on product ID (not App Store Connect metadata)
        let correctedTitle = pkg.product.title;
        if (pkg.product.identifier === PRODUCT_IDS.PREMIUM_YEARLY) {
          correctedTitle = 'Premium Yearly'; // Force correct name
        } else if (pkg.product.identifier === PRODUCT_IDS.PREMIUM_MONTHLY) {
          correctedTitle = 'Premium Monthly'; // Ensure consistency
        }
        
        return {
          productId: pkg.product.identifier,
          title: correctedTitle,
          description: pkg.product.description,
          price: pkg.product.price,
          currency: pkg.product.currencyCode,
          // RevenueCat-specific fields
          packageIdentifier: pkg.identifier,
          packageType: pkg.packageType,
          // Free trial information
          hasFreeTrial: hasFreeTrial || false,
          freeTrialDays: freeTrialDays,
          introPrice: introPrice ? {
            price: introPrice.price,
            periodUnit: introPrice.periodUnit,
            periodNumberOfUnits: introPrice.periodNumberOfUnits,
          } : null,
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

      // Map productId to package identifier
      // RevenueCat uses package identifiers like $rc_monthly, $rc_annual
      // But we receive product IDs like com.gutcheck.app.premium.monthly
      let packageIdentifier: string | null = null;
      if (productId === PRODUCT_IDS.PREMIUM_MONTHLY) {
        packageIdentifier = '$rc_monthly';
      } else if (productId === PRODUCT_IDS.PREMIUM_YEARLY) {
        packageIdentifier = '$rc_annual';
      }

      // First, try to find package by identifier (recommended approach)
      let packageToPurchase = packageIdentifier 
        ? offerings.current.availablePackages.find(
            pkg => pkg.identifier === packageIdentifier
          )
        : null;

      // If not found by package identifier, try to find by product identifier
      // This handles cases where product IDs might have suffixes (e.g., com.gutcheck.app.premium.monthly:monthly)
      if (!packageToPurchase) {
        console.log(`[RevenueCat] Package not found by identifier ${packageIdentifier}, trying product identifier match...`);
        packageToPurchase = offerings.current.availablePackages.find(
          pkg => {
            const pkgProductId = pkg.product.identifier;
            // Match exact or match if product ID starts with our product ID (for Android suffixes)
            return pkgProductId === productId || pkgProductId.startsWith(productId + ':') || pkgProductId.includes(productId);
          }
        );
      }

      // Log available packages for debugging
      if (!packageToPurchase) {
        console.error('[RevenueCat] Available packages:', offerings.current.availablePackages.map(pkg => ({
          identifier: pkg.identifier,
          productId: pkg.product.identifier,
          packageType: pkg.packageType,
        })));
        return {
          success: false,
          error: `Product ${productId} not found in RevenueCat offerings. Please configure it in RevenueCat dashboard. Available packages: ${offerings.current.availablePackages.map(p => `${p.identifier} (${p.product.identifier})`).join(', ')}`
        };
      }

      console.log(`[RevenueCat] Found package: ${packageToPurchase.identifier} with product: ${packageToPurchase.product.identifier}`);

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
      
      // CRITICAL: Guard against calling native module before initialization
      if (!this.isInitialized) {
        console.log('[RevenueCat] getCustomerInfo: Not initialized, initializing now...');
        const initResult = await this.initialize();
        if (!initResult.success) {
          console.error('[RevenueCat] getCustomerInfo: Initialization failed:', initResult.error);
          return null;
        }
        // Add small delay after initialization to ensure native module is ready
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (!this.apiKey) {
        console.log('[RevenueCat] getCustomerInfo: No API key, returning null');
        return null;
      }

      // CRITICAL: Wrap native call in try-catch to prevent crashes
      console.log('[RevenueCat] getCustomerInfo: Fetching customer info from RevenueCat...');
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        console.log('[RevenueCat] getCustomerInfo: Received customer info');
        return customerInfo;
      } catch (nativeError: any) {
        // Catch native module errors specifically to prevent app crash
        console.error('[RevenueCat] Native error in getCustomerInfo:', nativeError);
        console.error('[RevenueCat] Error details:', {
          message: nativeError?.message,
          code: nativeError?.code,
          name: nativeError?.name,
          stack: nativeError?.stack
        });
        return null;
      }
    } catch (error: any) {
      // Final catch-all for any unexpected errors
      console.error('[RevenueCat] Failed to get customer info:', error);
      console.error('[RevenueCat] Error details:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack
      });
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

