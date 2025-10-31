/**
 * Subscription Screen Wrapper
 * Dynamically loads the subscription screen to avoid native crashes during module resolution
 */

import React, { Suspense } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Loading fallback component
function LoadingFallback() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.text}>Loading subscription...</Text>
      </View>
    </SafeAreaView>
  );
}

// Error fallback component
function ErrorFallback({ error }: { error: Error }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.errorTitle}>❌ Failed to Load Subscription</Text>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    </SafeAreaView>
  );
}

// Dynamic import wrapper
let SubscriptionScreenComponent: React.ComponentType | null = null;
let loadingPromise: Promise<void> | null = null;
let loadError: Error | null = null;

async function loadSubscriptionScreen() {
  if (SubscriptionScreenComponent) {
    return; // Already loaded
  }
  
  if (loadError) {
    throw loadError; // Already tried and failed
  }
  
  if (loadingPromise) {
    return loadingPromise; // Already loading
  }
  
  loadingPromise = (async () => {
    try {
      console.log('[SUB_WRAPPER] Starting dynamic import of subscription screen...');
      const module = await import('./subscription');
      console.log('[SUB_WRAPPER] ✅ Dynamic import completed');
      SubscriptionScreenComponent = module.default;
      console.log('[SUB_WRAPPER] ✅ Component extracted:', typeof SubscriptionScreenComponent);
    } catch (error: any) {
      console.error('[SUB_WRAPPER] ❌ Dynamic import failed:', error);
      loadError = error;
      throw error;
    }
  })();
  
  return loadingPromise;
}

export default function SubscriptionWrapper() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null);

  React.useEffect(() => {
    loadSubscriptionScreen()
      .then(() => {
        console.log('[SUB_WRAPPER] Setting component in state...');
        setComponent(() => SubscriptionScreenComponent);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[SUB_WRAPPER] Error loading component:', err);
        setError(err);
        setIsLoading(false);
      });
  }, []);

  if (error) {
    return <ErrorFallback error={error} />;
  }

  if (isLoading || !Component) {
    return <LoadingFallback />;
  }

  console.log('[SUB_WRAPPER] Rendering subscription screen component');
  return <Component />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1d29',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
});

