/**
 * Stores the 4-digit PIN only in the device secure store (never on GutChecks servers)
 * so logged-in users can reveal it after biometric / device authentication.
 * Cleared on logout and account deletion.
 */

import * as SecureStore from 'expo-secure-store';

const PREFIX = 'gutcheck_pin_reveal_v1_';

function keyFor(userId: string) {
  return `${PREFIX}${userId}`;
}

export async function savePinForReveal(userId: string, pin: string): Promise<void> {
  if (!userId || !pin || pin.length !== 4) return;
  try {
    await SecureStore.setItemAsync(keyFor(userId), pin, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (e) {
    console.warn('[PIN_REVEAL] Could not save PIN to secure store:', e);
  }
}

export async function getPinForReveal(userId: string): Promise<string | null> {
  if (!userId) return null;
  try {
    return await SecureStore.getItemAsync(keyFor(userId));
  } catch (e) {
    console.warn('[PIN_REVEAL] Could not read PIN from secure store:', e);
    return null;
  }
}

export async function clearPinForReveal(userId: string | null | undefined): Promise<void> {
  if (!userId) return;
  try {
    await SecureStore.deleteItemAsync(keyFor(userId));
  } catch {
    /* already missing */
  }
}
