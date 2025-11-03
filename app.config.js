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
};

module.exports = {
  expo: {
    name: 'GutCheck',
    slug: 'gutcheck',
    // owner: 'bervic-digital',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/gc-main.png',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    splash: {
      image: './assets/gc-main.png',
      resizeMode: 'contain',
      backgroundColor: '#1a1d29',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.gutcheck.app',
      buildNumber: '34',
      infoPlist: {
        // NSUserTrackingUsageDescription: 'This app uses data to provide personalized mental health guidance and support.',
        NSCameraUsageDescription: 'This app allows you to upload images for AI analysis and guidance.',
        NSPhotoLibraryUsageDescription: 'This app allows you to select images from your photo library for AI analysis.',
        NSMicrophoneUsageDescription: 'This app may use the microphone for voice-based interactions.',
        NSLocationWhenInUseUsageDescription: 'This app may use location to provide region-specific mental health resources.',
        ITSAppUsesNonExemptEncryption: false,
        CFBundleDisplayName: 'GutCheck',
        CFBundleShortVersionString: '1.0.0',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/gc-main.png',
        backgroundColor: '#1a1d29',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'org.mygutcheck.app',
    },
    plugins: [
      'expo-router',
      // expo-in-app-purchases auto-links in Expo SDK 54+ (no plugin needed)
      // Adding it explicitly causes errors because it doesn't have a config plugin
    ],
    scheme: 'gutcheck',
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

