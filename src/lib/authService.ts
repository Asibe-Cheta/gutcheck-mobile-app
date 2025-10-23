/**
 * Authentication Service
 * Handles anonymous and username+PIN authentication
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

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
   * Create an anonymous account (no PIN required)
   */
  async createAnonymousAccount(): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const userId = this.generateUserId();
      const username = this.generateAnonymousUsername();

      // Save to local storage
      await AsyncStorage.setItem('user_id', userId);
      await AsyncStorage.setItem('username', username);
      await AsyncStorage.setItem('user_type', 'anonymous');
      await AsyncStorage.setItem('is_logged_in', 'true');

      // Try to save to database (graceful failure if table doesn't exist)
      try {
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            username,
            user_type: 'anonymous',
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.warn('Database save failed (non-critical):', error);
        }
      } catch (dbError) {
        console.warn('Database operation failed (non-critical):', dbError);
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
      // Validate username
      if (!username || username.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters' };
      }

      // Validate PIN
      if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return { success: false, error: 'PIN must be exactly 4 digits' };
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

      // Save to local storage
      await AsyncStorage.setItem('user_id', userId);
      await AsyncStorage.setItem('username', username);
      await AsyncStorage.setItem('user_type', 'username');
      await AsyncStorage.setItem('is_logged_in', 'true');

      // Save to database with fallback for missing columns
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

        // Send debug info to remote logging service
        try {
          await fetch('https://httpbin.org/post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'auth_debug',
              timestamp: new Date().toISOString(),
              user_id: userId,
              username,
              supabaseUrl: supabase.supabaseUrl,
              isTestFlight: __DEV__ === false,
              platform: Platform.OS
            })
          });
        } catch (e) {
          console.log('Remote logging failed:', e);
        }

        // First try with all columns
        let insertData: any = {
          user_id: userId,
          username,
          created_at: new Date().toISOString(),
        };

        // Try to add optional columns if they exist
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

          // If the error is about missing columns, try a minimal insert
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
      } catch (dbError) {
        console.error('Database operation failed:', {
          error: dbError,
          message: dbError.message,
          stack: dbError.stack
        });
        return { success: false, error: `Database operation failed: ${dbError.message}` };
      }

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
   * Login with username and PIN
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
   * Logout current user
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      // Clear all auth-related data from local storage
      await AsyncStorage.removeItem('user_id');
      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('user_type');
      await AsyncStorage.removeItem('is_logged_in');
      
      // Clear onboarding flag so they don't see it again on login
      // (keep it cleared because they already completed it)
      
      // Clear other user-specific data
      await AsyncStorage.removeItem('subscription_status');
      await AsyncStorage.removeItem('subscription_plan');

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

      return { success: true };
    } catch (error) {
      console.error('Update PIN error:', error);
      return { success: false, error: 'Failed to update PIN' };
    }
  }

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
      const userType = await AsyncStorage.getItem('user_type');

      if (!userId) {
        return { success: false, error: 'No user account found' };
      }

      // Delete from database
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Database delete error:', error);
        return { success: false, error: 'Failed to delete account from database' };
      }

      // Clear all local storage
      await AsyncStorage.multiRemove([
        'user_id',
        'username', 
        'user_type',
        'is_logged_in',
        'subscription_status',
        'subscription_plan',
        'onboarding_completed'
      ]);

      return { success: true };
    } catch (error) {
      console.error('Delete account error:', error);
      return { success: false, error: 'Failed to delete account' };
    }
  }
}

export const authService = new AuthService();
