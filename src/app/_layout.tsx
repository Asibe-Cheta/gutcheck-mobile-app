/**
 * Root Layout for GutCheck App
 * Main navigation structure
 */

// CRITICAL: Import log capture FIRST before anything else
import '@/lib/logCapture';

import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '@/lib/themeContext';
import { getThemeColors } from '@/lib/theme';
import { notificationService } from '@/lib/notifications';
import { NotificationStorageService } from '@/lib/notificationStorage';
import { panicButtonService } from '@/lib/panicButtonService';
import { AppLockProvider } from '@/contexts/AppLockContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Global error handler
if (typeof ErrorUtils !== 'undefined') {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    console.error('[GLOBAL_ERROR]', {
      message: error.message,
      stack: error.stack,
      isFatal: isFatal,
      name: error.name
    });
    originalHandler(error, isFatal);
  });
}

// Inner component that uses theme context
function AppContent() {
  const router = useRouter();
  const { isDark } = useTheme();
  const currentTheme = getThemeColors(isDark);

  useEffect(() => {
    // Setup notifications
    const setupNotifications = async () => {
      try {
        // Request permissions
        const hasPermission = await notificationService.requestPermissions();
        
        if (hasPermission) {
          // Check if notifications are already scheduled
          const notificationsScheduled = await AsyncStorage.getItem('notifications_scheduled');
          
          if (notificationsScheduled !== 'true') {
            // Schedule daily notifications
            await notificationService.scheduleDailyNotifications();
            console.log('Motivational notifications enabled');
          }

          // Setup listener for when user taps notification
          notificationService.setupNotificationListeners((notificationData) => {
            // Find the notification ID from storage to pass to detail screen
            NotificationStorageService.getAllNotifications().then((notifications) => {
              const matchingNotification = notifications.find(
                (n) => n.title === notificationData.title && n.body === notificationData.body
              );
              
              if (matchingNotification) {
                // Navigate to notification detail screen for AI elaboration
                router.push({
                  pathname: '/notification-detail',
                  params: {
                    notificationId: matchingNotification.id,
                    title: notificationData.title,
                    body: notificationData.body,
                    type: notificationData.type,
                    chatPrompt: notificationData.chatPrompt || '',
                  },
                });
              } else {
                // Fallback: navigate to notifications list
                router.push('/notifications');
              }
            }).catch((error) => {
              console.error('Error finding notification:', error);
              // Fallback: navigate to notifications list
              router.push('/notifications');
            });
          });
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();

    // Setup panic button (no monitoring needed for tap detection)
    const setupPanicButton = async () => {
      try {
        const enabled = await panicButtonService.isEnabled();
        console.log('[PANIC] Panic button status:', enabled ? 'ENABLED (triple-tap)' : 'DISABLED');
      } catch (error) {
        console.error('[PANIC] Error checking panic button:', error);
      }
    };

    setupPanicButton();

    // Cleanup listeners on unmount
    return () => {
      notificationService.removeNotificationListeners();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={isDark ? "light" : "dark"} backgroundColor={currentTheme.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: currentTheme.background },
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="upgrade" options={{ headerShown: false }} />
          <Stack.Screen name="analysis-results" options={{ headerShown: false }} />
          <Stack.Screen name="crisis-resources" options={{ headerShown: false }} />
          <Stack.Screen name="chat" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          {/* Use wrapper for subscription to prevent native crash during module resolution */}
          <Stack.Screen name="subscription" options={{ headerShown: false }} />
          {/* Keep wrapper route as backup */}
          <Stack.Screen name="subscription-wrapper" options={{ headerShown: false }} />
          <Stack.Screen name="subscription-test" options={{ headerShown: false }} />
          <Stack.Screen name="privacy" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding-route" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="notification-detail" options={{ headerShown: false }} />
          <Stack.Screen name="contact" options={{ headerShown: false }} />
          <Stack.Screen name="faq" options={{ headerShown: false }} />
          <Stack.Screen name="calculator" options={{ headerShown: false, animation: 'fade' }} />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppLockProvider>
        <AppContent />
      </AppLockProvider>
    </ThemeProvider>
  );
}