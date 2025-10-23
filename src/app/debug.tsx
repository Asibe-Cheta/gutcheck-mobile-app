import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export default function DebugScreen() {
  const [debugData, setDebugData] = useState<any>(null);
  const [envData, setEnvData] = useState<any>(null);

  useEffect(() => {
    loadDebugData();
  }, []);

  const loadDebugData = async () => {
    try {
      // Load debug data from AsyncStorage
      const authDebug = await AsyncStorage.getItem('debug_auth_data');
      const aiDebug = await AsyncStorage.getItem('debug_ai_data');
      
      setDebugData({
        auth: authDebug ? JSON.parse(authDebug) : null,
        ai: aiDebug ? JSON.parse(aiDebug) : null
      });

      // Load environment data
      setEnvData({
        allExtraKeys: Object.keys(Constants.expoConfig?.extra || {}),
        fullExtra: Constants.expoConfig?.extra,
        supabaseUrl: Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL,
        supabaseKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        anthropicKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_ANTHROPIC_API_KEY,
        isProduction: Constants.expoConfig?.extra?.EXPO_PUBLIC_APP_ENV === 'production'
      });
    } catch (error) {
      console.log('Error loading debug data:', error);
    }
  };

  const clearDebugData = async () => {
    try {
      await AsyncStorage.removeItem('debug_auth_data');
      await AsyncStorage.removeItem('debug_ai_data');
      setDebugData(null);
    } catch (error) {
      console.log('Error clearing debug data:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Debug Information</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Environment Variables</Text>
        <Text style={styles.text}>
          Supabase URL: {envData?.supabaseUrl ? 'Present' : 'MISSING'}
        </Text>
        <Text style={styles.text}>
          Supabase Key: {envData?.supabaseKey ? 'Present' : 'MISSING'}
        </Text>
        <Text style={styles.text}>
          Anthropic Key: {envData?.anthropicKey ? 'Present' : 'MISSING'}
        </Text>
        <Text style={styles.text}>
          Production: {envData?.isProduction ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.text}>
          All Keys: {envData?.allExtraKeys?.join(', ') || 'None'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Data</Text>
        <Text style={styles.text}>
          Auth Debug: {debugData?.auth ? 'Available' : 'Not Available'}
        </Text>
        <Text style={styles.text}>
          AI Debug: {debugData?.ai ? 'Available' : 'Not Available'}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={loadDebugData}>
        <Text style={styles.buttonText}>Refresh Debug Data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={clearDebugData}>
        <Text style={styles.buttonText}>Clear Debug Data</Text>
      </TouchableOpacity>

      {debugData?.auth && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auth Debug Details</Text>
          <Text style={styles.text}>
            {JSON.stringify(debugData.auth, null, 2)}
          </Text>
        </View>
      )}

      {debugData?.ai && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Debug Details</Text>
          <Text style={styles.text}>
            {JSON.stringify(debugData.ai, null, 2)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1d29',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#2a2d39',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
