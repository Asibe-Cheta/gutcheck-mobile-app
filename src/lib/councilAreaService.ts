/**
 * Council Area Service
 * Privacy-First Impact Measurement
 * 
 * This service handles anonymous usage tracking by UK council area
 * WITHOUT collecting any personally identifiable information (PII).
 * 
 * Privacy Guarantees:
 * - Postcode is NEVER stored (only used for one-time mapping)
 * - Device hash changes daily (cannot track individuals long-term)
 * - All data is aggregated at council area level
 * - Compliant with GDPR and UK DPA 2018
 */

import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

class CouncilAreaService {
  
  /**
   * Process postcode and record anonymous usage
   * This is called ONCE during onboarding
   * 
   * @param postcodeOutward - First part of UK postcode (e.g., 'M1', 'SW1A')
   * @returns Success status
   */
  async processPostcodeAndRecordUsage(postcodeOutward: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[COUNCIL] Processing postcode for council area mapping');
      
      // Validate input (basic check)
      if (!postcodeOutward || postcodeOutward.trim().length === 0) {
        return { success: false, error: 'Invalid postcode' };
      }
      
      // Clean and format the outward code
      const cleanedCode = postcodeOutward.trim().toUpperCase().replace(/\s/g, '');
      
      // Generate daily device hash (NOT a persistent identifier)
      const deviceHash = await this.generateDailyDeviceHash();
      
      // Call Supabase function to record usage
      const { data, error } = await supabase.rpc('record_anonymous_usage', {
        p_outward_code: cleanedCode,
        p_device_hash: deviceHash
      });
      
      if (error) {
        console.error('[COUNCIL] Error recording usage:', error);
        return { success: false, error: error.message };
      }
      
      console.log('[COUNCIL] ✅ Anonymous usage recorded successfully');
      
      // Mark that we've collected this data (prevent repeated requests)
      await AsyncStorage.setItem('council_area_recorded', 'true');
      
      return { success: true };
    } catch (error: any) {
      console.error('[COUNCIL] Exception in processPostcodeAndRecordUsage:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }
  
  /**
   * Generate a daily-rotating device hash
   * This hash changes every day, preventing long-term tracking
   * 
   * Hash formula: SHA256(DeviceID + CurrentDate)
   * 
   * Why daily rotation?
   * - Allows counting unique devices per day
   * - Prevents tracking individuals across multiple days
   * - Maintains privacy while providing useful analytics
   */
  private async generateDailyDeviceHash(): Promise<string> {
    try {
      // Get or create a local device ID (NOT sent to server directly)
      let deviceId = await AsyncStorage.getItem('local_device_id');
      
      if (!deviceId) {
        // Generate a random device ID (local only, never sent to server)
        deviceId = await Crypto.randomUUID();
        await AsyncStorage.setItem('local_device_id', deviceId);
      }
      
      // Get current date (YYYY-MM-DD format)
      const today = new Date().toISOString().split('T')[0];
      
      // Create daily hash: SHA256(deviceId + date)
      const dailyString = `${deviceId}-${today}`;
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        dailyString
      );
      
      // Return first 16 characters (sufficient for uniqueness in daily scope)
      return hash.substring(0, 16);
    } catch (error) {
      console.error('[COUNCIL] Error generating device hash:', error);
      // Fallback to random hash if error
      return Math.random().toString(36).substring(2, 18);
    }
  }
  
  /**
   * Check if we've already recorded council area usage
   * Prevents duplicate data collection
   */
  async hasRecordedUsage(): Promise<boolean> {
    try {
      const recorded = await AsyncStorage.getItem('council_area_recorded');
      return recorded === 'true';
    } catch (error) {
      console.error('[COUNCIL] Error checking recorded status:', error);
      return false;
    }
  }
  
  /**
   * Get aggregated analytics (for admin dashboard)
   * This returns ONLY aggregated data, never individual records
   * 
   * @param councilAreaCode - Optional filter by council area
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   */
  async getAggregatedAnalytics(
    councilAreaCode?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      let query = supabase
        .from('council_area_analytics')
        .select(`
          council_area_code,
          uk_council_areas!inner (
            council_area_name,
            region,
            country
          ),
          usage_date,
          session_count,
          analysis_count,
          crisis_alert_count
        `)
        .order('usage_date', { ascending: false });
      
      if (councilAreaCode) {
        query = query.eq('council_area_code', councilAreaCode);
      }
      
      if (startDate) {
        query = query.gte('usage_date', startDate);
      }
      
      if (endDate) {
        query = query.lte('usage_date', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Aggregate data by council area (sum counts)
      const aggregated = this.aggregateByCouncilArea(data || []);
      
      return { success: true, data: aggregated };
    } catch (error: any) {
      console.error('[COUNCIL] Error fetching analytics:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Aggregate analytics data by council area
   * Groups and sums all counts for each council area
   */
  private aggregateByCouncilArea(data: any[]): any[] {
    const grouped = data.reduce((acc, item) => {
      const code = item.council_area_code;
      
      if (!acc[code]) {
        acc[code] = {
          council_area_code: code,
          council_area_name: item.uk_council_areas?.council_area_name || 'Unknown',
          region: item.uk_council_areas?.region || 'Unknown',
          country: item.uk_council_areas?.country || 'Unknown',
          total_sessions: 0,
          total_analyses: 0,
          total_crisis_alerts: 0,
          days_active: 0,
        };
      }
      
      acc[code].total_sessions += item.session_count || 0;
      acc[code].total_analyses += item.analysis_count || 0;
      acc[code].total_crisis_alerts += item.crisis_alert_count || 0;
      acc[code].days_active += 1;
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(grouped);
  }
  
  /**
   * Clear council area data (for testing or user request)
   * This only clears the local flag, not server data (which is already anonymous)
   */
  async clearLocalData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('council_area_recorded');
      await AsyncStorage.removeItem('user_postcode_outward');
      console.log('[COUNCIL] Local data cleared');
    } catch (error) {
      console.error('[COUNCIL] Error clearing local data:', error);
    }
  }
}

export const councilAreaService = new CouncilAreaService();

