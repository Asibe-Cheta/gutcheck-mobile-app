/**
 * Conversation Store
 * Manages conversation state and flow for humanistic interactions
 */

import { create } from 'zustand';
import { ConversationState } from '@/lib/ai';
import type { CrisisCardPayload, SafeguardCategory, PatternResponsePayload } from '@/lib/ai';
import type { SupportPlan } from '@/lib/supportRules';

export type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
  imageUri?: string;
  crisisCard?: CrisisCardPayload;
  patternCard?: PatternResponsePayload;
  safeguardCategory?: SafeguardCategory;
  /** Support cards shown under this result (service IDs only, PRD 12.6). */
  support?: SupportPlan;
};

interface ConversationStore {
  conversationState: ConversationState;
  conversationHistory: ConversationMessage[];
  
  // Actions
  startNewConversation: () => void;
  addUserMessage: (message: string, imageUri?: string) => void;
  addAssistantResponse: (
    response: string,
    meta?: {
      crisisCard?: CrisisCardPayload;
      patternCard?: PatternResponsePayload;
      safeguardCategory?: SafeguardCategory;
      support?: SupportPlan;
    }
  ) => void;
  updateConversationState: (newState: Partial<ConversationState>) => void;
  updateContextGathered: (context: Partial<ConversationState['contextGathered']>) => void;
  reset: () => void;
}

const initialConversationState: ConversationState = {
  stage: 'initial',
  messagesExchanged: 0,
  hasImage: false,
  imageAnalyzed: false,
  contextGathered: {
    relationshipType: undefined,
    duration: undefined,
    specificIncident: false,
    emotionalImpact: false,
    patternHistory: false,
  }
};

export const useConversationStore = create<ConversationStore>((set, get) => ({
  conversationState: initialConversationState,
  conversationHistory: [],

  startNewConversation: () => {
    set({
      conversationState: initialConversationState,
      conversationHistory: []
    });
  },

  addUserMessage: (message: string, imageUri?: string) => {
    const { conversationHistory, conversationState } = get();
    
    // Add user message to history with optional image
    const updatedHistory = [...conversationHistory, { 
      role: 'user', 
      content: message,
      imageUri: imageUri 
    }];
    
    console.log('Adding user message:', {
      messageLength: message.length,
      hasImage: !!imageUri,
      totalMessages: updatedHistory.length,
      lastMessage: updatedHistory[updatedHistory.length - 1]?.content?.substring(0, 50) + '...'
    });
    
    // Update messages exchanged count
    const updatedState = {
      ...conversationState,
      messagesExchanged: conversationState.messagesExchanged + 1
    };
    
    set({
      conversationHistory: updatedHistory,
      conversationState: updatedState
    });
  },

  addAssistantResponse: (response, meta) => {
    const { conversationHistory } = get();
    
    const updatedHistory: ConversationMessage[] = [
      ...conversationHistory,
      {
        role: 'assistant',
        content: response,
        crisisCard: meta?.crisisCard,
        patternCard: meta?.patternCard,
        safeguardCategory: meta?.safeguardCategory,
        support: meta?.support,
      },
    ];
    
    console.log('Adding assistant response:', {
      responseLength: response.length,
      totalMessages: updatedHistory.length,
      lastMessage: updatedHistory[updatedHistory.length - 1]?.content?.substring(0, 50) + '...'
    });
    
    set({
      conversationHistory: updatedHistory
    });
  },

  updateConversationState: (newState: Partial<ConversationState>) => {
    const { conversationState } = get();
    
    set({
      conversationState: {
        ...conversationState,
        ...newState
      }
    });
  },

  updateContextGathered: (context: Partial<ConversationState['contextGathered']>) => {
    const { conversationState } = get();
    
    set({
      conversationState: {
        ...conversationState,
        contextGathered: {
          ...conversationState.contextGathered,
          ...context
        }
      }
    });
  },

  reset: () => {
    set({
      conversationState: initialConversationState,
      conversationHistory: []
    });
  }
}));
