import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
}

const LEGACY_STORAGE_KEY = 'gutcheck_saved_chats';

const getStorageKey = async (): Promise<string> => {
  const userId = await AsyncStorage.getItem('user_id');
  return userId ? `gutcheck_saved_chats_${userId}` : LEGACY_STORAGE_KEY;
};

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

/** Always read from disk and merge user + legacy keys so saves never wipe existing history. */
async function readAllChatsFromDisk(): Promise<SavedChat[]> {
  const userId = await AsyncStorage.getItem('user_id');
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

  return Array.from(byId.values()).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );
}

async function persistChatsToDisk(chats: SavedChat[]): Promise<void> {
  const storageKey = await getStorageKey();
  await AsyncStorage.setItem(storageKey, JSON.stringify(chats));
}

interface ChatHistoryStoreState {
  savedChats: SavedChat[];
  isLoading: boolean;
  error: string | null;

  upsertChat: (
    chat: Omit<SavedChat, 'createdAt' | 'updatedAt'> & { id?: string }
  ) => Promise<string>;
  saveChat: (chat: Omit<SavedChat, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateChatTitle: (chatId: string, newTitle: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  loadChats: () => Promise<void>;
  getChatById: (chatId: string) => SavedChat | undefined;
  clearAllChats: () => Promise<void>;
}

export const useChatHistoryStore = create<ChatHistoryStoreState>((set, get) => ({
  savedChats: [],
  isLoading: false,
  error: null,

  upsertChat: async (chatData) => {
    try {
      set({ isLoading: true, error: null });

      const persisted = await readAllChatsFromDisk();
      const now = new Date();
      let savedId: string;

      if (chatData.id) {
        const index = persisted.findIndex((c) => c.id === chatData.id);
        if (index >= 0) {
          persisted[index] = {
            ...persisted[index],
            ...chatData,
            id: chatData.id,
            updatedAt: now,
          };
          savedId = chatData.id;
        } else {
          const newChat: SavedChat = {
            ...chatData,
            id: chatData.id,
            createdAt: now,
            updatedAt: now,
          };
          persisted.unshift(newChat);
          savedId = chatData.id;
        }
      } else {
        savedId = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        const newChat: SavedChat = {
          ...chatData,
          id: savedId,
          createdAt: now,
          updatedAt: now,
        };
        persisted.unshift(newChat);
      }

      const sorted = persisted.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );

      await persistChatsToDisk(sorted);

      set({
        savedChats: sorted,
        isLoading: false,
      });

      console.log('[CHAT_HISTORY] Chat upserted:', {
        chatId: savedId,
        title: chatData.title,
        messageCount: chatData.messages.length,
        totalChats: sorted.length,
      });

      return savedId;
    } catch (error) {
      console.error('[CHAT_HISTORY] Error upserting chat:', error);
      set({
        error: 'Failed to save chat',
        isLoading: false,
      });
      throw error;
    }
  },

  saveChat: async (chatData) => {
    return get().upsertChat(chatData);
  },

  updateChatTitle: async (chatId, newTitle) => {
    try {
      set({ isLoading: true, error: null });

      const persisted = await readAllChatsFromDisk();
      const updatedChats = persisted.map((chat) =>
        chat.id === chatId ? { ...chat, title: newTitle, updatedAt: new Date() } : chat
      );

      await persistChatsToDisk(updatedChats);

      set({
        savedChats: updatedChats,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error updating chat title:', error);
      set({
        error: 'Failed to update chat title',
        isLoading: false,
      });
    }
  },

  deleteChat: async (chatId) => {
    try {
      set({ isLoading: true, error: null });

      const persisted = await readAllChatsFromDisk();
      const updatedChats = persisted.filter((chat) => chat.id !== chatId);

      await persistChatsToDisk(updatedChats);

      set({
        savedChats: updatedChats,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      set({
        error: 'Failed to delete chat',
        isLoading: false,
      });
    }
  },

  loadChats: async () => {
    try {
      set({ isLoading: true, error: null });

      const chats = await readAllChatsFromDisk();
      await persistChatsToDisk(chats);

      set({
        savedChats: chats,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading chats:', error);
      set({
        error: 'Failed to load chats',
        isLoading: false,
      });
    }
  },

  getChatById: (chatId) => {
    return get().savedChats.find((chat) => chat.id === chatId);
  },

  clearAllChats: async () => {
    try {
      set({ isLoading: true, error: null });

      const storageKey = await getStorageKey();
      await AsyncStorage.removeItem(storageKey);
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);

      set({
        savedChats: [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Error clearing chats:', error);
      set({
        error: 'Failed to clear chats',
        isLoading: false,
      });
    }
  },
}));
