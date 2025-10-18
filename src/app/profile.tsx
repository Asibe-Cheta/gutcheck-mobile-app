/**
 * Profile Screen
 * User profile management with avatar upload
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileService, ProfileData } from '@/lib/profileService';

interface LocalProfileData {
  username: string;
  age: string;
  region: string;
  avatarUri?: string;
  struggles?: string;
  goals?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  
  const [profileData, setProfileData] = useState<LocalProfileData>({
    username: '',
    age: '',
    region: '',
    avatarUri: undefined,
    struggles: '',
    goals: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      // First try to load from database
      const dbProfile = await profileService.getProfile();
      if (dbProfile) {
        setProfileData({
          username: dbProfile.username,
          age: dbProfile.age.toString(),
          region: dbProfile.region,
          avatarUri: dbProfile.avatar_url,
          struggles: dbProfile.struggles || '',
          goals: dbProfile.goals || ''
        });
        return;
      }

      // Fallback to local storage
      const savedProfile = await AsyncStorage.getItem('user_profile');
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfileData = async (data: LocalProfileData) => {
    try {
      // Save to database
      await profileService.saveProfile({
        username: data.username,
        age: parseInt(data.age),
        region: data.region,
        avatar_url: data.avatarUri,
        struggles: data.struggles,
        goals: data.goals
      });
      
      setProfileData(data);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile data');
    }
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newProfileData = {
          ...profileData,
          avatarUri: result.assets[0].uri
        };
        await saveProfileData(newProfileData);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const handleSave = async () => {
    if (!profileData.username.trim()) {
      Alert.alert('Required Field', 'Please enter your username');
      return;
    }

    if (!profileData.age.trim()) {
      Alert.alert('Required Field', 'Please enter your age');
      return;
    }

    if (!profileData.region.trim()) {
      Alert.alert('Required Field', 'Please enter your region');
      return;
    }

    setIsLoading(true);
    try {
      await saveProfileData(profileData);
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAvatar = () => {
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            const newProfileData = { ...profileData, avatarUri: undefined };
            await saveProfileData(newProfileData);
          }
        }
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: `${colors.background}CC`,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Inter',
    },
    saveButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    saveButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Inter',
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      fontFamily: 'Inter',
    },
    avatarSection: {
      alignItems: 'center',
    },
    avatarContainer: {
      marginBottom: 16,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarActions: {
      flexDirection: 'row',
      gap: 16,
    },
    avatarButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: `${colors.primary}15`,
      borderWidth: 1,
      borderColor: `${colors.primary}30`,
    },
    avatarButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 8,
      fontFamily: 'Inter',
    },
    removeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: `${colors.error}15`,
      borderWidth: 1,
      borderColor: `${colors.error}30`,
    },
    removeButtonText: {
      color: colors.error,
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 6,
      fontFamily: 'Inter',
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      fontFamily: 'Inter',
    },
    textInput: {
      backgroundColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      fontFamily: 'Inter',
      borderWidth: 1,
      borderColor: colors.border,
    },
    textArea: {
      minHeight: 100,
      paddingTop: 12,
    },
    sectionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
      fontFamily: 'Inter',
    },
    privacyNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 16,
      backgroundColor: `${colors.primary}15`,
      borderRadius: 8,
      marginBottom: 20,
    },
    privacyText: {
      flex: 1,
      marginLeft: 12,
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
      fontFamily: 'Inter',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={[styles.saveButtonText, isLoading && styles.saveButtonDisabled]}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {profileData.avatarUri ? (
                <Image source={{ uri: profileData.avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color={colors.textSecondary} />
                </View>
              )}
            </View>
            <View style={styles.avatarActions}>
              <TouchableOpacity style={styles.avatarButton} onPress={handleImagePicker}>
                <Ionicons name="camera" size={20} color={colors.primary} />
                <Text style={styles.avatarButtonText}>Upload Photo</Text>
              </TouchableOpacity>
              {profileData.avatarUri && (
                <TouchableOpacity style={styles.removeButton} onPress={handleRemoveAvatar}>
                  <Ionicons name="trash" size={16} color={colors.error} />
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username *</Text>
            <TextInput
              style={styles.textInput}
              value={profileData.username}
              onChangeText={(text) => setProfileData({ ...profileData, username: text })}
              placeholder="Enter your username"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Age */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age *</Text>
            <TextInput
              style={styles.textInput}
              value={profileData.age}
              onChangeText={(text) => setProfileData({ ...profileData, age: text })}
              placeholder="Enter your age"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          {/* Region */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Region *</Text>
            <TextInput
              style={styles.textInput}
              value={profileData.region}
              onChangeText={(text) => setProfileData({ ...profileData, region: text })}
              placeholder="Enter your region/country"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Optional Personal Context Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Context (Optional)</Text>
          <Text style={styles.sectionDescription}>
            This information helps the AI provide more personalized support. It's completely optional and will only be 
            referenced when relevant to your conversations.
          </Text>
          
          {/* Struggles */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Things I'm Struggling With</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={profileData.struggles}
              onChangeText={(text) => setProfileData({ ...profileData, struggles: text })}
              placeholder="E.g., low self-esteem, anxiety, trust issues, past trauma..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Goals */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Things I Want to Work On</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={profileData.goals}
              onChangeText={(text) => setProfileData({ ...profileData, goals: text })}
              placeholder="E.g., setting better boundaries, building confidence, recognizing red flags..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <Text style={styles.privacyText}>
            Your profile information is stored locally on your device and is not shared with third parties.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
