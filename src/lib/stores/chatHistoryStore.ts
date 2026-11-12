/**
 * History store (PRD 13).
 *
 * The server (gc_history_* functions, encrypted with a key held in the database) is the source of
 * truth; this phone keeps a full copy of the checks it has opened or made, so History works
 * offline. Every save is written here first, then uploaded. Checks from other devices appear as
 * list entries and are downloaded when opened.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { SupportPlan } from '@/lib/supportRules';
import type { CheckCategory } from '@/lib/responsePipeline';
import { callWithSession, NoSessionError } from '@/lib/accountSession';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  /** Support service IDs and tier shown under this result; cards re-render from the directory. */
  support?: SupportPlan;
}

export interface SavedChat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  hasImage?: boolean;
  analysisData?: {
    patterns: string[];
    severity: string;
    riskLevel: string;
  };
  /** Listed from the server but not yet downloaded to this phone (messages is empty). */
  remoteOnly?: boolean;
  /** Support cards were shown for this check (set for server-listed entries). */
  supportShown?: boolean;
  category?: CheckCategory;
}

const PAGE_SIZE = 20;
const LEGACY_STORAGE_KEY = 'gutcheck_saved_chats';

async function currentUserId(): Promise<string | null> {
  return AsyncStorage.getItem('user_id');
}

const getStorageKey = async (): Promise<string> => {
  const userId = await currentUserId();
  return userId ? `gutcheck_saved_chats_${userId}` : LEGACY_STORAGE_KEY;
};

/** id -> updatedAt (ms) of the version last uploaded, so only changed checks are re-sent. */
const syncedKey = (userId: string) => `gutcheck_history_synced_${userId}`;
/** Deletions made offline, sent on the next sync. */
const pendingDeletesKey = (userId: string) => `gutcheck_history_pending_deletes_${userId}`;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function parseStoredChats(raw: string): SavedChat[] {
  const parsed = JSON.parse(raw) as SavedChat[];
  return parsed.map((chat) => ({
    ...chat,
    createdAt: new Date(chat.createdAt),
    updatedAt: new Date(chat.updatedAt),
    messages: chat.messages.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    })),
  }));
}

const byNewest = (a: SavedChat, b: SavedChat) =>
  b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id);

/** Always read from disk and merge user + legacy keys so saves never wipe existing history. */
async function readAllChatsFromDisk(): Promise<SavedChat[]> {
  const userId = await currentUserId();
  const userKey = userId ? `gutcheck_saved_chats_${userId}` : LEGACY_STORAGE_KEY;
  const keysToRead = userId ? [userKey, LEGACY_STORAGE_KEY] : [LEGACY_STORAGE_KEY];

  const byId = new Map<string, SavedChat>();

  for (const key of keysToRead) {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) continue;
    try {
      const chats = parseStoredChats(raw);
      for (const chat of chats) {
        const existing = byId.get(chat.id);
        if (!existing || chat.updatedAt > existing.updatedAt) {
          byId.set(chat.id, chat);
        }
      }
    } catch (e) {
      console.warn('[CHAT_HISTORY] Failed to parse storage key', key, e);
    }
  }

  return Array.from(byId.values()).sort(byNewest);
}

async function persistChatsToDisk(chats: SavedChat[]): Promise<void> {
  const storageKey = await getStorageKey();
  await AsyncStorage.setItem(storageKey, JSON.stringify(chats.filter((c) => !c.remoteOnly)));
}

function mergeLists(local: SavedChat[], remote: SavedChat[]): SavedChat[] {
  const localIds = new Set(local.map((c) => c.id));
  return [...local, ...remote.filter((c) => !localIds.has(c.id))].sort(byNewest);
}

// ─── Server mapping ─────────────────────────────────────────────────────────

interface ServerListItem {
  id: string;
  client_id: string;
  title: string | null;
  category: string | null;
  risk_tier: number | null;
  support_service_ids: string[] | null;
  has_image: boolean;
  created_at: string;
  updated_at: string;
}

interface ServerChat {
  client_id: string;
  title: string | null;
  messages: { role: 'user' | 'assistant'; content: string; timestamp?: string; support?: SupportPlan }[];
  has_image: boolean;
  category?: string | null;
  created_at: string;
  updated_at: string;
}

