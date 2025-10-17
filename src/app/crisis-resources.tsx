/**
 * Crisis Resources Screen
 * Displays emergency resources and crisis support information
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { useCrisisStore } from '@/lib/stores/crisisStore';

export default function CrisisResourcesScreen({ navigation }: any) {
  const { resources, isLoading } = useCrisisStore();

  const handleCall = (number: string, name: string) => {
    Alert.alert(
      `Call ${name}`,
      `This will dial ${number}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${number}`) },
      ]
    );
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Services',
      'This will call 999 (Emergency Services). Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 999', style: 'destructive', onPress: () => Linking.openURL('tel:999') },
      ]
    );
  };

  const ResourceCard = ({ 
    title, 
    number, 
    description, 
    icon, 
    color, 
    isEmergency = false 
  }: {
    title: string;
    number: string;
    description: string;
    icon: string;
    color: string;
    isEmergency?: boolean;
  }) => (
    <TouchableOpacity 
      style={[styles.resourceCard, isEmergency && styles.emergencyCard]}
      onPress={() => handleCall(number, title)}
    >
      <View style={styles.resourceHeader}>
        <View style={[styles.resourceIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={24} color="white" />
        </View>
        <View style={styles.resourceInfo}>
          <Text style={styles.resourceTitle}>{title}</Text>
          <Text style={styles.resourceDescription}>{description}</Text>
        </View>
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.resourceNumber}>{number}</Text>
    </TouchableOpacity>
  );

  const SelfHelpCard = ({ title, description, icon }: {
    title: string;
    description: string;
    icon: string;
  }) => (
    <View style={styles.selfHelpCard}>
      <View style={styles.selfHelpHeader}>
        <Ionicons name={icon as any} size={20} color={theme.colors.primary} />
        <Text style={styles.selfHelpTitle}>{title}</Text>
      </View>
      <Text style={styles.selfHelpDescription}>{description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Crisis Resources</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Emergency Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Emergency Services</Text>
          <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyCall}>
            <Ionicons name="call" size={24} color="white" />
            <Text style={styles.emergencyButtonText}>Call 999 (Emergency)</Text>
          </TouchableOpacity>
        </View>

        {/* Helplines Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 Helplines</Text>
          <ResourceCard
            title="Samaritans"
            number="116 123"
            description="24/7 emotional support"
            icon="heart"
            color={theme.colors.success}
          />
          <ResourceCard
            title="National Domestic Abuse"
            number="0808 2000 247"
            description="24/7 domestic abuse support"
            icon="shield"
            color={theme.colors.warning}
          />
          <ResourceCard
            title="Childline"
            number="0800 1111"
            description="For under 19s"
            icon="people"
            color={theme.colors.primary}
          />
          <ResourceCard
            title="NSPCC"
            number="0808 800 5000"
            description="Child protection"
            icon="shield-checkmark"
            color={theme.colors.primary}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤝 Support Services</Text>
          <ResourceCard
            title="NHS 111"
            number="111"
            description="Non-emergency medical help"
            icon="medical"
            color={theme.colors.primary}
          />
          <ResourceCard
            title="Mind"
            number="0300 123 3393"
            description="Mental health support"
            icon="brain"
            color={theme.colors.primary}
          />
          <ResourceCard
            title="Crisis Text Line"
            number="Text SHOUT to 85258"
            description="Text support"
            icon="chatbubble"
            color={theme.colors.primary}
          />
        </View>

        {/* Self-Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💙 Self-Help</Text>
          <SelfHelpCard
            title="Find a Safe Space"
            description="Go to a place where you feel safe and secure"
            icon="home"
          />
          <SelfHelpCard
            title="Contact Trusted People"
            description="Reach out to friends, family, or trusted individuals"
            icon="people"
          />
          <SelfHelpCard
            title="Document Evidence"
            description="Keep records of any abuse or concerning behavior"
            icon="document-text"
          />
          <SelfHelpCard
            title="Seek Professional Help"
            description="Consider contacting a counselor or therapist"
            icon="person"
          />
        </View>

        {/* Safety Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ Safety Tips</Text>
          <View style={styles.safetyTipsCard}>
            <Text style={styles.safetyTipsTitle}>If you're in immediate danger:</Text>
            <Text style={styles.safetyTipsText}>• Call 999 immediately</Text>
            <Text style={styles.safetyTipsText}>• Go to a safe place</Text>
            <Text style={styles.safetyTipsText}>• Contact emergency services</Text>
            
            <Text style={styles.safetyTipsTitle}>If you're not in immediate danger:</Text>
            <Text style={styles.safetyTipsText}>• Call a helpline for support</Text>
            <Text style={styles.safetyTipsText}>• Speak to someone you trust</Text>
            <Text style={styles.safetyTipsText}>• Consider professional counseling</Text>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glassBorder,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  emergencyButton: {
    backgroundColor: theme.colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  resourceCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  emergencyCard: {
    borderColor: theme.colors.warning,
    borderWidth: 2,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
    fontFamily: 'Inter',
  },
  resourceDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: 'Inter',
  },
  callButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(79, 209, 199, 0.1)',
  },
  resourceNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
    fontFamily: 'Inter',
  },
  selfHelpCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  selfHelpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selfHelpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: 8,
    fontFamily: 'Inter',
  },
  selfHelpDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  safetyTipsCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  safetyTipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
    fontFamily: 'Inter',
  },
  safetyTipsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    fontFamily: 'Inter',
  },
});
