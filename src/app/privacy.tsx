/**
 * Privacy Screen
 * Privacy settings and data controls
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrivacySettings {
  dataSharing: boolean;
  analytics: boolean;
  crashReports: boolean;
}

export default function PrivacyScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<PrivacySettings>({
    dataSharing: false,
    analytics: true,
    crashReports: true,
  });

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('privacy_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const savePrivacySettings = async (newSettings: PrivacySettings) => {
    try {
      await AsyncStorage.setItem('privacy_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      Alert.alert('Error', 'Failed to save privacy settings');
    }
  };

  const handleToggle = (key: keyof PrivacySettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    savePrivacySettings(newSettings);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your conversation history, analysis data, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All Data', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Data Cleared', 'All your data has been permanently deleted.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Data export feature coming soon! You\'ll be able to download your conversation history and analysis data.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const PrivacyItem = ({ 
    icon, 
    title, 
    description, 
    value, 
    onToggle,
    isToggle = true 
  }: {
    icon: string;
    title: string;
    description: string;
    value?: boolean;
    onToggle?: () => void;
    isToggle?: boolean;
  }) => (
    <View style={styles.privacyItem}>
      <View style={styles.privacyItemContent}>
        <View style={styles.privacyIcon}>
          <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.privacyTextContainer}>
          <Text style={styles.privacyTitle}>{title}</Text>
          <Text style={styles.privacyDescription}>{description}</Text>
        </View>
        {isToggle ? (
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: '#767577', true: 'rgba(79, 209, 199, 0.5)' }}
            thumbColor={value ? theme.colors.primary : '#f4f3f4'}
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Data Collection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Collection</Text>
          
          <PrivacyItem
            icon="analytics"
            title="Analytics & Usage Data"
            description="Help improve the app by sharing anonymous usage data"
            value={settings.analytics}
            onToggle={() => handleToggle('analytics')}
          />
          
          <PrivacyItem
            icon="bug"
            title="Crash Reports"
            description="Automatically send crash reports to help fix issues"
            value={settings.crashReports}
            onToggle={() => handleToggle('crashReports')}
          />
          
          <PrivacyItem
            icon="people"
            title="Data Sharing"
            description="Share anonymized data with research partners"
            value={settings.dataSharing}
            onToggle={() => handleToggle('dataSharing')}
          />
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <PrivacyItem
            icon="download"
            title="Export Data"
            description="Download your conversation history and analysis data"
            isToggle={false}
            onToggle={handleExportData}
          />
          
          <PrivacyItem
            icon="trash"
            title="Clear All Data"
            description="Permanently delete all your data from this device"
            isToggle={false}
            onToggle={handleClearData}
          />
        </View>

        {/* Privacy Policy */}
        <View style={styles.privacyPolicy}>
          <Ionicons name="shield-checkmark" size={20} color={theme.colors.primary} />
          <View style={styles.privacyPolicyText}>
            <Text style={styles.privacyPolicyTitle}>Your Privacy Matters</Text>
            <Text style={styles.privacyPolicyDescription}>
              We are committed to protecting your privacy. All data is encrypted and stored securely. 
              We never sell your personal information to third parties.
            </Text>
            <TouchableOpacity style={styles.privacyPolicyLink}>
              <Text style={styles.privacyPolicyLinkText}>Read our Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
    backgroundColor: `${theme.colors.background}CC`,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  privacyItem: {
    marginBottom: 4,
  },
  privacyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  privacyIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(79, 209, 199, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  privacyTextContainer: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: 2,
    fontFamily: 'Inter',
  },
  privacyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: 'Inter',
  },
  privacyPolicy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: 'rgba(79, 209, 199, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 199, 0.3)',
  },
  privacyPolicyText: {
    flex: 1,
    marginLeft: 12,
  },
  privacyPolicyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  privacyPolicyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  privacyPolicyLink: {
    alignSelf: 'flex-start',
  },
  privacyPolicyLinkText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
