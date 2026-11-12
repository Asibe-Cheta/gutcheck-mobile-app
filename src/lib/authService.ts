/**
 * Authentication Service
 * Handles anonymous and username+PIN authentication.
 *
 * All account reads and writes go through the gc_* database functions (see
 * supabase/migrations/20261109120000_secure_accounts_and_history.sql). The app never reads the
 * profiles table directly, so PIN and recovery-code hashes never leave the server.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase, isSupabaseConfigured } from './supabase';
import { revenueCatService } from './revenueCatService';
import { biometricAuthService } from './biometricAuth';
import { savePinForReveal, clearPinForReveal } from './pinRevealStorage';
import {
  callWithSession,
  endSession,
  NoSessionError,
  saveSessionToken,
  sha256Hex,
} from './accountSession';

export interface AuthUser {
  id: string;
  username: string;
  userType: 'anonymous' | 'username';
  createdAt: string;
}

const PIN_PATTERN = /^\d{4}$/;
/** Logging in accepts the original 4-digit PINs and the 6-digit passcodes (PRD 6). */
const LOGIN_PIN_PATTERN = /^(\d{4}|\d{6})$/;
const PASSCODE_PATTERN = /^\d{6}$/;
/** Set on accounts created without a passcode; cleared once one is saved. */
export const NEEDS_PASSCODE_KEY = 'needs_passcode';

function messageFor(error: string | undefined, fallback: string): string {
  switch (error) {
    case 'too_many_attempts':
      return 'Too many attempts. Please wait 15 minutes and try again.';
    case 'username_taken':
      return 'Username already taken';
    case 'invalid_username':
      return 'Username must be between 3 and 40 characters';
    case 'invalid_credentials':
      return 'Invalid username or PIN';
    default:
      return fallback;
  }
}

async function storeLocalSession(userId: string, username: string, userType: string): Promise<void> {
  await AsyncStorage.multiSet([
    ['user_id', userId],
    ['username', username],
    ['user_type', userType],
    ['is_logged_in', 'true'],
  ]);
}

class AuthService {
  private async hashPin(pin: string): Promise<string> {
    return sha256Hex(pin);
  }

  private generateAnonymousUsername(): string {
    const bytes = Crypto.getRandomBytes(8);
    const suffix = Array.from(bytes, (b) => (b % 36).toString(36)).join('');
    return `Anonymous_${suffix}`;
  }

  private generateUserId(): string {
    return Crypto.randomUUID().toLowerCase();
  }

  /**
   * Create an anonymous account with PIN
   */
  async createAnonymousAccount(pin?: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      if (pin && !PIN_PATTERN.test(pin)) {
        return { success: false, error: 'PIN must be exactly 4 digits' };
      }

      const userId = this.generateUserId();
      const username = this.generateAnonymousUsername();
      let createdAt = new Date().toISOString();

      // The account still works on this phone if the server can't be reached; it just can't be
      // used on another device or sync History until it exists on the server.
      try {
        const { data, error } = await supabase.rpc('gc_create_account', {
          p_user_id: userId,
          p_username: username,
          p_user_type: 'anonymous',
          p_pin_hash: pin ? await this.hashPin(pin) : null,
        });
        if (error || !data?.ok) {
          console.warn('[AUTH] Server account not created (non-critical):', error?.message || data?.error);
        } else {
          await saveSessionToken(data.token);
          createdAt = data.created_at ?? createdAt;
        }
      } catch (dbError) {
        console.warn('[AUTH] Server account not created (non-critical):', dbError);
      }

      await storeLocalSession(userId, username, 'anonymous');
      await revenueCatService.setAppUserID(userId);
      if (pin) {
        await savePinForReveal(userId, pin);
      } else {
        await AsyncStorage.setItem(NEEDS_PASSCODE_KEY, 'true');
      }

      return { success: true, user: { id: userId, username, userType: 'anonymous', createdAt } };
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
      if (!username || username.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters' };
      }
      if (!pin || !PIN_PATTERN.test(pin)) {
        return { success: false, error: 'PIN must be exactly 4 digits' };
      }
      if (!isSupabaseConfigured()) {
        console.error('[AUTH] Supabase missing: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
        return { success: false, error: 'Cannot reach the server. Please try again later.' };
      }

      const userId = this.generateUserId();
      const { data, error } = await supabase.rpc('gc_create_account', {
        p_user_id: userId,
        p_username: username,
        p_user_type: 'username',
        p_pin_hash: await this.hashPin(pin),
      });

      if (error) {
        console.error('[AUTH] Create account failed:', error.message);
        return { success: false, error: 'Failed to create your account. Please check your connection and try again.' };
      }
      if (!data?.ok) {
        return { success: false, error: messageFor(data?.error, 'Failed to create your account') };
      }

      // Only persist the session locally after the server account exists.
      await saveSessionToken(data.token);
      await storeLocalSession(userId, username, 'username');
      await revenueCatService.setAppUserID(userId);
      await savePinForReveal(userId, pin);

      return {
        success: true,
        user: { id: userId, username, userType: 'username', createdAt: data.created_at ?? new Date().toISOString() },
      };
    } catch (error) {
      console.error('Create username account error:', error);
      return { success: false, error: 'Failed to create account' };
    }
  }

