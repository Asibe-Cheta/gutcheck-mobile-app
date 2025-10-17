/**
 * Enhanced Onboarding Screen
 * Comprehensive setup for new users with multiple steps
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { theme } from '@/lib/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Svg, { Path } from 'react-native-svg';

// Privacy Icon
const PrivacyIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <Path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.1 16,12.7V16.2C16,16.8 15.4,17.3 14.8,17.3H9.2C8.6,17.3 8,16.8 8,16.2V12.7C8,12.1 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11.5H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z" />
  </Svg>
);

// Shield Icon
const ShieldIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <Path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.1 16,12.7V16.2C16,16.8 15.4,17.3 14.8,17.3H9.2C8.6,17.3 8,16.8 8,16.2V12.7C8,12.1 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11.5H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z" />
  </Svg>
);

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [ageRange, setAgeRange] = useState<string>('');
  const [culturalBackground, setCulturalBackground] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState<'direct' | 'gentle'>('gentle');

  const ageRanges = [
    { value: '16-18', label: '16-18', description: 'High school age' },
    { value: '19-21', label: '19-21', description: 'College age' },
    { value: '22-25', label: '22-25', description: 'Young adult' },
    { value: '25+', label: '25+', description: 'Adult' },
  ];

  const culturalBackgrounds = [
    'Western', 'Asian', 'African', 'Latin American', 'Middle Eastern', 'Other'
  ];

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // TODO: Save user preferences to Supabase
    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>What should we call you?</Text>
        <Text style={styles.stepDescription}>
          Choose a nickname for your GutCheck experience
        </Text>
      </View>
      
      <Input
        placeholder="Enter a nickname (optional)"
        value={nickname}
        onChangeText={setNickname}
        style={styles.input}
      />
      
      <View style={styles.privacyCard}>
        <PrivacyIcon />
        <Text style={styles.privacyText}>
          Your nickname is only used to personalize your experience. 
          It's never shared or stored permanently.
        </Text>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Select your age range</Text>
        <Text style={styles.stepDescription}>
          This helps us provide age-appropriate guidance
        </Text>
      </View>
      
      <View style={styles.ageRangeContainer}>
        {ageRanges.map((range) => (
          <TouchableOpacity
            key={range.value}
            style={[
              styles.ageRangeCard,
              ageRange === range.value && styles.ageRangeCardSelected
            ]}
            onPress={() => setAgeRange(range.value)}
          >
            <Text style={[
              styles.ageRangeLabel,
              ageRange === range.value && styles.ageRangeLabelSelected
            ]}>
              {range.label}
            </Text>
            <Text style={[
              styles.ageRangeDescription,
              ageRange === range.value && styles.ageRangeDescriptionSelected
            ]}>
              {range.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Personalize your experience</Text>
        <Text style={styles.stepDescription}>
          Help us provide more relevant guidance
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cultural Background (Optional)</Text>
        <Input
          placeholder="e.g., Western, Asian, African..."
          value={culturalBackground}
          onChangeText={setCulturalBackground}
          style={styles.input}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Communication Style</Text>
        <View style={styles.communicationContainer}>
          <TouchableOpacity
            style={[
              styles.communicationCard,
              communicationStyle === 'gentle' && styles.communicationCardSelected
            ]}
            onPress={() => setCommunicationStyle('gentle')}
          >
            <Text style={[
              styles.communicationLabel,
              communicationStyle === 'gentle' && styles.communicationLabelSelected
            ]}>
              Gentle
            </Text>
            <Text style={styles.communicationDescription}>
              Supportive and understanding
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.communicationCard,
              communicationStyle === 'direct' && styles.communicationCardSelected
            ]}
            onPress={() => setCommunicationStyle('direct')}
          >
            <Text style={[
              styles.communicationLabel,
              communicationStyle === 'direct' && styles.communicationLabelSelected
            ]}>
              Direct
            </Text>
            <Text style={styles.communicationDescription}>
              Straightforward and clear
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.privacyCard}>
        <ShieldIcon />
        <Text style={styles.privacyText}>
          All information is encrypted and never shared. 
          You can change these settings anytime.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentStep / 3) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {currentStep} of 3</Text>
        </View>
        
        {/* Step content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        
        {/* Navigation buttons */}
        <View style={styles.buttonContainer}>
          <View style={styles.buttonRow}>
            {currentStep > 1 && (
              <Button
                title="Back"
                variant="outline"
                onPress={handleBack}
                style={styles.backButton}
              />
            )}
            
            <Button
              title={currentStep === 3 ? "Complete Setup" : "Next"}
              onPress={handleNext}
              style={[styles.nextButton, currentStep === 1 && styles.fullWidthButton]}
            />
          </View>
          
          <Button
            title="Skip for now"
            variant="outline"
            onPress={handleSkip}
            style={styles.skipButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  progressContainer: {
    marginBottom: theme.spacing.xl,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  stepContent: {
    flex: 1,
    marginBottom: theme.spacing.xl,
  },
  stepHeader: {
    marginBottom: theme.spacing.xl,
  },
  stepTitle: {
    fontSize: theme.typography.fontSize.h2,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    fontFamily: 'Inter',
  },
  stepDescription: {
    fontSize: theme.typography.fontSize.body,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.bodyLarge,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    fontFamily: 'Inter',
  },
  input: {
    marginBottom: theme.spacing.lg,
  },
  ageRangeContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  ageRangeCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  ageRangeCardSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  ageRangeLabel: {
    fontSize: theme.typography.fontSize.bodyLarge,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    fontFamily: 'Inter',
  },
  ageRangeLabelSelected: {
    color: theme.colors.background,
  },
  ageRangeDescription: {
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.textSecondary,
    fontFamily: 'Inter',
  },
  ageRangeDescriptionSelected: {
    color: theme.colors.background,
    opacity: 0.8,
  },
  communicationContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  communicationCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  communicationCardSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  communicationLabel: {
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    fontFamily: 'Inter',
  },
  communicationLabelSelected: {
    color: theme.colors.background,
  },
  communicationDescription: {
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
  privacyText: {
    flex: 1,
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.md,
    lineHeight: 18,
    fontFamily: 'Inter',
  },
  buttonContainer: {
    gap: theme.spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
  fullWidthButton: {
    flex: 1,
  },
  skipButton: {
    marginTop: theme.spacing.sm,
  },
});
