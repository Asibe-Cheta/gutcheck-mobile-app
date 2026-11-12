/**
 * History (PRD 13): every check, newest first, grouped by date, with privacy-safe titles,
 * category filter, loading/offline/error/empty/end states and a 5-second undo on delete.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, Modal, TextInput } from 'react-native';
import { authService } from '@/lib/authService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { useChatHistoryStore, SavedChat } from '@/lib/stores/chatHistoryStore';
import type { CheckCategory } from '@/lib/responsePipeline';
import { exportService } from '@/lib/exportService';
import { useSubscriptionStore } from '@/lib/stores/subscriptionStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppLock } from '@/contexts/AppLockContext';
import { BiometricLockScreen } from '@/components/BiometricLockScreen';

const { width } = Dimensions.get('window');

const CATEGORY_META: Record<CheckCategory, { label: string; icon: string }> = {
  messages: { label: 'Messages', icon: 'chatbubble-ellipses' },
  relationships: { label: 'Relationships', icon: 'heart' },
  friends: { label: 'Friends', icon: 'people' },
  school_work: { label: 'School or work', icon: 'school' },
  family: { label: 'Family', icon: 'home' },
  other: { label: 'Other', icon: 'ellipsis-horizontal-circle' },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Date header: Today, Yesterday, This week, then month and year (PRD 13.2). */
function groupLabel(date: Date): string {
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY_MS);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return 'This week';
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function rowDate(date: Date): string {
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY_MS);
  if (days <= 0) return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function showsSupport(chat: SavedChat): boolean {
  return (
    !!chat.supportShown ||
    chat.messages.some((m) => (m.support?.serviceIds.length ?? 0) > 0 || m.support?.tier === 3)
  );
}

