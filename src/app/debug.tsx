import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getLogs, clearLogs, getLogCount, exportLogsAsText } from '@/lib/logCapture';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';

export default function DebugScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [debugData, setDebugData] = useState<any>(null);
  const [envData, setEnvData] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadDebugData();
    // Refresh logs every second
    const interval = setInterval(() => {
      const capturedLogs = getLogs();
      setLogs(capturedLogs);
      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1000);
    return () => clearInterval(interval);
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
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        anthropicKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || Constants.expoConfig?.extra?.EXPO_PUBLIC_ANTHROPIC_API_KEY,
        isProduction: Constants.expoConfig?.extra?.EXPO_PUBLIC_APP_ENV === 'production',
        processEnvKeys: Object.keys(process.env || {}),
        processEnvSupabase: process.env.EXPO_PUBLIC_SUPABASE_URL,
        processEnvAnthropic: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY
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

  const handleCopyLogs = async () => {
    try {
      const logsText = await exportLogsAsText();
      if (logsText.trim()) {
        await Clipboard.setStringAsync(logsText);
        Alert.alert('Success', 'All logs copied to clipboard!');
      } else {
        Alert.alert('No Logs', 'There are no logs to copy.');
      }
    } catch (error) {
      console.error('Failed to copy logs:', error);
      Alert.alert('Error', 'Failed to copy logs to clipboard');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with back button */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Debug Information</Text>
        <View style={{ width: 40 }} /> {/* Spacer for centering */}
      </View>

      <ScrollView style={styles.scrollContent}>
      
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
        <Text style={styles.text}>
          Process Env Keys: {envData?.processEnvKeys?.join(', ') || 'None'}
        </Text>
        <Text style={styles.text}>
          Process Env Supabase: {envData?.processEnvSupabase ? 'Present' : 'MISSING'}
        </Text>
        <Text style={styles.text}>
          Process Env Anthropic: {envData?.processEnvAnthropic ? 'Present' : 'MISSING'}
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

      {/* Console Logs Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Console Logs ({logs.length} entries)</Text>
        <TextInput
          style={styles.filterInput}
          placeholder="Filter logs (e.g., IAP, ERROR)..."
          value={filter}
          onChangeText={setFilter}
          placeholderTextColor="#888"
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.copyButton, { backgroundColor: '#2196F3' }]} 
            onPress={handleCopyLogs}
          >
            <Ionicons name="copy-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Copy All Logs</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#ff4444' }]} 
            onPress={() => {
              clearLogs();
              setLogs([]);
            }}
          >
            <Text style={styles.buttonText}>Clear Logs</Text>
          </TouchableOpacity>
        </View>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.logsContainer}
          nestedScrollEnabled={true}
        >
          {logs
            .filter(log => !filter || log.toLowerCase().includes(filter.toLowerCase()))
            .map((log, index) => (
              <Text 
                key={index} 
                style={[
                  styles.logText,
                  log.includes('[ERROR]') && styles.errorLog,
                  log.includes('[WARN]') && styles.warnLog,
                  log.includes('[IAP]') && styles.iapLog
                ]}
              >
                {log}
              </Text>
            ))}
          {logs.length === 0 && (
            <Text style={styles.text}>No logs yet. Try using the app to generate logs.</Text>
          )}
        </ScrollView>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    flex: 1,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  filterInput: {
    backgroundColor: '#1a1d29',
    color: '#ffffff',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 10,
  },
  logsContainer: {
    maxHeight: 400,
    backgroundColor: '#0a0a0a',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  logText: {
    fontSize: 11,
    color: '#cccccc',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  errorLog: {
    color: '#ff6b6b',
  },
  warnLog: {
    color: '#ffd93d',
  },
  iapLog: {
    color: '#4ecdc4',
    fontWeight: 'bold',
  },
});
