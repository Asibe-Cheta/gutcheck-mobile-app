/**
 * Server session for the gc_* database functions.
 *
 * The app has no Supabase Auth session. gc_create_account / gc_login / gc_reset_pin_with_recovery
 * return a random token, kept in the phone's secure storage; every other gc_* call sends it and
 * the database acts only on that token's account.
 *
 * Phones that were logged in before this existed have no token. They get one silently by logging
 * in with the username and PIN already saved on the phone (pinRevealStorage), so nobody is asked
 * to log in again.
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getPinForReveal } from './pinRevealStorage';

const TOKEN_KEY = 'gc_session_token';

export class NoSessionError extends Error {
  constructor() {
    super('no_session');
    this.name = 'NoSessionError';
  }
}

/** Same SHA-256 the app has always sent; the server stores bcrypt of it. */
export async function sha256Hex(value: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

let cachedToken: string | null | undefined;
let bootstrap: Promise<string | null> | null = null;

export async function getSessionToken(): Promise<string | null> {
  if (cachedToken !== undefined) return cachedToken;
  try {
    cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    cachedToken = null;
  }
  return cachedToken;
}

export async function saveSessionToken(token: string): Promise<void> {
  cachedToken = token;
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  } catch (e) {
    console.warn('[SESSION] Could not store session token:', e);
  }
}

export async function clearSessionToken(): Promise<void> {
  cachedToken = null;
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // nothing stored
  }
}

function isNotAuthenticated(error: { code?: string; message?: string } | null): boolean {
  return !!error && (error.code === '28000' || (error.message || '').includes('not_authenticated'));
}

/** Silent login for phones that were logged in before server sessions existed. */
async function loginWithSavedCredentials(): Promise<string | null> {
  try {
    const [userId, username, isLoggedIn] = await Promise.all([
      AsyncStorage.getItem('user_id'),
      AsyncStorage.getItem('username'),
      AsyncStorage.getItem('is_logged_in'),
    ]);
    if (!userId || !username || isLoggedIn !== 'true') return null;
    const pin = await getPinForReveal(userId);
    if (!pin) return null;

    const pinHash = await sha256Hex(pin);
    const { data, error } = await supabase.rpc('gc_login', {
      p_username: username,
      p_pin_hash: pinHash,
    });

    // Accounts made while the app couldn't reach the server exist only on this phone: create the
    // server copy now. This can't touch another account: an existing user ID or username is refused.
    if (!error && data?.error === 'invalid_credentials') {
      const userType = (await AsyncStorage.getItem('user_type')) === 'username' ? 'username' : 'anonymous';
      const created = await supabase.rpc('gc_create_account', {
        p_user_id: userId,
        p_username: username,
        p_user_type: userType,
        p_pin_hash: pinHash,
      });
      if (!created.error && created.data?.ok) {
        await saveSessionToken(created.data.token);
        return created.data.token as string;
      }
      return null;
    }

    if (error || !data?.ok || data.user_id !== userId) {
      if (error) console.warn('[SESSION] Silent login failed:', error.message);
      return null;
    }
    await saveSessionToken(data.token);
    return data.token as string;
  } catch (e) {
    console.warn('[SESSION] Silent login error:', e);
    return null;
  }
}

/** Returns a token, creating one from saved credentials if needed; null if that isn't possible. */
export async function ensureSession(): Promise<string | null> {
  const existing = await getSessionToken();
  if (existing) return existing;
  if (!bootstrap) {
    bootstrap = loginWithSavedCredentials().finally(() => {
      bootstrap = null;
    });
  }
  return bootstrap;
}

/**
 * Call a gc_* function that needs the account's token. Retries once with a fresh silent login if
 * the server no longer recognises the token. Throws NoSessionError when there is no way to get one.
 */
export async function callWithSession<T = any>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await ensureSession();
    if (!token) throw new NoSessionError();
    const { data, error } = await supabase.rpc(fn, { p_token: token, ...args });
    if (!error) return data as T;
    if (isNotAuthenticated(error) && attempt === 0) {
      await clearSessionToken();
      continue;
    }
    throw error;
  }
  throw new NoSessionError();
}

/** Ends the server session (best effort) and forgets the token on this phone. */
export async function endSession(): Promise<void> {
  const token = await getSessionToken();
  if (token) {
    try {
      await supabase.rpc('gc_logout', { p_token: token });
    } catch {
      // offline: the token is still removed from this phone
    }
  }
  await clearSessionToken();
}
