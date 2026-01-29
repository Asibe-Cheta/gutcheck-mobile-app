/**
 * Country Dropdown Component
 * International countries with search functionality
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom', hasCouncilAreas: true },
  { code: 'US', name: 'United States', hasCouncilAreas: false },
  { code: 'CA', name: 'Canada', hasCouncilAreas: false },
  { code: 'AU', name: 'Australia', hasCouncilAreas: false },
  { code: 'IE', name: 'Ireland', hasCouncilAreas: false },
  { code: 'NZ', name: 'New Zealand', hasCouncilAreas: false },
  { code: 'ZA', name: 'South Africa', hasCouncilAreas: false },
  { code: 'IN', name: 'India', hasCouncilAreas: false },
  { code: 'PK', name: 'Pakistan', hasCouncilAreas: false },
  { code: 'BD', name: 'Bangladesh', hasCouncilAreas: false },
  { code: 'NG', name: 'Nigeria', hasCouncilAreas: false },
  { code: 'KE', name: 'Kenya', hasCouncilAreas: false },
  { code: 'GH', name: 'Ghana', hasCouncilAreas: false },
  { code: 'FR', name: 'France', hasCouncilAreas: false },
  { code: 'DE', name: 'Germany', hasCouncilAreas: false },
  { code: 'ES', name: 'Spain', hasCouncilAreas: false },
  { code: 'IT', name: 'Italy', hasCouncilAreas: false },
  { code: 'NL', name: 'Netherlands', hasCouncilAreas: false },
  { code: 'BE', name: 'Belgium', hasCouncilAreas: false },
  { code: 'SE', name: 'Sweden', hasCouncilAreas: false },
  { code: 'NO', name: 'Norway', hasCouncilAreas: false },
  { code: 'DK', name: 'Denmark', hasCouncilAreas: false },
  { code: 'FI', name: 'Finland', hasCouncilAreas: false },
  { code: 'PL', name: 'Poland', hasCouncilAreas: false },
  { code: 'OTHER', name: 'Other', hasCouncilAreas: false },
];

interface CountryDropdownProps {
  value: string;
  onValueChange: (value: string, hasCouncilAreas: boolean) => void;
  placeholder?: string;
  error?: string;
}

export default function CountryDropdown({ value, onValueChange, placeholder = "Select your country", error }: CountryDropdownProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCountries, setFilteredCountries] = useState(COUNTRIES);
  const searchInputRef = useRef<TextInput>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredCountries(COUNTRIES);
    } else {
      const filtered = COUNTRIES.filter(country =>
        country.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  };

  const handleSelect = (country: typeof COUNTRIES[0]) => {
    onValueChange(country.name, country.hasCouncilAreas);
    setIsOpen(false);
    setSearchQuery('');
    setFilteredCountries(COUNTRIES);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setSearchQuery('');
    setFilteredCountries(COUNTRIES);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
    setFilteredCountries(COUNTRIES);
  };

  const renderCountryItem = ({ item }: { item: typeof COUNTRIES[0] }) => (
    <TouchableOpacity
      style={[
        styles.countryItem,
        { 
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text style={[styles.countryText, { color: colors.text }]}>
        {item.name}
      </Text>
      {value === item.name && (
        <Ionicons name="checkmark" size={20} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
    },
    dropdownButton: {
      backgroundColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: error ? colors.error : colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 48,
    },
    dropdownButtonText: {
      fontSize: 16,
      color: value ? colors.text : colors.textSecondary,
      fontFamily: 'Inter',
      flex: 1,
    },
    dropdownIcon: {
      marginLeft: 8,
    },
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: Dimensions.get('window').height * 0.7,
      paddingTop: 20,
    },
    searchContainer: {
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    searchInput: {
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
    countriesList: {
      maxHeight: 400,
    },
    countryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    countryText: {
      fontSize: 16,
      fontFamily: 'Inter',
      flex: 1,
    },
    closeButton: {
      alignItems: 'center',
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      fontFamily: 'Inter',
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
      marginTop: 4,
      fontFamily: 'Inter',
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={handleOpen}
      >
        <Text style={styles.dropdownButtonText}>
          {value || placeholder}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
          style={styles.dropdownIcon}
        />
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.searchContainer}>
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search countries..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
            </View>
            
            <FlatList
              data={filteredCountries}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.code}
              style={styles.countriesList}
              showsVerticalScrollIndicator={false}
            />
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

