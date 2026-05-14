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
import { userHasPremiumAccess } from '@/lib/subscriptionAccess';
import { useSubscriptionStore } from '@/lib/stores/subscriptionStore';
import { NotificationStorageService } from '@/lib/notificationStorage';
import { BiometricSetupModal } from '@/components/BiometricSetupModal';
import { biometricAuthService } from '@/lib/biometricAuth';
import { useAppLock } from '@/contexts/AppLockContext';
import { BiometricLockScreen } from '@/components/BiometricLockScreen';
import ShareNudgeModal from '@/components/ShareNudgeModal';
import { shareNudgeService } from '@/lib/shareNudgeService';
import { SubscriptionGateModal } from '@/components/SubscriptionGateModal';
import ActionStepFollowUpModal from '@/components/ActionStepFollowUpModal';
import { actionStepTrackerService, type PendingActionStepFollowUp } from '@/lib/actionStepTrackerService';

export default function HomeScreen() {
  const [analysisText, setAnalysisText] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  const [showShareNudge, setShowShareNudge] = useState(false);
  const [showSubscriptionGate, setShowSubscriptionGate] = useState(false);
  const [pendingActionFollowUp, setPendingActionFollowUp] = useState<PendingActionStepFollowUp | null>(null);
  
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
  
  // App lock state - show lock screen when app is locked
  const { isLocked, shouldShowLock } = useAppLock();

  const quickPrompts = [
    "Someone made me feel guilty",
    "Someone asked me to keep a secret",
    "Someone says I can't tell anyone",
    "A friend is asking for money but something feels off",
    "A website is asking for my details to win a prize, should I share?"
  ];

  // Helper: check subscription and show/hide the gate modal accordingly.
  // Returns true if access is granted (so callers can chain work after it).
  const checkSubscriptionAccess = async (): Promise<boolean> => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const isLoggedIn = await AsyncStorage.getItem('is_logged_in');
      if (!userId || isLoggedIn !== 'true') return false;

      const hasAccess = await userHasPremiumAccess(userId);
      setShowSubscriptionGate(!hasAccess);
      return hasAccess;
    } catch (subError) {
      console.warn('[HOME] Subscription check error (denying access):', subError);
      setShowSubscriptionGate(true);
      return false;
    }
  };

  // Authentication + initial subscription check on mount
  useEffect(() => {
    shareNudgeService.startNewSession();
    const verifyAuth = async () => {
      try {
        console.log('[HOME] ==== AUTHENTICATION CHECK ====');

        const userId = await AsyncStorage.getItem('user_id');
        const isLoggedIn = await AsyncStorage.getItem('is_logged_in');

        if (!userId || isLoggedIn !== 'true') {
          console.log('[HOME] ❌ Not authenticated - redirecting to welcome');
          router.replace('/(auth)/welcome');
          return;
        }

        const hasAccess = await checkSubscriptionAccess();
        if (!hasAccess) {
          console.log('[HOME] No premium access — sending user to subscription');
          setIsCheckingSubscription(false);
          router.replace('/subscription');
          return;
        }

        console.log('[HOME] Auth + subscription check complete');
        setIsCheckingSubscription(false);

        // Check if user should see biometric setup prompt
        await checkBiometricSetupPrompt();
        await checkActionStepFollowUp();
      } catch (error) {
        console.error('[HOME] Error verifying authentication:', error);
        setIsCheckingSubscription(false);
        router.replace('/(auth)/welcome');
      }
    };

    verifyAuth();
  }, []);

  // Continuously re-check subscription every 90 seconds while this screen is mounted.
  // This catches mid-session expiry (e.g. trial ends while app is open).
  useEffect(() => {
    const interval = setInterval(async () => {
      const ok = await checkSubscriptionAccess();
      if (!ok) router.replace('/subscription');
    }, 90_000);
    return () => clearInterval(interval);
  }, []);

  const checkBiometricSetupPrompt = async () => {
    try {
      // Check if user has already seen this prompt
      const hasSeenPrompt = await AsyncStorage.getItem('_biometric_setup_prompt_shown');
      
      // Check if biometrics are already enabled
      const isBiometricEnabled = await biometricAuthService.isBiometricEnabled();
      
      // Check if biometrics are available on device
      const biometricAvailable = await biometricAuthService.isAvailable();
      
      console.log('[HOME] Biometric setup check:', {
        hasSeenPrompt,
        isBiometricEnabled,
        biometricAvailable
      });
      
      // Show prompt if:
      // 1. User hasn't seen it before
      // 2. Biometrics not already enabled
      // 3. Device supports biometrics
      if (!hasSeenPrompt && !isBiometricEnabled && biometricAvailable) {
        const bioType = await biometricAuthService.getBiometricType();
        setBiometricType(bioType);
        
        // Small delay to let screen load first
        setTimeout(() => {
          setShowBiometricModal(true);
        }, 1000);
      }
    } catch (error) {
      console.error('[HOME] Error checking biometric setup prompt:', error);
    }
  };

  const handleEnableBiometric = async () => {
    try {
      console.log('[HOME] User chose to enable biometric auth');
      
      // Get username and PIN - we need these to enable biometric auth
      const username = await AsyncStorage.getItem('username');
      const userId = await AsyncStorage.getItem('user_id');
      
      if (!username || !userId) {
        Alert.alert('Error', 'Unable to enable biometric authentication. Please try again from Settings.');
        setShowBiometricModal(false);
        await AsyncStorage.setItem('_biometric_setup_prompt_shown', 'true');
        return;
      }
      
      // Enable biometric authentication
      const result = await biometricAuthService.enableBiometricAuth(userId, username);
      
      if (result.success) {
        Alert.alert(
          'Success',
          `${biometricType} has been enabled. You'll be prompted to authenticate when you open GutChecks: Red Flags & Safety.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to enable biometric authentication.');
      }
      
      setShowBiometricModal(false);
      await AsyncStorage.setItem('_biometric_setup_prompt_shown', 'true');
    } catch (error) {
      console.error('[HOME] Error enabling biometric auth:', error);
      Alert.alert('Error', 'An error occurred. Please try again from Settings.');
      setShowBiometricModal(false);
      await AsyncStorage.setItem('_biometric_setup_prompt_shown', 'true');
    }
  };

  const handleSkipBiometric = async () => {
    console.log('[HOME] User skipped biometric setup');
    setShowBiometricModal(false);
    await AsyncStorage.setItem('_biometric_setup_prompt_shown', 'true');
  };

  // Handle when user returns from chat screen
  useFocusEffect(
    React.useCallback(() => {
      // Only reset if there's an ongoing conversation and we want to start fresh
      // Don't automatically reset - let the user decide when to start new conversations

      // Update unread notifications count when screen is focused
      loadUnreadCount();

      // Check if we should show share nudge
      checkActionStepFollowUp();
      if (!pendingActionFollowUp) {
        checkShareNudge();
      }
    }, [pendingActionFollowUp])
  );
  
  const loadUnreadCount = async () => {
    const count = await NotificationStorageService.getUnreadCount();
    setUnreadNotifications(count);
  };

  const checkShareNudge = async (source: 'focus' | 'action-followup' | 'hub-quiz' | 'post-query' = 'focus') => {
    if (pendingActionFollowUp) return;
    try {
      const deferred = await shareNudgeService.popDeferredTrigger();
      const triggerSource = (
        deferred === 'hub-quiz-complete'
          ? 'hub-quiz'
          : deferred === 'chat-session-complete'
            ? 'post-query'
            : source
      ) as 'focus' | 'action-followup' | 'hub-quiz' | 'post-query';

      // Check if we should show the share nudge
      const shouldShow = await shareNudgeService.shouldShowNudge();
      if (shouldShow) {
        console.log('[HOME] Share nudge trigger met, showing modal from:', triggerSource);
        // Small delay to avoid showing multiple modals at once
        setTimeout(() => {
          setShowShareNudge(true);
          // Mark as shown
          shareNudgeService.markNudgeShown();
        }, 500);
      }
    } catch (error) {
      console.error('[HOME] Error checking share nudge:', error);
    }
  };

  const checkActionStepFollowUp = async () => {
    try {
      const pending = await actionStepTrackerService.getPendingFollowUp();
      if (pending) {
        setPendingActionFollowUp(pending);
      }
    } catch (error) {
      console.error('[HOME] Error checking action step follow-up:', error);
    }
  };

  const handleSubmitActionFollowUp = async (payload: { selectedStepIndexes: number[]; barrierText?: string }) => {
    if (!pendingActionFollowUp) return;
    await actionStepTrackerService.submitFollowUp({
      sourceChatId: pendingActionFollowUp.sourceChatId,
      sourceChatUpdatedAt: pendingActionFollowUp.sourceChatUpdatedAt,
      selectedStepIndexes: payload.selectedStepIndexes,
      totalStepsPresented: pendingActionFollowUp.steps.length,
      barrierText: payload.barrierText,
      sourceCategory: pendingActionFollowUp.sourceCategory,
    });
    setPendingActionFollowUp(null);
    Alert.alert('Thanks for the feedback', 'This helps GutChecks improve practical guidance.');
    setTimeout(() => {
      checkShareNudge('action-followup');
    }, 250);
  };

  const handleSkipActionFollowUp = async () => {
    if (!pendingActionFollowUp) return;
    await actionStepTrackerService.skipFollowUp({
      sourceChatId: pendingActionFollowUp.sourceChatId,
      sourceChatUpdatedAt: pendingActionFollowUp.sourceChatUpdatedAt,
      totalStepsPresented: pendingActionFollowUp.steps.length,
    });
    setPendingActionFollowUp(null);
    setTimeout(() => {
      checkShareNudge('action-followup');
    }, 250);
  };


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
  
  // Show lock screen if app is locked (when returning from background)
  // Only show if user is authenticated and biometrics are enabled (handled by AppLockContext)
  if (isLocked && shouldShowLock) {
    return <BiometricLockScreen />;
  }
  
  // Show loading while checking subscription
  if (isCheckingSubscription) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={[styles.loadingText, { color: currentTheme.textSecondary, marginTop: 16 }]}>
          Checking subscription...
        </Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={require('../../../assets/new-gut-logo.jpeg')} 
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.headerTitleContainer}>
              <Text style={styles.appTitle}>GutChecks: Red Flags & Safety</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={currentTheme.textSecondary} />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge} />
            )}
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.greeting}>What situation would you like to check?</Text>
          <Text style={[styles.subGreeting, { color: currentTheme.textSecondary }]}>
            Share what happened or upload a screenshot for analysis
          </Text>
          
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
            <Text style={styles.promptsLabel}>Try asking:</Text>
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
        </ScrollView>
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

      {/* Biometric Setup Modal */}
      <BiometricSetupModal
        visible={showBiometricModal}
        biometricType={biometricType}
        onEnable={handleEnableBiometric}
        onSkip={handleSkipBiometric}
      />

      {/* Share Nudge Modal */}
      <ShareNudgeModal
        visible={showShareNudge}
        onClose={() => {
          shareNudgeService.markSessionDismissed();
          setShowShareNudge(false);
        }}
      />

      <ActionStepFollowUpModal
        visible={!!pendingActionFollowUp}
        steps={pendingActionFollowUp?.steps || []}
        onSubmit={handleSubmitActionFollowUp}
        onSkip={handleSkipActionFollowUp}
      />

      {/* Subscription Gate — blocks access when subscription has expired */}
      <SubscriptionGateModal
        visible={showSubscriptionGate}
        onAccessRestored={() => setShowSubscriptionGate(false)}
      />
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
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16, // py-4
    paddingHorizontal: 16, // p-4
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  headerLogo: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  headerTitleContainer: {
    flexDirection: 'column',
    flex: 1,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  notificationButton: {
    padding: 4,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#43B897',
  },
  mainContent: {
    paddingHorizontal: 16, // p-4
    gap: 24, // space-y-6
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'Inter',
    marginBottom: 8,
    lineHeight: 32,
  },
  subGreeting: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  textArea: {
    width: '100%',
    height: 148,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter',
    lineHeight: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  promptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  promptsLabel: {
    width: '100%',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'Inter',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  promptButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(79, 209, 199, 0.1)',
  },
  promptButtonSelected: {
    backgroundColor: 'rgba(79, 209, 199, 0.22)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
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
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  analyzeButtonDisabled: {
    backgroundColor: colors.surface,
    shadowOpacity: 0,
    elevation: 0,
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
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(79, 209, 199, 0.08)',
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
