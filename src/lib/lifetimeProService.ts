import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LifetimeProUser {
  id: string;
  user_id: string;
  granted_at: string;
  is_active: boolean;
}

class LifetimeProService {
  private readonly MAX_LIFETIME_PRO_USERS = 20;
  private readonly LIFETIME_PRO_KEY = 'lifetime_pro_users_count';

  /**
   * Check if a user is eligible for lifetime pro (within first 20 users)
   */
  async checkLifetimeProEligibility(userId: string): Promise<{ isEligible: boolean; isLifetimePro: boolean; count: number }> {
    try {
      // Get current count of lifetime pro users
      const { data: lifetimeProUsers, error: countError } = await supabase
        .from('lifetime_pro_users')
        .select('id')
        .eq('is_active', true);

      if (countError) {
        console.error('Error fetching lifetime pro users count:', countError);
        return { isEligible: false, isLifetimePro: false, count: 0 };
      }

      const currentCount = lifetimeProUsers?.length || 0;

      // Check if user is already a lifetime pro user
      const { data: existingUser, error: userError } = await supabase
        .from('lifetime_pro_users')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking existing lifetime pro user:', userError);
        return { isEligible: false, isLifetimePro: false, count: currentCount };
      }

      const isLifetimePro = !!existingUser;
      const isEligible = currentCount < this.MAX_LIFETIME_PRO_USERS && !isLifetimePro;

      return { isEligible, isLifetimePro, count: currentCount };
    } catch (error) {
      console.error('Error checking lifetime pro eligibility:', error);
      return { isEligible: false, isLifetimePro: false, count: 0 };
    }
  }

  /**
   * Grant lifetime pro status to a user (if eligible)
   */
  async grantLifetimePro(userId: string): Promise<{ success: boolean; error?: string; isLifetimePro?: boolean }> {
    try {
      // Check eligibility first
      const { isEligible, isLifetimePro, count } = await this.checkLifetimeProEligibility(userId);

      if (isLifetimePro) {
        return { success: true, isLifetimePro: true };
      }

      if (!isEligible) {
        return { 
          success: false, 
          error: `Lifetime pro limit reached (${this.MAX_LIFETIME_PRO_USERS} users). Current count: ${count}` 
        };
      }

      // Grant lifetime pro status
      const { data, error } = await supabase
        .from('lifetime_pro_users')
        .insert({
          user_id: userId,
          granted_at: new Date().toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error granting lifetime pro:', error);
        return { success: false, error: error.message };
      }

      // Update user profile to reflect lifetime pro status
      await this.updateUserProfileForLifetimePro(userId);

      // Save to local storage
      await this.saveLifetimeProStatus(userId, true);

      console.log(`Lifetime pro granted to user ${userId}. Total lifetime pro users: ${count + 1}`);
      return { success: true, isLifetimePro: true };
    } catch (error) {
      console.error('Error granting lifetime pro:', error);
      return { success: false, error: 'Failed to grant lifetime pro status' };
    }
  }

  /**
   * Check if current user has lifetime pro status
   * Always checks database to ensure accuracy (doesn't trust cache if database says false)
   */
  async checkUserLifetimeProStatus(userId: string): Promise<boolean> {
    try {
      // Always check database first for accurate status
      const { data, error } = await supabase
        .from('lifetime_pro_users')
        .select('is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking lifetime pro status:', error);
        // On error, check local storage as fallback
        const localStatus = await AsyncStorage.getItem(`lifetime_pro_${userId}`);
        return localStatus === 'true';
      }

      const isLifetimePro = !!data?.is_active;
      
      // Always update local storage to match database (cache should reflect truth)
      await this.saveLifetimeProStatus(userId, isLifetimePro);
      
      return isLifetimePro;
    } catch (error) {
      console.error('Error checking user lifetime pro status:', error);
      // On error, check local storage as fallback
      try {
        const localStatus = await AsyncStorage.getItem(`lifetime_pro_${userId}`);
        return localStatus === 'true';
      } catch {
        return false;
      }
    }
  }

  /**
   * Get lifetime pro users count
   */
  async getLifetimeProCount(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('lifetime_pro_users')
        .select('id')
        .eq('is_active', true);

      if (error) {
        console.error('Error getting lifetime pro count:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error getting lifetime pro count:', error);
      return 0;
    }
  }

  /**
   * Update user profile to reflect lifetime pro status
   */
  private async updateUserProfileForLifetimePro(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_plan: 'lifetime_pro',
          subscription_status: 'active',
          is_lifetime_pro: true,
          lifetime_pro_granted_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user profile for lifetime pro:', error);
      }
    } catch (error) {
      console.error('Error updating user profile for lifetime pro:', error);
    }
  }

  /**
   * Save lifetime pro status to local storage
   */
  private async saveLifetimeProStatus(userId: string, isLifetimePro: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(`lifetime_pro_${userId}`, isLifetimePro.toString());
      await AsyncStorage.setItem('subscription_status', isLifetimePro ? 'active' : 'inactive');
      await AsyncStorage.setItem('subscription_plan', isLifetimePro ? 'lifetime_pro' : '');
    } catch (error) {
      console.error('Error saving lifetime pro status:', error);
    }
  }

  /**
   * Clear lifetime pro status (for testing purposes)
   */
  async clearLifetimeProStatus(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`lifetime_pro_${userId}`);
      await AsyncStorage.removeItem('subscription_status');
      await AsyncStorage.removeItem('subscription_plan');
    } catch (error) {
      console.error('Error clearing lifetime pro status:', error);
    }
  }

  /**
   * Remove user from lifetime pro users table (for testing IAP subscriptions)
   * This allows testing subscriptions even if you're in the first 20 users
   */
  async removeUserFromLifetimePro(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Remove from database
      const { error } = await supabase
        .from('lifetime_pro_users')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing user from lifetime pro:', error);
        return { success: false, error: error.message };
      }

      // Update profile
      await supabase
        .from('profiles')
        .update({
          is_lifetime_pro: false,
          subscription_plan: null,
          subscription_status: 'inactive'
        })
        .eq('user_id', userId);

      // Clear local storage
      await this.clearLifetimeProStatus(userId);

      console.log(`User ${userId} removed from lifetime pro for testing`);
      return { success: true };
    } catch (error) {
      console.error('Error removing user from lifetime pro:', error);
      return { success: false, error: 'Failed to remove lifetime pro status' };
    }
  }
}

export const lifetimeProService = new LifetimeProService();
