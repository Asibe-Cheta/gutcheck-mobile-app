/**
 * Notifications List Screen
 * Shows all received notifications with delete and select functionality
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { NotificationStorageService, type StoredNotification } from '@/lib/notificationStorage';

export default function NotificationsScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const allNotifications = await NotificationStorageService.getAllNotifications();
    setNotifications(allNotifications);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: StoredNotification) => {
    if (isSelectionMode) {
      toggleSelection(notification.id);
    } else {
      // Mark as read and navigate to elaboration screen
      await NotificationStorageService.markAsRead(notification.id);
      router.push({
        pathname: '/notification-detail',
        params: {
          notificationId: notification.id,
          title: notification.title,
          body: notification.body,
          type: notification.type,
          chatPrompt: notification.chatPrompt || '',
        },
      });
      // Reload to update read status
      await loadNotifications();
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Notifications',
      `Delete ${selectedIds.length} notification(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await NotificationStorageService.deleteNotifications(selectedIds);
            await loadNotifications();
            setSelectedIds([]);
            setIsSelectionMode(false);
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'This will delete all notifications. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await NotificationStorageService.clearAll();
            await loadNotifications();
            setSelectedIds([]);
            setIsSelectionMode(false);
          },
        },
      ]
    );
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
    },
    content: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    notificationCard: {
      flexDirection: 'row',
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 6,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    unreadCard: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary + '40',
    },
    selectedCard: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    selectionCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectionCircleSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    notificationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    notificationContent: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      flex: 1,
    },
    notificationTime: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    notificationBody: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    unreadIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#43B897',
      marginLeft: 8,
    },
    bottomBar: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    bottomButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
    },
    selectButton: {
      backgroundColor: colors.primary + '20',
    },
    deleteButton: {
      backgroundColor: colors.error + '20',
    },
    clearButton: {
      backgroundColor: colors.error,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    selectButtonText: {
      color: colors.primary,
    },
    deleteButtonText: {
      color: colors.error,
    },
    clearButtonText: {
      color: '#FFFFFF',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerActions}>
          {isSelectionMode && (
            <TouchableOpacity style={styles.actionButton} onPress={handleSelectAll}>
              <Ionicons 
                name={selectedIds.length === notifications.length ? "checkbox" : "square-outline"} 
                size={24} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          )}
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textSecondary} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No Notifications Yet</Text>
            <Text style={styles.emptySubtext}>
              When you receive notifications, they'll appear here
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.isRead && styles.unreadCard,
                selectedIds.includes(notification.id) && styles.selectedCard,
              ]}
              onPress={() => handleNotificationPress(notification)}
              onLongPress={() => {
                setIsSelectionMode(true);
                toggleSelection(notification.id);
              }}
            >
              {isSelectionMode && (
                <View style={[
                  styles.selectionCircle,
                  selectedIds.includes(notification.id) && styles.selectionCircleSelected,
                ]}>
                  {selectedIds.includes(notification.id) && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              )}
              <View style={styles.notificationIcon}>
                <Ionicons name="notifications" size={20} color={colors.primary} />
              </View>
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle} numberOfLines={1}>
                    {notification.title}
                  </Text>
                  {!notification.isRead && <View style={styles.unreadIndicator} />}
                </View>
                <Text style={styles.notificationBody} numberOfLines={2}>
                  {notification.body}
                </Text>
                <Text style={styles.notificationTime}>{formatTime(notification.receivedAt)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bottom Actions */}
      {notifications.length > 0 && (
        <View style={styles.bottomBar}>
          {!isSelectionMode ? (
            <>
              <TouchableOpacity
                style={[styles.bottomButton, styles.selectButton]}
                onPress={() => setIsSelectionMode(true)}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
                <Text style={[styles.buttonText, styles.selectButtonText]}>Select</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bottomButton, styles.clearButton]}
                onPress={handleClearAll}
              >
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                <Text style={[styles.buttonText, styles.clearButtonText]}>Clear All</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.bottomButton, styles.selectButton]}
                onPress={() => {
                  setIsSelectionMode(false);
                  setSelectedIds([]);
                }}
              >
                <Ionicons name="close-circle-outline" size={20} color={colors.primary} />
                <Text style={[styles.buttonText, styles.selectButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bottomButton, styles.deleteButton]}
                onPress={handleDeleteSelected}
                disabled={selectedIds.length === 0}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
                <Text style={[styles.buttonText, styles.deleteButtonText]}>
                  Delete ({selectedIds.length})
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

