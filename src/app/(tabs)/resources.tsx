/**
 * Resources Screen
 * Enhanced design based on established patterns
 * Educational content and crisis support
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { detectRegion, getHelplinesForRegion, type Region } from '@/lib/helplineService';
import { useSubscriptionStore } from '@/lib/stores/subscriptionStore';
import { useAppLock } from '@/contexts/AppLockContext';
import { BiometricLockScreen } from '@/components/BiometricLockScreen';

// Crisis Resource Component
const CrisisResource = ({ 
  name, 
  number, 
  rawNumber,
  description, 
  icon, 
  color,
  styles,
  colors
}: {
  name: string;
  number: string;
  rawNumber?: string;
  description: string;
  icon: string;
  color: string;
  styles: any;
  colors: any;
}) => {
  const handleCall = () => {
    const dialNumber = rawNumber || number.replace(/\s/g, '');
    Alert.alert(
      `Call ${name}`,
      `This will dial ${number}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${dialNumber}`) }
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.resourceCard} onPress={handleCall}>
      <View style={styles.resourceHeader}>
        <View style={styles.resourceIconContainer}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <View style={styles.resourceInfo}>
          <Text style={styles.resourceName}>{name}</Text>
          <Text style={styles.resourceDescription}>{description}</Text>
        </View>
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.resourceNumber}>{number}</Text>
    </TouchableOpacity>
  );
};

// Guide Item Component
const GuideItem = ({ 
  title, 
  description, 
  icon, 
  onPress,
  styles,
  colors
}: {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
  styles: any;
  colors: any;
}) => (
  <TouchableOpacity style={styles.guideCard} onPress={onPress}>
    <View style={styles.guideContent}>
      <View style={styles.guideIconContainer}>
        <Ionicons name={icon as any} size={24} color={colors.primary} />
      </View>
      <View style={styles.guideTextContainer}>
        <Text style={styles.guideTitle}>{title}</Text>
        <Text style={styles.guideDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </View>
  </TouchableOpacity>
);

export default function ResourcesScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const currentTheme = getThemeColors(isDark);
  
  // App lock state - show lock screen when app is locked
  const { isLocked, shouldShowLock } = useAppLock();
  const [region, setRegion] = useState<Region>('UK');
  const [helplines, setHelplines] = useState<any[]>([]);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  
  // Authentication check only
  useEffect(() => {
    const checkAuth = async () => {
      const userId = await AsyncStorage.getItem('user_id');
      const isLoggedIn = await AsyncStorage.getItem('is_logged_in');
      
      if (!userId || isLoggedIn !== 'true') {
        router.replace('/(auth)/welcome');
        return;
      }
    };
    
    checkAuth();
    loadUserRegion();
  }, []);
  
  useFocusEffect(
    React.useCallback(() => {
      loadUserRegion();
    }, [])
  );
  
  const loadUserRegion = async () => {
    try {
      const userRegion = await AsyncStorage.getItem('user_region');
      console.log('[RESOURCES] User region from storage:', userRegion);
      const detectedRegion = detectRegion(userRegion);
      console.log('[RESOURCES] Detected region:', detectedRegion);
      loadHelplinesForRegion(detectedRegion);
    } catch (error) {
      console.error('Error loading user region:', error);
      // Default to UK if error
      loadHelplinesForRegion('UK');
    }
  };
  
  const loadHelplinesForRegion = (selectedRegion: Region) => {
    try {
      setRegion(selectedRegion);
      
      // Get helplines for this region
      const regionHelplines = getHelplinesForRegion(selectedRegion);
      console.log('[RESOURCES] Loaded', regionHelplines.length, 'helplines for', selectedRegion);
      
      // Format helplines for display
      const formattedHelplines = regionHelplines.map((helpline, index) => ({
        name: helpline.name,
        number: formatPhoneNumber(helpline.number),
        rawNumber: helpline.number,
        description: helpline.description,
        icon: helpline.icon,
        color: [currentTheme.warning, currentTheme.success, currentTheme.primary, currentTheme.error][index % 4]
      }));
      
      setHelplines(formattedHelplines);
    } catch (error) {
      console.error('Error formatting helplines:', error);
      setHelplines([]);
    }
  };
  
  // Format phone number with spaces for display
  const formatPhoneNumber = (number: string): string => {
    const cleaned = number.replace(/\s/g, '');
    
    if (cleaned.length === 7) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    } else if (cleaned.length === 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    } else if (cleaned.length === 11) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    
    return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
  };
  
  // Map helplines with colors for display
  const crisisResources = helplines;

  const safetyGuides = [
    { 
      title: 'Recognizing Gaslighting', 
      description: 'Learn to identify when someone is making you question your reality',
      icon: 'warning',
      route: '/guides/gaslighting'
    },
    { 
      title: 'Dealing with Manipulation', 
      description: 'Strategies to protect yourself from emotional manipulation',
      icon: 'shield',
      route: '/guides/manipulation'
    },
    { 
      title: 'Setting Boundaries', 
      description: 'How to establish and maintain healthy relationship boundaries',
      icon: 'lock-closed',
      route: '/guides/boundaries'
    },
    { 
      title: 'When to Seek Help', 
      description: 'Recognizing when you need professional support',
      icon: 'medical',
      route: '/guides/seek-help'
    },
  ];


  const handleCrisisSupport = () => {
    Alert.alert(
      'Crisis Support',
      'If you\'re in immediate danger, call 999. Otherwise, choose a helpline below.',
      [
        { text: 'Call 999 (Emergency)', onPress: () => Linking.openURL('tel:999') },
        { text: 'Samaritans (116 123)', onPress: () => Linking.openURL('tel:116123') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleGuidePress = (route?: string) => {
    if (route) {
      router.push(route as any);
    }
  };

  // Create styles directly with current theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.surface,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: currentTheme.textPrimary,
      fontFamily: 'Inter',
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
    },
    section: {
      marginVertical: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: currentTheme.textPrimary,
      marginBottom: 12,
      fontFamily: 'Inter',
    },
    resourceCard: {
      backgroundColor: currentTheme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: currentTheme.glassBorder,
    },
    resourceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    resourceIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: currentTheme.glassBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    resourceInfo: {
      flex: 1,
    },
    resourceName: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.textPrimary,
      fontFamily: 'Inter',
    },
    resourceDescription: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      marginTop: 4,
      fontFamily: 'Inter',
    },
    callButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: currentTheme.glassBg,
    },
    resourceNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.primary,
      fontFamily: 'Inter',
    },
    guideCard: {
      backgroundColor: currentTheme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: currentTheme.glassBorder,
    },
    guideContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    guideIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: currentTheme.glassBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    guideTextContainer: {
      flex: 1,
    },
    guideTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.textPrimary,
      fontFamily: 'Inter',
    },
    guideDescription: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      marginTop: 4,
      fontFamily: 'Inter',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    regionSwitcher: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    regionSwitcherText: {
      fontSize: 14,
      fontWeight: '600',
    },
    regionPickerModal: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    regionPickerContainer: {
      backgroundColor: currentTheme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 34,
    },
    regionPickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.border,
    },
    regionPickerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: currentTheme.textPrimary,
    },
    regionPickerDone: {
      fontSize: 16,
      fontWeight: '600',
    },
    regionOptionButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
    },
    regionOptionText: {
      fontSize: 16,
    },
    crisisButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: currentTheme.warning,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      gap: 8,
    },
    crisisButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Inter',
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: currentTheme.textPrimary,
      marginBottom: 4,
      fontFamily: 'Inter',
    },
    subtitle: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      fontFamily: 'Inter',
    },
    headerSpacer: {
      width: 40,
    },
  });
  
  // Show lock screen if app is locked (when returning from background)
  if (isLocked && shouldShowLock) {
    return <BiometricLockScreen />;
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/')}
        >
          <Ionicons name="arrow-back" size={24} color={currentTheme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Resources</Text>
          <Text style={styles.subtitle}>Support and educational content</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Crisis Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🆘 Crisis Support</Text>
          <TouchableOpacity 
            style={styles.crisisButton}
            onPress={handleCrisisSupport}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={24} color="white" />
            <Text style={styles.crisisButtonText}>Get Immediate Help</Text>
          </TouchableOpacity>
        </View>
        
        {/* Region-specific Helplines */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{region} Helplines</Text>
            <TouchableOpacity
              style={styles.regionSwitcher}
              onPress={() => setShowRegionPicker(true)}
            >
              <Text style={[styles.regionSwitcherText, { color: currentTheme.primary }]}>
                Change Region
              </Text>
              <Ionicons name="chevron-down" size={16} color={currentTheme.primary} />
            </TouchableOpacity>
          </View>
          {crisisResources.length > 0 ? (
            crisisResources.map((resource, index) => (
              <CrisisResource
                key={index}
                name={resource.name}
                number={resource.number}
                rawNumber={resource.rawNumber}
                description={resource.description}
                icon={resource.icon}
                color={resource.color}
                styles={styles}
                colors={currentTheme}
              />
            ))
          ) : (
            <Text style={[styles.resourceDescription, { color: currentTheme.textSecondary }]}>
              Loading helplines...
            </Text>
          )}
        </View>
        
        {/* Safety Guides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Guides</Text>
          {safetyGuides.map((guide, index) => (
            <GuideItem
              key={index}
              title={guide.title}
              description={guide.description}
              icon={guide.icon}
              onPress={() => handleGuidePress(guide.route)}
              styles={styles}
              colors={currentTheme}
            />
          ))}
        </View>
      </ScrollView>

      {/* Region Picker Modal */}
      <Modal
        visible={showRegionPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRegionPicker(false)}
      >
        <TouchableOpacity
          style={styles.regionPickerModal}
          activeOpacity={1}
          onPress={() => setShowRegionPicker(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.regionPickerContainer}>
              <View style={styles.regionPickerHeader}>
                <Text style={styles.regionPickerTitle}>Select Region</Text>
                <TouchableOpacity onPress={() => setShowRegionPicker(false)}>
                  <Text style={[styles.regionPickerDone, { color: currentTheme.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 300 }}>
                {(['UK', 'US', 'Canada', 'Australia'] as Region[]).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.regionOptionButton,
                      { borderBottomColor: currentTheme.border },
                      region === r && { backgroundColor: currentTheme.primary + '10' }
                    ]}
                    onPress={() => {
                      loadHelplinesForRegion(r);
                      setShowRegionPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.regionOptionText,
                      { color: currentTheme.textPrimary },
                      region === r && { fontWeight: '600', color: currentTheme.primary }
                    ]}>
                      {r}
                    </Text>
                    {region === r && (
                      <Ionicons name="checkmark" size={20} color={currentTheme.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
