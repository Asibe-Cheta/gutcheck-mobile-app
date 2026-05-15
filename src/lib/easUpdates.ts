/**
 * EAS Update: after a new bundle is published, apply it on next cold start (production only).
 */

import * as Updates from 'expo-updates';

export async function runLaunchOtaApply(): Promise<void> {
  if (__DEV__) return;
  if (!Updates.isEnabled) {
    console.log('[OTA] expo-updates disabled in this build');
    return;
  }

  try {
    console.log('[OTA] checking', {
      channel: Updates.channel ?? 'unknown',
      runtimeVersion: Updates.runtimeVersion ?? 'unknown',
      updateId: Updates.updateId ?? 'embedded',
    });
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) {
      console.log('[OTA] no update available');
      return;
    }

    console.log('[OTA] downloading update…');
    await Updates.fetchUpdateAsync();
    console.log('[OTA] reloading app with new bundle');
    await Updates.reloadAsync();
  } catch (e) {
    console.warn('[OTA] launch apply skipped', e);
  }
}
