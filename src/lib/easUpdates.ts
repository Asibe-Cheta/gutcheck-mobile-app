/**
 * EAS Update: after a new bundle is published, apply it on next cold start (production only).
 */

import * as Updates from 'expo-updates';

export async function runLaunchOtaApply(): Promise<void> {
  if (__DEV__) return;
  if (!Updates.isEnabled) return;

  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return;

    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  } catch (e) {
    console.warn('[OTA] launch apply skipped', e);
  }
}
