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

interface ChatHistoryStoreState {
  savedChats: SavedChat[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  saveChat: (chat: Omit<SavedChat, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateChatTitle: (chatId: string, newTitle: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  loadChats: () => Promise<void>;
  getChatById: (chatId: string) => SavedChat | undefined;
  clearAllChats: () => Promise<void>;
}

// Get storage key specific to current user
const getStorageKey = async (): Promise<string> => {
  const userId = await AsyncStorage.getItem('user_id');
  return userId ? `gutcheck_saved_chats_${userId}` : 'gutcheck_saved_chats';
};

export const useChatHistoryStore = create<ChatHistoryStoreState>((set, get) => ({
  savedChats: [],
  isLoading: false,
  error: null,

  saveChat: async (chatData) => {
    try {
      set({ isLoading: true, error: null });
      
      const newChat: SavedChat = {
        ...chatData,
        id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const currentChats = get().savedChats;
      const updatedChats = [newChat, ...currentChats];
      
      const storageKey = await getStorageKey();
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedChats));
      
      set({ 
        savedChats: updatedChats,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error saving chat:', error);
      set({ 
        error: 'Failed to save chat',
        isLoading: false 
      });
    }
  },

  updateChatTitle: async (chatId, newTitle) => {
    try {
      set({ isLoading: true, error: null });
      
      const currentChats = get().savedChats;
      const updatedChats = currentChats.map(chat => 
        chat.id === chatId 
          ? { ...chat, title: newTitle, updatedAt: new Date() }
          : chat
      );
      
      const storageKey = await getStorageKey();
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedChats));
      
      set({ 
        savedChats: updatedChats,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error updating chat title:', error);
      set({ 
        error: 'Failed to update chat title',
        isLoading: false 
      });
    }
  },

  deleteChat: async (chatId) => {
    try {
      set({ isLoading: true, error: null });
      
      const currentChats = get().savedChats;
      const updatedChats = currentChats.filter(chat => chat.id !== chatId);
      
      const storageKey = await getStorageKey();
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedChats));
      
      set({ 
        savedChats: updatedChats,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      set({ 
        error: 'Failed to delete chat',
        isLoading: false 
      });
    }
  },

  loadChats: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const storageKey = await getStorageKey();
      const storedChats = await AsyncStorage.getItem(storageKey);
      
      if (storedChats) {
        const parsedChats = JSON.parse(storedChats).map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        
        set({ 
          savedChats: parsedChats,
          isLoading: false 
        });
      } else {
        set({ 
          savedChats: [],
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      set({ 
        error: 'Failed to load chats',
        isLoading: false 
      });
    }
  },

  getChatById: (chatId) => {
    return get().savedChats.find(chat => chat.id === chatId);
  },

  clearAllChats: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const storageKey = await getStorageKey();
      await AsyncStorage.removeItem(storageKey);
      
      set({ 
        savedChats: [],
        isLoading: false 
      });
    } catch (error) {
      console.error('Error clearing chats:', error);
      set({ 
        error: 'Failed to clear chats',
        isLoading: false 
      });
    }
  },
}));