  /**
   * Login with username and PIN (for both username and anonymous accounts)
   */
  async login(username: string, pin: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    return this.loginWithPin(username, pin);
  }

  /**
   * Login anonymous user with username and PIN
   */
  async loginAnonymous(username: string, pin: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    return this.loginWithPin(username, pin, 'anonymous');
  }

  private async loginWithPin(
    username: string,
    pin: string,
    requiredType?: 'anonymous',
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      if (!username || !pin) {
        return { success: false, error: 'Username and PIN are required' };
      }

      const { data, error } = await supabase.rpc('gc_login', {
        p_username: username.trim(),
        p_pin_hash: await this.hashPin(pin),
      });

      if (error) {
        console.error('[AUTH] Login request failed:', error.message);
        return { success: false, error: 'Login failed. Please check your connection and try again.' };
      }
      if (!data?.ok || (requiredType && data.user_type !== requiredType)) {
        return { success: false, error: messageFor(data?.error, 'Invalid username or PIN') };
      }

      await saveSessionToken(data.token);
      await storeLocalSession(data.user_id, data.username, data.user_type);
      await revenueCatService.setAppUserID(data.user_id);
      await savePinForReveal(data.user_id, pin);

      const isBiometricEnabled = await biometricAuthService.isBiometricEnabled();
      if (isBiometricEnabled) {
        await biometricAuthService.enableBiometricAuth(data.user_id, data.username);
      }

      return {
        success: true,
        user: {
          id: data.user_id,
          username: data.username,
          userType: data.user_type as 'anonymous' | 'username',
          createdAt: data.created_at,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  /**
   * For phones that were logged in before PINs were saved on the device: confirming the PIN once
   * connects this phone to the account on the server (History sync, profile) without logging out.
   */
  async confirmPinForSync(pin: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!LOGIN_PIN_PATTERN.test(pin)) {
        return { success: false, error: 'Enter your 4-digit PIN or 6-digit passcode' };
      }
      const [userId, username] = await Promise.all([
        AsyncStorage.getItem('user_id'),
        AsyncStorage.getItem('username'),
      ]);
      if (!userId || !username) {
        return { success: false, error: 'Please log out and log in again.' };
      }

      const { data, error } = await supabase.rpc('gc_login', {
        p_username: username,
        p_pin_hash: await this.hashPin(pin),
      });
      if (error) {
        return { success: false, error: 'Please check your connection and try again.' };
      }
      if (!data?.ok) {
        return {
          success: false,
          error: data?.error === 'invalid_credentials' ? "That PIN didn't match. Please try again." : messageFor(data?.error, 'Please try again.'),
        };
      }
      if (data.user_id !== userId) {
        return { success: false, error: 'Please log out and log in again.' };
      }

      await saveSessionToken(data.token);
      await savePinForReveal(userId, pin);
      return { success: true };
    } catch (error) {
      console.error('[AUTH] confirmPinForSync error:', error);
      return { success: false, error: 'Please try again.' };
    }
  }

  /**
   * "Protect your History": set a 6-digit passcode on an account created without one, so the
   * account can be used on another phone.
   */
  async setFirstPasscode(passcode: string): Promise<{ success: boolean; username?: string; error?: string }> {
    try {
      if (!PASSCODE_PATTERN.test(passcode)) {
        return { success: false, error: 'Your passcode must be 6 digits' };
      }
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) return { success: false, error: 'Please log in again.' };
      const result = await callWithSession<{ ok: boolean; error?: string; username?: string }>('gc_set_first_passcode', {
        p_pin_hash: await this.hashPin(passcode),
      });
      if (!result?.ok && result?.error !== 'already_set') {
        return { success: false, error: 'Your passcode was not saved. Please try again.' };
      }
      if (result?.error === 'already_set') {
        await AsyncStorage.removeItem(NEEDS_PASSCODE_KEY);
        return { success: false, error: 'This account already has a passcode.' };
      }
      await savePinForReveal(userId, passcode);
      await AsyncStorage.removeItem(NEEDS_PASSCODE_KEY);
      return { success: true, username: result.username };
    } catch (error) {
      console.error('[AUTH] setFirstPasscode error:', error);
      if (error instanceof NoSessionError) {
        return { success: false, error: "Couldn't reach GutChecks. Check your connection and try again." };
      }
      return { success: false, error: 'Your passcode was not saved. Please try again.' };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      await endSession();

      const uidForPin = await AsyncStorage.getItem('user_id');
      await clearPinForReveal(uidForPin);

      const { revenueCatService } = await import('./revenueCatService');
      await revenueCatService.logOut();

      // Clear this phone's copy of History; the server copy stays for the next login.
      const { useChatHistoryStore } = await import('./stores/chatHistoryStore');
      await useChatHistoryStore.getState().clearAllChats();

      await AsyncStorage.multiRemove([
        'user_id',
        'username',
        'user_type',
        'is_logged_in',
        'subscription_status',
        'subscription_plan',
        NEEDS_PASSCODE_KEY,
        'user_profile',
        'user_age_range',
        'user_goal',
        '_has_active_subscription',
        '_skip_sub_check',
        '_sub_nav_from_home',
        '_sub_origin_screen',
      ]);

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
      if (!newPin || !PIN_PATTERN.test(newPin)) {
        return { success: false, error: 'PIN must be exactly 4 digits' };
      }

      const result = await callWithSession<{ ok: boolean; error?: string }>('gc_change_pin', {
        p_old_pin_hash: await this.hashPin(oldPin),
        p_new_pin_hash: await this.hashPin(newPin),
      });
      if (!result?.ok) {
        return {
          success: false,
          error: result?.error === 'invalid_credentials' ? 'Current PIN is incorrect' : messageFor(result?.error, 'Failed to update PIN'),
        };
      }

      await savePinForReveal(userId, newPin);
      return { success: true };
    } catch (error) {
      console.error('Update PIN error:', error);
      if (error instanceof NoSessionError) {
        return { success: false, error: 'Please log out and log in again, then change your PIN.' };
      }
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
    const bytes = Crypto.getRandomBytes(4);
    const pick = (b: number) => this.recoveryWordList[b % this.recoveryWordList.length];
    const digits = (1000 + (((bytes[1] << 8) | bytes[2]) % 9000)).toString();
    return `${pick(bytes[0])}-${digits}-${pick(bytes[3])}`;
  }

  private async hashRecoveryCode(code: string): Promise<string> {
    return sha256Hex(code.toUpperCase().trim());
  }

  /**
   * Hash and save the recovery code for the signed-in account.
   */
  async saveRecoveryCode(
    _userId: string,
    code: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await callWithSession<{ ok: boolean; error?: string }>('gc_set_recovery_code', {
        p_code_hash: await this.hashRecoveryCode(code),
      });
      if (!result?.ok) {
        return { success: false, error: result?.error || 'Failed to save recovery code' };
      }
      return { success: true };
    } catch (err: any) {
      console.error('[AUTH] saveRecoveryCode error:', err);
      return { success: false, error: 'Failed to save recovery code' };
    }
  }

