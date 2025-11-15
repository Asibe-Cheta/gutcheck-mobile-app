/**
 * Home Screen (Main Analysis)
 * Custom design based on provided HTML with improvements
 * Core feature for relationship analysis
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Keyboard, TouchableWithoutFeedback, ActivityIndicator, Image, Modal, Dimensions, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { Button } from '@/components/ui/Button';
import { useAnalysisStore } from '@/lib/stores/analysisStore';
import { useConversationStore } from '@/lib/stores/conversationStore';
import { useChatHistoryStore } from '@/lib/stores/chatHistoryStore';
import { revenueCatService } from '@/lib/revenueCatService';
import { getLifetimeProService } from '@/lib/lifetimeProService';
import { useSubscriptionStore } from '@/lib/stores/subscriptionStore';

export default function HomeScreen() {
  const [analysisText, setAnalysisText] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Get subscription state from store (synchronous check)
  const { subscription, isLifetimePro } = useSubscriptionStore();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  
  const { isDark } = useTheme();
  const currentTheme = getThemeColors(isDark);
  const analysisStore = useAnalysisStore();
  const { conversationHistory, startNewConversation } = useConversationStore();
  const { saveChat } = useChatHistoryStore();
  // const { checkLifetimePro } = useSubscriptionStore();

  const quickPrompts = [
    "Someone made me feel guilty",
    "Confusing conversation today", 
    "New person in my life"
  ];

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        // FIRST: Check permanent bypass flag - if set, user has active subscription
        const hasActiveFlag = await AsyncStorage.getItem('_has_active_subscription');
        if (hasActiveFlag === 'true') {
          console.log('[HOME] ✅ Permanent subscription flag found - user has active subscription');
          setIsCheckingSubscription(false);
          return;
        }
        
        // SECOND: Check store state synchronously - if subscription exists, trust it completely
        const storeState = useSubscriptionStore.getState();
        if (storeState.subscription || storeState.isLifetimePro) {
          console.log('[HOME] ✅ Subscription found in store - no RevenueCat check needed');
          // Set permanent flag for future visits
          await AsyncStorage.setItem('_has_active_subscription', 'true');
          setIsCheckingSubscription(false);
          return;
        }
        
        // THIRD: Check temporary skip flag
        const skipCheck = await AsyncStorage.getItem('_skip_sub_check');
        if (skipCheck === 'true') {
          console.log('[HOME] Skipping subscription check - coming from subscription screen');
          await AsyncStorage.removeItem('_skip_sub_check');
          // Set permanent flag
          await AsyncStorage.setItem('_has_active_subscription', 'true');
          setIsCheckingSubscription(false);
          return;
        }
        
        // Add a LONGER delay to ensure navigation and native bridge are fully ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const userId = await AsyncStorage.getItem('user_id');
        if (!userId) {
          console.log('[HOME] No user ID, redirecting to subscription');
          await AsyncStorage.setItem('_sub_nav_from_home', 'true');
          router.replace('/subscription-wrapper');
          return;
        }
        
        // Check lifetime pro first
        const lifetimeProStatus = await getLifetimeProService().checkUserLifetimeProStatus(userId);
        if (lifetimeProStatus) {
          console.log('[HOME] User has lifetime pro, allowing access');
          setIsCheckingSubscription(false);
          return;
        }
        
        // Check RevenueCat subscription with retry logic
        await revenueCatService.initialize(userId);
        
        // Try checking subscription up to 3 times with delays (handles sync delays)
        let hasActiveSubscription = false;
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          hasActiveSubscription = await revenueCatService.hasActiveSubscription();
          
          if (hasActiveSubscription) {
            console.log('[HOME] User has active subscription, allowing access');
            setIsCheckingSubscription(false);
            return;
          }
          
          console.log(`[HOME] Subscription check attempt ${attempt + 1} - not active yet`);
        }
        
        // After all retries, if still no subscription, redirect
        console.log('[HOME] User does not have active subscription after retries, redirecting to subscription screen');
        await AsyncStorage.setItem('_sub_nav_from_home', 'true');
        router.replace('/subscription-wrapper');
        setIsCheckingSubscription(false);
      } catch (error) {
        console.error('[HOME] Error checking subscription:', error);
        // On error, redirect to subscription to be safe
        await AsyncStorage.setItem('_sub_nav_from_home', 'true');
        router.replace('/subscription-wrapper');
        setIsCheckingSubscription(false);
      }
    };
    
    checkSubscription();
  }, []);

  // Handle when user returns from chat screen
  useFocusEffect(
    React.useCallback(() => {
      // Only reset if there's an ongoing conversation and we want to start fresh
      // Don't automatically reset - let the user decide when to start new conversations
    }, [])
  );


  // Reset form when conversation is cleared
  useEffect(() => {
    if (conversationHistory.length === 0) {
      setAnalysisText('');
      setSelectedPrompt(null);
      setUploadedImage(null);
      setIsAnalyzing(false);
    }
  }, [conversationHistory.length]);


  const handlePromptSelect = (prompt: string) => {
    setSelectedPrompt(prompt);
    setAnalysisText(prompt);
  };

  // Image upload functions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload images.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

    if (!result.canceled && result.assets[0]) {
      setUploadedImage(result.assets[0].uri);
      setShowUploadModal(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadedImage(result.assets[0].uri);
      setShowUploadModal(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('Document picked from home screen:', {
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
    setShowImagePreview(false);
  };

  const handleAnalyze = async () => {
    if (!analysisText.trim() && !uploadedImage) {
      Alert.alert('Input Required', 'Please describe what happened, how someone made you feel, or upload an image/document.');
      return;
    }
    
    try {
      setIsAnalyzing(true);
      console.log('Starting conversation with:', analysisText || 'Image upload');
      
      // CRITICAL: Start a fresh conversation before navigating
      startNewConversation();
      
      // Navigate to chat with the initial message and image
      router.push({
        pathname: '/chat',
        params: { 
          initialMessage: analysisText || 'I uploaded an image to analyze',
          hasImage: uploadedImage ? 'true' : 'false',
          imageData: uploadedImage || undefined
        }
      });
      
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    } finally {
      // Always reset the analyzing state
      setIsAnalyzing(false);
    }
  };

  const styles = createStyles(currentTheme);
  
  // Show loading while checking subscription or onboarding
  if (isCheckingSubscription || isCheckingOnboarding) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={[styles.loadingText, { color: currentTheme.textSecondary, marginTop: 16 }]}>
          {isCheckingSubscription ? 'Checking subscription...' : 'Loading...'}
        </Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={isDark ? require('../../../assets/gc-dark.png') : require('../../../assets/gc-white.png')} 
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.appTitle}>Home</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.greeting}>How can I help you today?</Text>
          
          {/* Analysis Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Describe what happened or how someone made you feel..."
              placeholderTextColor={currentTheme.textSecondary}
              value={analysisText}
              onChangeText={setAnalysisText}
              multiline
              textAlignVertical="top"
              maxLength={1000}
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={Keyboard.dismiss}
            />
            
            {/* Image Preview */}
            {uploadedImage && (
              <View style={styles.imagePreviewContainer}>
                <TouchableOpacity 
                  style={styles.imagePreview}
                  onPress={() => setShowImagePreview(true)}
                >
                  <Image source={{ uri: uploadedImage }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={removeImage}
                  >
                    <Ionicons name="close-circle" size={24} color={currentTheme.error} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Upload Button */}
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => setShowUploadModal(true)}
            >
              <Ionicons name="attach" size={20} color={currentTheme.textSecondary} />
              <Text style={styles.uploadButtonText}>
                {uploadedImage ? 'Change attachment' : 'Attach image or document'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Prompts */}
          <View style={styles.promptsContainer}>
            {quickPrompts.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.promptButton,
                  selectedPrompt === prompt && styles.promptButtonSelected
                ]}
                onPress={() => handlePromptSelect(prompt)}
              >
                <Text style={[
                  styles.promptText,
                  selectedPrompt === prompt && styles.promptTextSelected
                ]}>
                  {prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Analyze Button */}
          <TouchableOpacity
            style={[styles.analyzeButton, (!analysisText.trim() && !uploadedImage || isAnalyzing) && styles.analyzeButtonDisabled]}
            onPress={handleAnalyze}
            disabled={(!analysisText.trim() && !uploadedImage) || isAnalyzing}
            activeOpacity={0.8}
          >
            {isAnalyzing ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color={currentTheme.background} size="small" />
                <Text style={styles.analyzeButtonText}>Starting Chat...</Text>
              </View>
            ) : (
              <Text style={styles.analyzeButtonText}>Start Conversation</Text>
            )}
          </TouchableOpacity>
        </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Upload Options Modal */}
      <Modal
        visible={showUploadModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUploadModal(false)}
        >
          <View style={styles.uploadModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Attachment</Text>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <Ionicons name="close" size={24} color={currentTheme.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.uploadOptions}>
              <TouchableOpacity style={styles.uploadOption} onPress={pickImage}>
                <Ionicons name="image-outline" size={24} color={currentTheme.primary} />
                <Text style={styles.uploadOptionText}>Choose from Library</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.uploadOption} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={24} color={currentTheme.primary} />
                <Text style={styles.uploadOptionText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.uploadOption} onPress={pickDocument}>
                <Ionicons name="document-outline" size={24} color={currentTheme.primary} />
                <Text style={styles.uploadOptionText}>Choose Document</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
      >
        <TouchableOpacity 
          style={styles.imageModalOverlay}
          activeOpacity={1}
          onPress={() => setShowImagePreview(false)}
        >
          <View style={styles.imageModalClose}>
            <TouchableOpacity onPress={() => setShowImagePreview(false)}>
              <Ionicons name="close" size={32} color={currentTheme.background} />
            </TouchableOpacity>
          </View>
          {uploadedImage && (
            <Image 
              source={{ uri: uploadedImage }} 
              style={styles.fullImagePreview}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    maxWidth: 400, // max-w-md
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16, // py-4
    paddingHorizontal: 16, // p-4
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 43,
    height: 43,
  },
  appTitle: {
    fontSize: 20, // text-xl
    fontWeight: '700', // font-bold
    color: colors.textPrimary,
    fontFamily: 'Inter',
  },
  settingsButton: {
    padding: 4,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16, // p-4
    gap: 24, // space-y-6
  },
  greeting: {
    fontSize: 24, // text-2xl
    fontWeight: '700', // font-bold
    color: colors.textPrimary,
    fontFamily: 'Inter',
  },
  inputContainer: {
    marginBottom: 16,
  },
  textArea: {
    width: '100%',
    height: 192, // h-48
    padding: 16, // p-4
    borderRadius: 8, // rounded-lg
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    color: colors.textPrimary,
    fontSize: 16, // text-base
    fontFamily: 'Inter',
    lineHeight: 24,
  },
  promptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8, // gap-2
    marginBottom: 16,
  },
  promptButton: {
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
    borderRadius: 20, // rounded-full
    backgroundColor: 'rgba(79, 209, 199, 0.1)', // bg-primary/10
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 199, 0.2)',
  },
  promptButtonSelected: {
    backgroundColor: 'rgba(79, 209, 199, 0.2)', // bg-primary/20
    borderColor: colors.primary,
  },
  promptText: {
    fontSize: 14, // text-sm
    fontWeight: '500', // font-medium
    color: colors.primary,
    fontFamily: 'Inter',
  },
  promptTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  analyzeButton: {
    width: '100%',
    paddingVertical: 16, // py-4
    borderRadius: 8, // rounded-lg
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeButtonDisabled: {
    backgroundColor: colors.surface,
    opacity: 0.5,
  },
  analyzeButtonText: {
    color: colors.background,
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    fontFamily: 'Inter',
  },
  // Image upload styles
  imagePreviewContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  imagePreview: {
    position: 'relative',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  uploadModal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: 'Inter',
  },
  uploadOptions: {
    gap: 12,
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  uploadOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: 'Inter',
  },
  // Image preview modal styles
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
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter',
  },
});
