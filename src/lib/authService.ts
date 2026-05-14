/**
 * Authentication Service
 * Handles anonymous and username+PIN authentication
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { supabase, isSupabaseConfigured } from './supabase';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { revenueCatService } from './revenueCatService';
import { biometricAuthService } from './biometricAuth';
import { savePinForReveal, clearPinForReveal } from './pinRevealStorage';

export interface AuthUser {
  id: string;
  username: string;
  userType: 'anonymous' | 'username';
  createdAt: string;
}

class AuthService {
  /**
   * Hash a PIN for secure storage
   */
  private async hashPin(pin: string): Promise<string> {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pin
    );
  }

  /**
   * Generate a unique anonymous username
   */
  private generateAnonymousUsername(): string {
    const randomString = Math.random().toString(36).substring(2, 15);
    return `Anonymous_${randomString}`;
  }

  /**
   * Generate a unique user ID (UUID format)
   */
  private generateUserId(): string {
    // Generate a proper UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Create an anonymous account with PIN
   */
  async createAnonymousAccount(pin?: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const userId = this.generateUserId();
      const username = this.generateAnonymousUsername();

      // If PIN is provided, validate it
      if (pin && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
        return { success: false, error: 'PIN must be exactly 4 digits' };
      }

      // Hash PIN if provided
      const pinHash = pin ? await this.hashPin(pin) : null;

      // Save to local storage
      await AsyncStorage.setItem('user_id', userId);
      await AsyncStorage.setItem('username', username);
      await AsyncStorage.setItem('user_type', 'anonymous');
      await AsyncStorage.setItem('is_logged_in', 'true');

      // Try to save to database (graceful failure if table doesn't exist)
      try {
        const insertData: any = {
          user_id: userId,
          username,
          user_type: 'anonymous',
          created_at: new Date().toISOString(),
        };

        // Add PIN hash if provided
        if (pinHash) {
          insertData.pin_hash = pinHash;
        }

        const { error } = await supabase
          .from('profiles')
          .insert(insertData);

        if (error) {
          console.warn('Database save failed (non-critical):', error);
        }
      } catch (dbError) {
        console.warn('Database operation failed (non-critical):', dbError);
      }

      // Set RevenueCat user ID to associate purchases with this user
      await revenueCatService.setAppUserID(userId);

      if (pin) {
        await savePinForReveal(userId, pin);
      }

      const user: AuthUser = {
        id: userId,
        username,
        userType: 'anonymous',
        createdAt: new Date().toISOString(),
      };

      return { success: true, user };
    } catch (error) {
      console.error('Create anonymous account error:', error);
      return { success: false, error: 'Failed to create anonymous account' };
    }
  }

  /**
   * Create a username account with PIN
   */
  async createUsernameAccount(username: string, pin: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      // Test remote logging first
      try {
        await fetch('https://httpbin.org/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'test_connection',
            timestamp: new Date().toISOString(),
            message: 'Testing remote logging connection from TestFlight'
          })
        });
        console.log('Remote logging test successful');
      } catch (e) {
        console.log('Remote logging test failed:', e);
      }

      // Validate username
      if (!username || username.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters' };
      }

      // Validate PIN
      if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return { success: false, error: 'PIN must be exactly 4 digits' };
      }

      if (!isSupabaseConfigured()) {
        console.error('[AUTH] Supabase missing: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
        return {
          success: false,
          error:
            'Cannot reach the server: Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env (see .env.example), then restart Expo with: npx expo start -c',
        };
      }

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        return { success: false, error: 'Username already taken' };
      }

      const userId = this.generateUserId();
      const pinHash = await this.hashPin(pin);

      // Save to database first; only persist session locally after success (avoids half-created accounts).
      try {
        console.log('Attempting to save to database:', {
          user_id: userId,
          username,
          user_type: 'username',
          pin_hash: pinHash ? `${pinHash.substring(0, 10)}...` : 'MISSING',
          created_at: new Date().toISOString(),
          supabaseUrl: supabase.supabaseUrl,
          isTestFlight: __DEV__ === false,
          platform: Platform.OS,
          networkInfo: 'Testing network connectivity...'
        });

        try {
          const debugData = {
            type: 'auth_debug',
            timestamp: new Date().toISOString(),
            user_id: userId,
            username,
            supabaseUrl: supabase.supabaseUrl,
            isTestFlight: __DEV__ === false,
            platform: Platform.OS,
            buildNumber: '56',
            allExtraKeys: Object.keys(Constants?.expoConfig?.extra ?? {}),
            fullExtra: Constants?.expoConfig?.extra,
          };

          console.log('Debug data:', debugData);

          await AsyncStorage.setItem('debug_auth_data', JSON.stringify(debugData));

          console.log('Debug data stored in AsyncStorage');
        } catch (e) {
          console.log('Debug storage failed:', e);
        }

        let insertData: any = {
          user_id: userId,
          username,
          created_at: new Date().toISOString(),
        };

        try {
          insertData.user_type = 'username';
          insertData.pin_hash = pinHash;
        } catch (e) {
          console.warn('Could not add user_type/pin_hash columns:', e);
        }

        const { error } = await supabase
          .from('profiles')
          .insert(insertData);

        if (error) {
          console.error('Database save error:', {
            error: error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });

          if (error.message.includes('column') && error.message.includes('does not exist')) {
            console.log('Retrying with minimal data (missing columns detected)');

            const { error: minimalError } = await supabase
              .from('profiles')
              .insert({
                user_id: userId,
                username,
                created_at: new Date().toISOString(),
              });

            if (minimalError) {
              console.error('Minimal insert also failed:', minimalError);
              return { success: false, error: `Database schema issue: ${minimalError.message}` };
            } else {
              console.log('Minimal insert successful');
            }
          } else {
            return { success: false, error: `Failed to save account to database: ${error.message}` };
          }
        } else {
          console.log('Database save successful');
        }
      } catch (dbError: any) {
        console.error('Database operation failed:', {
          error: dbError,
          message: dbError?.message,
          stack: dbError?.stack
        });
        return { success: false, error: `Database operation failed: ${dbError?.message ?? 'Unknown error'}` };
      }

      await AsyncStorage.setItem('user_id', userId);
      await AsyncStorage.setItem('username', username);
      await AsyncStorage.setItem('user_type', 'username');
      await AsyncStorage.setItem('is_logged_in', 'true');

      // Set RevenueCat user ID to associate purchases with this user
      await revenueCatService.setAppUserID(userId);

      await savePinForReveal(userId, pin);

      const user: AuthUser = {
        id: userId,
        username,
        userType: 'username',
        createdAt: new Date().toISOString(),
      };

      return { success: true, user };
    } catch (error) {
      console.error('Create username account error:', error);
      return { success: false, error: 'Failed to create account' };
    }
  }

  /**
   * Login with username and PIN (for both username and anonymous accounts)
   */
  async login(username: string, pin: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      // Validate inputs
      if (!username || !pin) {
        return { success: false, error: 'Username and PIN are required' };
      }

      // Hash the provided PIN
      const pinHash = await this.hashPin(pin);

      // Query database for user with matching username and PIN hash
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, user_type, created_at')
        .eq('username', username)
        .eq('pin_hash', pinHash)
        .single();

      if (error || !data) {
        return { success: false, error: 'Invalid username or PIN' };
      }

      // Save to local storage
      await AsyncStorage.setItem('user_id', data.user_id);
      await AsyncStorage.setItem('username', data.username);
      await AsyncStorage.setItem('user_type', data.user_type);
      await AsyncStorage.setItem('is_logged_in', 'true');

      // Set RevenueCat user ID to associate purchases with this user
      await revenueCatService.setAppUserID(data.user_id);

      await savePinForReveal(data.user_id, pin);

      // Update biometric auth with username if enabled
      const isBiometricEnabled = await biometricAuthService.isBiometricEnabled();
      if (isBiometricEnabled) {
        console.log('[AUTH] Updating biometric auth with new username');
        await biometricAuthService.enableBiometricAuth(data.user_id, data.username);
      }

      const user: AuthUser = {
        id: data.user_id,
        username: data.username,
        userType: data.user_type as 'anonymous' | 'username',
        createdAt: data.created_at,
      };

      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  /**
   * Login anonymous user with username and PIN
   */
  async loginAnonymous(username: string, pin: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      // Validate inputs
      if (!username || !pin) {
        return { success: false, error: 'Username and PIN are required' };
      }

      // Hash the provided PIN
      const pinHash = await this.hashPin(pin);

      // Query database for anonymous user with matching username and PIN hash
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, user_type, created_at')
        .eq('username', username)
        .eq('user_type', 'anonymous')
        .eq('pin_hash', pinHash)
        .single();

      if (error || !data) {
        return { success: false, error: 'Invalid username or PIN' };
      }

      // Save to local storage
      await AsyncStorage.setItem('user_id', data.user_id);
      await AsyncStorage.setItem('username', data.username);
      await AsyncStorage.setItem('user_type', data.user_type);
      await AsyncStorage.setItem('is_logged_in', 'true');

      await savePinForReveal(data.user_id, pin);

      const user: AuthUser = {
        id: data.user_id,
        username: data.username,
        userType: 'anonymous',
        createdAt: data.created_at,
      };

      return { success: true, user };
    } catch (error) {
      console.error('Anonymous login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const uidForPin = await AsyncStorage.getItem('user_id');
      await clearPinForReveal(uidForPin);

      // Clear RevenueCat user data
      const { revenueCatService } = await import('./revenueCatService');
      await revenueCatService.logOut();

      // Clear chat history (user-specific)
      const { useChatHistoryStore } = await import('./stores/chatHistoryStore');
      await useChatHistoryStore.getState().clearAllChats();

      // Clear all auth-related data from local storage
      await AsyncStorage.multiRemove([
        'user_id',
        'username',
        'user_type',
        'is_logged_in',
        'subscription_status',
        'subscription_plan',
        'user_profile',
        'user_age_range',
        'user_goal',
        '_has_active_subscription',
        '_skip_sub_check',
        '_sub_nav_from_home',
        '_sub_origin_screen'
      ]);
      
      // Note: We keep 'onboarding_completed' cleared so they don't see it again on login

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Failed to logout' };
    }
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const isLoggedIn = await AsyncStorage.getItem('is_logged_in');
      const userId = await AsyncStorage.getItem('user_id');
      return isLoggedIn === 'true' && !!userId;
    } catch (error) {
      console.error('Check login status error:', error);
      return false;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const username = await AsyncStorage.getItem('username');
      const userType = await AsyncStorage.getItem('user_type');

      if (!userId || !username || !userType) {
        return null;
      }

      return {
        id: userId,
        username,
        userType: userType as 'anonymous' | 'username',
        createdAt: '', // We don't store this locally
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Update PIN for username accounts
   */
  async updatePin(oldPin: string, newPin: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const userType = await AsyncStorage.getItem('user_type');

      if (!userId || userType !== 'username') {
        return { success: false, error: 'Only username accounts can update PIN' };
      }

      // Validate new PIN
      if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return { success: false, error: 'PIN must be exactly 4 digits' };
      }

      // Verify old PIN
      const oldPinHash = await this.hashPin(oldPin);
      const { data: userData } = await supabase
        .from('profiles')
        .select('pin_hash')
        .eq('user_id', userId)
        .single();

      if (!userData || userData.pin_hash !== oldPinHash) {
        return { success: false, error: 'Current PIN is incorrect' };
      }

      // Update to new PIN
      const newPinHash = await this.hashPin(newPin);
      const { error } = await supabase
        .from('profiles')
        .update({ pin_hash: newPinHash })
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: 'Failed to update PIN' };
      }

      await savePinForReveal(userId, newPin);

      return { success: true };
    } catch (error) {
      console.error('Update PIN error:', error);
      return { success: false, error: 'Failed to update PIN' };
    }
  }

  // ─── Recovery code helpers ─────────────────────────────────────────────────

  private readonly recoveryWordList = [
    'BEAR','BIRD','BLUE','BOLT','CAVE','CLAY','COIN','CROW',
    'DAWN','DEER','DUSK','ECHO','FERN','FIRE','FISH','FLAME',
    'FLEET','FOG','FORD','FROST','GATE','GLOW','GOLD','GROVE',
    'HAWK','HILL','HORN','IRIS','JADE','LAKE','LEAF','LION',
    'LOCH','MAST','MIST','MOON','MOTH','NEWT','OAK','OWL',
    'PATH','PINE','POND','RAIN','REED','REEF','RISE','ROCK',
    'ROOT','ROSE','RUSH','SAGE','SALT','SAND','SEED','SILK',
    'SKYE','SLATE','SNOW','SOIL','STAR','STEM','STONE','STORM',
    'SUN','SURF','SWAN','TIDE','TIGER','THORN','TRAIL','TREE',
    'VALE','VINE','WAVE','WIND','WOLF','WOOD','WREN',
  ];

  /**
   * Generate a human-readable recovery code in the form WORD-DIGITS-WORD
   * e.g. TIGER-4821-WOLF
   */
  generateRecoveryCode(): string {
    const pick = () =>
      this.recoveryWordList[Math.floor(Math.random() * this.recoveryWordList.length)];
    const digits = Math.floor(1000 + Math.random() * 9000).toString();
    return `${pick()}-${digits}-${pick()}`;
  }

  /**
   * Hash and persist the recovery code against the user's profile row.
   * Requires the `recovery_code_hash` column to exist in the `profiles` table.
   * Fails gracefully if the column is absent (logs a warning, does not throw).
   */
  async saveRecoveryCode(
    userId: string,
    code: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const codeHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        code.toUpperCase().trim(),
      );
      const { error } = await supabase
        .from('profiles')
        .update({ recovery_code_hash: codeHash })
        .eq('user_id', userId);

      if (error) {
        console.warn('[AUTH] Could not save recovery code to DB (column may not exist yet):', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('[AUTH] saveRecoveryCode error:', err);
      return { success: false, error: 'Failed to save recovery code' };
    }
  }

  /**
   * Verify a username + recovery code combination without making any changes.
   * Returns true only if the pair exists in the database.
   */
  async verifyRecoveryCode(username: string, recoveryCode: string): Promise<boolean> {
    try {
      const codeHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        recoveryCode.toUpperCase().trim(),
      );
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('username', username.trim())
        .eq('recovery_code_hash', codeHash)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  /**
   * Verify the recovery code, reset the PIN, and log the user back in.
   * Should only be called after verifyRecoveryCode() returns true.
   */
  async resetPinWithRecoveryCode(
    username: string,
    recoveryCode: string,
    newPin: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return { success: false, error: 'PIN must be exactly 4 digits' };
      }

      const codeHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        recoveryCode.toUpperCase().trim(),
      );
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, user_type')
        .eq('username', username.trim())
        .eq('recovery_code_hash', codeHash)
        .single();

      if (error || !data) {
        return { success: false, error: 'Invalid username or recovery code' };
      }

      const newPinHash = await this.hashPin(newPin);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ pin_hash: newPinHash })
        .eq('user_id', data.user_id);

      if (updateError) {
        return { success: false, error: 'Failed to reset PIN. Please try again.' };
      }

      // Log the user back in
      await AsyncStorage.setItem('user_id', data.user_id);
      await AsyncStorage.setItem('username', data.username);
      await AsyncStorage.setItem('user_type', data.user_type || 'username');
      await AsyncStorage.setItem('is_logged_in', 'true');
      await revenueCatService.setAppUserID(data.user_id);

      await savePinForReveal(data.user_id, newPin);

      return { success: true };
    } catch (err: any) {
      console.error('[AUTH] resetPinWithRecoveryCode error:', err);
      return { success: false, error: 'Recovery failed. Please try again.' };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      return !data; // Available if no data found
    } catch (error) {
      // Error means not found, so available
      return true;
    }
  }

  /**
   * Delete user account and all associated data
   */
  async deleteAccount(): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await AsyncStorage.getItem('user_id');

      if (!userId) {
        return { success: false, error: 'No user account found' };
      }

      const { error, count } = await supabase
        .from('profiles')
        .delete({ count: 'exact' })
        .eq('user_id', userId);

      if (error) {
        console.error('Database delete error:', error);
        return {
          success: false,
          error: 'Unable to delete your account on our servers. Please check your connection and try again.',
        };
      }

      if (count === 0) {
        console.warn(
          '[deleteAccount] No profile row removed (local-only session or server policy). Clearing device data anyway.',
        );
      }

      const cleared = await this.logout();
      if (!cleared.success) {
        return { success: false, error: cleared.error || 'Failed to clear data on this device' };
      }

      await AsyncStorage.multiRemove([
        'onboarding_completed',
        'anonymous_user_id',
        'user_region',
        'user_country',
        'privacy_settings',
        'notifications_scheduled',
        'debug_auth_data',
        `@trial_data_${userId}`,
        `lifetime_pro_${userId}`,
      ]);

      try {
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.warn('[deleteAccount] supabase.auth.signOut:', signOutErr);
      }

      return { success: true };
    } catch (error) {
      console.error('Delete account error:', error);
      return { success: false, error: 'Failed to delete account' };
    }
  }
}

export const authService = new AuthService();
