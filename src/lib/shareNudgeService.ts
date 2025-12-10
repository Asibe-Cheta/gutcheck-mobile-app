/**
 * Share Nudge Service
 * Manages when to show the share app nudge based on user engagement milestones
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const STORAGE_KEYS = {
  CHAT_SESSION_COUNT: 'share_nudge_chat_count',
  LAST_NUDGE_SHOWN: 'share_nudge_last_shown',
  NUDGE_SHOW_COUNT: 'share_nudge_show_count',
  CHATS_SINCE_LAST_NUDGE: 'share_nudge_chats_since_last',
};

const NUDGE_CONFIG = {
  FIRST_TRIGGER: 5,           // Show after 5 chat sessions
  SUBSEQUENT_TRIGGER: 15,     // Show every 15 chats after first
  MIN_DAYS_BETWEEN: 30,       // Minimum 30 days between nudges
  MAX_LIFETIME_SHOWS: 3,      // Never show more than 3 times
};

interface NudgeState {
  totalChats: number;
  chatsSinceLastNudge: number;
  lastNudgeShown: number | null;
  nudgeShowCount: number;
}

class ShareNudgeService {
  /**
   * Increment chat session count
   * Call this after user completes a chat conversation
   */
  async incrementChatCount(): Promise<void> {
    try {
      const currentCount = await this.getTotalChatCount();
      const newCount = currentCount + 1;
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_SESSION_COUNT, String(newCount));

      // Also increment chats since last nudge
      const chatsSinceLast = await this.getChatsSinceLastNudge();
      await AsyncStorage.setItem(STORAGE_KEYS.CHATS_SINCE_LAST_NUDGE, String(chatsSinceLast + 1));

      console.log('[ShareNudge] Chat count incremented:', newCount);
    } catch (error) {
      console.error('[ShareNudge] Error incrementing chat count:', error);
    }
  }

  /**
   * Check if we should show the share nudge
   */
  async shouldShowNudge(): Promise<boolean> {
    try {
      const state = await this.getNudgeState();

      // Check 1: Haven't exceeded max lifetime shows
      if (state.nudgeShowCount >= NUDGE_CONFIG.MAX_LIFETIME_SHOWS) {
        console.log('[ShareNudge] Max lifetime shows reached');
        return false;
      }

      // Check 2: First nudge - need 5 chats
      if (state.nudgeShowCount === 0) {
        if (state.totalChats >= NUDGE_CONFIG.FIRST_TRIGGER) {
          console.log('[ShareNudge] First nudge trigger met (5 chats)');
          return true;
        }
        console.log(`[ShareNudge] First nudge needs ${NUDGE_CONFIG.FIRST_TRIGGER} chats, have ${state.totalChats}`);
        return false;
      }

      // Check 3: Subsequent nudges - need 15 more chats AND 30+ days
      if (state.chatsSinceLastNudge >= NUDGE_CONFIG.SUBSEQUENT_TRIGGER) {
        // Check time condition
        if (state.lastNudgeShown) {
          const daysSinceLastNudge = (Date.now() - state.lastNudgeShown) / (1000 * 60 * 60 * 24);
          if (daysSinceLastNudge >= NUDGE_CONFIG.MIN_DAYS_BETWEEN) {
            console.log('[ShareNudge] Subsequent nudge trigger met (15 chats + 30 days)');
            return true;
          }
          console.log(`[ShareNudge] Need ${NUDGE_CONFIG.MIN_DAYS_BETWEEN} days, been ${daysSinceLastNudge.toFixed(1)} days`);
          return false;
        }
        // If no last shown timestamp, show it
        return true;
      }

      console.log(`[ShareNudge] Subsequent nudge needs ${NUDGE_CONFIG.SUBSEQUENT_TRIGGER} chats, have ${state.chatsSinceLastNudge}`);
      return false;
    } catch (error) {
      console.error('[ShareNudge] Error checking if should show nudge:', error);
      return false;
    }
  }

  /**
   * Mark that nudge was shown
   */
  async markNudgeShown(): Promise<void> {
    try {
      const currentCount = await this.getNudgeShowCount();
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.NUDGE_SHOW_COUNT, String(currentCount + 1)],
        [STORAGE_KEYS.LAST_NUDGE_SHOWN, String(Date.now())],
        [STORAGE_KEYS.CHATS_SINCE_LAST_NUDGE, '0'], // Reset counter
      ]);
      console.log('[ShareNudge] Nudge shown, count:', currentCount + 1);
    } catch (error) {
      console.error('[ShareNudge] Error marking nudge shown:', error);
    }
  }

  /**
   * Track share event in Supabase
   */
  async trackShare(userId: string, shareMethod: string): Promise<void> {
    try {
      console.log('[ShareNudge] Tracking share:', { userId, shareMethod });

      const { error } = await supabase
        .from('app_shares')
        .insert({
          user_id: userId,
          share_method: shareMethod,
          shared_at: new Date().toISOString(),
        });

      if (error) {
        console.error('[ShareNudge] Error tracking share in Supabase:', error);
      } else {
        console.log('[ShareNudge] Share tracked successfully');
      }
    } catch (error) {
      console.error('[ShareNudge] Error tracking share:', error);
    }
  }

  /**
   * Get current nudge state
   */
  private async getNudgeState(): Promise<NudgeState> {
    const [totalChats, chatsSinceLastNudge, lastNudgeShownStr, nudgeShowCount] = await Promise.all([
      this.getTotalChatCount(),
      this.getChatsSinceLastNudge(),
      AsyncStorage.getItem(STORAGE_KEYS.LAST_NUDGE_SHOWN),
      this.getNudgeShowCount(),
    ]);

    return {
      totalChats,
      chatsSinceLastNudge,
      lastNudgeShown: lastNudgeShownStr ? parseInt(lastNudgeShownStr, 10) : null,
      nudgeShowCount,
    };
  }

  private async getTotalChatCount(): Promise<number> {
    const count = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_SESSION_COUNT);
    return count ? parseInt(count, 10) : 0;
  }

  private async getChatsSinceLastNudge(): Promise<number> {
    const count = await AsyncStorage.getItem(STORAGE_KEYS.CHATS_SINCE_LAST_NUDGE);
    return count ? parseInt(count, 10) : 0;
  }

  private async getNudgeShowCount(): Promise<number> {
    const count = await AsyncStorage.getItem(STORAGE_KEYS.NUDGE_SHOW_COUNT);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Debug: Get current state for troubleshooting
   */
  async getDebugState(): Promise<NudgeState> {
    return this.getNudgeState();
  }

  /**
   * Debug: Reset all counters (for testing)
   */
  async resetCounters(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.CHAT_SESSION_COUNT,
      STORAGE_KEYS.LAST_NUDGE_SHOWN,
      STORAGE_KEYS.NUDGE_SHOW_COUNT,
      STORAGE_KEYS.CHATS_SINCE_LAST_NUDGE,
    ]);
    console.log('[ShareNudge] All counters reset');
  }
}

export const shareNudgeService = new ShareNudgeService();
