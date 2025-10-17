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
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#1a1d29',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'org.mygutcheck.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
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
    },
  },
};

