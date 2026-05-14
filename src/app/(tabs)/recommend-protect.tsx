import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/lib/themeContext';
import { getThemeColors } from '@/lib/theme';
import {
  recommendProtectService,
  isSupabaseReferralBackendActive,
  type RecommendationSlot,
  type ShareChannel,
  type RecommendProtectDebugState,
} from '@/lib/recommendProtectService';
import { notificationService } from '@/lib/notifications';
import { getReferralVerifyBaseUrl, isReferralVerificationEnabled } from '@/lib/externalUrls';

function statusColor(status: RecommendationSlot['status'], colors: ReturnType<typeof getThemeColors>) {
  if (status === 'Downloaded') return colors.success;
  if (status === 'Opened') return colors.primary;
  if (status === 'Sent') return colors.warning;
  return colors.textSecondary;
}

export default function RecommendProtectScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [slots, setSlots] = useState<RecommendationSlot[]>([]);
  const [summary, setSummary] = useState({ total: 5, used: 0, remaining: 5 });
  const [templates, setTemplates] = useState<Record<ShareChannel, string> | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ShareChannel>('other');
  const [templateDraft, setTemplateDraft] = useState('');
  const [pushOptIn, setPushOptIn] = useState(false);
  const [verificationEnabled, setVerificationEnabled] = useState(false);
  const [verificationBaseUrl, setVerificationBaseUrl] = useState('');
  const [supabaseReferralBackend, setSupabaseReferralBackend] = useState(false);
  const [hasAccountContext, setHasAccountContext] = useState(false);
  const [debugState, setDebugState] = useState<RecommendProtectDebugState>({});

  const load = useCallback(async () => {
    const [nextSlots, nextSummary] = await Promise.all([
      recommendProtectService.getSlots(),
      recommendProtectService.getSummary(),
    ]);
    const savedTemplates = await recommendProtectService.getShareTemplates();
    const optedIn = await notificationService.isRecommendProtectPushOptedIn();
    const debug = await recommendProtectService.getDebugState();
    const userId = await AsyncStorage.getItem('user_id');
    setVerificationEnabled(isReferralVerificationEnabled());
    setVerificationBaseUrl(getReferralVerifyBaseUrl());
    setSupabaseReferralBackend(isSupabaseReferralBackendActive());
    setHasAccountContext(!!userId);
    setDebugState(debug);
    setSlots(nextSlots);
    setSummary(nextSummary);
    setTemplates(savedTemplates);
    setTemplateDraft(savedTemplates[selectedChannel] || '');
    if (nextSummary.remaining <= 0 && optedIn) {
      await notificationService.cancelRecommendProtectOneTimePrompt();
      setPushOptIn(false);
    } else {
      setPushOptIn(optedIn);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {});
    }, [load])
  );

  const handleShareNow = async () => {
    if (summary.remaining <= 0) {
      Alert.alert('All recommendations used', 'You have already used all 5 recommendation slots.');
      return;
    }

    const referral = await recommendProtectService.previewNextReferral();
    if (!referral) return;
    const sharePayload = await recommendProtectService.buildSharePayload(selectedChannel, referral.link);

    const result = await Share.share({
      message: sharePayload.message,
      title: 'Share GutChecks: Red Flags & Safety',
      ...(sharePayload.subject ? { subject: sharePayload.subject } : {}),
    });

    if (result.action === Share.sharedAction) {
      const method = result.activityType || 'native_share';
      const consumed = await recommendProtectService.consumeNextSlot(method, referral?.token);
      if (!consumed) {
        Alert.alert(
          'Share not counted yet',
          verificationEnabled
            ? isSupabaseReferralBackendActive()
              ? 'Could not confirm with Supabase. Apply database/migration_referral_slots.sql in the SQL editor, then try again.'
              : 'Server-side slot verification is required and could not be confirmed for this share.'
            : 'We could not verify this share yet. Please try again shortly.'
        );
      }
      await load();
    }
  };

  const handleSelectChannel = (channel: ShareChannel) => {
    setSelectedChannel(channel);
    if (templates) {
      setTemplateDraft(templates[channel] || '');
    }
  };

  const handleSaveTemplate = async () => {
    await recommendProtectService.saveShareTemplate(selectedChannel, templateDraft);
    const updated = await recommendProtectService.getShareTemplates();
    setTemplates(updated);
    setTemplateDraft(updated[selectedChannel] || '');
    Alert.alert('Saved', 'Template updated for this channel.');
  };

  const handleToggleRecommendPush = async (enabled: boolean) => {
    if (summary.remaining <= 0) {
      Alert.alert('Unavailable', 'All 5 slots are used, so recommendation prompts are disabled.');
      return;
    }

    if (enabled) {
      const scheduled = await notificationService.scheduleRecommendProtectOneTimePrompt(24);
      setPushOptIn(scheduled);
      if (!scheduled) {
        Alert.alert('Not enabled', 'This one-time reminder may already be used or permissions are disabled.');
      }
      return;
    }

    await notificationService.cancelRecommendProtectOneTimePrompt();
    setPushOptIn(false);
  };

  const handleResetDebugState = async () => {
    await recommendProtectService.resetDebugState();
    setDebugState({});
    Alert.alert('Reset', 'Referral debug state has been cleared.');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Recommend & Protect</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Share GutChecks through your device share sheet only. No recipient names, contacts, or messages are stored in-app.
        </Text>

        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
            {summary.used} of {summary.total} recommendations sent
          </Text>
          <Text style={[styles.summarySubText, { color: colors.textSecondary }]}>
            Remaining slots: {summary.remaining}
          </Text>
        </View>

        <View style={[styles.pushCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.pushRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pushTitle, { color: colors.textPrimary }]}>One-time share reminder</Text>
              <Text style={[styles.pushHint, { color: colors.textSecondary }]}>
                Optional. Sends one reminder notification per install. Automatically disabled when 5 of 5 slots are used.
              </Text>
            </View>
            <Switch
              value={pushOptIn}
              onValueChange={handleToggleRecommendPush}
              trackColor={{ false: colors.border, true: colors.primary + '88' }}
              thumbColor={pushOptIn ? colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.pushCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.pushTitle, { color: colors.textPrimary }]}>Referral verification mode</Text>
          <Text style={[styles.pushHint, { color: colors.textSecondary }]}>
            Status: {verificationEnabled ? 'enabled' : 'disabled'}{'\n'}
            Backend: {supabaseReferralBackend ? 'Supabase (referral_reserve_slot / referral_verify_event)' : `HTTP ${verificationBaseUrl}`}{'\n'}
            Account context: {hasAccountContext ? 'present' : 'missing'}{'\n'}
            RP-06 server enforcement: {verificationEnabled && hasAccountContext ? 'active' : 'inactive'}
          </Text>
          <Text style={[styles.pushHint, { color: colors.textSecondary, marginTop: 8 }]}>
            Last reservation result: {debugState.lastReservationResult || 'n/a'}{'\n'}
            Last verification result: {debugState.lastVerificationResult || 'n/a'}
          </Text>
          <TouchableOpacity
            style={[styles.resetDebugBtn, { borderColor: colors.border }]}
            onPress={handleResetDebugState}
          >
            <Text style={[styles.resetDebugText, { color: colors.textPrimary }]}>Reset debug state</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.templateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.templateTitle, { color: colors.textPrimary }]}>Share message templates</Text>
          <Text style={[styles.templateHelp, { color: colors.textSecondary }]}>
            Templates are editable per channel and stay warm, mission-led, and all-interactions focused.
          </Text>
          <View style={styles.channelRow}>
            {(['whatsapp', 'sms', 'email', 'copy_link', 'other'] as ShareChannel[]).map((channel) => (
              <TouchableOpacity
                key={channel}
                onPress={() => handleSelectChannel(channel)}
                style={[
                  styles.channelChip,
                  {
                    borderColor: colors.border,
                    backgroundColor: selectedChannel === channel ? colors.primary : colors.surface,
                  },
                ]}
              >
                <Text style={{ color: selectedChannel === channel ? '#fff' : colors.textPrimary, fontSize: 12, fontWeight: '600' }}>
                  {channel.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={templateDraft}
            onChangeText={setTemplateDraft}
            multiline
            style={[
              styles.templateInput,
              {
                color: colors.textPrimary,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
            placeholder="Write share template. Use [LINK] where referral link should appear."
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity style={[styles.saveTemplateBtn, { backgroundColor: colors.primary }]} onPress={handleSaveTemplate}>
            <Text style={styles.saveTemplateText}>Save template</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.slotList}>
          {slots.map((slot) => (
            <View key={slot.slotNumber} style={[styles.slotCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.slotHeader}>
                <Text style={[styles.slotTitle, { color: colors.textPrimary }]}>Recommendation {slot.slotNumber}</Text>
                <View style={[styles.badge, { backgroundColor: statusColor(slot.status, colors) + '22' }]}>
                  <Text style={[styles.badgeText, { color: statusColor(slot.status, colors) }]}>{slot.status}</Text>
                </View>
              </View>
              <Text style={[styles.slotMeta, { color: colors.textSecondary }]}>
                Method: {slot.method || '—'}
              </Text>
              <Text style={[styles.slotMeta, { color: colors.textSecondary }]}>
                Sent: {slot.usedAt ? new Date(slot.usedAt).toLocaleDateString() : '—'}
              </Text>
              {slot.status !== 'Available' && (
                <Text style={[styles.slotMeta, { color: colors.textSecondary }]}>
                  Opened: {slot.openedAt ? new Date(slot.openedAt).toLocaleDateString() : '—'}
                </Text>
              )}
              {slot.status === 'Downloaded' && (
                <Text style={[styles.slotMeta, { color: colors.textSecondary }]}>
                  Downloaded: {slot.downloadedAt ? new Date(slot.downloadedAt).toLocaleDateString() : '—'}
                </Text>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: summary.remaining > 0 ? colors.primary : colors.border }]}
          onPress={handleShareNow}
          disabled={summary.remaining <= 0}
        >
          <Ionicons name="share-social-outline" size={18} color="#fff" />
          <Text style={styles.shareButtonText}>
            {summary.remaining > 0 ? 'Share with one person' : 'All 5 slots used'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.privacyNote, { color: colors.textSecondary }]}>
          Privacy note: tracking is limited to slot-level status events (sent, opened, downloaded) and aggregate analytics.
          It is not used to identify a person.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  summaryText: { fontSize: 18, fontWeight: '700' },
  summarySubText: { fontSize: 13, marginTop: 4 },
  templateCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  pushCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  pushRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pushTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  pushHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  resetDebugBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resetDebugText: {
    fontSize: 12,
    fontWeight: '600',
  },
  templateTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  templateHelp: { fontSize: 12, lineHeight: 18, marginBottom: 10 },
  channelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  channelChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  templateInput: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top',
    marginBottom: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  saveTemplateBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveTemplateText: {
    color: '#fff',
    fontWeight: '700',
  },
  slotList: { gap: 10, marginBottom: 16 },
  slotCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotTitle: { fontSize: 16, fontWeight: '600' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  slotMeta: { fontSize: 13, marginTop: 2 },
  shareButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  shareButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  privacyNote: { fontSize: 12, lineHeight: 18 },
});

