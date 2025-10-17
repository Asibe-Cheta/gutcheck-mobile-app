/**
 * Crisis Alert Component
 * Displays crisis alerts and emergency resources
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/lib/theme';

interface CrisisAlertProps {
  severity: 'low' | 'medium' | 'high' | 'critical';
  onDismiss: () => void;
  onGetHelp: () => void;
}

export const CrisisAlert: React.FC<CrisisAlertProps> = ({ severity, onDismiss, onGetHelp }) => {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          title: '🚨 Immediate Support Needed',
          message: 'We\'ve detected critical risk indicators. Your safety is our top priority.',
          color: theme.colors.warning,
          icon: 'warning',
          urgent: true,
        };
      case 'high':
        return {
          title: '⚠️ High Risk Situation',
          message: 'Concerning patterns have been detected. Please consider reaching out for support.',
          color: theme.colors.warning,
          icon: 'alert-circle',
          urgent: true,
        };
      case 'medium':
        return {
          title: '⚠️ Concerning Patterns',
          message: 'Some concerning patterns were detected. We recommend speaking with someone you trust.',
          color: '#f59e0b',
          icon: 'information-circle',
          urgent: false,
        };
      case 'low':
        return {
          title: '💙 Support Available',
          message: 'Remember, you\'re not alone and support is available if you need it.',
          color: theme.colors.primary,
          icon: 'heart',
          urgent: false,
        };
      default:
        return {
          title: 'Support Available',
          message: 'Support is available if you need it.',
          color: theme.colors.primary,
          icon: 'information-circle',
          urgent: false,
        };
    }
  };

  const config = getSeverityConfig(severity);

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

  const handleSamaritansCall = () => {
    Alert.alert(
      'Samaritans',
      'This will call Samaritans (116 123). Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 116 123', style: 'default', onPress: () => Linking.openURL('tel:116123') },
      ]
    );
  };

  const handleDomesticAbuseCall = () => {
    Alert.alert(
      'National Domestic Abuse Helpline',
      'This will call the National Domestic Abuse Helpline (0808 2000 247). Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 0808 2000 247', style: 'default', onPress: () => Linking.openURL('tel:08082000247') },
      ]
    );
  };

  return (
    <View style={[styles.container, { borderColor: config.color }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name={config.icon as any} size={24} color={config.color} />
          <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.message}>{config.message}</Text>
      
      <View style={styles.actions}>
        {config.urgent && (
          <TouchableOpacity style={[styles.emergencyButton, { backgroundColor: config.color }]} onPress={handleEmergencyCall}>
            <Ionicons name="call" size={20} color="white" />
            <Text style={styles.emergencyButtonText}>Call 999</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.helpButton} onPress={onGetHelp}>
          <Ionicons name="help-circle" size={20} color={theme.colors.primary} />
          <Text style={styles.helpButtonText}>Get Help</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={handleSamaritansCall}>
          <Text style={styles.quickActionText}>Samaritans: 116 123</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAction} onPress={handleDomesticAbuseCall}>
          <Text style={styles.quickActionText}>Domestic Abuse: 0808 2000 247</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
    fontFamily: 'Inter',
  },
  dismissButton: {
    padding: 4,
  },
  message: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  helpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: 8,
  },
  helpButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  quickActions: {
    gap: 8,
  },
  quickAction: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(79, 209, 199, 0.1)',
    borderRadius: 6,
    alignItems: 'center',
  },
  quickActionText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
});
