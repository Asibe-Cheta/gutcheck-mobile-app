/**
 * EAS Update: after a new bundle is published, apply it on next cold start (production only).
 */

import * as Updates from 'expo-updates';
import { captureOtaBaseline, recordOtaCheckResult, readOtaNativeLogs } from './otaDiagnostics';

export async function runLaunchOtaApply(): Promise<void> {
  if (__DEV__) return;

  await captureOtaBaseline();

  if (!Updates.isEnabled) {
    console.log('[OTA] expo-updates disabled in this build');
    await recordOtaCheckResult(false, {
      checkReason: 'Updates.isEnabled is false — this App Store binary cannot load EAS Update JS',
    });
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
      await recordOtaCheckResult(false, { checkReason: 'checkForUpdateAsync returned isAvailable=false' });
      return;
    }

    console.log('[OTA] downloading update…');
    await recordOtaCheckResult(true, { checkReason: 'update available, fetching' });
    await Updates.fetchUpdateAsync();
    console.log('[OTA] reloading app with new bundle');
    await recordOtaCheckResult(true, { reloadScheduled: true });
    await Updates.reloadAsync();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const logs = await readOtaNativeLogs();
    console.warn('[OTA] launch apply skipped', message, logs.slice(-5));
    await recordOtaCheckResult(false, { fetchError: message });
  }
}
