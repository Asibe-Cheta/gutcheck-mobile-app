# 🚨 SoundBridge App Launch Issue - Complete Solution

## 📋 Problem Analysis

Based on your GutCheck app's experience with similar issues, SoundBridge is likely experiencing **app launch failures** due to **environment variable configuration problems**. This is a common issue in React Native/Expo apps where the app crashes immediately on startup.

## 🔍 Root Cause Analysis

### **Primary Issue: Missing Environment Variables**
The app is likely failing to launch because:

1. **Environment variables not properly configured** in production builds
2. **API keys missing** causing immediate crashes when services try to initialize
3. **Database connection failures** due to missing Supabase credentials
4. **AI service initialization errors** due to missing API keys

### **Secondary Issues:**
- App configuration not properly set up for production
- Missing fallback handling for missing environment variables
- Build process not injecting environment variables correctly

---

## ✅ Complete Solution for SoundBridge

### **Step 1: Environment Variables Setup**

#### **A. Create `.env` File (Development)**
Create a `.env` file in your project root with these **REQUIRED** variables:

```env
# Database Configuration (CRITICAL)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AI Service Configuration (REQUIRED)
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key_here
# OR
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# App Configuration
EXPO_PUBLIC_APP_ENV=development

# Optional Services
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key_here
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

#### **B. Update `app.config.js` (Production)**
```javascript
// Environment variables are provided by EAS Build in production
const envVars = {
  // Add your environment variables here for production builds
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_ANTHROPIC_API_KEY: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'production',
};

module.exports = {
  expo: {
    name: 'SoundBridge', // Update with your app name
    slug: 'soundbridge',   // Update with your app slug
    version: '1.0.0',
    // ... your existing config
    extra: {
      // Inject environment variables into the app
      ...envVars,
      // Your other extra config
    },
  },
};
```

### **Step 2: Add Environment Variable Validation**

#### **A. Create Environment Check Service**
Create `src/lib/envCheck.ts`:

```typescript
import Constants from 'expo-constants';

export interface EnvStatus {
  supabase: boolean;
  ai: boolean;
  app: boolean;
  missing: string[];
}

export function checkEnvironmentVariables(): EnvStatus {
  const missing: string[] = [];
  
  // Check Supabase
  const hasSupabaseUrl = !!(
    process.env.EXPO_PUBLIC_SUPABASE_URL || 
    Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL
  );
  const hasSupabaseKey = !!(
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
    Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );
  
  if (!hasSupabaseUrl) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!hasSupabaseKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  
  // Check AI Service
  const hasAnthropic = !!(
    process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || 
    Constants.expoConfig?.extra?.EXPO_PUBLIC_ANTHROPIC_API_KEY
  );
  const hasOpenAI = !!(
    process.env.EXPO_PUBLIC_OPENAI_API_KEY || 
    Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY
  );
  
  if (!hasAnthropic && !hasOpenAI) {
    missing.push('EXPO_PUBLIC_ANTHROPIC_API_KEY or EXPO_PUBLIC_OPENAI_API_KEY');
  }
  
  return {
    supabase: hasSupabaseUrl && hasSupabaseKey,
    ai: hasAnthropic || hasOpenAI,
    app: true,
    missing
  };
}
```

#### **B. Add Environment Check to App Initialization**
Update your main app file (e.g., `src/app/_layout.tsx`):

```typescript
import React, { useEffect, useState } from 'react';
import { checkEnvironmentVariables, EnvStatus } from '@/lib/envCheck';

export default function RootLayout() {
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkEnv = () => {
      const status = checkEnvironmentVariables();
      setEnvStatus(status);
      
      if (status.missing.length === 0) {
        setIsReady(true);
      } else {
        console.error('Missing environment variables:', status.missing);
        // Handle missing environment variables
        // You can show an error screen or use fallback values
      }
    };
    
    checkEnv();
  }, []);

  if (!isReady) {
    return <LoadingScreen />; // Show loading while checking
  }

  if (envStatus?.missing.length > 0) {
    return <EnvironmentErrorScreen missing={envStatus.missing} />;
  }

  return (
    // Your normal app content
  );
}
```

### **Step 3: Add Fallback Handling**

#### **A. Update Supabase Configuration**
Update your Supabase client configuration:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get environment variables with fallbacks
const supabaseUrl = 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 
  'https://placeholder.supabase.co';

const supabaseAnonKey = 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  'placeholder-key';

// Debug logging
console.log('Supabase Configuration:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
  keyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'MISSING',
  isProduction: Constants.expoConfig?.extra?.EXPO_PUBLIC_APP_ENV === 'production',
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

#### **B. Update AI Service Configuration**
Update your AI service to handle missing API keys gracefully:

```typescript
// src/lib/ai.ts
import Constants from 'expo-constants';

class AIAnalysisService {
  private config: AIConfig;

