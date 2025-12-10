/**
 * Share Nudge Modal
 * Beautiful bottom sheet that encourages users to share GutCheck
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { shareNudgeService } from '@/lib/shareNudgeService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = 320;

interface ShareNudgeModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ShareNudgeModal({ visible, onClose }: ShareNudgeModalProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up and fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: SCREEN_HEIGHT - MODAL_HEIGHT,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleShare = async () => {
    try {
      // Get user ID for tracking
      const userId = await AsyncStorage.getItem('user_id');

      // Platform-specific share links
      const appStoreLink = 'https://apps.apple.com/app/gutcheck/id6738287794';
      const playStoreLink = 'https://play.google.com/store/apps/details?id=com.gutcheck.app';

      const shareMessage = Platform.OS === 'ios'
        ? `Check out GutCheck - your confidential ally for difficult situations. Get clarity and perspective when you need it most.\n\n${appStoreLink}`
        : `Check out GutCheck - your confidential ally for difficult situations. Get clarity and perspective when you need it most.\n\n${playStoreLink}`;

      const result = await Share.share({
        message: shareMessage,
        title: 'Share GutCheck',
      });

      if (result.action === Share.sharedAction) {
        console.log('[ShareNudge] User shared the app');

        // Track share event in Supabase
        if (userId) {
          const shareMethod = result.activityType || 'unknown';
          await shareNudgeService.trackShare(userId, shareMethod);
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('[ShareNudge] User dismissed share dialog');
      }

      // Close modal after share attempt
      onClose();
    } catch (error) {
      console.error('[ShareNudge] Error sharing app:', error);
      onClose();
    }
  };

  const handleMaybeLater = () => {
    console.log('[ShareNudge] User dismissed nudge');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View style={{ ...styles.backdropOverlay, opacity: fadeAnim }} />
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            backgroundColor: colors.surface,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle indicator */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="sparkles" size={32} color={colors.primary} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            GutCheck helped you find clarity? 💡
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Pass it forward.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: colors.primary }]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Ionicons name="share-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.shareButtonText}>Share GutCheck</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.laterButton}
            onPress={handleMaybeLater}
            activeOpacity={0.7}
          >
            <Text style={[styles.laterButtonText, { color: colors.textSecondary }]}>
              Maybe Later
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MODAL_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 24 : 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#43B897',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
