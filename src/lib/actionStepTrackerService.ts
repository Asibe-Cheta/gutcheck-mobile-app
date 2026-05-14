import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { isSupabaseConfigured } from './supabase';

type FeedbackStatus = 'acted_upon' | 'not_acted_upon' | 'skipped';

export interface PendingActionStepFollowUp {
  sourceChatId: string;
  sourceChatUpdatedAt: string;
  steps: string[];
  cooldownHours: number;
  sourceCategory?: string;
}

interface ActionStepFeedbackEvent {
  token: string;
  status: FeedbackStatus;
  selectedStepIndexes: number[];
  totalStepsPresented: number;
  barrierTextProvided: boolean;
  barrierTextLength: number;
  elapsedBucket: '1-24h' | '25-48h' | '3-7d' | '7+d';
  ageGroup?: string | null;
  sourceCategory?: string;
  barrierTheme?: string;
  createdAt: string;
}

export interface ActionStepLocalAggregateSummary {
  totalResponses: number;
  actedUponCount: number;
  notActedUponCount: number;
  skippedCount: number;
  actedUponRate: number;
  skipRate: number;
  barrierTextRate: number;
  elapsedBuckets: Record<'1-24h' | '25-48h' | '3-7d' | '7+d', number>;
}

const BASE = {
  EVENTS: '@action_step_feedback_events_v1',
  LAST_PROMPTED: '@action_step_last_prompted_at_v1',
  LAST_PROCESSED_CHAT: '@action_step_last_processed_chat_id_v1',
  LAST_SKIPPED: '@action_step_last_skipped_at_v1',
  COOLDOWN_HOURS: '@action_step_cooldown_hours_v1',
};

const DEFAULT_COOLDOWN_HOURS = 24;
const RAW_EVENT_RETENTION_DAYS = 30;
const MAX_LOCAL_EVENTS = 500;

function keyForUser(base: string, userId: string) {
  return `${base}_${userId}`;
}

function toMs(hours: number) {
  return hours * 60 * 60 * 1000;
}

function sanitizeBarrierTextLength(input?: string): number {
  if (!input) return 0;
  return input.trim().slice(0, 280).length;
}

function scrubBarrierText(input?: string): string {
  if (!input) return '';
  return input
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\+?\d[\d\s\-()]{7,}\d/g, '[redacted-phone]')
    .replace(/\b([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})\b/gi, '[redacted-postcode]')
    .trim()
    .slice(0, 280);
}

function detectBarrierTheme(scrubbedText: string): string | undefined {
  const text = scrubbedText.toLowerCase();
  if (!text) return undefined;
  if (/afraid|unsafe|scared|danger/.test(text)) return 'safety-fear';
  if (/money|cost|expensive|afford/.test(text)) return 'financial-barrier';
  if (/time|busy|schedule|work/.test(text)) return 'time-barrier';
  if (/didn\'t know|confused|not sure/.test(text)) return 'clarity-barrier';
  if (/embarrass|ashamed|guilt|anxious/.test(text)) return 'emotional-barrier';
  return 'other';
}

function getElapsedBucket(sourceIso: string): ActionStepFeedbackEvent['elapsedBucket'] {
  const elapsedHours = Math.max(0, (Date.now() - new Date(sourceIso).getTime()) / (1000 * 60 * 60));
  if (elapsedHours <= 24) return '1-24h';
  if (elapsedHours <= 48) return '25-48h';
  if (elapsedHours <= 7 * 24) return '3-7d';
  return '7+d';
}

function extractActionStepsFromAssistantText(text: string): string[] {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);

  const headingIndex = lines.findIndex((line) =>
    /recommended action steps|action steps|next steps|what to do/i.test(line)
  );
  const scanLines = headingIndex >= 0 ? lines.slice(headingIndex + 1) : lines;

  const candidates = scanLines
    .filter((line) => /^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim())
    .filter((line) => line.length > 0 && line.length < 220)
    .filter((line) => !/red flags|likely scenarios|reality check|closing/i.test(line));

  const unique = Array.from(new Set(candidates));
  return unique.slice(0, 6);
}

