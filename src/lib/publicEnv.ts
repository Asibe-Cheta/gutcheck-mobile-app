/**
 * The only place the app reads EXPO_PUBLIC_* config.
 *
 * Expo inlines these values into the bundle only when written as process.env.EXPO_PUBLIC_NAME.
 * A dynamic process.env[name] is undefined in a production bundle, and an OTA update replaces
 * expoConfig.extra with whatever was set when `eas update` ran, so each value must be written out
 * in full here. Add new keys to this map.
 */

import Constants from 'expo-constants';

const INLINED: Record<string, string | undefined> = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_REVENUECAT_IOS_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
  EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
  EXPO_PUBLIC_ACTION_STEP_INGEST_SECRET: process.env.EXPO_PUBLIC_ACTION_STEP_INGEST_SECRET,
  EXPO_PUBLIC_ENABLE_REFERRAL_VERIFY: process.env.EXPO_PUBLIC_ENABLE_REFERRAL_VERIFY,
  EXPO_PUBLIC_REFERRAL_VERIFY_BASE_URL: process.env.EXPO_PUBLIC_REFERRAL_VERIFY_BASE_URL,
};

export function getPublicEnv(key: string): string | undefined {
  const inlined = INLINED[key];
  if (inlined) return inlined;
  try {
    const fromConfig = Constants?.expoConfig?.extra?.[key];
    return fromConfig ? String(fromConfig) : undefined;
  } catch {
    return undefined;
  }
}