const ChatHistoryItem = ({
  chat,
  onPress,
  onDelete,
  onExport,
  isLast = false,
  showPreview = false,
  colors,
  styles,
}: {
  chat: SavedChat;
  onPress: () => void;
  onDelete: () => void;
  onExport: () => void;
  isLast?: boolean;
  showPreview?: boolean;
  colors: any;
  styles: any;
}) => {
  const preview = showPreview
    ? (chat.messages.find((m) => m.role === 'user')?.content || '').replace(/\s+/g, ' ').trim().slice(0, 60)
    : '';
  const meta = chat.category ? CATEGORY_META[chat.category] : null;
  return (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${chat.title}, ${meta?.label ?? 'Check'}, ${rowDate(chat.createdAt)}`}
    >
      <View style={styles.chatItemContent}>
        <View style={[styles.chatIcon, { backgroundColor: colors.surface }]}>
          <Ionicons name={(meta?.icon ?? 'chatbubble') as any} size={20} color={colors.primary} />
        </View>
        <View style={styles.chatContent}>
          <Text style={styles.chatTitle} numberOfLines={1}>{chat.title}</Text>
          {/* No preview text unless turned on in Settings (PRD 13.2) */}
          {preview ? (
            <Text style={styles.chatDate} numberOfLines={1}>{preview}</Text>
          ) : null}
          <View style={styles.chatMeta}>
            <Text style={styles.chatDate}>
              {meta ? `${meta.label} · ` : ''}
              {rowDate(chat.createdAt)}
            </Text>
            {showsSupport(chat) && (
              <Text style={[styles.riskLevel, { color: colors.primary }]}>Support options</Text>
            )}
          </View>
        </View>
        <View style={styles.chatActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onExport}
            accessibilityRole="button"
            accessibilityLabel="Export as PDF"
          >
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete check"
          >
            <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      {!isLast && <View style={styles.chatDivider} />}
    </TouchableOpacity>
  );
};

export default function HistoryScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const currentTheme = getThemeColors(isDark);
  
  // App lock state - show lock screen when app is locked
  const { isLocked, shouldShowLock } = useAppLock();
  const {
    savedChats,
    loadChats,
    loadMore,
    deleteChat,
    fetchChat,
    hasMore,
    isLoadingMore,
    serverState,
  } = useChatHistoryStore();
  const [showPreviews, setShowPreviews] = useState(false);
  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem('history_show_previews')
        .then((v) => setShowPreviews(v === 'true'))
        .catch(() => undefined);
    }, [])
  );
  const [categoryFilter, setCategoryFilter] = useState<CheckCategory | 'all'>('all');
  // Delete is confirmed, then held for 5 seconds so it can be undone (PRD 13.3).
  const [pendingDelete, setPendingDelete] = useState<SavedChat | null>(null);
  const pendingDeleteRef = useRef<SavedChat | null>(null);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    pendingDeleteRef.current = pendingDelete;
  }, [pendingDelete]);

  const finishPendingDelete = () => {
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    deleteTimer.current = null;
    setPendingDelete((current) => {
      if (current) void deleteChat(current.id);
      return null;
    });
  };

  const undoDelete = () => {
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    deleteTimer.current = null;
    setPendingDelete(null);
  };

  // Leaving the screen completes a pending delete.
  useEffect(() => () => {
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    if (pendingDeleteRef.current) void deleteChat(pendingDeleteRef.current.id);
  }, [deleteChat]);
  // Phones logged in before PINs were saved on the device need the PIN once to sync History.
  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinBusy, setPinBusy] = useState(false);

  const submitPin = async () => {
    setPinBusy(true);
    setPinError(null);
    const result = await authService.confirmPinForSync(pinInput);
    setPinBusy(false);
    if (result.success) {
      setPinPromptOpen(false);
      setPinInput('');
      void loadChats();
    } else {
      setPinError(result.error || 'Please try again.');
    }
  };

  // Authentication check only
  useEffect(() => {
    const checkAuth = async () => {
      const userId = await AsyncStorage.getItem('user_id');
      const isLoggedIn = await AsyncStorage.getItem('is_logged_in');
      
      if (!userId || isLoggedIn !== 'true') {
        router.replace('/(auth)/welcome');
        return;
      }
    };
    
    checkAuth();
    loadChats();
  }, []);

  // Refresh chat history when screen comes into focus
  // This ensures chats saved in other screens appear immediately
  useFocusEffect(
    React.useCallback(() => {
      loadChats();
    }, [loadChats])
  );

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
    Alert.alert('Delete this check?', "This can't be undone after 5 seconds.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (pendingDelete) finishPendingDelete();
          setPendingDelete(chat);
          deleteTimer.current = setTimeout(() => {
            deleteTimer.current = null;
            setPendingDelete(null);
            void deleteChat(chat.id);
          }, 5000);
        },
      },
    ]);
  };

  const handleExportChat = async (listed: SavedChat) => {
    try {
      // Checks from another device are downloaded before export.
      const chat = listed.remoteOnly ? await fetchChat(listed.id) : listed;
      if (!chat || chat.messages.length === 0) {
        Alert.alert("Couldn't open this check", 'Please check your connection and try again.');
        return;
      }
      // Show confirmation dialog first
      Alert.alert(
        'Export Conversation as Evidence',
        'This will create a timestamped PDF of your conversation that can be used as evidence.\n\nThe export will include:\n• All messages with timestamps\n• Risk analysis data\n• Legal notice\n• Secure watermark',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Export PDF',
            onPress: async () => {
              // Convert chat data to export format
              const exportData = {
                chatId: chat.id,
                title: chat.title,
                messages: chat.messages.map(msg => ({
                  role: msg.role,
                  content: msg.content,
                  timestamp: typeof msg.timestamp === 'number' ? msg.timestamp : Date.now(),
                })),
                createdAt: chat.createdAt instanceof Date ? chat.createdAt.getTime() : Date.now(),
                analysis: chat.analysisData ? JSON.stringify(chat.analysisData, null, 2) : undefined,
              };

              // Export as PDF
              await exportService.exportChatAsPDF(exportData);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('[HISTORY] Error exporting chat:', error);
      Alert.alert('Export Error', `Failed to export: ${error?.message || 'Unknown error'}`);
    }
  };

  const visibleChats = savedChats
    .filter((c) => c.id !== pendingDelete?.id)
    .filter((c) => categoryFilter === 'all' || c.category === categoryFilter);
  const presentCategories = (Object.keys(CATEGORY_META) as CheckCategory[]).filter((cat) =>
    savedChats.some((c) => c.category === cat)
  );
  const groups: { label: string; chats: SavedChat[] }[] = [];
  for (const chat of visibleChats) {
    const label = groupLabel(chat.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.chats.push(chat);
    else groups.push({ label, chats: [chat] });
  }

  const styles = createStyles(currentTheme);
  
  // Show lock screen if app is locked (when returning from background)
  if (isLocked && shouldShowLock) {
    return <BiometricLockScreen />;
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={pinPromptOpen} transparent animationType="fade" onRequestClose={() => setPinPromptOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: currentTheme.surface, borderRadius: 16, padding: 20, gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: currentTheme.textPrimary }} accessibilityRole="header">
              Confirm your PIN
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 22, color: currentTheme.textSecondary }}>
              Enter the 4-digit PIN you use to log in. You only need to do this once on this phone.
            </Text>
            <TextInput
              value={pinInput}
              onChangeText={(t) => setPinInput(t.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              autoFocus
              accessibilityLabel="PIN"
              style={{
                minHeight: 52,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: currentTheme.textSecondary,
                color: currentTheme.textPrimary,
                fontSize: 24,
                letterSpacing: 12,
                textAlign: 'center',
              }}
            />
            {pinError ? <Text style={{ fontSize: 15, color: currentTheme.warning }}>{pinError}</Text> : null}
            <TouchableOpacity
              onPress={submitPin}
              disabled={pinBusy || pinInput.length !== 4}
              accessibilityRole="button"
              style={{
                minHeight: 52,
                borderRadius: 12,
                backgroundColor: currentTheme.primary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pinBusy || pinInput.length !== 4 ? 0.5 : 1,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: '700', color: currentTheme.background }}>
                {pinBusy ? 'Checking…' : 'Confirm'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPinPromptOpen(false)}
              accessibilityRole="button"
              style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: currentTheme.primary }}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={200}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 400) {
            void loadMore();
          }
        }}
      >
        {/* Chat History Section */}
        <View style={styles.section}>
          {serverState === 'unavailable' && (
            <TouchableOpacity
              onPress={() => setPinPromptOpen(true)}
              accessibilityRole="button"
              style={{ marginBottom: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: currentTheme.primary }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: currentTheme.textPrimary }}>
                Keep your checks saved to your account
              </Text>
              <Text style={[styles.emptySubtitle, { marginTop: 4, textAlign: 'left' }]}>
                Confirm your PIN once so your History is safe if you change phones.
              </Text>
            </TouchableOpacity>
          )}
          {serverState === 'offline' && savedChats.length > 0 && (
            <Text style={[styles.emptySubtitle, { marginBottom: 12 }]} accessibilityRole="alert">
              You're offline. Showing checks saved on this phone.
            </Text>
          )}

          {presentCategories.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
              {(['all', ...presentCategories] as (CheckCategory | 'all')[]).map((cat) => {
                const selected = categoryFilter === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategoryFilter(cat)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={{
                      minHeight: 36,
                      paddingHorizontal: 14,
                      borderRadius: 18,
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: selected ? currentTheme.primary : currentTheme.border,
                      backgroundColor: selected ? currentTheme.primary : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: '600', color: selected ? currentTheme.background : currentTheme.textPrimary }}>
                      {cat === 'all' ? 'All' : CATEGORY_META[cat].label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {savedChats.length === 0 && serverState === 'loading' ? (
            <View accessibilityLabel="Loading your History" style={{ gap: 12 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} style={{ height: 64, borderRadius: 12, backgroundColor: currentTheme.surface, opacity: 0.6 }} />
              ))}
            </View>
          ) : savedChats.length === 0 && serverState === 'offline' ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>We couldn't load your History.</Text>
              <Text style={styles.emptySubtitle}>Your checks are safe.</Text>
              <TouchableOpacity
                style={{ marginTop: 16, minHeight: 44, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: currentTheme.primary, justifyContent: 'center' }}
                onPress={() => void loadChats()}
                accessibilityRole="button"
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: currentTheme.primary }}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : visibleChats.length === 0 && !pendingDelete && categoryFilter === 'all' ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={currentTheme.textSecondary} />
              <Text style={styles.emptyTitle}>Your checks will appear here</Text>
              <Text style={styles.emptySubtitle}>
                Everything you check is saved privately so you can come back to it.
              </Text>
              <TouchableOpacity
                style={{ marginTop: 16, minHeight: 44, paddingHorizontal: 20, borderRadius: 12, backgroundColor: currentTheme.primary, justifyContent: 'center' }}
                onPress={() => router.push('/chat')}
                accessibilityRole="button"
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: currentTheme.background }}>Start a check</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {groups.map((group) => (
                <View key={group.label} style={{ marginBottom: 16 }}>
                  <Text style={styles.sectionTitle} accessibilityRole="header">{group.label}</Text>
                  <View style={styles.chatList}>
                    {group.chats.map((chat, index) => (
                      <ChatHistoryItem
                        key={chat.id}
                        chat={chat}
                        onPress={() => handleChatPress(chat)}
                        onDelete={() => handleDeleteChat(chat)}
                        onExport={() => handleExportChat(chat)}
                        isLast={index === group.chats.length - 1}
                        showPreview={showPreviews}
                        colors={currentTheme}
                        styles={styles}
                      />
                    ))}
                  </View>
                </View>
              ))}
              {visibleChats.length === 0 && categoryFilter !== 'all' ? (
                <Text style={[styles.emptySubtitle, { paddingVertical: 12 }]}>No checks in this category yet.</Text>
              ) : null}
              {isLoadingMore ? (
                <Text style={[styles.emptySubtitle, { paddingVertical: 12 }]}>Loading more…</Text>
              ) : hasMore ? (
                <TouchableOpacity onPress={() => void loadMore()} style={{ minHeight: 44, justifyContent: 'center' }} accessibilityRole="button">
                  <Text style={[styles.emptySubtitle, { color: currentTheme.primary }]}>Show more</Text>
                </TouchableOpacity>
              ) : serverState === 'ready' && visibleChats.length > 0 ? (
                <Text style={[styles.emptySubtitle, { paddingVertical: 12 }]}>That's everything.</Text>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
      {pendingDelete ? (
        <View
          accessibilityLiveRegion="polite"
          style={{
            position: 'absolute', left: 16, right: 16, bottom: 24, borderRadius: 12, padding: 14,
            backgroundColor: currentTheme.textPrimary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontSize: 16, color: currentTheme.background }}>Check deleted.</Text>
          <TouchableOpacity onPress={undoDelete} accessibilityRole="button" style={{ minHeight: 44, minWidth: 64, alignItems: 'flex-end', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: currentTheme.background }}>Undo</Text>
          </TouchableOpacity>
        </View>
      ) : null}
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
  chatActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
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
