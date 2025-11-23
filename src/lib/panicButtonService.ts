/**
 * Panic Button Service
 * Detects triple-tap gesture to trigger quick exit
 * Routes to calculator disguise screen for safety
 */

import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibration } from 'react-native';

const PANIC_BUTTON_ENABLED_KEY = 'panic_button_enabled';
const TAP_TIME_WINDOW = 800; // ms - time window for 3 taps
const MAX_TAPS = 3; // Number of taps required

class PanicButtonService {
  private isEnabled: boolean = false;
  private tapTimes: number[] = [];
  private tapHandler: ((event: any) => void) | null = null;

  /**
   * Check if panic button is enabled
   */
  async isEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(PANIC_BUTTON_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('[PANIC] Error checking if enabled:', error);
      return false;
    }
  }

  /**
   * Enable panic button
   */
  async enable(): Promise<void> {
    try {
      await AsyncStorage.setItem(PANIC_BUTTON_ENABLED_KEY, 'true');
      this.isEnabled = true;
      console.log('[PANIC] Panic button enabled');
    } catch (error) {
      console.error('[PANIC] Error enabling:', error);
    }
  }

  /**
   * Disable panic button
   */
  async disable(): Promise<void> {
    try {
      await AsyncStorage.setItem(PANIC_BUTTON_ENABLED_KEY, 'false');
      this.isEnabled = false;
      console.log('[PANIC] Panic button disabled');
    } catch (error) {
      console.error('[PANIC] Error disabling:', error);
    }
  }

  /**
   * Handle tap event
   */
  handleTap(): void {
    if (!this.isEnabled) {
      return;
    }

    const now = Date.now();
    
    // Add current tap time
    this.tapTimes.push(now);
    
    // Remove taps outside the time window
    this.tapTimes = this.tapTimes.filter(time => now - time < TAP_TIME_WINDOW);
    
    console.log(`[PANIC] Tap detected - Total taps in window: ${this.tapTimes.length}`);
    
    // Check if we have 3 taps within the time window
    if (this.tapTimes.length >= MAX_TAPS) {
      console.log('[PANIC] Triple tap detected!');
      this.tapTimes = []; // Reset tap counter
      this.triggerPanicExit();
    }
  }

  /**
   * Get the tap handler function (to be used in GestureDetector or TouchableWithoutFeedback)
   */
  getTapHandler(): () => void {
    return () => this.handleTap();
  }

  /**
   * Trigger panic exit - go to calculator disguise
   */
  private triggerPanicExit(): void {
    try {
      console.log('[PANIC] 🚨 PANIC EXIT TRIGGERED 🚨');
      
      // Haptic feedback
      Vibration.vibrate(100);
      
      // Navigate to calculator disguise
      router.push('/calculator');
      
      console.log('[PANIC] Navigated to calculator disguise');
    } catch (error) {
      console.error('[PANIC] Error triggering panic exit:', error);
    }
  }

  /**
   * Manual panic exit (for triple-tap or button)
   */
  async manualPanicExit(): Promise<void> {
    // Check if enabled
    const enabled = await this.isEnabled();
    if (!enabled) {
      console.log('[PANIC] Panic button is disabled - manual exit ignored');
      return;
    }

    this.triggerPanicExit();
  }
}

export const panicButtonService = new PanicButtonService();

