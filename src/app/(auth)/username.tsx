/**
 * Username Creation Screen
 * Simple username-only registration
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { profileService } from '@/lib/profileService';
import { Ionicons } from '@expo/vector-icons';

export default function UsernameScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateUsername = async () => {
    if (!username.trim()) {
      Alert.alert('Username Required', 'Please enter a username to continue.');
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert('Username Too Short', 'Username must be at least 3 characters long.');
      return;
    }

    if (username.trim().length > 20) {
      Alert.alert('Username Too Long', 'Username must be 20 characters or less.');
      return;
    }

    // Check for valid characters (alphanumeric and underscore only)
    const validUsernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!validUsernameRegex.test(username.trim())) {
      Alert.alert('Invalid Username', 'Username can only contain letters, numbers, and underscores.');
      return;
    }

    // Navigate to PIN setup screen
    router.push({
      pathname: '/(auth)/pin-setup',
      params: { username: username.trim() }
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 60,
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    backButton: {
      position: 'absolute',
      left: 0,
      top: 0,
      padding: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    form: {
      flex: 1,
      justifyContent: 'center',
    },
    inputContainer: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    input: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 16,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
    },
    inputFocused: {
      borderColor: colors.primary,
    },
    requirements: {
      marginTop: 8,
    },
    requirementText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    buttonContainer: {
      marginTop: 32,
    },
    createButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    createButtonDisabled: {
      backgroundColor: colors.border,
    },
    createButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    backToWelcomeButton: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    backToWelcomeText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <Text style={styles.title}>Create Username</Text>
          <Text style={styles.subtitle}>
            Choose a username to personalize your experience
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[
                styles.input,
                username.length > 0 && styles.inputFocused
              ]}
              placeholder="Enter your username"
              placeholderTextColor={colors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              editable={!isLoading}
            />
            <View style={styles.requirements}>
              <Text style={styles.requirementText}>
                • 3-20 characters long
              </Text>
              <Text style={styles.requirementText}>
                • Letters, numbers, and underscores only
              </Text>
              <Text style={styles.requirementText}>
                • This will be your display name
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.createButton,
                (!username.trim() || isLoading) && styles.createButtonDisabled
              ]}
              onPress={handleCreateUsername}
              disabled={!username.trim() || isLoading}
            >
              <Text style={styles.createButtonText}>
                {isLoading ? 'Creating Account...' : 'Continue'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToWelcomeButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backToWelcomeText}>Back to Welcome</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
