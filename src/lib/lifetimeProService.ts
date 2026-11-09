import AsyncStorage from '@react-native-async-storage/async-storage';
import { callWithSession } from './accountSession';

/**
 * Lifetime Pro status. Granting is server-only (the old client-side grant and the public
 * grant_lifetime_pro function let anyone give themselves Premium); the app can only read its own
 * status and, for IAP testing, remove itself.
 */
class LifetimeProService {
  private async cache(userId: string, isLifetimePro: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(`lifetime_pro_${userId}`, isLifetimePro.toString());
      if (isLifetimePro) {
        await AsyncStorage.setItem('subscription_status', 'active');
        await AsyncStorage.setItem('subscription_plan', 'lifetime_pro');
      }
    } catch (error) {
      console.error('Error saving lifetime pro status:', error);
    }
  }

  /** Eligibility is decided on the server; the app never grants. */
  async checkLifetimeProEligibility(userId: string): Promise<{ isEligible: boolean; isLifetimePro: boolean; count: number }> {
    const isLifetimePro = await this.checkUserLifetimeProStatus(userId);
    return { isEligible: false, isLifetimePro, count: 0 };
  }

  async grantLifetimePro(_userId: string): Promise<{ success: boolean; error?: string; isLifetimePro?: boolean }> {
    return { success: false, error: 'Lifetime Pro can only be granted by GutChecks.' };
  }

  /** Server status for the signed-in account; falls back to the last known value when offline. */
  async checkUserLifetimeProStatus(userId: string): Promise<boolean> {
    try {
      const isLifetimePro = (await callWithSession<boolean>('gc_lifetime_pro_status')) === true;
      await this.cache(userId, isLifetimePro);
      return isLifetimePro;
    } catch (error) {
      console.warn('[LIFETIME_PRO] Status check failed, using cached value:', error);
      try {
        return (await AsyncStorage.getItem(`lifetime_pro_${userId}`)) === 'true';
      } catch {
        return false;
      }
    }
  }

  async getLifetimeProCount(): Promise<number> {
    return 0;
  }

  async clearLifetimeProStatus(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`lifetime_pro_${userId}`);
      await AsyncStorage.removeItem('subscription_status');
      await AsyncStorage.removeItem('subscription_plan');
    } catch (error) {
      console.error('Error clearing lifetime pro status:', error);
    }
  }

  /** For IAP testing: remove the signed-in account's own Lifetime Pro. */
  async removeUserFromLifetimePro(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await callWithSession('gc_lifetime_pro_remove');
      await this.clearLifetimeProStatus(userId);
      return { success: true };
    } catch (error) {
      console.error('Error removing user from lifetime pro:', error);
      return { success: false, error: 'Failed to remove lifetime pro status' };
    }
  }
}

export const lifetimeProService = new LifetimeProService();

/** Accessor used by subscriptionAccess, welcome, chat, etc. */
export function getLifetimeProService() {
  return lifetimeProService;
}
