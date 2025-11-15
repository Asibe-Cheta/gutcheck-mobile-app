/**
 * Notification Storage Service
 * Manages storing and retrieving notifications for user history
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  chatPrompt?: string;
  receivedAt: number; // timestamp
  isRead: boolean;
}

const NOTIFICATIONS_KEY = '@notifications_history';

export class NotificationStorageService {
  /**
   * Save a received notification
   */
  static async saveNotification(notification: Omit<StoredNotification, 'id' | 'receivedAt' | 'isRead'>): Promise<void> {
    try {
      const existingNotifications = await this.getAllNotifications();
      
      const newNotification: StoredNotification = {
        ...notification,
        id: Date.now().toString(),
        receivedAt: Date.now(),
        isRead: false,
      };
      
      const updatedNotifications = [newNotification, ...existingNotifications];
      
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
      console.log('Notification saved to history');
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  }
  
  /**
   * Get all notifications
   */
  static async getAllNotifications(): Promise<StoredNotification[]> {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      if (!data) return [];
      
      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }
  
  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getAllNotifications();
      const updated = notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
  
  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getAllNotifications();
      const filtered = notifications.filter(n => n.id !== notificationId);
      
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }
  
  /**
   * Delete multiple notifications
   */
  static async deleteNotifications(notificationIds: string[]): Promise<void> {
    try {
      const notifications = await this.getAllNotifications();
      const filtered = notifications.filter(n => !notificationIds.includes(n.id));
      
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  }
  
  /**
   * Clear all notifications
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }
  
  /**
   * Get count of unread notifications
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getAllNotifications();
      return notifications.filter(n => !n.isRead).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

