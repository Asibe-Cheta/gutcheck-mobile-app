/**
 * Settings Screen
 * Custom design based on provided HTML
 * User preferences and account management
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme, getThemeColors } from '@/lib/theme';
import { notificationService } from '@/lib/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@/lib/themeContext';
import { profileService } from '@/lib/profileService';
import { authService } from '@/lib/authService';
import { biometricAuthService } from '@/lib/biometricAuth';
import { panicButtonService } from '@/lib/panicButtonService';
import { useSubscriptionStore } from '@/lib/stores/subscriptionStore';
import { useAppLock } from '@/contexts/AppLockContext';
import { BiometricLockScreen } from '@/components/BiometricLockScreen';
import * as Clipboard from 'expo-clipboard';
import { getPinForReveal } from '@/lib/pinRevealStorage';
import { externalUrls, GOOGLE_PLAY_APP_TITLE } from '@/lib/externalUrls';

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
  
  // App lock state - show lock screen when app is locked
  const { isLocked, shouldShowLock } = useAppLock();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const [panicButtonEnabled, setPanicButtonEnabled] = useState(false);
  const [profileData, setProfileData] = useState<{username: string, avatarUri?: string} | null>(null);
  
  // Get current theme colors
  const currentTheme = getThemeColors(isDark);

  // Authentication check only
  useEffect(() => {
    const checkAuth = async () => {
      const userId = await AsyncStorage.getItem('user_id');
      const isLoggedIn = await AsyncStorage.getItem('is_logged_in');
      
      if (!userId || isLoggedIn !== 'true') {
        router.replace('/(auth)/welcome');
        return;
      }
    };
    
    checkAuth();
    checkNotificationStatus();
    loadProfileData();
    checkBiometricStatus();
    checkPanicButtonStatus();
  }, []);

  // Reload biometric status when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      checkBiometricStatus();
    }, [])
  );

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

  const checkBiometricStatus = async () => {
    try {
      const available = await biometricAuthService.isAvailable();
      const enabled = await biometricAuthService.isBiometricEnabled();
      const type = await biometricAuthService.getBiometricType();
      
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
      setBiometricType(type);
      
      console.log('[SETTINGS] Biometric status - available:', available, 'enabled:', enabled, 'type:', type);
    } catch (error) {
      console.error('[SETTINGS] Error checking biometric status:', error);
    }
  };

  const checkPanicButtonStatus = async () => {
    try {
      const enabled = await panicButtonService.isEnabled();
      setPanicButtonEnabled(enabled);
      console.log('[SETTINGS] Panic button status - enabled:', enabled);
    } catch (error) {
      console.error('[SETTINGS] Error checking panic button status:', error);
    }
  };

  const handlePanicButtonToggle = async (value: boolean) => {
    try {
      if (value) {
        // Enable panic button
        await panicButtonService.enable();
        setPanicButtonEnabled(true);
        Alert.alert(
          '🚨 Panic Button Enabled',
          'Triple-tap anywhere on the screen to instantly exit to a calculator screen.\n\nThis feature is designed to help you quickly hide the app if you\'re in an unsafe situation.\n\nTo return to GutChecks: Red Flags & Safety, simply navigate back from the calculator.',
          [{ text: 'Got It', style: 'default' }]
        );
      } else {
        // Disable panic button
        await panicButtonService.disable();
        setPanicButtonEnabled(false);
        Alert.alert(
          'Panic Button Disabled',
          'Triple-tap gesture will no longer trigger the quick exit.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('[SETTINGS] Error toggling panic button:', error);
      Alert.alert('Error', 'Failed to update panic button settings. Please try again.');
    }
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const handleSubscriptionPress = async () => {
    try {
      console.log('[SETTINGS] Navigating to subscription screen...');
      
      // Set origin flag so subscription screen knows to return to settings
      await AsyncStorage.setItem('_sub_origin_screen', 'settings');
      
      // Use wrapper route to avoid native crash during module resolution
      // The wrapper dynamically imports the subscription screen
      const route = '/subscription-wrapper'; // Wrapper route that loads subscription dynamically
      
      console.log(`[SETTINGS] Attempting navigation to: ${route}`);
      router.push(route);
      console.log('[SETTINGS] ✅ Navigation call completed (async, may not have loaded yet)');
    } catch (error: any) {
      console.error('[SETTINGS] ❌ Error navigating to subscription:', error);
      console.error('[SETTINGS] Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      Alert.alert(
        'Navigation Error',
        `Failed to open subscription screen: ${error?.message || 'Unknown error'}\n\nCheck Debug Info for details.`,
        [{ text: 'OK' }]
      );
    }
  };


  const handleNotificationsToggle = async (value: boolean) => {
    try {
      if (value) {
        // Enable notifications
        const hasPermission = await notificationService.requestPermissions();
        if (hasPermission) {
          await notificationService.scheduleDailyNotifications();
          setNotificationsEnabled(true);
          Alert.alert(
            '🎉 Notifications Enabled',
            'You\'ll receive motivational tips every day between 8 AM and 10 PM to remind you of your worth and keep you moving forward!',
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

  const handleBiometricToggle = async (value: boolean) => {
    try {
      if (value) {
        // Enable biometric authentication
        const userId = await AsyncStorage.getItem('user_id');
        if (!userId) {
          Alert.alert('Error', 'User not logged in');
          return;
        }

        const success = await biometricAuthService.enableBiometricAuth(userId);
        if (success) {
          setBiometricEnabled(true);
          Alert.alert(
            `${biometricType} Enabled`,
            `You can now use ${biometricType} to quickly sign in to GutChecks: Red Flags & Safety.`,
            [{ text: 'Great!', style: 'default' }]
          );
        } else {
          Alert.alert(
            'Failed to Enable',
            `Could not enable ${biometricType}. Please try again.`,
            [{ text: 'OK', style: 'default' }]
          );
        }
      } else {
        // Disable biometric authentication
        Alert.alert(
          `Disable ${biometricType}?`,
          `You will need to use your username and PIN to sign in.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                await biometricAuthService.disableBiometricAuth();
                setBiometricEnabled(false);
                Alert.alert(
                  `${biometricType} Disabled`,
                  'You will now use your username and PIN to sign in.',
                  [{ text: 'OK', style: 'default' }]
                );
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      Alert.alert('Error', 'Failed to update biometric settings. Please try again.');
    }
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

  const handleAwarenessHubAgePress = () => {
    router.push('/(tabs)/awareness-hub?openAgeGate=1');
  };

  const handleHelpPress = () => {
    router.push('/faq');
  };

  const handleContactPress = () => {
    router.push('/contact');
  };

  const handleAboutPress = () => {
    Alert.alert(
      'About GutChecks: Red Flags & Safety',
      'GutChecks: Red Flags & Safety v2.0.2\n\nYour confidential guidance tool for navigating everyday interactions and relationships with confidence.\n\n✨ Key Features:\n• AI-powered interaction analysis\n• Red flag detection\n• Anonymous and secure\n• Panic button (triple-tap to exit)\n• Daily supportive notifications\n• Export evidence as PDF\n• Local data storage\n• Crisis resources\n\n© 2024 GutChecks: Red Flags & Safety. Your safety matters.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleShowMyPin = async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        Alert.alert('Not signed in', 'Sign in to use this option.');
        return;
      }

      const cachedPin = await getPinForReveal(userId);
      if (!cachedPin) {
        Alert.alert(
          'PIN reminder unavailable',
          'Your PIN is not saved for viewing on this device yet. Sign out and sign in once with your username and PIN (it will be stored only in your phone’s secure storage). You can also reset your PIN with your recovery code from the login screen.',
          [{ text: 'OK' }],
        );
        return;
      }

      const biometricAvailable = await biometricAuthService.isAvailable();
      if (!biometricAvailable) {
        Alert.alert(
          'Verification required',
          'Use Face ID, Touch ID, or your device passcode to show your PIN. Set up biometrics on your device first, or reset your PIN with your recovery code from the login screen.',
          [{ text: 'OK' }],
        );
        return;
      }

      const authResult = await biometricAuthService.authenticate();
      if (!authResult.success) {
        if (authResult.error && !/cancel/i.test(authResult.error)) {
          Alert.alert('Could not verify', authResult.error);
        }
        return;
      }

      Alert.alert('Your PIN', cachedPin, [
        {
          text: 'Copy',
          onPress: async () => {
            try {
              await Clipboard.setStringAsync(cachedPin);
            } catch (e) {
              console.warn('[SETTINGS] Copy PIN failed:', e);
            }
          },
        },
        { text: 'Done', style: 'default' },
      ]);
    } catch (e) {
      console.error('[SETTINGS] Show PIN error:', e);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out? You can log back in anytime with your username and PIN.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: async () => {
          // Clear biometric authentication data
          await biometricAuthService.disableBiometricAuth();
          console.log('[SETTINGS] Biometric data cleared on logout');
          
          const result = await authService.logout();
          if (result.success) {
            // Navigate to welcome screen
            router.replace('/(auth)/welcome');
          } else {
            Alert.alert('Error', result.error || 'Failed to logout');
          }
        }}
      ]
    );
  };

  const performDeleteAccount = async () => {
    try {
      await biometricAuthService.disableBiometricAuth();
    } catch (e) {
      console.warn('[SETTINGS] Biometric disable before account delete:', e);
    }

    const result = await authService.deleteAccount();
    console.log('Delete account result:', result);

    if (result.success) {
      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted. Thank you for using GutChecks: Red Flags & Safety.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/welcome') }]
      );
      return;
    }

    console.error('Delete account failed:', result.error);
    Alert.alert(
      'Something went wrong',
      result.error || 'We could not finish deleting your account. Please try again.',
    );
  };

  const handleDeleteAccount = () => {
    console.log('Delete Account button pressed');
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your data, conversations, and settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            // Defer second alert so the first can dismiss cleanly (avoids blank / stuck dialogs on some iOS/Android builds).
            setTimeout(() => {
              Alert.alert(
                'Final Confirmation',
                'This will permanently delete your account and all data. Are you absolutely sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: () => {
                      performDeleteAccount();
                    },
                  },
                ]
              );
            }, 300);
          },
        },
      ]
    );
  };

  const styles = createStyles(isDark);
  
  // Show lock screen if app is locked (when returning from background)
  if (isLocked && shouldShowLock) {
    return <BiometricLockScreen />;
  }
  
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
        <View style={styles.headerCenter}>
          <Image 
            source={require('../../../assets/new-gut-logo.jpeg')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Settings</Text>
        </View>
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
            onPress={() => {
              console.log('[SETTINGS_BUTTON] Subscription button pressed at:', new Date().toISOString());
              console.log('[SETTINGS_BUTTON] About to call handleSubscriptionPress...');
              try {
                handleSubscriptionPress();
                console.log('[SETTINGS_BUTTON] ✅ handleSubscriptionPress called successfully');
              } catch (error: any) {
                console.error('[SETTINGS_BUTTON] ❌ Error calling handleSubscriptionPress:', error);
                Alert.alert('Error', `Failed to navigate: ${error?.message}`);
              }
            }}
            styles={styles}
            colors={currentTheme}
          />
          <SettingsItem
            icon="keypad"
            title="Show my PIN"
            description="Verify with Face ID or Touch ID. Stored only on this device."
            onPress={handleShowMyPin}
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
                  Get encouraging reminders every day
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

          {/* Biometric Authentication Toggle */}
          {biometricAvailable && (
            <View style={styles.settingsItem}>
              <View style={styles.settingsItemContent}>
                <View style={styles.settingsIcon}>
                  <Ionicons name="finger-print" size={24} color={currentTheme.primary} />
                </View>
                <View style={styles.settingsTextContainer}>
                  <Text style={styles.settingsTitle}>{biometricType}</Text>
                  <Text style={styles.settingsDescription}>
                    {biometricEnabled ? `Sign in with ${biometricType}` : `Enable ${biometricType} for quick sign-in`}
                  </Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: '#767577', true: 'rgba(79, 209, 199, 0.5)' }}
                  thumbColor={biometricEnabled ? currentTheme.primary : '#f4f3f4'}
                />
              </View>
            </View>
          )}

          {/* Panic Button Toggle - TEMPORARILY DISABLED */}
          {false && (
          <View style={styles.settingsItem}>
            <View style={styles.settingsItemContent}>
              <View style={styles.settingsIcon}>
                <Ionicons name="warning" size={24} color="#FF6B6B" />
              </View>
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsTitle}>Panic Button 🚨</Text>
                <Text style={styles.settingsDescription}>
                  {panicButtonEnabled ? 'Triple-tap screen to quickly exit app' : 'Enable to quickly hide the app'}
                </Text>
              </View>
              <Switch
                value={panicButtonEnabled}
                onValueChange={handlePanicButtonToggle}
                trackColor={{ false: '#767577', true: 'rgba(255, 107, 107, 0.5)' }}
                thumbColor={panicButtonEnabled ? '#FF6B6B' : '#f4f3f4'}
              />
            </View>
          </View>
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
            icon="school"
            title="Awareness Hub Age Group"
            description="Review or update age-based Hub content gating"
            onPress={handleAwarenessHubAgePress}
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
          <SettingsItem
            icon="trash-bin"
            title="Delete Account"
            description="Permanently delete your account and all data"
            onPress={() => {
              console.log('Delete Account SettingsItem pressed');
              handleDeleteAccount();
            }}
            styles={styles}
            colors={currentTheme}
          />
          <SettingsItem
            icon="document-text"
            title="Account deletion (web)"
            description={`Official ${GOOGLE_PLAY_APP_TITLE} instructions for Google Play / support`}
            onPress={() => {
              Linking.openURL(externalUrls.accountDeletion).catch(() => {
                Alert.alert('Unable to open link', `Please open ${externalUrls.accountDeletion} in your browser.`);
              });
            }}
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
            icon="mail"
            title="Contact Us"
            description="Get in touch with our team"
            onPress={handleContactPress}
            styles={styles}
            colors={currentTheme}
          />
          <SettingsItem
            icon="information-circle"
            title="About"
            description={`Learn more about ${GOOGLE_PLAY_APP_TITLE}`}
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 24,
    height: 24,
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
  });
};