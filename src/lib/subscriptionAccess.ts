/**
 * Single place to decide if the signed-in user may enter the main app (tabs).
 * Uses lifetime pro DB + RevenueCat (after setAppUserID). Fails closed on errors * unless AsyncStorage still says subscription_status === 'active' (outage fallback).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { revenueCatService } from '@/lib/revenueCatService';
import { getLifetimeProService } from '@/lib/lifetimeProService';

export async function userHasPremiumAccess(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;

  try {
    const lifetimeProService = getLifetimeProService();
    const isLifetimePro = await lifetimeProService.checkUserLifetimeProStatus(userId);
    if (isLifetimePro) return true;

    await revenueCatService.setAppUserID(userId);
    return await revenueCatService.hasActiveSubscription();
  } catch (error) {
    console.error('[SUB_ACCESS] Premium check failed:', error);
    try {
      const cached = await AsyncStorage.getItem('subscription_status');
      if (cached === 'active') {
        console.warn('[SUB_ACCESS] Using cached subscription_status=active after verification error');
        return true;
      }
    } catch (_) {
      /* ignore */
    }
    return false;
  }
}
