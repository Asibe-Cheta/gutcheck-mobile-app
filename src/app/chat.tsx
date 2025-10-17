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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { theme } from '@/lib/theme';
import { useConversationStore } from '@/lib/stores/conversationStore';
import { useAnalysisStore } from '@/lib/stores/analysisStore';
import { useChatHistoryStore } from '@/lib/stores/chatHistoryStore';

// Animated Typing Indicator Component
const AnimatedTypingIndicator = () => {
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

  return (
    <View style={styles.typingIndicator}>
      <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
    </View>
  );
};

export default function ChatScreen() {
  const { initialMessage, hasImage, fromNotification, chatId, isFromHistory } = useLocalSearchParams();
  const router = useRouter();
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
    } else if (initialMessage && typeof initialMessage === 'string') {
      // Handle new conversation - always start fresh if we have an initial message
      console.log('Starting new conversation with initial message:', initialMessage);
      const imageFlag = hasImage === 'true';
      sendInitialMessage(initialMessage, imageFlag);
    }
  }, [initialMessage, hasImage, chatId, isFromHistory]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [conversationHistory]);

  const sendInitialMessage = async (message: string, hasImageFlag: boolean = false) => {
    setIsTyping(true);

    try {
      // Add user message to conversation
      addUserMessage(message);

      // Update conversation state with image context
      updateConversationState({ 
        hasImage: hasImageFlag,
        imageAnalyzed: hasImageFlag 
      });

      // Handle the conversation - pass raw conversation history
      const response = await handleConversation(
        message,
        conversationState,
        conversationHistory,
        hasImageFlag
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

      // Handle the conversation with image - pass raw conversation history
      const response = await handleConversation(
        userMessage,
        conversationState,
        conversationHistory,
        !!imageToSend
      );

      // Handle long responses with chunking and typing animation
      if (response.response.length > 200) {
        // Break the response into multiple chunks for separate message bubbles
        const chunks = chunkMessage(response.response, 150); // Smaller chunks for better UX
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          
          // Show typing animation for this chunk FIRST
          setIsStreaming(true);
          setStreamingMessage('');
          
          console.log('Starting typing animation for chunk:', i + 1, 'of', chunks.length);
          
          await simulateTyping(chunk, (text) => {
            setStreamingMessage(text);
          });
          
          // Clear streaming state and THEN add to conversation history
          setIsStreaming(false);
          setStreamingMessage('');
          addAssistantResponse(chunk);
          
          console.log('Added chunk to conversation history:', i + 1);
          
          // Small delay between chunks to make it feel natural
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } else {
        // For short responses, show typing animation FIRST
        setIsStreaming(true);
        setStreamingMessage('');
        
        console.log('Starting typing animation for short response');
        
        await simulateTyping(response.response, (text) => {
          setStreamingMessage(text);
        });
        
        // Clear streaming state and THEN add to conversation history
        setIsStreaming(false);
        setStreamingMessage('');
        addAssistantResponse(response.response);
        
        console.log('Added short response to conversation history');
      }

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

  // Function to chunk long messages into smaller parts
  const chunkMessage = (message: string, maxLength: number = 200): string[] => {
    if (message.length <= maxLength) {
      return [message];
    }
    
    const chunks: string[] = [];
    const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;
      
      if (currentChunk.length + trimmedSentence.length + 1 <= maxLength) {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk + '.');
          currentChunk = trimmedSentence;
        } else {
          chunks.push(trimmedSentence + '.');
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk + '.');
    }
    
    return chunks;
  };

  // Function to simulate character-by-character typing animation
  const simulateTyping = async (message: string, onUpdate: (text: string) => void) => {
    let currentText = '';
    
    for (let i = 0; i < message.length; i++) {
      currentText += message[i];
      onUpdate(currentText);
      
      // Variable typing speed - faster for spaces, slower for punctuation
      const char = message[i];
      let delay = 30; // Base delay
      
      if (char === ' ') {
        delay = 50; // Slightly longer pause for spaces
      } else if (char === '.' || char === '!' || char === '?') {
        delay = 200; // Longer pause for sentence endings
      } else if (char === ',' || char === ';') {
        delay = 100; // Medium pause for commas
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
        // For now, we'll handle images only
        if (result.assets[0].mimeType?.startsWith('image/')) {
          setUploadedImage(result.assets[0].uri);
        } else {
          Alert.alert('Document Type', 'Please select an image file for now.');
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

  // Function to render text with bold formatting
  const renderFormattedText = (text: string, textStyle: any) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return (
      <Text style={textStyle}>
        {parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            // Bold text
            const boldText = part.slice(2, -2);
            return (
              <Text key={index} style={[textStyle, { fontWeight: 'bold' }]}>
                {boldText}
              </Text>
            );
          }
          return part;
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

  return (
    <SafeAreaView style={styles.container}>
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
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>GutCheck</Text>
          <Text style={styles.subtitle}>Your relationship companion</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.saveButton} onPress={saveCurrentChat}>
            <Ionicons name="bookmark-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.newChatButton} onPress={startNewChat}>
            <Ionicons name="add" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {conversationHistory.length === 0 && (
            <View style={styles.welcomeContainer}>
              <Ionicons name="chatbubbles" size={48} color={theme.colors.primary} />
              <Text style={styles.welcomeTitle}>Hey there! 👋</Text>
              <Text style={styles.welcomeText}>
                I'm here to help you understand what's happening in your relationships. 
                Share what's on your mind - I'll listen and help you figure things out.
              </Text>
            </View>
          )}

          {conversationHistory.map(renderMessage)}

          {/* Streaming message display */}
          {isStreaming && streamingMessage && (
            <View style={[styles.messageContainer, styles.assistantMessage]}>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                {renderFormattedText(streamingMessage, styles.messageText)}
                <AnimatedTypingIndicator />
              </View>
            </View>
          )}

          {isLoading && !isStreaming && (
            <View style={[styles.messageContainer, styles.assistantMessage]}>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <AnimatedTypingIndicator />
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
              <Ionicons name="close-circle" size={24} color={theme.colors.warning} />
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
                color={isLoading ? theme.colors.textSecondary : theme.colors.primary} 
              />
            </TouchableOpacity>
            
            <TextInput
              style={styles.textInput}
              placeholder="What's on your mind?"
              placeholderTextColor={theme.colors.textSecondary}
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
                color={(message.trim() || uploadedImage) && !isLoading ? 'white' : theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
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
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.uploadOptions}>
                <TouchableOpacity style={styles.uploadOption} onPress={pickImage}>
                  <Ionicons name="image-outline" size={32} color={theme.colors.primary} />
                  <Text style={styles.uploadOptionText}>Choose from Library</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.uploadOption} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={32} color={theme.colors.primary} />
                  <Text style={styles.uploadOptionText}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.uploadOption} onPress={pickDocument}>
                  <Ionicons name="document-outline" size={32} color={theme.colors.primary} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glassBorder,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: 'Inter',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(79, 209, 199, 0.1)',
  },
  newChatButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(79, 209, 199, 0.1)',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 12,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter',
  },
  userText: {
    color: 'white',
  },
  assistantText: {
    color: theme.colors.textPrimary,
  },
  analysisLinkButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(79, 209, 199, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 199, 0.3)',
    alignItems: 'center',
  },
  analysisLinkText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textSecondary,
    marginHorizontal: 2,
  },
  errorContainer: {
    backgroundColor: theme.colors.warning + '20',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  errorText: {
    color: theme.colors.warning,
    fontSize: 14,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glassBorder,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontFamily: 'Inter',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.textSecondary + '30',
  },
  uploadButton: {
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  uploadModal: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glassBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter',
  },
  uploadOptions: {
    padding: 20,
    gap: 16,
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  uploadOptionText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginLeft: 16,
    fontFamily: 'Inter',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  fullImagePreview: {
    width: Dimensions.get('window').width * 0.9,
    height: Dimensions.get('window').height * 0.7,
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