function stubFromServer(item: ServerListItem): SavedChat {
  return {
    id: item.client_id,
    title: item.title || 'Untitled check',
    messages: [],
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
    hasImage: item.has_image,
    remoteOnly: true,
    category: (item.category as CheckCategory) || undefined,
    supportShown: (item.support_service_ids?.length ?? 0) > 0 || item.risk_tier === 3,
  };
}

function chatFromServer(row: ServerChat): SavedChat {
  return {
    id: row.client_id,
    title: row.title || 'Untitled check',
    messages: (row.messages || []).map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date(row.created_at),
      support: m.support,
    })),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    hasImage: row.has_image,
    category: (row.category as CheckCategory) || undefined,
    analysisData: { patterns: [], severity: 'unknown', riskLevel: 'unknown' },
  };
}

/** Support summary stored as metadata so History can show the tag without decrypting content. */
function supportSummary(chat: SavedChat) {
  const plans = chat.messages.map((m) => m.support).filter((s): s is SupportPlan => !!s);
  if (plans.length === 0) return { tier: null, serviceIds: [] as string[], directory: null, ruleset: null };
  const highest = plans.reduce((a, b) => (b.tier > a.tier ? b : a));
  return {
    tier: highest.tier,
    serviceIds: Array.from(new Set(plans.flatMap((p) => p.serviceIds))),
    directory: highest.directoryVersion,
    ruleset: highest.rulesetVersion,
  };
}

async function uploadChat(chat: SavedChat): Promise<boolean> {
  const support = supportSummary(chat);
  const result = await callWithSession<{ ok: boolean; error?: string }>('gc_history_save', {
    p_client_id: chat.id,
    p_created_at: chat.createdAt.toISOString(),
    p_title: chat.title,
    p_messages: chat.messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
      ...(m.support ? { support: m.support } : {}),
    })),
    p_has_image: !!chat.hasImage,
    p_risk_tier: support.tier,
    p_support_service_ids: support.serviceIds,
    p_directory_version: support.directory,
    p_ruleset_version: support.ruleset,
    p_category: chat.category ?? null,
  });
  // 'deleted' means it was deleted on another device: treat as done so it isn't re-sent.
  return !!result?.ok || result?.error === 'deleted';
}

async function markSynced(userId: string, chat: SavedChat): Promise<void> {
  const synced = await readJson<Record<string, number>>(syncedKey(userId), {});
  synced[chat.id] = chat.updatedAt.getTime();
  await AsyncStorage.setItem(syncedKey(userId), JSON.stringify(synced));
}

/** Upload one check; failures are left for the next sync. */
async function syncOne(chat: SavedChat): Promise<void> {
  const userId = await currentUserId();
  if (!userId || chat.remoteOnly || chat.messages.length === 0) return;
  try {
    if (await uploadChat(chat)) await markSynced(userId, chat);
  } catch (error) {
    if (!(error instanceof NoSessionError)) {
      console.warn('[CHAT_HISTORY] Upload failed, will retry on next sync:', error);
    }
  }
}

/** Send offline deletions and any checks changed since their last upload (including old ones). */
async function syncPending(local: SavedChat[]): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;

  const deletes = await readJson<string[]>(pendingDeletesKey(userId), []);
  const stillPending: string[] = [];
  for (const id of deletes) {
    try {
      await callWithSession('gc_history_delete', { p_client_id: id });
    } catch (error) {
      if (error instanceof NoSessionError) return;
      stillPending.push(id);
    }
  }
  await AsyncStorage.setItem(pendingDeletesKey(userId), JSON.stringify(stillPending));

  const synced = await readJson<Record<string, number>>(syncedKey(userId), {});
  for (const chat of local) {
    if (chat.remoteOnly || chat.messages.length === 0) continue;
    if (synced[chat.id] === chat.updatedAt.getTime()) continue;
    try {
      if (await uploadChat(chat)) await markSynced(userId, chat);
    } catch (error) {
      if (error instanceof NoSessionError) return;
      console.warn('[CHAT_HISTORY] Upload failed, will retry on next sync:', error);
    }
  }
}

