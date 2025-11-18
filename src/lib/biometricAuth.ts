/**
 * Biometric Authentication Service
 * Handles FaceID (iOS) and Fingerprint (Android) authentication
 * Uses expo-local-authentication for biometric prompts
 * Uses expo-secure-store for secure token storage
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BIOMETRIC_TOKEN_KEY = 'gutcheck_biometric_token';
const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';
const BIOMETRIC_USER_ID_KEY = 'biometric_user_id';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: string;
}

class BiometricAuthService {
  /**
   * Check if device supports biometric authentication
   */
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        console.log('[BIOMETRIC] No biometric hardware available');
        return false;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        console.log('[BIOMETRIC] No biometric credentials enrolled');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[BIOMETRIC] Error checking availability:', error);
      return false;
    }
  }

  /**
   * Get the type of biometric authentication available
   * Returns: 'FaceID', 'TouchID', 'Fingerprint', 'Iris', or 'Unknown'
   */
  async getBiometricType(): Promise<string> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
      }
      
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
      }
      
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'Iris Scan';
      }

      return 'Biometric';
    } catch (error) {
      console.error('[BIOMETRIC] Error getting biometric type:', error);
      return 'Biometric';
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(): Promise<BiometricAuthResult> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      const biometricType = await this.getBiometricType();

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Use ${biometricType} to sign in to GutCheck`,
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        return {
          success: true,
          biometricType,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }
    } catch (error) {
      console.error('[BIOMETRIC] Authentication error:', error);
      return {
        success: false,
        error: 'An error occurred during authentication',
      };
    }
  }

  /**
   * Enable biometric authentication for a user
   * Stores user ID securely for auto-login
   */
  async enableBiometricAuth(userId: string): Promise<boolean> {
    try {
      // First, authenticate to ensure user consent
      const authResult = await this.authenticate();
      if (!authResult.success) {
        console.log('[BIOMETRIC] User authentication failed, cannot enable biometric auth');
        return false;
      }

      // Store user ID securely in device keychain/keystore
      await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, userId);
      
      // Store flag in AsyncStorage (for quick checks)
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      await AsyncStorage.setItem(BIOMETRIC_USER_ID_KEY, userId);

      console.log('[BIOMETRIC] Biometric authentication enabled successfully');
      return true;
    } catch (error) {
      console.error('[BIOMETRIC] Error enabling biometric auth:', error);
      return false;
    }
  }

  /**
   * Disable biometric authentication
   * Clears stored credentials
   */
  async disableBiometricAuth(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_USER_ID_KEY);
      console.log('[BIOMETRIC] Biometric authentication disabled');
    } catch (error) {
      console.error('[BIOMETRIC] Error disabling biometric auth:', error);
    }
  }

  /**
   * Check if biometric authentication is enabled for current device
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('[BIOMETRIC] Error checking if biometric enabled:', error);
      return false;
    }
  }

  /**
   * Authenticate and retrieve user ID for auto-login
   */
  async authenticateAndGetUserId(): Promise<string | null> {
    try {
      // Check if biometric is enabled
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        console.log('[BIOMETRIC] Biometric auth not enabled');
        return null;
      }

      // Authenticate user
      const authResult = await this.authenticate();
      if (!authResult.success) {
        console.log('[BIOMETRIC] Authentication failed');
        return null;
      }

      // Retrieve stored user ID
      const userId = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
      if (!userId) {
        console.log('[BIOMETRIC] No user ID found in secure store');
        // Clear the enabled flag if no user ID found (data inconsistency)
        await this.disableBiometricAuth();
        return null;
      }

      console.log('[BIOMETRIC] Authentication successful, user ID retrieved');
      return userId;
    } catch (error) {
      console.error('[BIOMETRIC] Error authenticating and retrieving user ID:', error);
      return null;
    }
  }

  /**
   * Get stored user ID without authentication (for checking only)
   */
  async getStoredUserId(): Promise<string | null> {
    try {
      const userId = await AsyncStorage.getItem(BIOMETRIC_USER_ID_KEY);
      return userId;
    } catch (error) {
      console.error('[BIOMETRIC] Error getting stored user ID:', error);
      return null;
    }
  }
}

export const biometricAuthService = new BiometricAuthService();

