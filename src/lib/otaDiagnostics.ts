import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

const OTA_DEBUG_KEY = '@ota_debug_v1';

export type OtaDebugSnapshot = {
  at: string;
  isEnabled: boolean;
  channel: string | null;
  runtimeVersion: string | null;
  updateId: string | null;
  isEmbeddedLaunch: boolean;
  checkAvailable?: boolean;
  checkReason?: string;
  fetchError?: string;
  reloadScheduled?: boolean;
};

export async function readOtaDebugSnapshot(): Promise<OtaDebugSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(OTA_DEBUG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OtaDebugSnapshot;
  } catch {
    return null;
  }
}

export async function captureOtaBaseline(): Promise<OtaDebugSnapshot> {
  const snapshot: OtaDebugSnapshot = {
    at: new Date().toISOString(),
    isEnabled: Updates.isEnabled,
    channel: Updates.channel ?? null,
    runtimeVersion: Updates.runtimeVersion ?? null,
    updateId: Updates.updateId ?? null,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  };
  await AsyncStorage.setItem(OTA_DEBUG_KEY, JSON.stringify(snapshot));
  return snapshot;
}

export async function recordOtaCheckResult(
  available: boolean,
  extra?: Partial<OtaDebugSnapshot>
): Promise<void> {
  const prev = (await readOtaDebugSnapshot()) ?? (await captureOtaBaseline());
  const next: OtaDebugSnapshot = {
    ...prev,
    at: new Date().toISOString(),
    checkAvailable: available,
    ...extra,
  };
  await AsyncStorage.setItem(OTA_DEBUG_KEY, JSON.stringify(next));
}

export async function readOtaNativeLogs(maxAge = 3600000): Promise<string[]> {
  try {
    const entries = await Updates.readLogEntriesAsync(maxAge);
    return entries.map((e) => `${e.timestamp}: ${e.message}`);
  } catch {
    return [];
  }
}
