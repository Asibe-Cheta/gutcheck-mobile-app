// Load environment variables from .env file
const fs = require('fs');
const path = require('path');

// Function to load .env file
function loadEnvFile() {
  const envPath = path.resolve(__dirname, '.env');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    // Read as buffer first to detect encoding
    const buffer = fs.readFileSync(envPath);
    // Convert to UTF-8 string, removing BOM if present
    let envContent = buffer.toString('utf8').replace(/^\uFEFF/, '');
    
    // Split into lines and process
    const lines = envContent.split(/\r?\n/);
    
    for (const line of lines) {
      // Skip comments and empty lines
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('#') || !trimmedLine) {
        continue;
      }
      
      const equalsIndex = trimmedLine.indexOf('=');
      if (equalsIndex > 0) {
        const key = trimmedLine.substring(0, equalsIndex).trim();
        const value = trimmedLine.substring(equalsIndex + 1).trim();
        if (key && value) {
          env[key] = value;
        }
      }
    }
  }
  
  return env;
}

const envVars = loadEnvFile();

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
    plugins: ['expo-router'],
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

