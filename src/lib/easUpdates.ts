/**
 * EAS Update: optional launch-time check (production only).
 *
 * Native auto-check is disabled (checkAutomatically: NEVER) so a bad OTA cannot
 * crash the app via expo.controller.errorRecoveryQueue before JS boots.
 * Chat and core features work on the embedded store bundle via server proxies.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

const LEGACY_OTA_DEBUG_KEY = '@ota_debug_v1';

/** Applies production-channel OTA updates after launch; a failed check keeps the current bundle. */
const APPLY_OTA_ON_LAUNCH = true;

export async function runLaunchOtaApply(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled || !APPLY_OTA_ON_LAUNCH) return;

  try {
    await AsyncStorage.removeItem(LEGACY_OTA_DEBUG_KEY);
  } catch {
    /* non-fatal */
  }

  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return;

    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  } catch {
    // Offline, quota, or update server unreachable — keep running the current bundle.
  }
}
