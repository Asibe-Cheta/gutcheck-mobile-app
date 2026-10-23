// Environment variables are provided by EAS Build in production
// EAS will inject variables from the EAS dashboard or eas.json build profile
// These fallback to process.env for local development
const APP_VERSION = '2.2.7';
const IOS_BUILD_NUMBER = '222';
const ANDROID_VERSION_CODE = 55;

// EAS project @bervic-digital/gutcheck. The previous project (@justice_asibe/gutcheck,
// 8e8f5512-18b9-489d-9b05-ee5c0379ea29) is unusable while that account is disabled.
const EAS_PROJECT_ID = '17b7de67-e1ec-4648-8a0c-74e8f2394332';

const envVars = {
  // These will be overridden by EAS build env vars if set
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_ANTHROPIC_API_KEY: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'development',
  EXPO_PUBLIC_REVENUECAT_IOS_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
  EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
  EXPO_PUBLIC_ENABLE_REFERRAL_VERIFY: process.env.EXPO_PUBLIC_ENABLE_REFERRAL_VERIFY,
  EXPO_PUBLIC_REFERRAL_VERIFY_BASE_URL: process.env.EXPO_PUBLIC_REFERRAL_VERIFY_BASE_URL,
  EXPO_PUBLIC_ACTION_STEP_INGEST_SECRET: process.env.EXPO_PUBLIC_ACTION_STEP_INGEST_SECRET,
};

// Explicit string runtime (matches Global Ready). Override only when publishing OTA for an
// older store binary, e.g. OTA_RUNTIME_VERSION=2.2.3 npm run ota:production:legacy
const runtimeVersion = process.env.OTA_RUNTIME_VERSION || APP_VERSION;

module.exports = {
  expo: {
    name: 'GutChecks: Red Flags & Safety',
    slug: 'gutcheck',
    owner: 'bervic-digital',
    version: APP_VERSION,
    orientation: 'default',
    icon: './assets/new-gut-logo.jpeg',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/new-gut-logo.jpeg',
      resizeMode: 'contain',
      backgroundColor: '#1a1d29',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.gutcheck.app',
      buildNumber: IOS_BUILD_NUMBER,
      runtimeVersion,
      infoPlist: {
        // NSUserTrackingUsageDescription: 'This app uses data to provide personalized mental health guidance and support.',
        NSCameraUsageDescription: 'This app allows you to upload images for AI analysis and guidance.',
        NSPhotoLibraryUsageDescription: 'This app allows you to select images from your photo library for AI analysis.',
        NSMicrophoneUsageDescription: 'This app may use the microphone for voice-based interactions.',
        NSSpeechRecognitionUsageDescription:
          'GutChecks uses speech recognition only to turn what you say into text in the chat on your device, so you can review and send it. Audio is processed by Apple speech services. GutChecks does not store your voice as a recording.',
        NSLocationWhenInUseUsageDescription: 'This app may use location to provide region-specific mental health resources.',
        NSFaceIDUsageDescription: 'GutChecks: Red Flags & Safety uses Face ID to securely log you in and protect your privacy.',
        ITSAppUsesNonExemptEncryption: false,
        CFBundleDisplayName: 'GutChecks: Red Flags & Safety',
        CFBundleShortVersionString: APP_VERSION,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/new-gut-logo.jpeg',
        backgroundColor: '#1a1d29',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'org.mygutcheck.app',
      versionCode: ANDROID_VERSION_CODE,
      runtimeVersion,
    },
    plugins: [
      ['expo-local-authentication', {}],
      ['expo-secure-store', {}],
      [
        'expo-speech-recognition',
        {
          speechRecognitionPermission:
            'GutChecks uses speech recognition only to turn what you say into text in the chat on your device, so you can review and send it. Audio is processed by Apple speech services. GutChecks does not store your voice as a recording.',
          microphonePermission: 'This app may use the microphone for voice-based interactions.',
        },
      ],
      'expo-updates',
    ],
    scheme: 'gutcheck',
    runtimeVersion,
    updates: {
      ...(EAS_PROJECT_ID ? { url: `https://u.expo.dev/${EAS_PROJECT_ID}` } : {}),
      requestHeaders: {
        'expo-channel-name': 'production',
      },
      // Never block launch on OTA. A bad update previously crashed via
      // expo.controller.errorRecoveryQueue; JS applies updates only after a successful boot.
      checkAutomatically: 'NEVER',
      fallbackToCacheTimeout: 0,
    },
    experiments: {
      typedRoutes: true,
    },
    extra: {
      // Inject environment variables into the app
      ...envVars,
      // App metadata
      websiteUrl: 'https://mygutcheck.org',
      supportEmail: 'contact@mygutcheck.org',
      eas: {
        // Set by EAS init output so CLI can link the project
        ...(EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : {}),
      },
    },
  },
};
