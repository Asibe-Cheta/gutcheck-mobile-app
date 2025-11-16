/**
 * Onboarding Flow
 * 3-screen psychological onboarding to lead users to 7-day free trial
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Modal, Platform, KeyboardAvoidingView, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { profileService } from '@/lib/profileService';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [currentScreen, setCurrentScreen] = useState(0);
  const [selectedAge, setSelectedAge] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [region, setRegion] = useState<string>('');
  const [showAgePicker, setShowAgePicker] = useState(false);

  const ageOptions = [
    { value: '', label: 'Select your age range' },
    { value: '10-14', label: '10-14 years old' },
    { value: '15-24', label: '15-24 years old' },
    { value: '25-34', label: '25-34 years old' },
    { value: '35-44', label: '35-44 years old' },
    { value: '45+', label: '45+ years old' },
    { value: 'guardian', label: 'I\'m a guardian/parent' },
  ];

  const goalOptions = [
    { value: 'better-life', label: 'I want to do better in life' },
    { value: 'buddy', label: 'I want you to be a buddy' },
    { value: 'achieve-more', label: 'Achieve more' },
    { value: 'confidence', label: 'Improve self confidence' },
  ];

  const handleNext = async () => {
    if (currentScreen === 1) {
      // Check if user has selected an age
      if (!selectedAge) {
        Alert.alert('Please select your age', 'This helps us personalize your experience.');
        return;
      }
    }

    if (currentScreen === 2) {
      // Save onboarding data first
      try {
        // Save onboarding completion
        await AsyncStorage.setItem('onboarding_completed', 'true');
        
        // Save user preferences
        if (selectedAge) {
          await AsyncStorage.setItem('user_age_range', selectedAge);
        }
        if (region.trim()) {
          await AsyncStorage.setItem('user_region', region.trim());
        }

        // Update profile if user is logged in
        const user = await AsyncStorage.getItem('user_id');
        if (user) {
          try {
            await profileService.updateProfile({
              age_range: selectedAge,
              region: region.trim() || undefined,
            });
          } catch (error) {
            console.log('Profile update failed, will sync later:', error);
          }
        }
      } catch (error) {
        console.error('Error saving onboarding data:', error);
      }

      // Navigate to subscription screen to start 3-day free trial
      router.push('/subscription');
    } else {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const handlePrevious = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const renderScreen1 = () => (
    <View style={styles.screenContainer}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={60} color={colors.primary} />
        </View>
        
        <Text style={[styles.headline, { color: colors.textPrimary }]}>
          Let's recap why we are here
        </Text>

        <View style={styles.statsCardsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statCardText, { color: colors.textPrimary }]}>
              An avalanche of child abuse and sexual exploitation is taking place behind closed doors a new study has found
            </Text>
            <Text style={[styles.statCardReference, { color: colors.textSecondary }]}>
              — The University of Edinburgh, 2025
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statCardText, { color: colors.textPrimary }]}>
              Approximately 50% of minors are being approached in a grooming context. In the UK
            </Text>
            <Text style={[styles.statCardReference, { color: colors.textSecondary }]}>
              — NSPCC, 2024
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statCardText, { color: colors.textPrimary }]}>
              Approximately one-third of the world's youth are being bullied.
            </Text>
            <Text style={[styles.statCardReference, { color: colors.textSecondary }]}>
              — UNESCO Institute of Statistics, 2024
            </Text>
          </View>
        </View>

        <Text style={[styles.purposeText, { color: colors.textSecondary }]}>
          Stories like this and more is why GC was created; to give users eyes to see the warning signs before they're trapped, and a voice to reach out before silence wins.
        </Text>
      </View>
    </View>
  );

  const renderScreen2 = () => (
    <KeyboardAvoidingView 
      style={styles.screenContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="flash" size={60} color={colors.primary} />
          </View>
          
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            Congratulations, great start. You just made a great decision. Your intuition just got a new ally.
          </Text>

          <View style={styles.ageSelection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Age
            </Text>
            
            <TouchableOpacity
              style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowAgePicker(true)}
            >
              <Text style={[
                styles.pickerButtonText,
                { color: selectedAge ? colors.textPrimary : colors.textSecondary }
              ]}>
                {selectedAge ? ageOptions.find(o => o.value === selectedAge)?.label : 'Select your age range'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>
              Region
            </Text>
            
            <TextInput
              style={[
                styles.regionInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }
              ]}
              placeholder="Enter your region (e.g., London, UK)"
              placeholderTextColor={colors.textSecondary}
              value={region}
              onChangeText={setRegion}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderScreen3 = () => (
    <View style={styles.screenContainer}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="people" size={60} color={colors.primary} />
        </View>
        
        <Text style={[styles.headline, { color: colors.textPrimary }]}>
          Your Gut Isn't Alone, join 50,000+ who visualize their intuition to spot red flags!
        </Text>
        
        <View style={styles.statsContainer}>
          <Text style={[styles.statText, { color: colors.primary }]}>
            85% feel more confident after one session
          </Text>
        </View>

        <View style={styles.testimonialContainer}>
          <Text style={[styles.testimonial, { color: colors.textSecondary }]}>
            "Instead of feeling cornered by manipulation, I now recognize red flags and take action."
          </Text>
        </View>

        <View style={styles.privacyContainer}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
            Your intuition stays yours, visualizations are private and never shared.
          </Text>
        </View>

        <View style={styles.transformationContainer}>
          <Text style={[styles.transformationText, { color: colors.textPrimary }]}>
            From isolated vulnerability to confident resilience. From silent suffering to proactive prevention.
          </Text>
        </View>
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    screenContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 40,
      alignItems: 'center',
    },
    iconContainer: {
      marginBottom: 32,
    },
    headline: {
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 36,
    },
    subtext: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      textAlign: 'center',
    },
    ageSelection: {
      width: '100%',
      marginBottom: 32,
    },
    ageInputContainer: {
      marginBottom: 20,
    },
    ageInput: {
      borderWidth: 2,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 18,
      textAlign: 'center',
      fontWeight: '500',
    },
    quickSelectLabel: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 12,
      fontStyle: 'italic',
    },
    quickSelectContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    quickSelectButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      marginHorizontal: 4,
      marginVertical: 4,
    },
    quickSelectText: {
      fontSize: 14,
      fontWeight: '500',
    },
    goalSelection: {
      width: '100%',
      marginBottom: 24,
    },
    optionButton: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 12,
      alignItems: 'center',
    },
    selectedOption: {
      borderColor: colors.primary,
    },
    optionText: {
      fontSize: 16,
      fontWeight: '500',
    },
    insightText: {
      fontSize: 14,
      textAlign: 'center',
      fontStyle: 'italic',
      lineHeight: 20,
    },
    statsCardsContainer: {
      width: '100%',
      marginBottom: 24,
      gap: 12,
    },
    statCard: {
      padding: 20,
      borderRadius: 12,
      borderWidth: 1,
    },
    statCardText: {
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
    },
    purposeText: {
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 24,
      marginTop: 8,
      fontStyle: 'italic',
    },
    pickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 2,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    pickerButtonText: {
      fontSize: 16,
      flex: 1,
    },
    agePickerModal: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    agePickerContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 34,
    },
    agePickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    agePickerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    agePickerDone: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    ageOptionButton: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    ageOptionText: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    ageOptionSelected: {
      backgroundColor: colors.primary + '10',
    },
    regionInput: {
      borderWidth: 2,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 16,
    },
    statsContainer: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statText: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    testimonialContainer: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    testimonial: {
      fontSize: 16,
      fontStyle: 'italic',
      textAlign: 'center',
      lineHeight: 22,
    },
    privacyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    privacyText: {
      fontSize: 14,
      marginLeft: 12,
      flex: 1,
      lineHeight: 20,
    },
    transformationContainer: {
      backgroundColor: colors.primary + '10',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    transformationText: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 22,
    },
    progressContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 32,
    },
    progressDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
    },
    buttonContainer: {
      width: '100%',
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    navigationButtons: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    previousButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: 'transparent',
      flex: 1,
    },
    previousButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    nextButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      flex: 1,
    },
    nextButtonFullWidth: {
      flex: 1,
    },
    nextButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginRight: 8,
    },
    skipButton: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    skipButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
  });

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index <= currentScreen ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Screen Content */}
        {currentScreen === 0 && renderScreen1()}
        {currentScreen === 1 && renderScreen2()}
        {currentScreen === 2 && renderScreen3()}
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.buttonContainer}>
        <View style={styles.navigationButtons}>
          {currentScreen > 0 && (
            <TouchableOpacity
              style={styles.previousButton}
              onPress={handlePrevious}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.previousButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.nextButton, currentScreen === 0 && styles.nextButtonFullWidth]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentScreen === 2 ? 'Start My 3-Day Free Trial' : 'Continue'}
            </Text>
            {currentScreen < 2 && (
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
        
        {currentScreen < 2 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Age Picker Modal */}
      <Modal
        visible={showAgePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAgePicker(false)}
      >
        <TouchableOpacity
          style={styles.agePickerModal}
          activeOpacity={1}
          onPress={() => setShowAgePicker(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.agePickerContainer}>
              <View style={styles.agePickerHeader}>
                <Text style={styles.agePickerTitle}>Select Age</Text>
                <TouchableOpacity onPress={() => setShowAgePicker(false)}>
                  <Text style={styles.agePickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 400 }}>
                {ageOptions.filter(o => o.value !== '').map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.ageOptionButton,
                      selectedAge === option.value && styles.ageOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedAge(option.value);
                      setShowAgePicker(false);
                    }}
                  >
                    <Text style={[
                      styles.ageOptionText,
                      selectedAge === option.value && { fontWeight: '600', color: colors.primary }
                    ]}>
                      {option.label}
                    </Text>
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
