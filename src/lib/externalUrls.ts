import Constants from 'expo-constants';

/**
 * Public URLs used in-app and in Play Console (Data safety → account deletion link).
 * Google requires the deletion URL’s page to reference the same app name / developer as the store listing.
 */

export const WEBSITE_BASE_URL = 'https://mygutcheck.org';

export const externalUrls = {
  privacyPolicy: `${WEBSITE_BASE_URL}/privacy`,
  termsOfUse: `${WEBSITE_BASE_URL}/terms`,
  accountDeletion: `${WEBSITE_BASE_URL}/delete-account`,
} as const;

/** Must match the Google Play store title (Data safety / policy checks). */
export const GOOGLE_PLAY_APP_TITLE = 'GutChecks: Red Flags & Safety';

function getEnvVar(key: string, defaultValue = ''): string {
  try {
    if (process.env[key]) return process.env[key] as string;
    if (Constants?.expoConfig?.extra?.[key]) return Constants.expoConfig.extra[key] as string;
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

export function getReferralVerifyBaseUrl(): string {
  return getEnvVar('EXPO_PUBLIC_REFERRAL_VERIFY_BASE_URL', WEBSITE_BASE_URL);
}

export function isReferralVerificationEnabled(): boolean {
  return getEnvVar('EXPO_PUBLIC_ENABLE_REFERRAL_VERIFY', 'false') === 'true';
}

export function getAiDataUseConsentMessage(): string {
  return (
    'To provide guidance, your messages and any images you send are processed by Anthropic (Claude), a third-party AI service. We do not use your content to train AI models. Your data is used only to generate responses and is handled according to our Privacy Policy.\n\n' +
    'By tapping Accept, you agree to this use. See our Privacy Policy for full details: ' +
    externalUrls.privacyPolicy
  );
}
