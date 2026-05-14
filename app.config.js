// Environment variables are provided by EAS Build in production
// EAS will inject variables from the EAS dashboard or eas.json build profile
// These fallback to process.env for local development
const envVars = {
  // These will be overridden by EAS build env vars if set
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_ANTHROPIC_API_KEY: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'development',
  EXPO_PUBLIC_REVENUECAT_IOS_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
  EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
  EXPO_PUBLIC_ENABLE_REFERRAL_VERIFY: process.env.EXPO_PUBLIC_ENABLE_REFERRAL_VERIFY,
  EXPO_PUBLIC_REFERRAL_VERIFY_BASE_URL: process.env.EXPO_PUBLIC_REFERRAL_VERIFY_BASE_URL,
  EXPO_PUBLIC_ACTION_STEP_INGEST_SECRET: process.env.EXPO_PUBLIC_ACTION_STEP_INGEST_SECRET,
};

module.exports = {
  expo: {
    name: 'GutChecks: Red Flags & Safety',
    slug: 'gutcheck',
    // owner: 'bervic-digital',
    version: '2.2.2',
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
      buildNumber: '202',
      infoPlist: {
        // NSUserTrackingUsageDescription: 'This app uses data to provide personalized mental health guidance and support.',
        NSCameraUsageDescription: 'This app allows you to upload images for AI analysis and guidance.',
        NSPhotoLibraryUsageDescription: 'This app allows you to select images from your photo library for AI analysis.',
        NSMicrophoneUsageDescription: 'This app may use the microphone for voice-based interactions.',
        NSSpeechRecognitionUsageDescription:
          'GutChecks uses speech recognition only to turn what you say into text in the chat on your device, so you can review and send it. Audio is processed by Apple’s speech services, not stored by GutChecks as a voice recording.',
        NSLocationWhenInUseUsageDescription: 'This app may use location to provide region-specific mental health resources.',
        NSFaceIDUsageDescription: 'GutChecks: Red Flags & Safety uses Face ID to securely log you in and protect your privacy.',
        ITSAppUsesNonExemptEncryption: false,
        CFBundleDisplayName: 'GutChecks: Red Flags & Safety',
        CFBundleShortVersionString: '2.2.2',
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
      versionCode: 202,
    },
    plugins: [
      ['expo-local-authentication', {}],
      ['expo-secure-store', {}],
      /** Embeds EAS Update URL / runtime; required for reliable OTA on store builds */
      'expo-updates',
    ],
    scheme: 'gutcheck',
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/8e8f5512-18b9-489d-9b05-ee5c0379ea29',
      enabled: true,
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 30000,
    },
    experiments: {
      typedRoutes: true,
    },
    extra: {
      // Inject environment variables into the app
      ...envVars,
      // App metadata
      websiteUrl: 'https://mygutcheck.org',
      supportEmail: 'support@mygutcheck.org',
      eas: {
        // Set by EAS init output so CLI can link the project
        projectId: '8e8f5512-18b9-489d-9b05-ee5c0379ea29',
      },
    },
  },
};