// ─── Store ──────────────────────────────────────────────────────────────────

type ServerState = 'idle' | 'loading' | 'ready' | 'offline' | 'unavailable';

interface ChatHistoryStoreState {
  savedChats: SavedChat[];
  remoteChats: SavedChat[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  serverState: ServerState;
  error: string | null;

  upsertChat: (
    chat: Omit<SavedChat, 'createdAt' | 'updatedAt'> & { id?: string }
  ) => Promise<string>;
  saveChat: (chat: Omit<SavedChat, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateChatTitle: (chatId: string, newTitle: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  loadChats: () => Promise<void>;
  loadMore: () => Promise<void>;
  getChatById: (chatId: string) => SavedChat | undefined;
  /** Full check, downloading it from the server if this phone only has the list entry. */
  fetchChat: (chatId: string) => Promise<SavedChat | undefined>;
  /** Clears this phone's copy (used on logout). The server copy is kept. */
  clearAllChats: () => Promise<void>;
}

let refreshInFlight: Promise<void> | null = null;

export const useChatHistoryStore = create<ChatHistoryStoreState>((set, get) => {
  const publish = (local: SavedChat[], remote = get().remoteChats) => {
    const remoteOnly = remote.filter((r) => !local.some((l) => l.id === r.id));
    set({ remoteChats: remoteOnly, savedChats: mergeLists(local, remoteOnly) });
  };

  const fetchPage = async (cursor: { createdAt: Date; serverId: string } | null) => {
    const rows = await callWithSession<ServerListItem[]>('gc_history_list', {
      p_before_created_at: cursor ? cursor.createdAt.toISOString() : null,
      p_before_id: cursor ? cursor.serverId : null,
      p_limit: PAGE_SIZE,
    });
    return rows || [];
  };

  // Server ids for paging, kept outside React state.
  let lastServerItem: { createdAt: Date; serverId: string } | null = null;

  const refreshFromServer = async () => {
    set({ serverState: 'loading' });
    try {
      const local = await readAllChatsFromDisk();
      await syncPending(local);

      const rows = await fetchPage(null);
      lastServerItem = rows.length
        ? { createdAt: new Date(rows[rows.length - 1].created_at), serverId: rows[rows.length - 1].id }
        : null;
      publish(await readAllChatsFromDisk(), rows.map(stubFromServer));
      set({ hasMore: rows.length === PAGE_SIZE, serverState: 'ready' });
    } catch (error) {
      if (error instanceof NoSessionError) {
        set({ serverState: 'unavailable', hasMore: false });
      } else {
        console.warn('[CHAT_HISTORY] Could not load History from the server:', error);
        set({ serverState: 'offline', hasMore: false });
      }
    }
  };

  return {
    savedChats: [],
    remoteChats: [],
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    serverState: 'idle',
    error: null,

    upsertChat: async (chatData) => {
      try {
        set({ isLoading: true, error: null });

        const persisted = await readAllChatsFromDisk();
        const now = new Date();
        const savedId = chatData.id || Crypto.randomUUID().toLowerCase();
        const index = persisted.findIndex((c) => c.id === savedId);
        let saved: SavedChat;

        if (index >= 0) {
          saved = { ...persisted[index], ...chatData, id: savedId, remoteOnly: false, updatedAt: now };
          persisted[index] = saved;
        } else {
          // A check downloaded from the server keeps its original date.
          const remote = get().remoteChats.find((c) => c.id === savedId);
          saved = {
            ...chatData,
            id: savedId,
            remoteOnly: false,
            createdAt: remote?.createdAt ?? now,
            updatedAt: now,
          };
          persisted.unshift(saved);
        }

        const sorted = persisted.sort(byNewest);
        await persistChatsToDisk(sorted);
        publish(sorted);
        set({ isLoading: false });

        void syncOne(saved);
        return savedId;
      } catch (error) {
        console.error('[CHAT_HISTORY] Error upserting chat:', error);
        set({ error: 'Failed to save chat', isLoading: false });
        throw error;
      }
    },

    saveChat: async (chatData) => {
      return get().upsertChat(chatData);
    },

    updateChatTitle: async (chatId, newTitle) => {
      try {
        const persisted = await readAllChatsFromDisk();
        const updatedChats = persisted.map((chat) =>
          chat.id === chatId ? { ...chat, title: newTitle, updatedAt: new Date() } : chat
        );
        await persistChatsToDisk(updatedChats);
        publish(updatedChats);
        const changed = updatedChats.find((c) => c.id === chatId);
        if (changed) void syncOne(changed);
      } catch (error) {
        console.error('Error updating chat title:', error);
        set({ error: 'Failed to update chat title' });
      }
    },

    deleteChat: async (chatId) => {
      try {
        set({ error: null });
        const persisted = await readAllChatsFromDisk();
        const updatedChats = persisted.filter((chat) => chat.id !== chatId);
        await persistChatsToDisk(updatedChats);
        publish(updatedChats, get().remoteChats.filter((c) => c.id !== chatId));

        const userId = await currentUserId();
        try {
          await callWithSession('gc_history_delete', { p_client_id: chatId });
        } catch (error) {
          if (userId && !(error instanceof NoSessionError)) {
            const pending = await readJson<string[]>(pendingDeletesKey(userId), []);
            await AsyncStorage.setItem(pendingDeletesKey(userId), JSON.stringify([...pending, chatId]));
          }
        }
      } catch (error) {
        console.error('Error deleting chat:', error);
        set({ error: 'Failed to delete chat' });
      }
    },

    loadChats: async () => {
      try {
        set({ isLoading: true, error: null });
        const chats = await readAllChatsFromDisk();
        await persistChatsToDisk(chats);
        publish(chats);
        set({ isLoading: false });
      } catch (error) {
        console.error('Error loading chats:', error);
        set({ error: 'Failed to load chats', isLoading: false });
      }

      // The phone's copy is shown at once; the server list and uploads follow in the background.
      if (!refreshInFlight) {
        refreshInFlight = refreshFromServer().finally(() => {
          refreshInFlight = null;
        });
      }
    },

    loadMore: async () => {
      const { hasMore, isLoadingMore } = get();
      if (!hasMore || isLoadingMore || !lastServerItem) return;
      set({ isLoadingMore: true });
      try {
        const page = await fetchPage(lastServerItem);
        if (page.length) {
          const last = page[page.length - 1];
          lastServerItem = { createdAt: new Date(last.created_at), serverId: last.id };
        }
        const remote = [...get().remoteChats, ...page.map(stubFromServer)];
        publish(await readAllChatsFromDisk(), remote);
        set({ hasMore: page.length === PAGE_SIZE, isLoadingMore: false });
      } catch (error) {
        console.warn('[CHAT_HISTORY] Could not load more History:', error);
        set({ isLoadingMore: false });
      }
    },

    getChatById: (chatId) => {
      return get().savedChats.find((chat) => chat.id === chatId);
    },

    fetchChat: async (chatId) => {
      const existing = get().savedChats.find((chat) => chat.id === chatId);
      if (existing && !existing.remoteOnly) return existing;
      try {
        const row = await callWithSession<ServerChat | null>('gc_history_get', { p_client_id: chatId });
        if (!row) return existing;
        const chat = chatFromServer(row);
        const persisted = await readAllChatsFromDisk();
        const next = [...persisted.filter((c) => c.id !== chat.id), chat].sort(byNewest);
        await persistChatsToDisk(next);
        const userId = await currentUserId();
        if (userId) await markSynced(userId, chat);
        publish(next);
        return chat;
      } catch (error) {
        console.warn('[CHAT_HISTORY] Could not download check:', error);
        return existing;
      }
    },

    clearAllChats: async () => {
      try {
        const storageKey = await getStorageKey();
        await AsyncStorage.removeItem(storageKey);
        await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
        lastServerItem = null;
        set({ savedChats: [], remoteChats: [], hasMore: false, serverState: 'idle' });
      } catch (error) {
        console.error('Error clearing chats:', error);
        set({ error: 'Failed to clear chats' });
      }
    },
  };
});
