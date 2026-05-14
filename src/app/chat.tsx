/**
 * Chat Screen
 * Humanistic conversation interface for GutChecks: Red Flags & Safety
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Modal,
  Dimensions,
  Animated,
  Linking,
  AppState,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Speech from 'expo-speech';
import type { Voice } from 'expo-speech';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { getThemeColors } from '@/lib/theme';
import { getAiDataUseConsentMessage } from '@/lib/externalUrls';
import { useTheme } from '@/lib/themeContext';
import { useConversationStore } from '@/lib/stores/conversationStore';
import { useAnalysisStore } from '@/lib/stores/analysisStore';
import { useChatHistoryStore } from '@/lib/stores/chatHistoryStore';
import { aiService, SAFEGUARD_READBACK_TEMPLATES } from '@/lib/ai';
import { shareNudgeService } from '@/lib/shareNudgeService';
import { revenueCatService } from '@/lib/revenueCatService';
import { getLifetimeProService } from '@/lib/lifetimeProService';
import { SubscriptionGateModal } from '@/components/SubscriptionGateModal';
import {
  filterCuratedTtsVoices,
  recognitionLangFromTtsLanguage,
  DEFAULT_VOICE_LOCALE,
} from '@/lib/voiceTtsCurated';
import { voiceSessionLogService } from '@/lib/voiceSessionLogService';

// Animated Typing Indicator Component
const AnimatedTypingIndicator = ({ colors }: { colors: any }) => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDots = () => {
      const createAnimation = (dot: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 600,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0.3,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
      };

      Animated.parallel([
        createAnimation(dot1, 0),
        createAnimation(dot2, 200),
        createAnimation(dot3, 400),
      ]).start();
    };

    animateDots();
  }, []);

  const indicatorStyles = {
    typingIndicator: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: 12,
      backgroundColor: colors.border,
      borderRadius: 16,
      maxWidth: '80%',
      marginBottom: 16,
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.textSecondary,
      marginHorizontal: 2,
    },
  };

  return (
    <View style={indicatorStyles.typingIndicator}>
      <Animated.View style={[indicatorStyles.typingDot, { opacity: dot1 }]} />
      <Animated.View style={[indicatorStyles.typingDot, { opacity: dot2 }]} />
      <Animated.View style={[indicatorStyles.typingDot, { opacity: dot3 }]} />
    </View>
  );
};

export default function ChatScreen() {
  const { 
    initialMessage, 
    hasImage, 
    fromNotification, 
    chatId, 
    isFromHistory, 
    imageData,
    notificationTitle,
    notificationBody,
    notificationType,
    chatPrompt
  } = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [showSubscriptionGate, setShowSubscriptionGate] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [voiceSilenceHint, setVoiceSilenceHint] = useState(false);
  const [autoReadBackEnabled, setAutoReadBackEnabled] = useState(false);
  const [readBackSpeed, setReadBackSpeed] = useState<'0.75x' | '1x' | '1.25x' | '1.5x' | '2x'>('1x');
  const [readBackLocale, setReadBackLocale] = useState(DEFAULT_VOICE_LOCALE);
  const [readBackVoiceId, setReadBackVoiceId] = useState<string | null>(null);
  const [curatedVoices, setCuratedVoices] = useState<Voice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceDisabledForSession, setVoiceDisabledForSession] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceBaseTextRef = useRef('');
  const pendingVoiceSendRef = useRef(false);
  const voiceSessionStartRef = useRef<number | null>(null);
  const voiceBreakPromptShownRef = useRef(false);
  const isRecordingVoiceRef = useRef(false);
  const voiceRecordStartMsRef = useRef<number | null>(null);
  
  const { 
    conversationState, 
    conversationHistory, 
    addUserMessage, 
    addAssistantResponse,
    updateConversationState,
    updateContextGathered,
    startNewConversation 
  } = useConversationStore();
  
  const { handleConversation, isLoading, error } = useAnalysisStore();
  const { saveChat, getChatById } = useChatHistoryStore();
  const VOICE_SETTINGS_KEY = '@voice_settings_v1';
  const VOICE_INPUT_RATIONALE_KEY = '@chat_voice_input_rationale_v1';
  const HUB_AGE_BAND_KEY = '@awareness_hub_age_band_v1';

  const resetVoiceSilenceTimer = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    setVoiceSilenceHint(false);
    silenceTimeoutRef.current = setTimeout(() => {
      if (isRecordingVoice) {
        setVoiceSilenceHint(true);
      }
    }, 5000);
  };

  const stopReadback = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const maybePromptVoiceBreak = () => {
    if (!voiceSessionStartRef.current || voiceBreakPromptShownRef.current) return;
    const elapsedMs = Date.now() - voiceSessionStartRef.current;
    if (elapsedMs >= 15 * 60 * 1000) {
      voiceBreakPromptShownRef.current = true;
      Alert.alert(
        'Take a short break',
        'You have been in voice mode for a while. Consider stepping away briefly or speaking with a trusted person.'
      );
    }
  };

  const getSpeechRate = () => {
    const map = {
      '0.75x': 0.38,
      '1x': 0.5,
      '1.25x': 0.62,
      '1.5x': 0.72,
      '2x': 0.9,
    } as const;
    return map[readBackSpeed];
  };

  // Helper: check subscription and show/hide the blocking gate modal.
  const checkSubscriptionAccess = async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const isLoggedIn = await AsyncStorage.getItem('is_logged_in');

      if (!userId || isLoggedIn !== 'true') {
        router.replace('/(auth)/welcome');
        return;
      }

      const lifetimeProService = getLifetimeProService();
      const isLifetimePro = await lifetimeProService.checkUserLifetimeProStatus(userId);
      if (isLifetimePro) {
        setShowSubscriptionGate(false);
        return;
      }

      const hasActive = await revenueCatService.hasActiveSubscription();
      setShowSubscriptionGate(!hasActive);
      if (!hasActive) console.log('[CHAT] ❌ Subscription expired — showing gate modal');
      else console.log('[CHAT] ✅ Subscription verified');
    } catch (error) {
      // Allow access on error so paying users are not locked out when RevenueCat is temporarily down
      console.warn('[CHAT] Subscription check error (allowing access):', error);
    }
  };

  // Check on mount
  useEffect(() => {
    checkSubscriptionAccess();
  }, []);

  useEffect(() => {
    isRecordingVoiceRef.current = isRecordingVoice;
  }, [isRecordingVoice]);

  useEffect(() => {
    const loadVoiceSettings = async () => {
      try {
        const raw = await AsyncStorage.getItem(VOICE_SETTINGS_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as {
          autoReadBackEnabled?: boolean;
          readBackSpeed?: '0.75x' | '1x' | '1.25x' | '1.5x' | '2x';
          readBackLocale?: string;
          readBackVoiceId?: string | null;
        };
        setAutoReadBackEnabled(!!parsed.autoReadBackEnabled);
        if (parsed.readBackSpeed) setReadBackSpeed(parsed.readBackSpeed);
        if (parsed.readBackLocale) setReadBackLocale(parsed.readBackLocale);
        if (parsed.readBackVoiceId !== undefined) setReadBackVoiceId(parsed.readBackVoiceId);
      } catch {
        // Ignore settings read failures
      }
    };
    loadVoiceSettings();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(
      VOICE_SETTINGS_KEY,
      JSON.stringify({
        autoReadBackEnabled,
        readBackSpeed,
        readBackLocale,
        readBackVoiceId,
      })
    ).catch(() => {});
  }, [autoReadBackEnabled, readBackSpeed, readBackLocale, readBackVoiceId]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState !== 'active') {
        stopReadback();
        return;
      }
      try {
        const mic = await ExpoSpeechRecognitionModule.getMicrophonePermissionsAsync();
        if (!mic.granted && isRecordingVoiceRef.current) {
          ExpoSpeechRecognitionModule.abort();
          setIsRecordingVoice(false);
          setVoiceSilenceHint(false);
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
          Alert.alert(
            'Microphone turned off',
            'Microphone access was revoked or restricted. Voice capture stopped; you can keep chatting in text.'
          );
        }
      } catch {
        /* ignore */
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!showVoiceSettings) return;
    let cancelled = false;
    (async () => {
      try {
        const all = await Speech.getAvailableVoicesAsync();
        if (!cancelled) setCuratedVoices(filterCuratedTtsVoices(all));
      } catch {
        if (!cancelled) setCuratedVoices([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showVoiceSettings]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isRecordingVoice || isSpeaking) {
        maybePromptVoiceBreak();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [isRecordingVoice, isSpeaking]);

  // Re-check every 90 seconds while the chat screen is open (catches mid-session expiry)
  useEffect(() => {
    const interval = setInterval(() => {
      checkSubscriptionAccess();
    }, 90_000);
    return () => clearInterval(interval);
  }, []);

  // Handle loading saved chat or initial message
  useEffect(() => {
    if (isFromHistory === 'true' && chatId) {
      // Load saved chat
      const savedChat = getChatById(chatId as string);
      if (savedChat) {
        console.log('Loading saved chat:', {
          chatId,
          messageCount: savedChat.messages.length,
          messages: savedChat.messages.map(m => ({ role: m.role, contentLength: m.content.length }))
        });
        
        // Load the saved conversation by setting the entire history at once
        const { conversationHistory: _, ...rest } = useConversationStore.getState();
        useConversationStore.setState({
          conversationHistory: savedChat.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          conversationState: {
            ...rest.conversationState,
            stage: 'support'
          }
        });
      }
    } else if (fromNotification === 'true' && notificationTitle && notificationBody) {
      // Handle notification-triggered conversation
      console.log('Starting conversation from notification:', {
        title: notificationTitle,
        body: notificationBody,
        type: notificationType
      });
      handleNotificationResponse(notificationTitle, notificationBody, notificationType, chatPrompt);
    } else if (initialMessage && typeof initialMessage === 'string') {
      // Handle new conversation - always start fresh if we have an initial message
      console.log('Starting new conversation with initial message:', initialMessage);
      const imageFlag = hasImage === 'true';
      const imageUri = imageData as string | undefined;
      console.log('Image data from params:', {
        hasImage,
        imageData: imageUri ? imageUri.substring(0, 50) + '...' : 'none',
        imageFlag
      });
      sendInitialMessage(initialMessage, imageFlag, imageUri);
    }
  }, [initialMessage, hasImage, chatId, isFromHistory]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [conversationHistory]);

  useSpeechRecognitionEvent('start', () => {
    voiceRecordStartMsRef.current = Date.now();
    void voiceSessionLogService.append({
      at: new Date().toISOString(),
      action: 'record_start',
    });
    setIsRecordingVoice(true);
    resetVoiceSilenceTimer();
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript || '';
    const nextText = [voiceBaseTextRef.current, transcript].filter(Boolean).join(' ').trim();
    setMessage(nextText);
    resetVoiceSilenceTimer();
  });

  useSpeechRecognitionEvent('volumechange', (event) => {
    setVoiceLevel(Math.max(0, Math.min(1, (event.value + 2) / 12)));
    if (event.value > 0) {
      resetVoiceSilenceTimer();
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    voiceRecordStartMsRef.current = null;
    setIsRecordingVoice(false);
    setVoiceSilenceHint(false);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      Alert.alert(
        'Voice input unavailable',
        'Speech recognition or the microphone is not available. You can keep using text.'
      );
      return;
    }
    Alert.alert('Voice input unavailable', event.message || 'Voice recognition could not continue.');
  });

  useSpeechRecognitionEvent('end', () => {
    const started = voiceRecordStartMsRef.current;
    voiceRecordStartMsRef.current = null;
    void voiceSessionLogService.append({
      at: new Date().toISOString(),
      action: 'record_end',
      durationMs: started ? Date.now() - started : undefined,
    });
    setIsRecordingVoice(false);
    setVoiceSilenceHint(false);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (pendingVoiceSendRef.current) {
      pendingVoiceSendRef.current = false;
      setTimeout(() => {
        sendMessage();
      }, 120);
    }
  });

  const handleNotificationResponse = async (title: string, body: string, type: string, chatPrompt?: string) => {
    const aiConsentKey = 'ai_disclosure_accepted';
    const accepted = await AsyncStorage.getItem(aiConsentKey);
    if (accepted !== 'true') {
      return new Promise<void>((resolve) => {
        Alert.alert(
          'Data Use & Privacy',
          getAiDataUseConsentMessage(),
          [
            { text: 'Decline', style: 'cancel', onPress: () => resolve() },
            {
              text: 'Accept',
              onPress: async () => {
                await AsyncStorage.setItem(aiConsentKey, 'true');
                resolve();
                handleNotificationResponse(title, body, type, chatPrompt);
              },
            },
          ]
        );
      });
    }

    setIsTyping(true);

    try {
      console.log('handleNotificationResponse called with:', {
        title,
        body,
        type,
        chatPrompt
      });

      // Use the AI service's notification handler
      const response = await aiService.handleNotificationResponse(
        title,
        body,
        type,
        chatPrompt
      );

      // Add assistant response
      addAssistantResponse(response.response);

      if (response.safeguardCategory && response.safeguardCategory !== 'D') {
        setVoiceDisabledForSession(true);
      }
      if (autoReadBackEnabled) {
        startReadback(response.response, {
          safeguardCategory:
            response.safeguardCategory && response.safeguardCategory !== 'D'
              ? response.safeguardCategory
              : undefined,
        });
      }

      // Update conversation state
      updateConversationState({ stage: response.nextStage });

    } catch (error) {
      console.error('Notification response error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const isUnder18User = async (): Promise<boolean> => {
    const hubBand = await AsyncStorage.getItem(HUB_AGE_BAND_KEY);
    if (hubBand && (hubBand.includes('Junior') || hubBand.includes('Teen (13-15)') || hubBand.includes('Older Teen (16-17)'))) {
      return true;
    }
    const ageRange = await AsyncStorage.getItem('user_age_range');
    if (!ageRange) return false;
    const firstNumber = Number((ageRange.match(/\d+/) || [])[0]);
    return Number.isFinite(firstNumber) && firstNumber < 18;
  };

  const handleToggleAutoReadBack = async (enabled: boolean) => {
    if (!enabled) {
      setAutoReadBackEnabled(false);
      return;
    }
    if (await isUnder18User()) {
      Alert.alert(
        'Enable read-back?',
        'Auto read-back is off by default. For users under 18, please confirm you want voice read-back enabled.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: () => setAutoReadBackEnabled(true) },
        ]
      );
      return;
    }
    setAutoReadBackEnabled(true);
  };

  const startReadback = (text: string, opts?: { safeguardCategory?: 'A' | 'B' | 'C' }) => {
    stopReadback();
    const cat = opts?.safeguardCategory;
    let tts = text;
    if (cat === 'A' || cat === 'B' || cat === 'C') {
      tts = SAFEGUARD_READBACK_TEMPLATES[cat];
    }
    void voiceSessionLogService.append({
      at: new Date().toISOString(),
      action: 'readback_start',
      ...(cat ? { safeguardCategory: cat } : {}),
    });
    setIsSpeaking(true);
    Speech.speak(tts, {
      rate: getSpeechRate(),
      language: readBackLocale,
      ...(readBackVoiceId ? { voice: readBackVoiceId } : {}),
      onDone: () => {
        setIsSpeaking(false);
        void voiceSessionLogService.append({ at: new Date().toISOString(), action: 'readback_end' });
      },
      onStopped: () => {
        setIsSpeaking(false);
        void voiceSessionLogService.append({ at: new Date().toISOString(), action: 'readback_end' });
      },
      onError: () => {
        setIsSpeaking(false);
        void voiceSessionLogService.append({ at: new Date().toISOString(), action: 'readback_end' });
      },
    });
  };

  const ensureVoiceInputRationale = async (): Promise<boolean> => {
    try {
      const seen = await AsyncStorage.getItem(VOICE_INPUT_RATIONALE_KEY);
      if (seen === 'true') return true;
    } catch {
      /* continue to prompt */
    }
    return new Promise((resolve) => {
      Alert.alert(
        'Voice input',
        'GutChecks turns what you say into text on your device so you can review and send it. Audio is processed by your phone\'s speech service (for example Apple or Google), not stored by GutChecks as a voice recording. You can always type instead.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Continue',
            onPress: async () => {
              try {
                await AsyncStorage.setItem(VOICE_INPUT_RATIONALE_KEY, 'true');
              } catch {
                /* ignore */
              }
              resolve(true);
            },
          },
        ]
      );
    });
  };

  const startVoiceInput = async () => {
    if (voiceDisabledForSession) {
      Alert.alert(
        'Voice temporarily disabled',
        'Voice input is disabled for this session after a sensitive safety response. Text mode is still available.'
      );
      return;
    }
    if (!(await ensureVoiceInputRationale())) {
      return;
    }
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone permission required', 'Enable microphone and speech permissions to use voice input.');
        return;
      }
      if (isSpeaking) stopReadback();
      voiceBaseTextRef.current = message.trim();
      if (!voiceSessionStartRef.current) {
        voiceSessionStartRef.current = Date.now();
        voiceBreakPromptShownRef.current = false;
      }
      setVoiceSilenceHint(false);
      setVoiceLevel(0);
      ExpoSpeechRecognitionModule.start({
        lang: recognitionLangFromTtsLanguage(readBackLocale),
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        addsPunctuation: true,
      });
    } catch {
      Alert.alert('Voice input unavailable', 'Could not start voice capture on this device.');
    }
  };

  const stopVoiceInput = () => {
    pendingVoiceSendRef.current = false;
    ExpoSpeechRecognitionModule.stop();
  };

  const sendVoiceInput = () => {
    pendingVoiceSendRef.current = true;
    ExpoSpeechRecognitionModule.stop();
  };

  const sendInitialMessage = async (message: string, hasImageFlag: boolean = false, imageData?: string) => {
    // Guideline 5.1.1/5.1.2: Same AI consent before sending to third party
    const aiConsentKey = 'ai_disclosure_accepted';
    const accepted = await AsyncStorage.getItem(aiConsentKey);
    if (accepted !== 'true') {
      return new Promise<void>((resolve) => {
        Alert.alert(
          'Data Use & Privacy',
          getAiDataUseConsentMessage(),
          [
            { text: 'Decline', style: 'cancel', onPress: () => resolve() },
            {
              text: 'Accept',
              onPress: async () => {
                await AsyncStorage.setItem(aiConsentKey, 'true');
                resolve();
                sendInitialMessage(message, hasImageFlag, imageData);
              },
            },
          ]
        );
      });
    }

    setIsTyping(true);

    try {
      console.log('sendInitialMessage called with:', {
        message: message.substring(0, 50) + '...',
        hasImageFlag,
        imageData: imageData ? imageData.substring(0, 50) + '...' : 'none'
      });

      // Add user message to conversation
      addUserMessage(message, imageData);

      // Update conversation state with image context
      updateConversationState({ 
        hasImage: hasImageFlag,
        imageAnalyzed: hasImageFlag 
      });

      // Get the updated conversation history after adding the user message
      const updatedHistory = useConversationStore.getState().conversationHistory;
      console.log('Updated conversation history:', {
        messageCount: updatedHistory.length,
        lastMessage: updatedHistory[updatedHistory.length - 1]?.content?.substring(0, 50) + '...',
        hasImageInLastMessage: !!updatedHistory[updatedHistory.length - 1]?.imageUri
      });

      // Handle the conversation - pass updated conversation history
      const response = await handleConversation(
        message,
        conversationState,
        updatedHistory,
        hasImageFlag,
        imageData
      );

      // Add assistant response
      addAssistantResponse(response.response);

      if (response.safeguardCategory && response.safeguardCategory !== 'D') {
        setVoiceDisabledForSession(true);
      }
      if (autoReadBackEnabled) {
        startReadback(response.response, {
          safeguardCategory:
            response.safeguardCategory && response.safeguardCategory !== 'D'
              ? response.safeguardCategory
              : undefined,
        });
      }

      // Update conversation state
      updateConversationState({ stage: response.nextStage });

      // Update context based on user message (basic extraction)
      updateContextFromMessage(message);

    } catch (error) {
      console.error('Initial message error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() && !uploadedImage) return;

    // Guideline 5.1.1/5.1.2: Disclose AI data use and get consent before sending to third party
    const aiConsentKey = 'ai_disclosure_accepted';
    const accepted = await AsyncStorage.getItem(aiConsentKey);
    if (accepted !== 'true') {
      return new Promise<void>((resolve) => {
        Alert.alert(
          'Data Use & Privacy',
          getAiDataUseConsentMessage(),
          [
            { text: 'Decline', style: 'cancel', onPress: () => resolve() },
            {
              text: 'Accept',
              onPress: async () => {
                await AsyncStorage.setItem(aiConsentKey, 'true');
                resolve();
                sendMessage(); // Retry send after consent
              },
            },
          ]
        );
      });
    }

    const userMessage = message.trim() || (uploadedImage ? '[Image attached]' : '');
    const imageToSend = uploadedImage; // Store image before clearing
    
    setMessage('');
    setUploadedImage(null); // Clear uploaded image immediately after capturing it
    setIsTyping(true);

    try {
      // Add user message to conversation with image if present
      addUserMessage(userMessage, imageToSend || undefined);
      
      // Log image attachment for debugging
      if (imageToSend) {
        console.log('Image successfully attached to message:', imageToSend.substring(0, 50) + '...');
      }

      // Update conversation state with image context if there's an image
      if (imageToSend) {
        updateConversationState({ 
          hasImage: true,
          imageAnalyzed: true 
        });
      }

      // Get the updated conversation history after adding the user message
      const updatedHistory = useConversationStore.getState().conversationHistory;

      const useLiveStream = !imageToSend;
      let streamedAny = false;

      if (useLiveStream) {
        setIsStreaming(true);
        setStreamingMessage('');
      }

      const response = await handleConversation(
        userMessage,
        conversationState,
        updatedHistory,
        !!imageToSend,
        imageToSend || undefined,
        useLiveStream
          ? (chunk) => {
              streamedAny = true;
              setStreamingMessage(chunk);
            }
          : undefined
      );

      if (useLiveStream && !streamedAny && response.response) {
        await simulateTyping(response.response, (text) => {
          setStreamingMessage(text);
        });
      } else if (!useLiveStream && response.response) {
        setIsStreaming(true);
        setStreamingMessage('');
        await simulateTyping(response.response, (text) => {
          setStreamingMessage(text);
        });
      }

      setIsStreaming(false);
      setStreamingMessage('');
      addAssistantResponse(response.response);

      if (response.safeguardCategory && response.safeguardCategory !== 'D') {
        setVoiceDisabledForSession(true);
      }
      if (autoReadBackEnabled) {
        startReadback(response.response, {
          safeguardCategory:
            response.safeguardCategory && response.safeguardCategory !== 'D'
              ? response.safeguardCategory
              : undefined,
        });
      }
      
      console.log('Added complete response to conversation history');

      // Update conversation state
      updateConversationState({ stage: response.nextStage });

      // Update context based on user message (basic extraction)
      updateContextFromMessage(userMessage);

      // Clear uploaded image after sending
      setUploadedImage(null);

    } catch (error) {
      console.error('Chat error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  const updateContextFromMessage = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Extract relationship type
    if (lowerMessage.includes('boyfriend') || lowerMessage.includes('bf')) {
      updateContextGathered({ relationshipType: 'boyfriend' });
    } else if (lowerMessage.includes('girlfriend') || lowerMessage.includes('gf')) {
      updateContextGathered({ relationshipType: 'girlfriend' });
    } else if (lowerMessage.includes('friend')) {
      updateContextGathered({ relationshipType: 'friend' });
    } else if (lowerMessage.includes('family') || lowerMessage.includes('parent')) {
      updateContextGathered({ relationshipType: 'family' });
    }

    // Extract duration
    if (lowerMessage.includes('months')) {
      updateContextGathered({ duration: 'months' });
    } else if (lowerMessage.includes('years')) {
      updateContextGathered({ duration: 'years' });
    } else if (lowerMessage.includes('weeks')) {
      updateContextGathered({ duration: 'weeks' });
    }

    // Extract incident info
    if (lowerMessage.includes('happened') || lowerMessage.includes('said') || lowerMessage.includes('did')) {
      updateContextGathered({ specificIncident: true });
    }

    // Extract emotional impact
    if (lowerMessage.includes('feel') || lowerMessage.includes('felt') || lowerMessage.includes('upset') || lowerMessage.includes('angry') || lowerMessage.includes('sad')) {
      updateContextGathered({ emotionalImpact: true });
    }

    // Extract pattern history
    if (lowerMessage.includes('always') || lowerMessage.includes('every time') || lowerMessage.includes('often') || lowerMessage.includes('usually')) {
      updateContextGathered({ patternHistory: true });
    }
  };

  const startNewChat = () => {
    // Start a fresh conversation, clear image, and navigate to home
    startNewConversation();
    setUploadedImage(null);
    setVoiceDisabledForSession(false);
    voiceSessionStartRef.current = null;
    voiceBreakPromptShownRef.current = false;
    stopReadback();
    router.push('/(tabs)/');
  };

  // Function to simulate character-by-character typing animation
  const simulateTyping = async (message: string, onUpdate: (text: string) => void) => {
    let currentText = '';
    
    for (let i = 0; i < message.length; i++) {
      currentText += message[i];
      onUpdate(currentText);
      
      // Much faster typing speed - reduced delays significantly
      const char = message[i];
      let delay = 10; // Much faster base delay (was 30)
      
      if (char === ' ') {
        delay = 15; // Slightly longer pause for spaces (was 50)
      } else if (char === '.' || char === '!' || char === '?') {
        delay = 50; // Shorter pause for sentence endings (was 200)
      } else if (char === ',' || char === ';') {
        delay = 25; // Shorter pause for commas (was 100)
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Scroll to bottom periodically
      if (i % 20 === 0) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 10);
      }
    }
  };

  const saveCurrentChat = async () => {
    if (conversationHistory.length === 0) {
      Alert.alert('No conversation to save', 'Start a conversation first before saving.');
      return;
    }

    // Don't save if this is a loaded conversation from history
    if (isFromHistory === 'true') {
      Alert.alert('Already Saved', 'This conversation is already saved in your history.');
      return;
    }

    // Generate a title from the first user message
    const firstUserMessage = conversationHistory.find(msg => msg.role === 'user');
    const title = firstUserMessage?.content.substring(0, 30) + (firstUserMessage?.content.length > 30 ? '...' : '') || 'Untitled Conversation';

    try {
      await saveChat({
        title,
        messages: conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date()
        })),
        hasImage: conversationState.hasImage || false,
        analysisData: {
          patterns: [], // Will be populated when analysis is done
          severity: 'unknown',
          riskLevel: 'unknown'
        }
      });

      // Increment chat session count for share nudge tracking
      await shareNudgeService.incrementChatCount();
      await shareNudgeService.requestDeferredTrigger('chat-session-complete');
      console.log('[CHAT] Chat saved and session count incremented for share nudge');

      Alert.alert('Chat Saved', 'Your conversation has been saved to history.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save conversation. Please try again.');
    }
  };

  // Image upload functions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your photos to upload images.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedImage(result.assets[0].uri);
        setShowUploadModal(false);
        console.log('Image selected from gallery:', result.assets[0].uri.substring(0, 50) + '...');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your camera to take photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedImage(result.assets[0].uri);
        setShowUploadModal(false);
        console.log('Photo taken successfully:', result.assets[0].uri.substring(0, 50) + '...');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('Document picked:', {
          uri: result.assets[0].uri,
          mimeType: result.assets[0].mimeType,
          name: result.assets[0].name,
          size: result.assets[0].size
        });
        
        // Handle both images and PDFs
        if (result.assets[0].mimeType?.startsWith('image/') || result.assets[0].mimeType === 'application/pdf') {
          setUploadedImage(result.assets[0].uri);
        } else {
          Alert.alert('Document Type', 'Please select an image or PDF file.');
        }
        setShowUploadModal(false);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
  };

  // Function to render text with bold formatting and clickable phone numbers
  const renderFormattedText = (text: string, textStyle: any) => {
    // First split by bold markers, then check each part for phone numbers
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    
    return (
      <Text style={textStyle}>
        {boldParts.map((part, index) => {
          // Handle bold text
          if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            
            // Check if bold text contains a phone number - improved regex
            const phoneRegex = /(\d{3,4}\s?\d{3,4}\s?\d{3,4}|\d{4}\s?\d{4}|\d{5}\s?\d{6})/g;
            const phoneParts = boldText.split(phoneRegex);
            
            return (
              <Text key={index} style={[textStyle, { fontWeight: 'bold' }]}>
                {phoneParts.map((phonePart, phoneIndex) => {
                  // Test if this part matches the phone regex
                  if (phoneRegex.test(phonePart)) {
                    // Make phone number clickable
                    const phoneNumber = phonePart.replace(/\s/g, '');
                    return (
                      <Text
                        key={phoneIndex}
                        style={[textStyle, { fontWeight: 'bold', color: '#4A90E2', textDecorationLine: 'underline' }]}
                        onPress={() => {
                          try {
                            // Clean and format the phone number for dialing
                            const dialNumber = phoneNumber.replace(/[^\d]/g, '');
                            Alert.alert(
                              'Call Helpline',
                              `This will dial ${phonePart}. Continue?`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { 
                                  text: 'Call', 
                                  onPress: () => {
                                    try {
                                      Linking.openURL(`tel:${dialNumber}`);
                                    } catch (error) {
                                      console.error('Error opening phone dialer:', error);
                                      Alert.alert('Error', 'Unable to open phone dialer. Please try calling manually.');
                                    }
                                  }
                                }
                              ]
                            );
                          } catch (error) {
                            console.error('Error handling phone number:', error);
                            Alert.alert('Error', 'Unable to process phone number. Please try calling manually.');
                          }
                        }}
                      >
                        {phonePart}
                      </Text>
                    );
                  }
                  return phonePart;
                })}
              </Text>
            );
          }
          
          // Check regular text for phone numbers - improved regex for UK numbers
          const phoneRegex = /(\d{3,4}\s?\d{3,4}\s?\d{3,4}|\d{4}\s?\d{4}|\d{5}\s?\d{6}|\d{3}\s?\d{3}\s?\d{4}|\d{2}\s?\d{4}\s?\d{4})/g;
          const phoneParts = part.split(phoneRegex);
          
          return phoneParts.map((phonePart, phoneIndex) => {
            // Test if this part matches the phone regex
            if (phoneRegex.test(phonePart)) {
              // Make phone number clickable
              const phoneNumber = phonePart.replace(/\s/g, '');
              return (
                <Text
                  key={`${index}-${phoneIndex}`}
                  style={[textStyle, { color: '#4A90E2', textDecorationLine: 'underline' }]}
                  onPress={() => {
                    try {
                      // Clean and format the phone number for dialing
                      const dialNumber = phoneNumber.replace(/[^\d]/g, '');
                      Alert.alert(
                        'Call Helpline',
                        `This will dial ${phonePart}. Continue?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Call', 
                            onPress: () => {
                              try {
                                Linking.openURL(`tel:${dialNumber}`);
                              } catch (error) {
                                console.error('Error opening phone dialer:', error);
                                Alert.alert('Error', 'Unable to open phone dialer. Please try calling manually.');
                              }
                            }
                          }
                        ]
                      );
                    } catch (error) {
                      console.error('Error handling phone number:', error);
                      Alert.alert('Error', 'Unable to process phone number. Please try calling manually.');
                    }
                  }}
                >
                  {phonePart}
                </Text>
              );
            }
            return phonePart;
          });
        })}
      </Text>
    );
  };

  const renderMessage = (msg: {role: 'user' | 'assistant', content: string, imageUri?: string}, index: number) => {
    const isUser = msg.role === 'user';
    
    // Check if message contains analysis link
    const hasAnalysisLink = msg.content.includes('[View Analysis]');
    let displayContent = msg.content;
    
    if (hasAnalysisLink) {
      // Split content to separate the link
      const parts = msg.content.split('[View Analysis]');
      displayContent = parts[0];
    }
    
    return (
      <View key={index} style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.assistantMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble
        ]}>
          {/* Display image if present */}
          {msg.imageUri && isUser && (
            <View style={styles.messageImageContainer}>
              <Image source={{ uri: msg.imageUri }} style={styles.messageImage} />
            </View>
          )}
          
          {renderFormattedText(displayContent, [
            styles.messageText,
            isUser ? styles.userText : styles.assistantText
          ])}
          
          {/* Analysis Link Button */}
          {hasAnalysisLink && !isUser && (
            <TouchableOpacity 
              style={styles.analysisLinkButton}
              onPress={() => router.push('/analysis-results')}
            >
              <Text style={styles.analysisLinkText}>📊 View Analysis</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Dynamic styles based on theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    newChatButton: {
      padding: 8,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    saveButton: {
      padding: 8,
    },
    welcomeContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    welcomeTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginTop: 16,
      marginBottom: 12,
      textAlign: 'center',
    },
    welcomeText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    chatContainer: {
      flex: 1,
    },
    messagesContainer: {
      flex: 1,
      padding: 16,
      paddingBottom: 20,
    },
    messageContainer: {
      marginBottom: 16,
    },
    userMessage: {
      alignItems: 'flex-end',
    },
    assistantMessage: {
      alignItems: 'flex-start',
    },
    messageBubble: {
      maxWidth: '82%',
      padding: 14,
      borderRadius: 22,
    },
    userBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 6,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 3,
    },
    assistantBubble: {
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
    },
    messageText: {
      fontSize: 15,
      lineHeight: 22,
    },
    userText: {
      color: '#FFFFFF',
    },
    assistantText: {
      color: colors.textPrimary,
    },
    userMessageText: {
      color: '#FFFFFF',
    },
    assistantMessageText: {
      color: colors.text,
    },
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 14,
      backgroundColor: 'rgba(79, 209, 199, 0.12)',
      borderRadius: 22,
      borderBottomLeftRadius: 6,
      maxWidth: '45%',
      marginBottom: 16,
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginHorizontal: 3,
    },
    disclaimerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      paddingBottom: 12,
      backgroundColor: colors.background,
    },
    disclaimerText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 6,
      fontStyle: 'italic',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.07,
      shadowRadius: 10,
      elevation: 8,
    },
    inputWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 26,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginHorizontal: 6,
    },
    uploadButton: {
      padding: 8,
      marginRight: 8,
    },
    attachButton: {
      padding: 8,
      marginRight: 8,
    },
    imagePreviewContainer: {
      position: 'relative',
      marginRight: 8,
    },
    imagePreview: {
      width: 40,
      height: 40,
      borderRadius: 8,
    },
    removeImageButton: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: colors.error,
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    textInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      maxHeight: 100,
    },
    sendButton: {
      marginLeft: 4,
      backgroundColor: colors.primary,
      borderRadius: 24,
      width: 46,
      height: 46,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    sendButtonDisabled: {
      backgroundColor: colors.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    voiceButton: {
      marginLeft: 2,
      marginRight: 2,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    voiceRecordingBanner: {
      marginHorizontal: 12,
      marginBottom: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 10,
    },
    voiceRecordingText: {
      color: colors.textPrimary,
      fontSize: 13,
      marginTop: 8,
    },
    voiceHintText: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 6,
    },
    voiceLevelTrack: {
      width: '100%',
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 6,
      overflow: 'hidden',
    },
    voiceLevelFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 6,
    },
    voiceActionRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 10,
    },
    voiceActionBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: colors.background,
    },
    voiceActionText: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
    readbackBar: {
      marginHorizontal: 12,
      marginBottom: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 10,
    },
    readbackText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '600',
    },
    voiceSettingsContent: {
      padding: 16,
      gap: 12,
    },
    voiceSettingsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    voiceSettingsLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    voiceSettingsHint: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    speedRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 6,
    },
    speedChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: colors.background,
    },
    speedChipText: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
    voiceScroll: {
      maxHeight: 200,
      marginTop: 6,
    },
    errorContainer: {
      marginTop: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.error,
      backgroundColor: `${colors.error}22`,
      padding: 10,
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      lineHeight: 18,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    uploadModal: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 40,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    uploadOptions: {
      padding: 20,
    },
    uploadOptionsContainer: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 20,
      width: '80%',
      maxWidth: 300,
    },
    uploadOptionsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    uploadOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.border,
      borderRadius: 12,
      marginBottom: 12,
    },
    uploadOptionText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
    cancelButton: {
      padding: 12,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    imagePreviewModal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closePreviewButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 1,
    },
    fullImagePreview: {
      width: '100%',
      height: '100%',
    },
    messageImageContainer: {
      marginBottom: 8,
      borderRadius: 8,
      overflow: 'hidden',
    },
    messageImage: {
      width: 200,
      height: 150,
      borderRadius: 8,
    },
    analysisLinkButton: {
      marginTop: 8,
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: `${colors.primary}22`,
      borderWidth: 1,
      borderColor: `${colors.primary}66`,
    },
    analysisLinkText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    imageModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.92)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageModalClose: {
      position: 'absolute',
      top: 44,
      right: 20,
      zIndex: 2,
      padding: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={async () => {
            // Only save if this is a new conversation (not loaded from history)
            if (conversationHistory.length > 0 && isFromHistory !== 'true') {
              try {
                const firstUserMessage = conversationHistory.find(msg => msg.role === 'user');
                const title = firstUserMessage?.content.substring(0, 30) + (firstUserMessage?.content.length > 30 ? '...' : '') || 'Untitled Conversation';

                await saveChat({
                  title,
                  messages: conversationHistory.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    timestamp: new Date()
                  })),
                  hasImage: conversationState.hasImage || false,
                  analysisData: {
                    patterns: [],
                    severity: 'unknown',
                    riskLevel: 'unknown'
                  }
                });
                console.log('[CHAT] Conversation auto-saved successfully');
              } catch (error) {
                console.error('[CHAT] Error auto-saving conversation:', error);
                // Don't block navigation if save fails - user can manually save if needed
              }
            }
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>GutChecks: Red Flags & Safety</Text>
          <Text style={styles.subtitle}>Check the situation, not the feeling</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.saveButton} onPress={() => setShowVoiceSettings(true)}>
            <Ionicons name="volume-high-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={saveCurrentChat}>
            <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.newChatButton} onPress={startNewChat}>
            <Ionicons name="add" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustContentInsets={false}
        >
          {conversationHistory.length === 0 && (
            <View style={styles.welcomeContainer}>
              <Ionicons name="chatbubbles" size={48} color={colors.primary} />
              <Text style={styles.welcomeTitle}>Hey there! 👋</Text>
              <Text style={styles.welcomeText}>
                GutChecks helps you understand what is happening in everyday interactions and relationships.
                Ask follow up questions to get practical guidance and next steps.
              </Text>
            </View>
          )}

          {conversationHistory.map(renderMessage)}

          {/* Streaming message display */}
          {isStreaming && streamingMessage && (
            <View style={[styles.messageContainer, styles.assistantMessage]}>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                {renderFormattedText(streamingMessage, styles.messageText)}
                <AnimatedTypingIndicator colors={colors} />
              </View>
            </View>
          )}

          {isLoading && !isStreaming && (
            <View style={[styles.messageContainer, styles.assistantMessage]}>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <AnimatedTypingIndicator colors={colors} />
              </View>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Image Preview */}
        {uploadedImage && (
          <View style={styles.imagePreviewContainer}>
            <TouchableOpacity onPress={() => setShowImagePreview(true)}>
              <Image source={{ uri: uploadedImage }} style={styles.imagePreview} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {isRecordingVoice && (
          <View style={styles.voiceRecordingBanner}>
            <View style={styles.voiceLevelTrack}>
              <View style={[styles.voiceLevelFill, { width: `${Math.max(10, voiceLevel * 100)}%` }]} />
            </View>
            <Text style={styles.voiceRecordingText}>Listening... Tap Stop or Send when ready.</Text>
            {voiceSilenceHint && (
              <Text style={styles.voiceHintText}>Still listening. Tap Stop or Send when ready.</Text>
            )}
            <View style={styles.voiceActionRow}>
              <TouchableOpacity style={styles.voiceActionBtn} onPress={stopVoiceInput}>
                <Text style={styles.voiceActionText}>Stop</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.voiceActionBtn} onPress={sendVoiceInput}>
                <Text style={styles.voiceActionText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isSpeaking && (
          <View style={styles.readbackBar}>
            <Text style={styles.readbackText}>Read-back active</Text>
            <View style={styles.voiceActionRow}>
              <TouchableOpacity style={styles.voiceActionBtn} onPress={stopReadback}>
                <Text style={styles.voiceActionText}>Mute/Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.voiceActionBtn} onPress={stopReadback}>
                <Text style={styles.voiceActionText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => setShowUploadModal(true)}
              disabled={isLoading}
            >
              <Ionicons 
                name="add-circle-outline" 
                size={24} 
                color={isLoading ? colors.textSecondary : colors.primary} 
              />
            </TouchableOpacity>
            
            <TextInput
              style={styles.textInput}
              placeholder="Ask follow up"
              placeholderTextColor={colors.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              editable={!isLoading}
            />

            <TouchableOpacity
              style={styles.voiceButton}
              onPress={startVoiceInput}
              disabled={isLoading || isRecordingVoice}
            >
              <Ionicons
                name={isRecordingVoice ? 'mic' : 'mic-outline'}
                size={20}
                color={voiceDisabledForSession ? colors.textSecondary : colors.primary}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.sendButton,
                ((!message.trim() && !uploadedImage) || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={(!message.trim() && !uploadedImage) || isLoading}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={(message.trim() || uploadedImage) && !isLoading ? 'white' : colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.disclaimerText}>GutChecks is a guidance tool, not a counsellor, therapist, friend, or crisis service. If you are in danger, call 999. For confidential support, see the help options in the chat.</Text>
        </View>

        <Modal
          visible={showVoiceSettings}
          transparent
          animationType="slide"
          onRequestClose={() => setShowVoiceSettings(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.uploadModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Voice settings</Text>
                <TouchableOpacity onPress={() => setShowVoiceSettings(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.voiceSettingsContent}>
                <View style={styles.voiceSettingsRow}>
                  <Text style={styles.voiceSettingsLabel}>Auto read-back</Text>
                  <Switch
                    value={autoReadBackEnabled}
                    onValueChange={handleToggleAutoReadBack}
                    trackColor={{ false: colors.border, true: `${colors.primary}99` }}
                    thumbColor={autoReadBackEnabled ? colors.primary : '#f4f3f4'}
                  />
                </View>
                <Text style={styles.voiceSettingsHint}>
                  Off by default. If this session triggered a sensitive safeguarding template, voice input is disabled for the rest of the session.
                </Text>
                <Text style={styles.voiceSettingsLabel}>Read-back speed</Text>
                <View style={styles.speedRow}>
                  {(['0.75x', '1x', '1.25x', '1.5x', '2x'] as const).map((speed) => (
                    <TouchableOpacity
                      key={speed}
                      onPress={() => setReadBackSpeed(speed)}
                      style={[
                        styles.speedChip,
                        readBackSpeed === speed && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                    >
                      <Text style={[styles.speedChipText, readBackSpeed === speed && { color: '#fff' }]}>{speed}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.voiceSettingsLabel}>Read-back language</Text>
                <Text style={styles.voiceSettingsHint}>
                  English voices only for this release. Speech recognition follows this language.
                </Text>
                <View style={styles.speedRow}>
                  {(['en-GB', 'en-US', 'en-AU'] as const).map((loc) => (
                    <TouchableOpacity
                      key={loc}
                      onPress={() => {
                        setReadBackLocale(loc);
                        setReadBackVoiceId((prev) => {
                          if (!prev) return null;
                          const v = curatedVoices.find((x) => x.identifier === prev);
                          if (!v) return null;
                          const l = (v.language || '').toLowerCase();
                          return l.startsWith(loc.toLowerCase()) ? prev : null;
                        });
                      }}
                      style={[
                        styles.speedChip,
                        readBackLocale === loc && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                    >
                      <Text style={[styles.speedChipText, readBackLocale === loc && { color: '#fff' }]}>{loc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.voiceSettingsLabel}>Read-back voice (curated)</Text>
                <Text style={styles.voiceSettingsHint}>
                  Neutral, English-only list. Founder review may narrow options before wider release.
                </Text>
                <ScrollView style={styles.voiceScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  <View style={styles.speedRow}>
                    <TouchableOpacity
                      onPress={() => setReadBackVoiceId(null)}
                      style={[
                        styles.speedChip,
                        readBackVoiceId === null && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                    >
                      <Text style={[styles.speedChipText, readBackVoiceId === null && { color: '#fff' }]}>
                        System default
                      </Text>
                    </TouchableOpacity>
                    {curatedVoices
                      .filter((v) => (v.language || '').toLowerCase().startsWith(readBackLocale.toLowerCase()))
                      .map((v) => (
                        <TouchableOpacity
                          key={v.identifier}
                          onPress={() => {
                            setReadBackVoiceId(v.identifier);
                            const raw = (v.language || DEFAULT_VOICE_LOCALE).replace('_', '-');
                            const parts = raw.split('-');
                            const loc =
                              parts.length >= 2
                                ? `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`
                                : DEFAULT_VOICE_LOCALE;
                            setReadBackLocale(loc);
                          }}
                          style={[
                            styles.speedChip,
                            readBackVoiceId === v.identifier && {
                              backgroundColor: colors.primary,
                              borderColor: colors.primary,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.speedChipText,
                              readBackVoiceId === v.identifier && { color: '#fff' },
                            ]}
                            numberOfLines={2}
                          >
                            {v.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>

        {/* Upload Options Modal */}
        <Modal
          visible={showUploadModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowUploadModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.uploadModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Media</Text>
                <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.uploadOptions}>
                <TouchableOpacity style={styles.uploadOption} onPress={pickImage}>
                  <Ionicons name="image-outline" size={32} color={colors.primary} />
                  <Text style={styles.uploadOptionText}>Choose from Library</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.uploadOption} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={32} color={colors.primary} />
                  <Text style={styles.uploadOptionText}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.uploadOption} onPress={pickDocument}>
                  <Ionicons name="document-outline" size={32} color={colors.primary} />
                  <Text style={styles.uploadOptionText}>Choose Document</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Image Preview Modal */}
        <Modal
          visible={showImagePreview && !!uploadedImage}
          transparent
          animationType="fade"
          onRequestClose={() => setShowImagePreview(false)}
        >
          <View style={styles.imageModalOverlay}>
            <TouchableOpacity 
              style={styles.imageModalClose}
              onPress={() => setShowImagePreview(false)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            {uploadedImage && (
              <Image 
                source={{ uri: uploadedImage }} 
                style={styles.fullImagePreview}
                resizeMode="contain"
              />
            )}
          </View>
        </Modal>
      </KeyboardAvoidingView>

      {/* Subscription Gate — blocks access when subscription has expired */}
      <SubscriptionGateModal
        visible={showSubscriptionGate}
        onAccessRestored={() => setShowSubscriptionGate(false)}
      />
    </SafeAreaView>
  );
}
