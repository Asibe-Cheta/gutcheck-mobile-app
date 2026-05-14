import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReferralVerifyBaseUrl, isReferralVerificationEnabled } from './externalUrls';
import { supabase, isSupabaseConfigured } from './supabase';

/** When verification is on and Supabase is configured, RP-06 uses Postgres RPCs (see database/migration_referral_slots.sql). */
export function isSupabaseReferralBackendActive(): boolean {
  return isReferralVerificationEnabled() && isSupabaseConfigured();
}

export type SlotStatus = 'Available' | 'Sent' | 'Opened' | 'Downloaded';
export type ShareChannel = 'whatsapp' | 'sms' | 'email' | 'copy_link' | 'other';

export interface RecommendationSlot {
  slotNumber: number;
  status: SlotStatus;
  method?: string;
  usedAt?: string;
  referralToken?: string;
  openedAt?: string;
  downloadedAt?: string;
}

const TOTAL_SLOTS = 5;
const KEY = '@recommend_protect_slots_v1';
const TEMPLATE_KEY = '@recommend_protect_templates_v1';
const DEBUG_KEY = '@recommend_protect_debug_v1';

export interface RecommendProtectDebugState {
  lastReservationResult?: 'reserved' | 'denied' | 'unavailable';
  lastVerificationResult?: 'verified' | 'invalid' | 'unavailable';
  lastUpdatedAt?: string;
}

export interface SharePayload {
  message: string;
  subject?: string;
}

async function storageKeyForCurrentUser(): Promise<string> {
  const userId = await AsyncStorage.getItem('user_id');
  return userId ? `${KEY}_${userId}` : KEY;
}

function defaultSlots(): RecommendationSlot[] {
  return Array.from({ length: TOTAL_SLOTS }, (_, idx) => ({
    slotNumber: idx + 1,
    status: 'Available',
  }));
}

