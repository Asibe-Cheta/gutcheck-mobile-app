/**
 * Privacy-safe analytics (PRD 17).
 *
 * Every event carries only its name, a few allow-listed codes, a random per-launch session ID,
 * the app version, the platform and an age bucket ("18-24", "25+" or "under_18_or_unknown").
 * Never pass inquiry text, titles, AI output or anything a person typed: the server rejects any
 * value that isn't a short code, and drops the whole event. No account ID is ever sent.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

type Code = string | number | boolean;

const SESSION_ID = Crypto.randomUUID().toLowerCase();

async function ageBucket(): Promise<string> {
  const band = await AsyncStorage.getItem('user_age_range').catch(() => null);
  return band === '18-24' || band === '25+' ? band : 'under_18_or_unknown';
}

/** Fire-and-forget: analytics must never slow down or break the app. */
export function track(name: string, props: Record<string, Code | null | undefined> = {}): void {
  void (async () => {
    try {
      const clean: Record<string, Code> = {};
      for (const [key, value] of Object.entries(props)) {
        if (value !== null && value !== undefined) clean[key] = value;
      }
      await supabase.rpc('gc_log_event', {
        p_name: name,
        p_props: clean,
        p_session_id: SESSION_ID,
        p_app_version: Constants.expoConfig?.version ?? null,
        p_platform: Platform.OS === 'android' ? 'android' : 'ios',
        p_age_bucket: await ageBucket(),
      });
    } catch {
      // ignored by design
    }
  })();
}