  /**
   * Verify a username + recovery code combination without making any changes.
   */
  async verifyRecoveryCode(username: string, recoveryCode: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('gc_verify_recovery', {
        p_username: username.trim(),
        p_code_hash: await this.hashRecoveryCode(recoveryCode),
      });
      return !error && !!data?.ok;
    } catch {
      return false;
    }
  }

  /**
   * Verify the recovery code, reset the PIN, and log the user back in.
   */
  async resetPinWithRecoveryCode(
    username: string,
    recoveryCode: string,
    newPin: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!newPin || !PIN_PATTERN.test(newPin)) {
        return { success: false, error: 'PIN must be exactly 4 digits' };
      }

      const { data, error } = await supabase.rpc('gc_reset_pin_with_recovery', {
        p_username: username.trim(),
        p_code_hash: await this.hashRecoveryCode(recoveryCode),
        p_new_pin_hash: await this.hashPin(newPin),
      });

      if (error) {
        return { success: false, error: 'Recovery failed. Please check your connection and try again.' };
      }
      if (!data?.ok) {
        return {
          success: false,
          error: data?.error === 'invalid_credentials' ? 'Invalid username or recovery code' : messageFor(data?.error, 'Recovery failed'),
        };
      }

      await saveSessionToken(data.token);
      await storeLocalSession(data.user_id, data.username, data.user_type || 'username');
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
      const { data, error } = await supabase.rpc('gc_username_available', { p_username: username });
      if (error) return true;
      return data !== false;
    } catch {
      return true;
    }
  }

  /**
   * Delete user account and all associated data (profile, History, sessions)
   */
  async deleteAccount(): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        return { success: false, error: 'No user account found' };
      }

      try {
        await callWithSession('gc_delete_account');
      } catch (error) {
        if (error instanceof NoSessionError) {
          return {
            success: false,
            error: 'Please log out, log in again with your username and PIN, then delete your account.',
          };
        }
        console.error('Server delete error:', error);
        return {
          success: false,
          error: 'Unable to delete your account on our servers. Please check your connection and try again.',
        };
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
