/**
 * Subscription Screen Wrapper
 * Dynamically loads the subscription screen to avoid native crashes during module resolution
 */

// Log at the VERY FIRST line
console.log('[SUB_WRAPPER] subscription-wrapper.tsx file is being evaluated/loaded');

import React, { Suspense } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

console.log('[SUB_WRAPPER] ✅ Basic imports completed');

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
    console.log('[SUB_WRAPPER] Component already loaded, skipping');
    return; // Already loaded
  }
  
  if (loadError) {
    console.error('[SUB_WRAPPER] Previous load failed, rethrowing error');
    throw loadError; // Already tried and failed
  }
  
  if (loadingPromise) {
    console.log('[SUB_WRAPPER] Already loading, waiting for existing promise...');
    return loadingPromise; // Already loading
  }
  
  console.log('[SUB_WRAPPER] Creating new loading promise...');
  loadingPromise = (async () => {
    try {
      console.log('[SUB_WRAPPER] Step 1: About to call import()...');
      console.log('[SUB_WRAPPER] Step 1.1: import() call initiated');
      
      const module = await import('./subscription');
      
      console.log('[SUB_WRAPPER] Step 2: ✅ Dynamic import() completed successfully');
      console.log('[SUB_WRAPPER] Step 2.1: Module received:', typeof module);
      console.log('[SUB_WRAPPER] Step 2.2: Module keys:', Object.keys(module || {}));
      
      SubscriptionScreenComponent = module.default;
      console.log('[SUB_WRAPPER] Step 3: ✅ Component extracted:', typeof SubscriptionScreenComponent);
      console.log('[SUB_WRAPPER] ✅ All steps completed successfully!');
    } catch (error: any) {
      console.error('[SUB_WRAPPER] ❌ Dynamic import failed at step:', error?.message);
      console.error('[SUB_WRAPPER] Error type:', error?.constructor?.name);
      console.error('[SUB_WRAPPER] Error stack:', error?.stack);
      console.error('[SUB_WRAPPER] Full error object:', JSON.stringify({
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        toString: String(error)
      }, null, 2));
      loadError = error;
      throw error;
    }
  })();
  
  return loadingPromise;
}

export default function SubscriptionWrapper() {
  console.log('[SUB_WRAPPER] Component function called - wrapper is mounting');
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null);

  React.useEffect(() => {
    console.log('[SUB_WRAPPER] useEffect triggered, calling loadSubscriptionScreen()...');
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

