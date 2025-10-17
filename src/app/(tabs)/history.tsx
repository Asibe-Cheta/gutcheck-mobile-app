/**
 * History Screen
 * Custom design based on provided HTML
 * Shows analysis history and pattern tracking
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useChatHistoryStore, SavedChat } from '@/lib/stores/chatHistoryStore';

const { width } = Dimensions.get('window');

// Chat History Item Component
const ChatHistoryItem = ({ 
  chat, 
  onPress, 
  onDelete, 
  isLast = false,
  colors,
  styles
}: { 
  chat: SavedChat; 
  onPress: () => void; 
  onDelete: () => void;
  isLast?: boolean;
  colors: any;
  styles: any;
}) => {
  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'high': return colors.warning;
      case 'critical': return '#ff4444';
      case 'medium': return colors.primary;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const getRiskIcon = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'high': return 'warning';
      case 'critical': return 'alert-circle';
      case 'medium': return 'information-circle';
      case 'low': return 'checkmark-circle';
      default: return 'chatbubble';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1}d ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress}>
      <View style={styles.chatItemContent}>
        <View style={[styles.chatIcon, { backgroundColor: getRiskColor(chat.analysisData?.riskLevel) }]}>
          <Ionicons name={getRiskIcon(chat.analysisData?.riskLevel) as any} size={20} color="white" />
        </View>
        <View style={styles.chatContent}>
          <Text style={styles.chatTitle} numberOfLines={1}>{chat.title}</Text>
          <Text style={styles.chatSubtitle} numberOfLines={2}>
            {chat.messages[0]?.content || 'No messages'}
          </Text>
          <View style={styles.chatMeta}>
            <Text style={styles.chatDate}>{formatDate(chat.createdAt)}</Text>
            {chat.analysisData?.riskLevel && (
              <Text style={[styles.riskLevel, { color: getRiskColor(chat.analysisData.riskLevel) }]}>
                {chat.analysisData.riskLevel.toUpperCase()}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      {!isLast && <View style={styles.chatDivider} />}
    </TouchableOpacity>
  );
};

// Pattern Chart Component
const PatternChart = ({ styles, colors }: { styles: any; colors: any }) => (
  <View style={styles.chartContainer}>
    <Svg width="100%" height={160} viewBox="0 0 300 100" preserveAspectRatio="none">
      <Path
        d="M 0 50 C 50 20, 50 80, 100 60 S 150 0, 200 40 S 250 100, 300 80"
        fill="none"
        stroke={colors.primary}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M 0 100 V 50 C 50 20, 50 80, 100 60 S 150 0, 200 40 S 250 100, 300 80 V 100 Z"
        fill={`${colors.primary}20`}
      />
    </Svg>
    <View style={styles.chartLabels}>
      <Text style={styles.chartLabel}>Jan</Text>
      <Text style={styles.chartLabel}>Feb</Text>
      <Text style={styles.chartLabel}>Mar</Text>
    </View>
  </View>
);

// Stat Card Component
const StatCard = ({ 
  label, 
  value, 
  isFullWidth = false,
  styles
}: {
  label: string;
  value: string;
  isFullWidth?: boolean;
  styles: any;
}) => (
  <View style={[styles.statCard, isFullWidth && styles.statCardFull]}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

export default function HistoryScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const currentTheme = getThemeColors(isDark);
  const { savedChats, isLoading, loadChats, deleteChat } = useChatHistoryStore();
  const [editingTitle, setEditingTitle] = useState<string | null>(null);

  useEffect(() => {
    loadChats();
  }, []);

  const handleChatPress = (chat: SavedChat) => {
    // Navigate to chat with saved conversation
    router.push({
      pathname: '/chat',
      params: { 
        chatId: chat.id,
        isFromHistory: 'true'
      }
    });
  };

  const handleDeleteChat = (chat: SavedChat) => {
    Alert.alert(
      'Delete Chat',
      `Are you sure you want to delete "${chat.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteChat(chat.id)
        }
      ]
    );
  };

  const getStats = () => {
    const totalChats = savedChats.length;
    const highRiskChats = savedChats.filter(chat => 
      chat.analysisData?.riskLevel === 'high' || chat.analysisData?.riskLevel === 'critical'
    ).length;
    const patterns = savedChats.reduce((acc, chat) => {
      chat.analysisData?.patterns?.forEach(pattern => {
        acc[pattern] = (acc[pattern] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    return { totalChats, highRiskChats, patterns };
  };

  const stats = getStats();

  const styles = createStyles(currentTheme);
  
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
        <Text style={styles.title}>History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Chat History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Conversations</Text>
          {savedChats.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={currentTheme.textSecondary} />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>Start a conversation to see your history here</Text>
            </View>
          ) : (
            <View style={styles.chatList}>
              {savedChats.map((chat, index) => (
                <ChatHistoryItem
                  key={chat.id}
                  chat={chat}
                  onPress={() => handleChatPress(chat)}
                  onDelete={() => handleDeleteChat(chat)}
                  isLast={index === savedChats.length - 1}
                  colors={currentTheme}
                  styles={styles}
                />
              ))}
            </View>
          )}
        </View>

        {/* Pattern Tracking Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pattern Tracking</Text>
          <View style={styles.patternCard}>
            <View style={styles.patternHeader}>
              <View>
                <Text style={styles.patternTitle}>Relationship Health</Text>
                <Text style={styles.patternSubtitle}>Last 3 Months</Text>
              </View>
              <View style={styles.patternStats}>
                <Text style={styles.patternPercentage}>75%</Text>
                <View style={styles.patternTrend}>
                  <Ionicons name="arrow-up" size={16} color={currentTheme.success} />
                  <Text style={styles.patternTrendText}>10%</Text>
                </View>
              </View>
            </View>
            <PatternChart styles={styles} colors={currentTheme} />
          </View>
        </View>

        {/* Quick Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Total Chats" value={stats.totalChats.toString()} styles={styles} />
            <StatCard label="High Risk" value={stats.highRiskChats.toString()} styles={styles} />
            <StatCard label="Patterns Found" value={Object.keys(stats.patterns).length.toString()} isFullWidth styles={styles} />
          </View>
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
  },
  title: {
    flex: 1,
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  headerSpacer: {
    width: 40, // w-10
  },
  content: {
    flex: 1,
    padding: 16, // p-4
    gap: 32, // space-y-8
  },
  section: {
    marginBottom: 32, // space-y-8
  },
  sectionTitle: {
    fontSize: 20, // text-xl
    fontWeight: '700', // font-bold
    color: colors.textPrimary,
    marginBottom: 16, // mb-4
    fontFamily: 'Inter',
  },
  // Timeline Styles
  timelineContainer: {
    position: 'relative',
    paddingLeft: 32, // pl-8
    gap: 32, // space-y-8
  },
  timelineItem: {
    position: 'relative',
    paddingLeft: 32, // -left-8 equivalent
  },
  timelineIcon: {
    position: 'absolute',
    left: -32, // -left-8
    top: 4, // top-1
    width: 32, // w-8
    height: 32, // h-8
    borderRadius: 16, // rounded-full
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    marginLeft: 8,
  },
  timelineTitle: {
    fontSize: 16, // font-semibold
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: 'Inter',
  },
  timelineSubtitle: {
    fontSize: 14, // text-sm
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  timelineLine: {
    position: 'absolute',
    left: -32, // -left-8
    top: 36, // top-2
    bottom: -32, // bottom-2
    width: 2, // w-0.5
    backgroundColor: colors.glassBorder,
  },
  // Pattern Tracking Styles
  patternCard: {
    backgroundColor: colors.surface,
    padding: 24, // p-6
    borderRadius: 8, // rounded-lg
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16, // mt-4
  },
  patternTitle: {
    fontSize: 16, // font-semibold
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: 'Inter',
  },
  patternSubtitle: {
    fontSize: 14, // text-sm
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  patternStats: {
    alignItems: 'flex-end',
  },
  patternPercentage: {
    fontSize: 30, // text-3xl
    fontWeight: '700', // font-bold
    color: colors.success,
    fontFamily: 'Inter',
  },
  patternTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  patternTrendText: {
    fontSize: 14, // text-sm
    fontWeight: '500', // font-medium
    color: colors.success,
    fontFamily: 'Inter',
  },
  chartContainer: {
    height: 160, // h-40
    marginTop: 16, // mt-4
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8, // mt-2
  },
  chartLabel: {
    fontSize: 12, // text-xs
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  // Stats Grid Styles
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16, // gap-4
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    padding: 16, // p-4
    borderRadius: 8, // rounded-lg
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  statCardFull: {
    minWidth: '100%',
  },
  statLabel: {
    fontSize: 14, // text-sm
    fontWeight: '500', // font-medium
    color: colors.textSecondary,
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  statValue: {
    fontSize: 24, // text-2xl
    fontWeight: '700', // font-bold
    color: colors.textPrimary,
    fontFamily: 'Inter',
  },
  // Chat History Styles
  chatList: {
    gap: 0,
  },
  chatItem: {
    backgroundColor: colors.surface,
    marginBottom: 1,
  },
  chatItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  chatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  chatSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  chatMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatDate: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  riskLevel: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatDivider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginLeft: 68,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
});
