/**
 * Resources Screen
 * Enhanced design based on established patterns
 * Educational content and crisis support
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { useRouter } from 'expo-router';

// Crisis Resource Component
const CrisisResource = ({ 
  name, 
  number, 
  description, 
  icon, 
  color,
  styles,
  colors
}: {
  name: string;
  number: string;
  description: string;
  icon: string;
  color: string;
  styles: any;
  colors: any;
}) => {
  const handleCall = () => {
    Alert.alert(
      `Call ${name}`,
      `This will dial ${number}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${number}`) }
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
  
  const crisisResources = [
    { 
      name: 'Childline', 
      number: '0800 1111', 
      description: 'For under 19s', 
      icon: 'people',
      color: currentTheme.warning
    },
    { 
      name: 'Samaritans', 
      number: '116 123', 
      description: '24/7 support', 
      icon: 'heart',
      color: currentTheme.success
    },
    { 
      name: 'NSPCC', 
      number: '0808 800 5000', 
      description: 'Child protection', 
      icon: 'shield-checkmark',
      color: currentTheme.primary
    },
    { 
      name: 'National Domestic Abuse', 
      number: '0808 2000 247', 
      description: '24/7 helpline', 
      icon: 'call',
      color: currentTheme.warning
    },
  ];

  const safetyGuides = [
    { 
      title: 'Recognizing Gaslighting', 
      description: 'Learn to identify when someone is making you question your reality',
      icon: 'warning'
    },
    { 
      title: 'Dealing with Manipulation', 
      description: 'Strategies to protect yourself from emotional manipulation',
      icon: 'shield'
    },
    { 
      title: 'Setting Boundaries', 
      description: 'How to establish and maintain healthy relationship boundaries',
      icon: 'lock-closed'
    },
    { 
      title: 'When to Seek Help', 
      description: 'Recognizing when you need professional support',
      icon: 'medical'
    },
  ];

  const educationalContent = [
    { 
      title: 'Understanding Manipulation', 
      description: 'Deep dive into manipulation tactics and how they work',
      icon: 'book'
    },
    { 
      title: 'Healthy Relationships 101', 
      description: 'What healthy relationships look like and how to build them',
      icon: 'heart-circle'
    },
    { 
      title: 'Trusting Your Intuition', 
      description: 'Learning to recognize and trust your gut feelings',
      icon: 'bulb'
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

  const handleGuidePress = (title: string) => {
    // TODO: Navigate to guide content
    console.log(`Opening guide: ${title}`);
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
  });
  
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
        
        {/* UK Helplines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UK Helplines</Text>
          {crisisResources.map((resource, index) => (
            <CrisisResource
              key={index}
              name={resource.name}
              number={resource.number}
              description={resource.description}
              icon={resource.icon}
              color={resource.color}
              styles={styles}
              colors={currentTheme}
            />
          ))}
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
              onPress={() => handleGuidePress(guide.title)}
              styles={styles}
              colors={currentTheme}
            />
          ))}
        </View>
        
        {/* Educational Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Educational Content</Text>
          {educationalContent.map((content, index) => (
            <GuideItem
              key={index}
              title={content.title}
              description={content.description}
              icon={content.icon}
              onPress={() => handleGuidePress(content.title)}
              styles={styles}
              colors={currentTheme}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, // p-4
    backgroundColor: `${colors.background}CC`, // backdrop-blur effect
  },
  backButton: {
    padding: 8, // p-2
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24, // text-2xl
    fontWeight: '700', // font-bold
    color: colors.textPrimary,
    marginBottom: 4, // mb-1
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 16, // text-base
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  headerSpacer: {
    width: 40, // w-10
  },
  content: {
    flex: 1,
    paddingHorizontal: 16, // px-4
  },
  section: {
    marginBottom: 32, // mb-8
  },
  sectionTitle: {
    fontSize: 20, // text-xl
    fontWeight: '700', // font-bold
    color: colors.textPrimary,
    marginBottom: 16, // mb-4
    fontFamily: 'Inter',
  },
  // Crisis Support Styles
  crisisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning,
    paddingVertical: 16, // py-4
    paddingHorizontal: 24, // px-6
    borderRadius: 12, // rounded-lg
    gap: 8, // gap-2
  },
  crisisButtonText: {
    color: 'white',
    fontSize: 16, // text-base
    fontWeight: '600', // font-semibold
    fontFamily: 'Inter',
  },
  // Resource Card Styles
  resourceCard: {
    backgroundColor: colors.surface,
    padding: 16, // p-4
    borderRadius: 12, // rounded-lg
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 12, // mb-3
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // mb-2
  },
  resourceIconContainer: {
    width: 40, // w-10
    height: 40, // h-10
    borderRadius: 20, // rounded-full
    backgroundColor: 'rgba(79, 209, 199, 0.1)', // bg-primary/10
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12, // mr-3
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontSize: 16, // text-base
    fontWeight: '600', // font-semibold
    color: colors.textPrimary,
    marginBottom: 2, // mb-0.5
    fontFamily: 'Inter',
  },
  resourceDescription: {
    fontSize: 14, // text-sm
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  callButton: {
    padding: 8, // p-2
    borderRadius: 8, // rounded
    backgroundColor: 'rgba(79, 209, 199, 0.1)', // bg-primary/10
  },
  resourceNumber: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: colors.primary,
    fontFamily: 'Inter',
  },
  // Guide Card Styles
  guideCard: {
    backgroundColor: colors.surface,
    padding: 16, // p-4
    borderRadius: 12, // rounded-lg
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 8, // mb-2
  },
  guideContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideIconContainer: {
    width: 40, // w-10
    height: 40, // h-10
    borderRadius: 20, // rounded-full
    backgroundColor: 'rgba(79, 209, 199, 0.1)', // bg-primary/10
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12, // mr-3
  },
  guideTextContainer: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 16, // text-base
    fontWeight: '600', // font-semibold
    color: colors.textPrimary,
    marginBottom: 2, // mb-0.5
    fontFamily: 'Inter',
  },
  guideDescription: {
    fontSize: 14, // text-sm
    color: colors.textSecondary,
    lineHeight: 20, // leading-5
    fontFamily: 'Inter',
  },
});
