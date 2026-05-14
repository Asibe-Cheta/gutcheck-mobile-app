/**
 * Trial Tracking Service
 * Monitors trial status and sends reminders to improve conversion rates
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface TrialData {
  userId: string;
  planId: string;
  productId: string;
  trialStartDate: string;
  trialEndDate: string;
  reminderSent24h: boolean;
  reminderSent48h: boolean;
  hasConverted: boolean;
}

class TrialTrackingService {
  private readonly STORAGE_KEY = '@trial_data';

  /**
   * Record when a user starts a trial
   */
  async recordTrialStart(userId: string, planId: string, productId: string): Promise<void> {
    try {
      const trialStartDate = new Date();
      const trialEndDate = new Date(trialStartDate);
      trialEndDate.setDate(trialEndDate.getDate() + 3); // 3-day trial (Apple-approved)

      const trialData: TrialData = {
        userId,
        planId,
        productId,
        trialStartDate: trialStartDate.toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        reminderSent24h: false,
        reminderSent48h: false,
        hasConverted: false,
      };

      await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(trialData));
      console.log('[TrialTracking] Trial recorded for user:', userId, 'ends:', trialEndDate.toISOString());
    } catch (error) {
      console.error('[TrialTracking] Failed to record trial start:', error);
    }
  }

  /**
   * Check if reminders need to be sent
   * Call this when app comes to foreground
   */
  async checkAndSendReminders(): Promise<{ shouldRemind24h: boolean; shouldRemind48h: boolean; trialData?: TrialData }> {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        return { shouldRemind24h: false, shouldRemind48h: false };
      }

      const trialDataStr = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      if (!trialDataStr) {
        return { shouldRemind24h: false, shouldRemind48h: false };
      }

      const trialData: TrialData = JSON.parse(trialDataStr);

      // If already converted, no reminders needed
      if (trialData.hasConverted) {
        return { shouldRemind24h: false, shouldRemind48h: false, trialData };
      }

      const now = new Date();
      const trialEnd = new Date(trialData.trialEndDate);
      const hoursUntilExpiry = (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60);

      let shouldRemind24h = false;
      let shouldRemind48h = false;

      // Send 24h reminder if within 24-48 hours and not sent yet
      if (hoursUntilExpiry <= 24 && hoursUntilExpiry > 0 && !trialData.reminderSent24h) {
        shouldRemind24h = true;
        trialData.reminderSent24h = true;
        await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(trialData));
        console.log('[TrialTracking] 24h reminder triggered for user:', userId);
      }

      // Send 48h reminder if within 48-72 hours and not sent yet
      if (hoursUntilExpiry <= 48 && hoursUntilExpiry > 24 && !trialData.reminderSent48h) {
        shouldRemind48h = true;
        trialData.reminderSent48h = true;
        await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(trialData));
        console.log('[TrialTracking] 48h reminder triggered for user:', userId);
      }

      return { shouldRemind24h, shouldRemind48h, trialData };
    } catch (error) {
      console.error('[TrialTracking] Failed to check reminders:', error);
      return { shouldRemind24h: false, shouldRemind48h: false };
    }
  }

  /**
   * Mark trial as converted (user subscribed)
   */
  async markTrialConverted(userId: string): Promise<void> {
    try {
      const trialDataStr = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      if (trialDataStr) {
        const trialData: TrialData = JSON.parse(trialDataStr);
        trialData.hasConverted = true;
        await AsyncStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(trialData));
        console.log('[TrialTracking] Trial marked as converted for user:', userId);
      }
    } catch (error) {
      console.error('[TrialTracking] Failed to mark trial converted:', error);
    }
  }

  /**
   * Get trial analytics for a user
   */
  async getTrialAnalytics(userId: string): Promise<{
    isInTrial: boolean;
    hoursRemaining: number;
    daysRemaining: number;
    hasConverted: boolean;
  } | null> {
    try {
      const trialDataStr = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      if (!trialDataStr) {
        return null;
      }

      const trialData: TrialData = JSON.parse(trialDataStr);
      const now = new Date();
      const trialEnd = new Date(trialData.trialEndDate);
      const hoursRemaining = Math.max(0, (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60));
      const daysRemaining = Math.ceil(hoursRemaining / 24);

      return {
        isInTrial: hoursRemaining > 0 && !trialData.hasConverted,
        hoursRemaining: Math.round(hoursRemaining),
        daysRemaining,
        hasConverted: trialData.hasConverted,
      };
    } catch (error) {
      console.error('[TrialTracking] Failed to get trial analytics:', error);
      return null;
    }
  }

  /**
   * Clear trial data (for testing or when trial ends)
   */
  async clearTrialData(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.STORAGE_KEY}_${userId}`);
      console.log('[TrialTracking] Trial data cleared for user:', userId);
    } catch (error) {
      console.error('[TrialTracking] Failed to clear trial data:', error);
    }
  }
}

export const trialTrackingService = new TrialTrackingService();
