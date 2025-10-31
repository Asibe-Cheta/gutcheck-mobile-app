/**
 * MINIMAL TEST SUBSCRIPTION SCREEN
 * This is a bare-bones version to test if routing works
 * If this works, the crash is in the imports. If this crashes too, it's routing.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function SubscriptionTestScreen() {
  console.log('[SUB_TEST] ✅ Minimal test screen loaded successfully!');
  console.log('[SUB_TEST] This proves routing works. If you see this, the crash is in subscription.tsx imports.');
  
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>✅ Test Subscription Screen</Text>
        <Text style={styles.text}>
          If you're seeing this, routing works!{'\n\n'}
          The crash is in the subscription.tsx imports.{'\n\n'}
          Check Debug Info → Filter: "SUB_TEST"
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

