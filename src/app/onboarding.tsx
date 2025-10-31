/**
 * Onboarding Flow
 * 3-screen psychological onboarding to lead users to 7-day free trial
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
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
  const [customAge, setCustomAge] = useState<string>('');
  const [showCustomAgeInput, setShowCustomAgeInput] = useState(false);

  const ageOptions = [
    { value: '10-14', label: '10-14 years old' },
    { value: '15-24', label: '15-24 years old' },
    { value: '25-34', label: '25-34 years old' },
    { value: '35-44', label: '35-44 years old' },
    { value: '45+', label: '45+ years old' },
    { value: 'guardian', label: 'I\'m a guardian/parent' },
    { value: 'custom', label: 'Enter my exact age' },
  ];

  const goalOptions = [
    { value: 'better-life', label: 'I want to do better in life' },
    { value: 'buddy', label: 'I want you to be a buddy' },
    { value: 'achieve-more', label: 'Achieve more' },
    { value: 'confidence', label: 'Improve self confidence' },
  ];

  const handleNext = async () => {
    if (currentScreen === 0) {
      // Check if user has entered an age (either custom or selected a range)
      if (!customAge.trim() && !selectedAge) {
        Alert.alert('Please enter your age', 'This helps us personalize your experience.');
        return;
      }
      
      // If custom age is entered, validate it
      if (customAge.trim()) {
        const age = parseInt(customAge.trim());
        if (isNaN(age) || age < 10 || age > 100) {
          Alert.alert('Invalid age', 'Please enter a valid age between 10 and 100.');
          return;
        }
      }
    }
    
    if (currentScreen === 1 && !selectedGoal) {
      Alert.alert('Please select a goal', 'This helps us understand how to support you.');
      return;
    }

    if (currentScreen === 2) {
      // Save onboarding data first
      try {
        // Save onboarding completion
        await AsyncStorage.setItem('onboarding_completed', 'true');
        
        // Save user preferences - prioritize custom age input
        const finalAge = customAge.trim() || selectedAge;
        if (finalAge) {
          await AsyncStorage.setItem('user_age_range', finalAge);
        }
        if (selectedGoal) {
          await AsyncStorage.setItem('user_goal', selectedGoal);
        }

        // Update profile if user is logged in
        const user = await AsyncStorage.getItem('user_id');
        if (user && finalAge) {
          try {
            await profileService.updateProfile({
              age_range: finalAge,
              goal: selectedGoal,
            });
          } catch (error) {
            console.log('Profile update failed, will sync later:', error);
          }
        }
      } catch (error) {
        console.error('Error saving onboarding data:', error);
      }

      // Navigate to subscription screen to start 7-day free trial
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
          <Ionicons name="flash" size={60} color={colors.primary} />
        </View>
        
        <Text style={[styles.headline, { color: colors.textPrimary }]}>
          Welcome to GutCheck! Your intuition just got a powerful ally.
        </Text>
        
        <Text style={[styles.subtext, { color: colors.textSecondary }]}>
          Trusting your gut was the smartest move. You're about to learn how to spot red flags before they hit, from manipulation to bullying.
        </Text>

        <View style={styles.ageSelection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            How old are you?
          </Text>
          
          {/* Direct Age Input */}
          <View style={styles.ageInputContainer}>
            <TextInput
              style={[
                styles.ageInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }
              ]}
              placeholder="Enter your age (e.g., 28)"
              placeholderTextColor={colors.textSecondary}
              value={customAge}
              onChangeText={(text) => {
                setCustomAge(text);
                setSelectedAge('custom');
              }}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
          
          {/* Quick Select Options */}
          <Text style={[styles.quickSelectLabel, { color: colors.textSecondary }]}>
            Or select a range:
          </Text>
          <View style={styles.quickSelectContainer}>
            {ageOptions.slice(0, -1).map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.quickSelectButton,
                  { 
                    backgroundColor: selectedAge === option.value ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                  selectedAge === option.value && styles.selectedOption
                ]}
                onPress={() => {
                  setSelectedAge(option.value);
                  setCustomAge('');
                }}
              >
                <Text style={[
                  styles.quickSelectText,
                  { color: selectedAge === option.value ? '#FFFFFF' : colors.textPrimary }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderScreen2 = () => (
    <View style={styles.screenContainer}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="heart" size={60} color={colors.primary} />
        </View>
        
        <Text style={[styles.headline, { color: colors.textPrimary }]}>
          Great start, your intuition is speaking!
        </Text>
        
        <Text style={[styles.subtext, { color: colors.textSecondary }]}>
          What do you want to improve most? Pick what resonates with you.
        </Text>

        <View style={styles.goalSelection}>
          {goalOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                { 
                  backgroundColor: selectedGoal === option.value ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
                selectedGoal === option.value && styles.selectedOption
              ]}
              onPress={() => setSelectedGoal(option.value)}
            >
              <Text style={[
                styles.optionText,
                { color: selectedGoal === option.value ? '#FFFFFF' : colors.textPrimary }
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.insightText, { color: colors.textSecondary }]}>
          Visualizing these goals makes your path crystal clear. You're not alone, this is normal and achievable.
        </Text>
      </View>
    </View>
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
              {currentScreen === 2 ? 'Start My 7-Day Free Trial' : 'Continue'}
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
    </SafeAreaView>
  );
}