class RecommendProtectService {
  private async setDebugState(
    patch: Partial<RecommendProtectDebugState>
  ): Promise<void> {
    try {
      const keyUser = await AsyncStorage.getItem('user_id');
      const key = keyUser ? `${DEBUG_KEY}_${keyUser}` : DEBUG_KEY;
      const raw = await AsyncStorage.getItem(key);
      const current = raw ? (JSON.parse(raw) as RecommendProtectDebugState) : {};
      const next: RecommendProtectDebugState = {
        ...current,
        ...patch,
        lastUpdatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Debug info should never break core flow
    }
  }

  async getDebugState(): Promise<RecommendProtectDebugState> {
    try {
      const keyUser = await AsyncStorage.getItem('user_id');
      const key = keyUser ? `${DEBUG_KEY}_${keyUser}` : DEBUG_KEY;
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return {};
      return JSON.parse(raw) as RecommendProtectDebugState;
    } catch {
      return {};
    }
  }

  async resetDebugState(): Promise<void> {
    try {
      const keyUser = await AsyncStorage.getItem('user_id');
      const key = keyUser ? `${DEBUG_KEY}_${keyUser}` : DEBUG_KEY;
      await AsyncStorage.removeItem(key);
    } catch {
      // No-op: debug utility only
    }
  }

  private defaultTemplates(): Record<ShareChannel, string> {
    return {
      whatsapp:
        "Hey, I’ve been using an app called GutChecks: Red Flags & Safety and thought of you. It helps you check in on your gut instinct across all kinds of everyday interactions; work, friendships, online, family, public spaces; and helps you spot red flags before they become problems. Worth a look. Here’s the link: [LINK]",
      sms:
        "Check out GutChecks: Red Flags & Safety. It helps you spot red flags and stay safe across everyday interactions, online and offline. Thought you’d find it useful: [LINK]",
      email:
        "Hi, I’ve been using GutChecks: Red Flags & Safety and thought of you. It helps you check in on your instincts across all kinds of everyday interactions; not just relationships, but work, online, family, public spaces, and more. Genuinely useful. Download it here: [LINK].",
      copy_link:
        "GutChecks: Red Flags & Safety supports everyday interactions across work, family, online spaces, friendships, and relationships. Here is the link: [LINK]",
      other:
        "Sharing GutChecks: Red Flags & Safety in case it is useful. It covers everyday interactions across work, family, online spaces, friendships, and relationships: [LINK]",
    };
  }

  private async templateStorageKeyForCurrentUser(): Promise<string> {
    const userId = await AsyncStorage.getItem('user_id');
    return userId ? `${TEMPLATE_KEY}_${userId}` : TEMPLATE_KEY;
  }

  async getShareTemplates(): Promise<Record<ShareChannel, string>> {
    const key = await this.templateStorageKeyForCurrentUser();
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return this.defaultTemplates();
    try {
      const parsed = JSON.parse(raw) as Partial<Record<ShareChannel, string>>;
      return {
        ...this.defaultTemplates(),
        ...parsed,
      };
    } catch {
      return this.defaultTemplates();
    }
  }

  async saveShareTemplate(channel: ShareChannel, value: string): Promise<void> {
    const key = await this.templateStorageKeyForCurrentUser();
    const current = await this.getShareTemplates();
    const next = {
      ...current,
      [channel]: value.trim(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(next));
  }

  async buildShareMessage(channel: ShareChannel, link: string): Promise<string> {
    const templates = await this.getShareTemplates();
    const template = templates[channel] || templates.other;
    return template.replace(/\[LINK\]/g, link);
  }

  async buildSharePayload(channel: ShareChannel, link: string): Promise<SharePayload> {
    const message = await this.buildShareMessage(channel, link);
    if (channel === 'email') {
      return {
        subject: 'Something I think you might find useful',
        message,
      };
    }
    return { message };
  }

  async getSlots(): Promise<RecommendationSlot[]> {
    const key = await storageKeyForCurrentUser();
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return defaultSlots();
    try {
      const parsed = JSON.parse(raw) as RecommendationSlot[];
      const normalized = defaultSlots().map((slot) => parsed.find((p) => p.slotNumber === slot.slotNumber) || slot);
      return normalized;
    } catch {
      return defaultSlots();
    }
  }

  private async saveSlots(slots: RecommendationSlot[]): Promise<void> {
    const key = await storageKeyForCurrentUser();
    await AsyncStorage.setItem(key, JSON.stringify(slots));
  }

  async getSummary(): Promise<{ total: number; used: number; remaining: number }> {
    const slots = await this.getSlots();
    const used = slots.filter((slot) => slot.status !== 'Available').length;
    return {
      total: TOTAL_SLOTS,
      used,
      remaining: TOTAL_SLOTS - used,
    };
  }

  async hasAvailableSlot(): Promise<boolean> {
    const summary = await this.getSummary();
    return summary.remaining > 0;
  }

  async consumeNextSlot(method: string, referralToken?: string): Promise<RecommendationSlot | null> {
    const slots = await this.getSlots();
    const next = slots.find((slot) => slot.status === 'Available');
    if (!next) return null;
    const tokenToUse = referralToken || this.buildReferralToken(next.slotNumber);

    // When server verification mode is enabled, require a successful server reservation
    // before consuming a local slot. This reduces client-side manipulation risk.
    if (isReferralVerificationEnabled()) {
      const reservation = await this.reserveSlotOnServer({
        slotNumber: next.slotNumber,
        token: tokenToUse,
        method,
      });
      await this.setDebugState({ lastReservationResult: reservation });
      if (reservation !== 'reserved') {
        return null;
      }
    }

    const updated: RecommendationSlot = {
      ...next,
      status: 'Sent',
      method,
      usedAt: new Date().toISOString(),
      referralToken: tokenToUse,
    };
    const nextSlots = slots.map((slot) => (slot.slotNumber === updated.slotNumber ? updated : slot));
    await this.saveSlots(nextSlots);
    return updated;
  }

  private async reserveSlotOnServer(payload: {
    slotNumber: number;
    token: string;
    method: string;
  }): Promise<'reserved' | 'denied' | 'unavailable'> {
    const userId = await AsyncStorage.getItem('user_id');
    if (!userId) {
      return 'denied';
    }

    if (isSupabaseReferralBackendActive()) {
      try {
        const { data, error } = await supabase.rpc('referral_reserve_slot', {
          p_slot_number: payload.slotNumber,
          p_token: payload.token,
          p_method: payload.method,
          p_profile_user_id: userId,
        });
        if (error) {
          return 'unavailable';
        }
        const row = data as { allowed?: boolean; error?: string } | null;
        if (row?.allowed) return 'reserved';
        const err = row?.error || '';
        if (err === 'slot_consumed' || err === 'cap_reached' || err === 'conflict' || err === 'invalid_user') {
          return 'denied';
        }
        return 'denied';
      } catch {
        return 'unavailable';
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const baseUrl = getReferralVerifyBaseUrl();
      const response = await fetch(`${baseUrl}/api/referral/reserve-slot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          token: payload.token,
          slotNumber: payload.slotNumber,
          method: payload.method,
          userId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403 || response.status === 409) {
          return 'denied';
        }
        return 'unavailable';
      }
      const data = (await response.json()) as { allowed?: boolean };
      return data.allowed ? 'reserved' : 'denied';
    } catch {
      return 'unavailable';
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildReferralToken(slotNumber: number): string {
    return `rp_${slotNumber}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  async previewNextReferral(): Promise<{ slotNumber: number; token: string; link: string } | null> {
    const slots = await this.getSlots();
    const next = slots.find((slot) => slot.status === 'Available');
    if (!next) return null;
    const token = this.buildReferralToken(next.slotNumber);
    return {
      slotNumber: next.slotNumber,
      token,
      link: `https://mygutcheck.org/r?ref=${encodeURIComponent(token)}`,
    };
  }

  async getReferralLinkForSlot(slotNumber: number): Promise<string | null> {
    const slots = await this.getSlots();
    const slot = slots.find((item) => item.slotNumber === slotNumber);
    if (!slot?.referralToken) return null;
    return `https://mygutcheck.org/r?ref=${encodeURIComponent(slot.referralToken)}`;
  }

  async verifyReferralEvent(
    token: string,
    event: 'opened' | 'downloaded'
  ): Promise<'verified' | 'invalid' | 'unavailable'> {
    if (!isReferralVerificationEnabled()) {
      await this.setDebugState({ lastVerificationResult: 'unavailable' });
      return 'unavailable';
    }

    if (isSupabaseReferralBackendActive()) {
      try {
        const { data, error } = await supabase.rpc('referral_verify_event', {
          p_token: token,
          p_event: event,
        });
        if (error) {
          await this.setDebugState({ lastVerificationResult: 'unavailable' });
          return 'unavailable';
        }
        const row = data as { valid?: boolean } | null;
        const verification = row?.valid ? 'verified' : 'invalid';
        await this.setDebugState({ lastVerificationResult: verification });
        return verification;
      } catch {
        await this.setDebugState({ lastVerificationResult: 'unavailable' });
        return 'unavailable';
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const baseUrl = getReferralVerifyBaseUrl();
      const response = await fetch(
        `${baseUrl}/api/referral/verify?token=${encodeURIComponent(token)}&event=${encodeURIComponent(event)}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        }
      );
      if (!response.ok) {
        await this.setDebugState({ lastVerificationResult: 'unavailable' });
        return 'unavailable';
      }
      const data = (await response.json()) as { valid?: boolean };
      const verification = data.valid ? 'verified' : 'invalid';
      await this.setDebugState({ lastVerificationResult: verification });
      return verification;
    } catch {
      await this.setDebugState({ lastVerificationResult: 'unavailable' });
      return 'unavailable';
    } finally {
      clearTimeout(timeout);
    }
  }

  async markSlotStatusByToken(token: string, status: Exclude<SlotStatus, 'Available' | 'Sent'>): Promise<boolean> {
    const slots = await this.getSlots();
    const target = slots.find((slot) => slot.referralToken === token);
    if (!target) return false;

    const nextSlots = slots.map((slot) => {
      if (slot.referralToken !== token) return slot;
      if (status === 'Opened' && (slot.status === 'Sent' || slot.status === 'Opened')) {
        return {
          ...slot,
          status: 'Opened',
          openedAt: slot.openedAt || new Date().toISOString(),
        };
      }
      if (status === 'Downloaded' && slot.status !== 'Available') {
        return {
          ...slot,
          status: 'Downloaded',
          openedAt: slot.openedAt || new Date().toISOString(),
          downloadedAt: slot.downloadedAt || new Date().toISOString(),
        };
      }
      return slot;
    });

    await this.saveSlots(nextSlots);
    return true;
  }
}

export const recommendProtectService = new RecommendProtectService();

