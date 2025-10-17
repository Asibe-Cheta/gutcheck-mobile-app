/**
 * Settings Screen
 * Custom design based on provided HTML
 * User preferences and account management
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme, getThemeColors } from '@/lib/theme';
import { notificationService } from '@/lib/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/themeContext';
import { profileService } from '@/lib/profileService';

// Settings Item Component
const SettingsItem = ({ 
  icon, 
  title, 
  description, 
  onPress,
  isProfile = false,
  avatarUrl,
  styles,
  colors
}: {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  isProfile?: boolean;
  avatarUrl?: string;
  styles: any;
  colors: any;
}) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
    <View style={styles.settingsItemContent}>
      {isProfile ? (
        <Image 
          source={{ uri: avatarUrl || 'https://via.placeholder.com/48' }} 
          style={styles.profileAvatar}
        />
      ) : (
        <View style={styles.settingsIcon}>
          <Ionicons name={icon as any} size={24} color={colors.primary} />
        </View>
      )}
      <View style={styles.settingsTextContainer}>
        <Text style={styles.settingsTitle}>{title}</Text>
        <Text style={styles.settingsDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [profileData, setProfileData] = useState<{username: string, avatarUri?: string} | null>(null);
  
  // Get current theme colors
  const currentTheme = getThemeColors(isDark);

  useEffect(() => {
    checkNotificationStatus();
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      console.log('Loading profile data...');
      const profile = await profileService.getProfile();
      console.log('Profile data loaded:', profile);
      if (profile) {
        setProfileData({
          username: profile.username,
          avatarUri: profile.avatar_url
        });
        console.log('Profile data set:', {
          username: profile.username,
          avatarUri: profile.avatar_url
        });
      } else {
        console.log('No profile data found');
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const checkNotificationStatus = async () => {
    const enabled = await notificationService.areNotificationsEnabled();
    const scheduled = await AsyncStorage.getItem('notifications_scheduled');
    setNotificationsEnabled(enabled && scheduled === 'true');
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const handleSubscriptionPress = () => {
    router.push('/subscription');
  };

  const handleNotificationsToggle = async (value: boolean) => {
    try {
      if (value) {
        // Enable notifications
        const hasPermission = await notificationService.requestPermissions();
        if (hasPermission) {
          await notificationService.scheduleWeeklyNotifications();
          setNotificationsEnabled(true);
          Alert.alert(
            '🎉 Notifications Enabled',
            'You\'ll receive motivational tips 3 times a week to remind you of your worth and keep you moving forward!',
            [{ text: 'Great!', style: 'default' }]
          );
        } else {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive motivational tips.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      } else {
        // Disable notifications
        await notificationService.cancelAllNotifications();
        setNotificationsEnabled(false);
        Alert.alert(
          'Notifications Disabled',
          'You won\'t receive motivational tips anymore. You can re-enable them anytime.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    }
  };

  const handleTestNotification = async () => {
    await notificationService.sendTestNotification();
    Alert.alert('Test Sent!', 'You should receive a notification in 2 seconds.');
  };

  const handlePrivacyPress = () => {
    router.push('/privacy');
  };

  const handleLanguagePress = () => {
    Alert.alert(
      'Language Settings',
      'Language selection coming soon! You\'ll be able to choose from multiple languages for the app interface.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleHelpPress = () => {
    Alert.alert(
      'Help Center',
      'Help and support features coming soon! You\'ll have access to FAQs, tutorials, and direct support.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleAboutPress = () => {
    Alert.alert(
      'About GutCheck',
      'GutCheck v1.0.0\n\nYour intelligent relationship companion that helps you navigate complex social situations with confidence.\n\nBuilt with React Native and powered by AI.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => {
          // TODO: Implement logout logic
          console.log('User logged out');
        }}
      ]
    );
  };

  const styles = createStyles(isDark);
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/')}
        >
          <Ionicons name="arrow-back" size={24} color={currentTheme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingsItem
            icon="person"
            title="Profile"
            description={profileData?.username ? `Logged in as ${profileData.username}` : "Update your profile information"}
            onPress={handleProfilePress}
            isProfile={true}
            avatarUrl={profileData?.avatarUri}
            styles={styles}
            colors={currentTheme}
          />
          <SettingsItem
            icon="card"
            title="Subscription"
            description="Manage your subscription plan"
            onPress={handleSubscriptionPress}
            styles={styles}
            colors={currentTheme}
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          {/* Notifications Toggle */}
          <View style={styles.settingsItem}>
            <View style={styles.settingsItemContent}>
              <View style={styles.settingsIcon}>
                <Ionicons name="notifications" size={24} color={currentTheme.primary} />
              </View>
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsTitle}>Motivational Tips</Text>
                <Text style={styles.settingsDescription}>
                  Get encouraging reminders 3x per week
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: '#767577', true: 'rgba(79, 209, 199, 0.5)' }}
                thumbColor={notificationsEnabled ? currentTheme.primary : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Test Notification Button (only show if notifications enabled) */}
          {notificationsEnabled && (
            <TouchableOpacity 
              style={styles.testNotificationButton}
              onPress={handleTestNotification}
            >
              <Text style={styles.testNotificationText}>Send Test Notification</Text>
            </TouchableOpacity>
          )}
          
          {/* Dark Mode Toggle */}
          <View style={styles.settingsItem}>
            <View style={styles.settingsItemContent}>
              <View style={styles.settingsIcon}>
                <Ionicons name="moon" size={24} color={currentTheme.primary} />
              </View>
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsTitle}>Dark Mode</Text>
                <Text style={styles.settingsDescription}>
                  {isDark ? 'Currently using dark theme' : 'Currently using light theme'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#767577', true: 'rgba(79, 209, 199, 0.5)' }}
                thumbColor={isDark ? currentTheme.primary : '#f4f3f4'}
              />
            </View>
          </View>
          <SettingsItem
            icon="shield-checkmark"
            title="Privacy"
            description="Adjust your privacy settings"
            onPress={handlePrivacyPress}
            styles={styles}
            colors={currentTheme}
          />
          <SettingsItem
            icon="language"
            title="Language"
            description="Choose your preferred language"
            onPress={handleLanguagePress}
            styles={styles}
            colors={currentTheme}
          />
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          <SettingsItem
            icon="download"
            title="Export Data"
            description="Download your conversation history"
            onPress={() => Alert.alert('Export Data', 'Data export features coming soon!')}
            styles={styles}
            colors={currentTheme}
          />
          <SettingsItem
            icon="trash"
            title="Clear Cache"
            description="Free up storage space"
            onPress={() => Alert.alert('Clear Cache', 'Cache clearing features coming soon!')}
            styles={styles}
            colors={currentTheme}
          />
          <SettingsItem
            icon="cloud"
            title="Sync Settings"
            description="Manage cloud synchronization"
            onPress={() => Alert.alert('Sync Settings', 'Cloud sync features coming soon!')}
            styles={styles}
            colors={currentTheme}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingsItem
            icon="help-circle"
            title="Help Center"
            description="Get help and support"
            onPress={handleHelpPress}
            styles={styles}
            colors={currentTheme}
          />
          <SettingsItem
            icon="information-circle"
            title="About"
            description="Learn more about GutCheck"
            onPress={handleAboutPress}
            styles={styles}
            colors={currentTheme}
          />
        </View>

        {/* Log Out Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => {
  const colors = getThemeColors(isDark);
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16, // h-14 equivalent
    paddingHorizontal: 16, // px-4
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)', // border-slate-200/10
    backgroundColor: `${colors.background}CC`, // backdrop-blur effect
  },
  backButton: {
    width: 40, // w-10
    height: 40, // h-10
    borderRadius: 20, // rounded-full
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: colors.textPrimary,
    fontFamily: 'Inter',
  },
  headerSpacer: {
    width: 40, // w-10
  },
  content: {
    flex: 1,
    padding: 16, // p-4
  },
  section: {
    marginBottom: 32, // space-y-8
  },
  sectionTitle: {
    fontSize: 14, // text-sm
    fontWeight: '600', // font-semibold
    color: colors.textSecondary,
    paddingHorizontal: 16, // px-4
    paddingBottom: 8, // pb-2
    fontFamily: 'Inter',
  },
  // Settings Item Styles
  settingsItem: {
    marginBottom: 4, // space-y-1
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, // p-4
    borderRadius: 8, // rounded-lg
    backgroundColor: 'transparent',
  },
  profileAvatar: {
    width: 48, // h-12 w-12
    height: 48,
    borderRadius: 24, // rounded-full
    marginRight: 16, // gap-4
  },
  settingsIcon: {
    width: 48, // h-12 w-12
    height: 48,
    borderRadius: 8, // rounded-lg
    backgroundColor: 'rgba(79, 209, 199, 0.2)', // bg-primary/20
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16, // gap-4
  },
  settingsTextContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16, // font-medium
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2, // mb-0.5
    fontFamily: 'Inter',
  },
  settingsDescription: {
    fontSize: 14, // text-sm
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  // Logout Section
  logoutSection: {
    paddingTop: 16, // pt-4
  },
  logoutButton: {
    width: '100%',
    backgroundColor: 'rgba(148, 163, 184, 0.2)', // bg-slate-200/70
    paddingVertical: 12, // py-3
    borderRadius: 8, // rounded-lg
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    fontSize: 16, // font-semibold
    fontWeight: '600',
    color: colors.warning, // text-red-500
    fontFamily: 'Inter',
  },
  testNotificationButton: {
    marginTop: 8,
    marginHorizontal: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(79, 209, 199, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 199, 0.3)',
    alignItems: 'center',
  },
  testNotificationText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  });
};