class ActionStepTrackerService {
  private isWithinRawRetentionWindow(isoDate: string): boolean {
    const timestamp = new Date(isoDate).getTime();
    if (!Number.isFinite(timestamp)) return false;
    const ageMs = Date.now() - timestamp;
    return ageMs <= RAW_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  }

  private pruneRawEvents(events: ActionStepFeedbackEvent[]): ActionStepFeedbackEvent[] {
    return events
      .filter((event) => this.isWithinRawRetentionWindow(event.createdAt))
      .slice(-MAX_LOCAL_EVENTS);
  }

  private clampCooldownHours(value: number): number {
    if (!Number.isFinite(value)) return DEFAULT_COOLDOWN_HOURS;
    return Math.min(72, Math.max(24, Math.round(value)));
  }

  async setCooldownHours(hours: number): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) return;
    const normalized = this.clampCooldownHours(hours);
    await AsyncStorage.setItem(keyForUser(BASE.COOLDOWN_HOURS, userId), String(normalized));
  }

  private async getCooldownHoursOrDefault(): Promise<number> {
    const userId = await this.getUserId();
    if (!userId) return DEFAULT_COOLDOWN_HOURS;
    const raw = await AsyncStorage.getItem(keyForUser(BASE.COOLDOWN_HOURS, userId));
    if (!raw) return DEFAULT_COOLDOWN_HOURS;
    return this.clampCooldownHours(Number(raw));
  }

  private async getUserId(): Promise<string | null> {
    const userId = await AsyncStorage.getItem('user_id');
    const loggedIn = await AsyncStorage.getItem('is_logged_in');
    if (!userId || loggedIn !== 'true') return null;
    return userId;
  }

  private async getSavedChats(userId: string): Promise<any[]> {
    const key = `gutcheck_saved_chats_${userId}`;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private getMostRecentChatWithActionSteps(chats: any[]): { chat: any; steps: string[] } | null {
    const sorted = [...chats].sort((a, b) => {
      const at = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
      const bt = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
      return bt - at;
    });

    for (const chat of sorted) {
      const messages = Array.isArray(chat?.messages) ? chat.messages : [];
      const assistants = messages.filter((m: any) => m?.role === 'assistant' && typeof m?.content === 'string');
      for (let i = assistants.length - 1; i >= 0; i -= 1) {
        const steps = extractActionStepsFromAssistantText(assistants[i].content || '');
        if (steps.length > 0) {
          return { chat, steps };
        }
      }
    }

    return null;
  }

  private inferSourceCategory(chat: any): string {
    const messages = Array.isArray(chat?.messages) ? chat.messages : [];
    const text = messages
      .map((m: any) => (typeof m?.content === 'string' ? m.content : ''))
      .join(' ')
      .toLowerCase();

    if (/work|boss|manager|colleague|office|job/.test(text)) return 'workplace';
    if (/family|parent|mother|father|sister|brother|home/.test(text)) return 'family';
    if (/online|instagram|tiktok|whatsapp|snapchat|dm|group chat/.test(text)) return 'online';
    if (/partner|boyfriend|girlfriend|dating|ex|relationship/.test(text)) return 'romantic';
    if (/school|teacher|classmate|campus|college|university/.test(text)) return 'education';
    if (/street|bus|train|public|stranger|event/.test(text)) return 'public-space';
    return 'general';
  }

  async getPendingFollowUp(cooldownHours?: number): Promise<PendingActionStepFollowUp | null> {
    const userId = await this.getUserId();
    if (!userId) return null;
    const effectiveCooldownHours =
      typeof cooldownHours === 'number'
        ? this.clampCooldownHours(cooldownHours)
        : await this.getCooldownHoursOrDefault();

    const [lastPromptedRaw, lastProcessedChatId] = await Promise.all([
      AsyncStorage.getItem(keyForUser(BASE.LAST_PROMPTED, userId)),
      AsyncStorage.getItem(keyForUser(BASE.LAST_PROCESSED_CHAT, userId)),
    ]);

    if (lastPromptedRaw) {
      const elapsed = Date.now() - Number(lastPromptedRaw);
      if (Number.isFinite(elapsed) && elapsed < toMs(effectiveCooldownHours)) {
        return null;
      }
    }

    const chats = await this.getSavedChats(userId);
    if (!chats.length) return null;

    const candidate = this.getMostRecentChatWithActionSteps(chats);
    if (!candidate) return null;

    if (lastProcessedChatId && lastProcessedChatId === candidate.chat.id) {
      return null;
    }

    return {
      sourceChatId: candidate.chat.id,
      sourceChatUpdatedAt: candidate.chat.updatedAt || candidate.chat.createdAt || new Date().toISOString(),
      steps: candidate.steps,
      cooldownHours: effectiveCooldownHours,
      sourceCategory: this.inferSourceCategory(candidate.chat),
    };
  }

  /** Match `getEnvVar` in `supabase.ts` so ingest runs whenever the client is configured. */
  private readPublicEnv(key: string): string | undefined {
    try {
      if (process.env[key]) return process.env[key] as string;
      const fromExtra = Constants?.expoConfig?.extra?.[key];
      if (typeof fromExtra === 'string' && fromExtra.length > 0) return fromExtra;
    } catch {
      /* ignore */
    }
    return undefined;
  }

  private async syncAnonymisedFeedbackToEdge(ev: ActionStepFeedbackEvent): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      const url = this.readPublicEnv('EXPO_PUBLIC_SUPABASE_URL');
      const anon = this.readPublicEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');
      if (!url || !anon) return;

      const secret = this.readPublicEnv('EXPO_PUBLIC_ACTION_STEP_INGEST_SECRET');
      const fnUrl = `${String(url).replace(/\/$/, '')}/functions/v1/action-step-feedback`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anon}`,
        apikey: anon,
      };
      if (typeof secret === 'string' && secret.length > 0) {
        headers['x-action-step-ingest-secret'] = secret;
      }

      const body = {
        session_token: ev.token,
        status: ev.status,
        total_steps_presented: ev.totalStepsPresented,
        selected_step_count: ev.selectedStepIndexes.length,
        barrier_text_provided: ev.barrierTextProvided,
        barrier_text_length: ev.barrierTextLength,
        elapsed_bucket: ev.elapsedBucket,
        age_group: ev.ageGroup ?? null,
        source_category: ev.sourceCategory ?? null,
        barrier_theme: ev.barrierTheme ?? null,
      };

      const res = await fetch(fnUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        console.warn('[ActionStepTracker] edge ingest failed', res.status, t.slice(0, 240));
      }
    } catch (e) {
      console.warn('[ActionStepTracker] edge ingest error', e);
    }
  }

  private async recordFeedbackEvent(
    userId: string,
    event: Omit<ActionStepFeedbackEvent, 'token' | 'createdAt' | 'ageGroup'>
  ): Promise<ActionStepFeedbackEvent> {
    const eventsKey = keyForUser(BASE.EVENTS, userId);
    const raw = await AsyncStorage.getItem(eventsKey);
    const parsed: ActionStepFeedbackEvent[] = raw ? this.pruneRawEvents(JSON.parse(raw)) : [];
    const ageGroup = await AsyncStorage.getItem('user_age_range');

    const full: ActionStepFeedbackEvent = {
      ...event,
      token: Crypto.randomUUID(),
      ageGroup,
      createdAt: new Date().toISOString(),
    };
    parsed.push(full);
    await AsyncStorage.setItem(eventsKey, JSON.stringify(this.pruneRawEvents(parsed)));
    return full;
  }

  private async markPromptHandled(userId: string, chatId: string): Promise<void> {
    await AsyncStorage.multiSet([
      [keyForUser(BASE.LAST_PROMPTED, userId), String(Date.now())],
      [keyForUser(BASE.LAST_PROCESSED_CHAT, userId), chatId],
    ]);
  }

  async submitFollowUp(params: {
    sourceChatId: string;
    sourceChatUpdatedAt: string;
    selectedStepIndexes: number[];
    totalStepsPresented: number;
    barrierText?: string;
    sourceCategory?: string;
  }): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) return;

    const scrubbedBarrier = scrubBarrierText(params.barrierText);
    const barrierLength = sanitizeBarrierTextLength(params.barrierText);
    const status: FeedbackStatus =
      params.selectedStepIndexes.length > 0 ? 'acted_upon' : 'not_acted_upon';

    const saved = await this.recordFeedbackEvent(userId, {
      status,
      selectedStepIndexes: params.selectedStepIndexes,
      totalStepsPresented: params.totalStepsPresented,
      barrierTextProvided: barrierLength > 0,
      barrierTextLength: barrierLength,
      elapsedBucket: getElapsedBucket(params.sourceChatUpdatedAt),
      sourceCategory: params.sourceCategory,
      barrierTheme: detectBarrierTheme(scrubbedBarrier),
    });

    await this.markPromptHandled(userId, params.sourceChatId);
    void this.syncAnonymisedFeedbackToEdge(saved);
  }

  async skipFollowUp(params: { sourceChatId: string; sourceChatUpdatedAt: string; totalStepsPresented: number }): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) return;

    const saved = await this.recordFeedbackEvent(userId, {
      status: 'skipped',
      selectedStepIndexes: [],
      totalStepsPresented: params.totalStepsPresented,
      barrierTextProvided: false,
      barrierTextLength: 0,
      elapsedBucket: getElapsedBucket(params.sourceChatUpdatedAt),
      sourceCategory: 'general',
    });

    await AsyncStorage.setItem(keyForUser(BASE.LAST_SKIPPED, userId), String(Date.now()));
    await this.markPromptHandled(userId, params.sourceChatId);
    void this.syncAnonymisedFeedbackToEdge(saved);
  }

  async getLocalAggregateSummary(): Promise<ActionStepLocalAggregateSummary> {
    const userId = await this.getUserId();
    const empty: ActionStepLocalAggregateSummary = {
      totalResponses: 0,
      actedUponCount: 0,
      notActedUponCount: 0,
      skippedCount: 0,
      actedUponRate: 0,
      skipRate: 0,
      barrierTextRate: 0,
      elapsedBuckets: { '1-24h': 0, '25-48h': 0, '3-7d': 0, '7+d': 0 },
    };
    if (!userId) return empty;

    const raw = await AsyncStorage.getItem(keyForUser(BASE.EVENTS, userId));
    const events: ActionStepFeedbackEvent[] = raw ? this.pruneRawEvents(JSON.parse(raw)) : [];
    if (!events.length) return empty;

    const totalResponses = events.length;
    const actedUponCount = events.filter((e) => e.status === 'acted_upon').length;
    const notActedUponCount = events.filter((e) => e.status === 'not_acted_upon').length;
    const skippedCount = events.filter((e) => e.status === 'skipped').length;
    const barrierCount = events.filter((e) => e.barrierTextProvided).length;

    const elapsedBuckets: ActionStepLocalAggregateSummary['elapsedBuckets'] = {
      '1-24h': 0,
      '25-48h': 0,
      '3-7d': 0,
      '7+d': 0,
    };
    events.forEach((e) => {
      elapsedBuckets[e.elapsedBucket] += 1;
    });

    return {
      totalResponses,
      actedUponCount,
      notActedUponCount,
      skippedCount,
      actedUponRate: actedUponCount / totalResponses,
      skipRate: skippedCount / totalResponses,
      barrierTextRate: barrierCount / totalResponses,
      elapsedBuckets,
    };
  }

  async pruneStoredEventsNow(): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) return;
    const eventsKey = keyForUser(BASE.EVENTS, userId);
    const raw = await AsyncStorage.getItem(eventsKey);
    if (!raw) return;
    const parsed: ActionStepFeedbackEvent[] = JSON.parse(raw);
    await AsyncStorage.setItem(eventsKey, JSON.stringify(this.pruneRawEvents(parsed)));
  }
}

export const actionStepTrackerService = new ActionStepTrackerService();
