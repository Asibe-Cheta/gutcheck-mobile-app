/**
 * B.4 Voice-mode session metadata: start/stop/duration and classifier category (no raw audio).
 * Ring buffer in AsyncStorage; best-effort only.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@voice_session_meta_v1';
const MAX = 80;

export type VoiceSessionLogEntry = {
  at: string;
  action: 'record_start' | 'record_end' | 'readback_start' | 'readback_end';
  durationMs?: number;
  safeguardCategory?: 'A' | 'B' | 'C' | 'D';
};

async function readAll(): Promise<VoiceSessionLogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VoiceSessionLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const voiceSessionLogService = {
  async append(entry: VoiceSessionLogEntry): Promise<void> {
    try {
      const cur = await readAll();
      cur.push(entry);
      await AsyncStorage.setItem(KEY, JSON.stringify(cur.slice(-MAX)));
    } catch {
      /* ignore */
    }
  },

  async readRecent(): Promise<VoiceSessionLogEntry[]> {
    return readAll();
  },
};
