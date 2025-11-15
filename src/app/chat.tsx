/**
 * Chat Screen
 * Humanistic conversation interface for GutCheck
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { useConversationStore } from '@/lib/stores/conversationStore';
import { useAnalysisStore } from '@/lib/stores/analysisStore';
import { useChatHistoryStore } from '@/lib/stores/chatHistoryStore';
import { aiService } from '@/lib/ai';

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
  const scrollViewRef = useRef<ScrollView>(null);
  
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

  const handleNotificationResponse = async (title: string, body: string, type: string, chatPrompt?: string) => {
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

      // Update conversation state
      updateConversationState({ stage: response.nextStage });

    } catch (error) {
      console.error('Notification response error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const sendInitialMessage = async (message: string, hasImageFlag: boolean = false, imageData?: string) => {
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

      // Handle the conversation with image - pass updated conversation history
      const response = await handleConversation(
        userMessage,
        conversationState,
        updatedHistory,
        !!imageToSend,
        imageToSend || undefined
      );

      // Show typing animation FIRST, then add complete response in one box
      setIsStreaming(true);
      setStreamingMessage('');
      
      console.log('Starting typing animation for response');
      
      await simulateTyping(response.response, (text) => {
        setStreamingMessage(text);
      });
      
      // Clear streaming state and THEN add complete response to conversation history
      setIsStreaming(false);
      setStreamingMessage('');
      addAssistantResponse(response.response);
      
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
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
      maxWidth: '80%',
      padding: 12,
      borderRadius: 16,
    },
    userBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 4,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 20,
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
    disclaimerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 6,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    inputWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginHorizontal: 8,
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
      marginLeft: 8,
      padding: 8,
      backgroundColor: colors.primary,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
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
              } catch (error) {
                console.error('Error saving conversation:', error);
              }
            }
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>GutCheck</Text>
          <Text style={styles.subtitle}>Your relationship companion</Text>
        </View>
        <View style={styles.headerActions}>
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
                I'm here to help you understand what's happening in your relationships. 
                Ask follow up questions - I'll listen and help you figure things out.
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
          <Text style={styles.disclaimerText}>Disclaimer: This app is for guidance, not an authority. The final judgment will always lie with the user and or real world experts.</Text>
        </View>

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
    </SafeAreaView>
  );
}