  constructor() {
    // Get API keys with fallbacks
    const hasAnthropic = !!(
      process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || 
      Constants.expoConfig?.extra?.EXPO_PUBLIC_ANTHROPIC_API_KEY
    );
    const hasOpenAI = !!(
      process.env.EXPO_PUBLIC_OPENAI_API_KEY || 
      Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY
    );
    
    if (!hasAnthropic && !hasOpenAI) {
      console.warn('No AI API keys found - AI features will be disabled');
    }
    
    this.config = {
      provider: hasAnthropic ? 'anthropic' : (hasOpenAI ? 'openai' : 'anthropic'),
      model: hasAnthropic ? 'claude-sonnet-4-20250514' : (hasOpenAI ? 'gpt-4' : 'claude-sonnet-4-20250514'),
      max_tokens: 2000,
      temperature: 0.3,
    };
  }

  // Add error handling for missing API keys
  private async makeAIRequest(prompt: string): Promise<string> {
    const apiKey = this.getAPIKey();
    
    if (!apiKey) {
      throw new Error('AI API key not configured');
    }
    
    // Your existing AI request logic
  }
  
  private getAPIKey(): string | null {
    if (this.config.provider === 'anthropic') {
      return process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || 
             Constants.expoConfig?.extra?.EXPO_PUBLIC_ANTHROPIC_API_KEY || 
             null;
    } else {
      return process.env.EXPO_PUBLIC_OPENAI_API_KEY || 
             Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY || 
             null;
    }
  }
}
```

### **Step 4: Production Build Configuration**

#### **A. EAS Build Configuration**
Create or update `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "your_production_supabase_url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your_production_supabase_anon_key",
        "EXPO_PUBLIC_ANTHROPIC_API_KEY": "your_production_anthropic_key",
        "EXPO_PUBLIC_APP_ENV": "production"
      }
    },
    "development": {
      "env": {
        "EXPO_PUBLIC_APP_ENV": "development"
      }
    }
  }
}
```

#### **B. Build Commands**
```bash
# For development builds
eas build --profile development

# For production builds
eas build --profile production
```

### **Step 5: Error Handling & User Experience**

#### **A. Create Error Screen Component**
```typescript
// src/components/EnvironmentErrorScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  missing: string[];
}

export default function EnvironmentErrorScreen({ missing }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuration Error</Text>
      <Text style={styles.message}>
        The app is missing required configuration. Please contact support.
      </Text>
      <Text style={styles.details}>
        Missing: {missing.join(', ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  details: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
```

#### **B. Add Loading Screen**
```typescript
// src/components/LoadingScreen.tsx
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Loading SoundBridge...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
  },
});
```

---

## 🚀 Quick Fix for Immediate Launch

### **Emergency Solution (If App Won't Launch At All)**

1. **Create a minimal `.env` file** with placeholder values:
```env
EXPO_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=placeholder-key
EXPO_PUBLIC_ANTHROPIC_API_KEY=placeholder-key
EXPO_PUBLIC_APP_ENV=development
```

2. **Add error boundaries** to prevent crashes:
```typescript
// Wrap your app with error boundary
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Something went wrong: {error.message}</Text>
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {/* Your app content */}
    </ErrorBoundary>
  );
}
```

3. **Add try-catch blocks** around service initialization:
```typescript
useEffect(() => {
  const initializeApp = async () => {
    try {
      // Initialize services
      await initializeServices();
    } catch (error) {
      console.error('App initialization failed:', error);
      // Handle gracefully - show error screen or fallback
    }
  };
  
  initializeApp();
}, []);
```

---

## 📋 Testing Checklist

### **Before Deployment:**
- [ ] All environment variables are set
- [ ] App launches without crashes
- [ ] Database connection works
- [ ] AI services respond (if configured)
- [ ] Error handling works for missing services
- [ ] Production build includes environment variables

### **After Deployment:**
- [ ] App launches on device
- [ ] All features work as expected
- [ ] No console errors in production
- [ ] Graceful degradation for missing services

---

## 🆘 If Still Not Working

### **Debug Steps:**
1. **Check console logs** for specific error messages
2. **Verify environment variables** are actually being loaded
3. **Test with minimal configuration** (remove optional services)
4. **Check build configuration** matches your environment setup

### **Common Issues:**
- **UTF-16 encoding** in `.env` file (should be UTF-8)
- **Missing quotes** around environment variable values
- **Incorrect variable names** (must start with `EXPO_PUBLIC_`)
- **Build process** not injecting environment variables

---

## 📞 Support

If you're still experiencing issues after following this guide, the problem might be:

1. **Platform-specific configuration** (iOS vs Android)
2. **Build tool configuration** (EAS vs local builds)
3. **Service-specific issues** (Supabase, AI providers)
4. **Code-level problems** in service initialization

**Next Steps:**
1. Implement the environment variable validation
2. Add error boundaries and fallback handling
3. Test with minimal configuration first
4. Gradually add services back
5. Check console logs for specific error messages

This solution is based on the successful fixes applied to the GutCheck app, which had identical launch issues that were resolved using these exact steps.
