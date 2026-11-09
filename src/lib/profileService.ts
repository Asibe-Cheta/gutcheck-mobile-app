/**
 * Profile Service
 * Reads and writes the signed-in user's profile through the gc_get_profile / gc_update_profile
 * database functions. Only profile fields can be changed; subscription and lifetime fields are
 * server-controlled.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { callWithSession } from './accountSession';

/** Synced Awareness Hub fields (see database/migration_awareness_hub_profile.sql). */
export interface AwarenessHubStateBlob {
  updatedAt: string;
  ageBand: string | null;
  juniorConsent: boolean;
  trackProgress: Record<string, { level: number; progress: number; state: string }>;
  streakDays: number;
  lastActiveDate: string | null;
  remindersEnabled: boolean;
}

export interface ProfileData {
  id?: string;
  username?: string;
  age?: number;
  region?: string;
  avatar_url?: string;
  user_id?: string;
  struggles?: string;
  goals?: string;
  age_range?: string;
  goal?: string;
  user_type?: 'anonymous' | 'username' | 'email';
  created_at?: string;
  updated_at?: string;
}

const EDITABLE_FIELDS = [
  'username',
  'age',
  'region',
  'avatar_url',
  'struggles',
  'goals',
  'age_range',
  'goal',
] as const;

function editablePatch(updates: Partial<ProfileData>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (updates[key] !== undefined) patch[key] = updates[key];
  }
  return patch;
}

async function cacheProfileLocally(profile: ProfileData): Promise<void> {
  await AsyncStorage.setItem(
    'user_profile',
    JSON.stringify({
      username: profile.username,
      age: profile.age ? profile.age.toString() : '',
      region: profile.region,
      avatarUri: profile.avatar_url,
      struggles: profile.struggles,
      goals: profile.goals,
    }),
  );
  // Age and region are also kept in their own keys for AI context.
  if (profile.age) {
    await AsyncStorage.setItem('user_age_range', profile.age.toString());
  }
  if (profile.region) {
    await AsyncStorage.setItem('user_region', profile.region);
  }
}

async function readCachedProfile(): Promise<ProfileData | null> {
  try {
    const localProfile = await AsyncStorage.getItem('user_profile');
    if (!localProfile) return null;
    const parsed = JSON.parse(localProfile);
    return {
      username: parsed.username,
      age: parsed.age ? parseInt(parsed.age, 10) : undefined,
      region: parsed.region,
      avatar_url: parsed.avatarUri,
      struggles: parsed.struggles,
      goals: parsed.goals,
    };
  } catch (localError) {
    console.error('Error getting local profile:', localError);
    return null;
  }
}

async function applyUpdate(updates: Partial<ProfileData>): Promise<ProfileData> {
  const result = await callWithSession<{ ok: boolean; error?: string; profile?: ProfileData }>(
    'gc_update_profile',
    { p_patch: editablePatch(updates) },
  );
  if (!result?.ok || !result.profile) {
    throw new Error(result?.error === 'username_taken' ? 'Username already taken' : 'Failed to save profile data');
  }
  await cacheProfileLocally(result.profile);
  return result.profile;
}

class ProfileService {
  /**
   * Save profile data
   */
  async saveProfile(profileData: Omit<ProfileData, 'id' | 'user_id'>): Promise<ProfileData> {
    try {
      return await applyUpdate(profileData);
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error instanceof Error && error.message === 'Username already taken'
        ? error
        : new Error('Failed to save profile data');
    }
  }

  /**
   * Get profile data (falls back to the copy on this phone when offline)
   */
  async getProfile(): Promise<ProfileData | null> {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) return null;

      const data = await callWithSession<ProfileData | null>('gc_get_profile');
      if (data) {
        await cacheProfileLocally(data);
      }
      return data;
    } catch (error) {
      console.warn('[Profile] getProfile from server failed, using local copy:', error);
      return readCachedProfile();
    }
  }

  /**
   * Update profile data
   */
  async updateProfile(updates: Partial<ProfileData>): Promise<void> {
    try {
      await applyUpdate(updates);
      if (updates.age !== undefined) {
        await AsyncStorage.setItem('user_age_range', String(updates.age));
      }
      if (updates.region !== undefined) {
        await AsyncStorage.setItem('user_region', updates.region);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Load Awareness Hub snapshot from the signed-in user's profile (cross-device).
   */
  async getAwarenessHubState(): Promise<AwarenessHubStateBlob | null> {
    try {
      const data = await callWithSession<{ awareness_hub_state?: AwarenessHubStateBlob } | null>('gc_get_profile');
      const raw = data?.awareness_hub_state;
      if (!raw || typeof raw !== 'object' || !raw.updatedAt) return null;
      return raw;
    } catch (e) {
      console.warn('[Profile] getAwarenessHubState failed:', e);
      return null;
    }
  }

  /**
   * Persist Awareness Hub snapshot (best-effort).
   */
  async setAwarenessHubState(blob: AwarenessHubStateBlob): Promise<boolean> {
    try {
      const result = await callWithSession<{ ok: boolean }>('gc_update_profile', {
        p_patch: { awareness_hub_state: blob },
      });
      return !!result?.ok;
    } catch (e) {
      console.warn('[Profile] setAwarenessHubState failed:', e);
      return false;
    }
  }
}

export const profileService = new ProfileService();
