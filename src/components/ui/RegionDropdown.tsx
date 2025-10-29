/**
 * Region Dropdown Component
 * UK regions with search functionality
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

const UK_REGIONS = [
  'England',
  'Scotland',
  'Wales',
  'Northern Ireland',
  'London',
  'Greater London',
  'Birmingham',
  'Manchester',
  'Liverpool',
  'Leeds',
  'Sheffield',
  'Bristol',
  'Newcastle',
  'Nottingham',
  'Leicester',
  'Coventry',
  'Bradford',
  'Cardiff',
  'Belfast',
  'Glasgow',
  'Edinburgh',
  'Aberdeen',
  'Dundee',
  'Plymouth',
  'Southampton',
  'Portsmouth',
  'Brighton',
  'Hull',
  'Middlesbrough',
  'Stoke-on-Trent',
  'Wolverhampton',
  'Derby',
  'Swansea',
  'Southampton',
  'Southend-on-Sea',
  'Salford',
  'Aberdeen',
  'Westminster',
  'Milton Keynes',
  'Northampton',
  'Norwich',
  'Luton',
  'Swindon',
  'Exeter',
  'Ipswich',
  'Croydon',
  'Walsall',
  'Maidstone',
  'Oxford',
  'Peterborough',
  'Cambridge',
  'Doncaster',
  'York',
  'Poole',
  'Gloucester',
  'Burnley',
  'Huddersfield',
  'Torbay',
  'Blackpool',
  'Middlesbrough',
  'Bolton',
  'Ipswich',
  'Stockport',
  'Brighton and Hove',
  'West Bromwich',
  'Reading',
  'Oldham',
  'Aldershot',
  'Rotherham',
  'Wigan',
  'Southend-on-Sea',
  'Bournemouth',
  'Grimsby',
  'Halifax',
  'Bath',
  'Hartlepool',
  'Blackburn',
  'Wellingborough',
  'Chesterfield',
  'Mansfield',
  'Crewe',
  'Bedford',
  'Guildford',
  'Chatham',
  'Eastbourne',
  'Basingstoke',
  'Aylesbury',
  'Tamworth',
  'Scunthorpe',
  'Gillingham',
  'Chester',
  'Warrington',
  'Maidenhead',
  'Ashford',
  'Worcester',
  'Rochdale',
  'Solihull',
  'Royal Tunbridge Wells',
  'Royal Leamington Spa',
  'High Wycombe',
  'Gateshead',
  'Harrogate',
  'Slough',
  'Blackburn',
  'Folkestone',
  'Basildon',
  'Canterbury',
  'Carlisle',
  'Cheltenham',
  'Colchester',
  'Crawley',
  'Darlington',
  'Eastleigh',
  'Hastings',
  'Hemel Hempstead',
  'Huddersfield',
  'Huntingdon',
  'Kettering',
  'Kingston upon Hull',
  'Lancaster',
  'Lincoln',
  'Macclesfield',
  'Maidstone',
  'Mansfield',
  'Newbury',
  'Newcastle upon Tyne',
  'Northampton',
  'Norwich',
  'Nuneaton',
  'Preston',
  'Redditch',
  'Rotherham',
  'Rugby',
  'Runcorn',
  'Rushden',
  'Salisbury',
  'Scarborough',
  'Scunthorpe',
  'Shrewsbury',
  'Sittingbourne',
  'Skegness',
  'Sleaford',
  'Slough',
  'Southport',
  'Stafford',
  'Staines',
  'Stevenage',
  'Stockport',
  'Stoke-on-Trent',
  'Stourbridge',
  'Stratford-upon-Avon',
  'Stroud',
  'Sunderland',
  'Sutton Coldfield',
  'Swindon',
  'Tamworth',
  'Taunton',
  'Telford',
  'Tiverton',
  'Torquay',
  'Trowbridge',
  'Truro',
  'Tunbridge Wells',
  'Uxbridge',
  'Wakefield',
  'Walsall',
  'Warrington',
  'Warwick',
  'Watford',
  'Wellingborough',
  'Welwyn Garden City',
  'West Bromwich',
  'Weston-super-Mare',
  'Weymouth',
  'Whitehaven',
  'Widnes',
  'Wigan',
  'Wimbledon',
  'Winchester',
  'Windsor',
  'Woking',
  'Wolverhampton',
  'Worcester',
  'Worthing',
  'Wrexham',
  'Yeovil',
  'York',
  'Yorkshire',
  'Berkshire',
  'Bedfordshire',
  'Buckinghamshire',
  'Cambridgeshire',
  'Cheshire',
  'Cornwall',
  'Cumbria',
  'Derbyshire',
  'Devon',
  'Dorset',
  'Durham',
  'East Riding of Yorkshire',
  'East Sussex',
  'Essex',
  'Gloucestershire',
  'Greater Manchester',
  'Hampshire',
  'Herefordshire',
  'Hertfordshire',
  'Humberside',
  'Huntingdonshire',
  'Isle of Wight',
  'Kent',
  'Lancashire',
  'Leicestershire',
  'Lincolnshire',
  'Merseyside',
  'Middlesex',
  'Norfolk',
  'North Yorkshire',
  'Northamptonshire',
  'Northumberland',
  'Nottinghamshire',
  'Oxfordshire',
  'Rutland',
  'Shropshire',
  'Somerset',
  'South Yorkshire',
  'Staffordshire',
  'Suffolk',
  'Surrey',
  'Tyne and Wear',
  'Warwickshire',
  'West Midlands',
  'West Sussex',
  'West Yorkshire',
  'Wiltshire',
  'Worcestershire',
];

interface RegionDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export default function RegionDropdown({ value, onValueChange, placeholder = "Select your region", error }: RegionDropdownProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRegions, setFilteredRegions] = useState(UK_REGIONS);
  const searchInputRef = useRef<TextInput>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredRegions(UK_REGIONS);
    } else {
      const filtered = UK_REGIONS.filter(region =>
        region.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredRegions(filtered);
    }
  };

  const handleSelect = (region: string) => {
    onValueChange(region);
    setIsOpen(false);
    setSearchQuery('');
    setFilteredRegions(UK_REGIONS);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setSearchQuery('');
    setFilteredRegions(UK_REGIONS);
    // Focus search input after modal opens
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
    setFilteredRegions(UK_REGIONS);
  };

  const renderRegionItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.regionItem,
        { 
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text style={[styles.regionText, { color: colors.text }]}>
        {item}
      </Text>
      {value === item && (
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
    regionsList: {
      maxHeight: 400,
    },
    regionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    regionText: {
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
                placeholder="Search regions..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
            </View>
            
            <FlatList
              data={filteredRegions}
              renderItem={renderRegionItem}
              keyExtractor={(item) => item}
              style={styles.regionsList}
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
