import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/themeContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { notificationService } from '@/lib/notifications';
import { shareNudgeService } from '@/lib/shareNudgeService';
import { profileService, type AwarenessHubStateBlob } from '@/lib/profileService';
import { isSupabaseConfigured } from '@/lib/supabase';

type PillarFilter = 'harmful' | 'healthy' | 'all';
type TrackState = 'Locked' | 'In progress' | 'Completed';
type AgeBand = 'Junior (under 13)' | 'Teen (13-15)' | 'Older Teen (16-17)' | 'Young Adult (18-25)' | 'Adult (26+)';

interface HubTrack {
  id: string;
  title: string;
  pillar: 'harmful' | 'healthy';
  environment: string;
  level: number;
  progress: number;
  state: TrackState;
}

interface TrackProgressMap {
  [trackId: string]: {
    level: number;
    progress: number;
    state: TrackState;
  };
}

interface HubQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'scenario_match' | 'reflective_short';
  prompt: string;
  options?: string[];
  correctIndex?: number;
  reorderTarget?: string[];
  explanation: string;
  ageBands: AgeBand[];
}

const STORAGE = {
  AGE_BAND: '@awareness_hub_age_band_v1',
  JUNIOR_CONSENT: '@awareness_hub_junior_consent_v1',
  TRACK_PROGRESS: '@awareness_hub_track_progress_v1',
  STREAK: '@awareness_hub_streak_v1',
  LAST_ACTIVE_DATE: '@awareness_hub_last_active_date_v1',
  REMINDERS_ENABLED: '@awareness_hub_reminders_enabled_v1',
  HUB_SYNC_UPDATED_AT: '@awareness_hub_sync_updated_at_v1',
};

const TRACKS: HubTrack[] = [
  { id: 'H-01', title: 'What does healthy look like?', pillar: 'healthy', environment: 'All environments', level: 1, progress: 35, state: 'In progress' },
  { id: 'T-06', title: 'Manipulation and gaslighting', pillar: 'harmful', environment: 'All environments', level: 1, progress: 0, state: 'Locked' },
  { id: 'T-07', title: 'Online grooming awareness', pillar: 'harmful', environment: 'Online', level: 1, progress: 0, state: 'Locked' },
  { id: 'H-02', title: 'Healthy communication', pillar: 'healthy', environment: 'All interactions', level: 1, progress: 0, state: 'Locked' },
  { id: 'H-03', title: 'Setting and respecting boundaries', pillar: 'healthy', environment: 'All environments', level: 1, progress: 0, state: 'Locked' },
];

const AGE_BANDS: AgeBand[] = [
  'Junior (under 13)',
  'Teen (13-15)',
  'Older Teen (16-17)',
  'Young Adult (18-25)',
  'Adult (26+)',
];

const QUESTION_BANK: Record<string, HubQuestion[]> = {
  'H-01': [
    {
      id: 'h01-q1',
      type: 'true_false',
      prompt: 'If someone pressures you to hide a harmful secret, is that healthy?',
      options: ['Yes', 'No'],
      correctIndex: 1,
      explanation: 'Healthy interactions do not rely on pressure, secrecy, or fear.',
      ageBands: AGE_BANDS,
    },
    {
      id: 'h01-q2',
      type: 'scenario_match',
      prompt: 'Which response best reflects a healthy boundary?',
      options: ['I owe you an answer now', 'I need time to think, and I will reply later', 'If you are upset, I must say yes'],
      correctIndex: 1,
      explanation: 'Healthy communication allows respectful limits and time to think.',
      ageBands: AGE_BANDS,
    },
    {
      id: 'h01-q3',
      type: 'multiple_choice',
      prompt: 'A respectful disagreement should include:',
      options: ['Insults', 'Listening and clear boundaries', 'Threats'],
      correctIndex: 1,
      explanation: 'Listening, respect, and boundaries are core healthy skills.',
      ageBands: AGE_BANDS,
    },
    {
      id: 'h01-q4',
      type: 'multiple_choice',
      prompt: 'If a friend constantly mocks your boundaries, that is:',
      options: ['Healthy banter', 'A warning sign', 'Always your fault'],
      correctIndex: 1,
      explanation: 'Repeated disrespect for boundaries is a warning sign.',
      ageBands: AGE_BANDS,
    },
    {
      id: 'h01-q5',
      type: 'reflective_short',
      prompt: 'Best next step when you feel unsafe in any setting:',
      options: [],
      explanation: 'Seeking support early is a protective and practical action.',
      ageBands: AGE_BANDS,
    },
    {
      id: 'h01-q6',
      type: 'scenario_match',
      prompt: 'Put these steps in a safer order (first to last).',
      options: [
        'Tell a trusted adult or support person',
        'Move to a safer place',
        'Save evidence or notes for later support',
      ],
      reorderTarget: [
        'Move to a safer place',
        'Tell a trusted adult or support person',
        'Save evidence or notes for later support',
      ],
      explanation: 'Prioritize immediate safety first, then reach support, then document details.',
      ageBands: AGE_BANDS,
    },
  ],
  'T-06': [
    {
      id: 't06-q1',
      type: 'multiple_choice',
      prompt: 'Gaslighting usually makes someone feel:',
      options: ['Certain and calm', 'Confused about their own memory', 'More respected'],
      correctIndex: 1,
      explanation: 'Gaslighting undermines confidence in memory and perception.',
      ageBands: AGE_BANDS,
    },
  ],
};

const SENSITIVE_TRACK_IDS = new Set(['T-06', 'T-07']);
const FOUNDATION_TRACK_ID = 'H-01';

export default function AwarenessHubScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ openAgeGate?: string }>();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [filter, setFilter] = useState<PillarFilter>('all');
  const [ageBand, setAgeBand] = useState<AgeBand | null>(null);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [pendingBand, setPendingBand] = useState<AgeBand | null>(null);
  const [juniorConsent, setJuniorConsent] = useState(false);
  const [trackProgress, setTrackProgress] = useState<TrackProgressMap>({});
  const [quizTrack, setQuizTrack] = useState<HubTrack | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [reflectiveAnswer, setReflectiveAnswer] = useState('');
  const [reorderAnswers, setReorderAnswers] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [pendingSensitiveTrack, setPendingSensitiveTrack] = useState<HubTrack | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const hubSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyRemoteHub = async (remote: AwarenessHubStateBlob) => {
    const entries: [string, string][] = [
      [STORAGE.HUB_SYNC_UPDATED_AT, remote.updatedAt],
      [STORAGE.JUNIOR_CONSENT, String(!!remote.juniorConsent)],
      [STORAGE.TRACK_PROGRESS, JSON.stringify(remote.trackProgress || {})],
      [STORAGE.STREAK, String(remote.streakDays ?? 0)],
      [STORAGE.LAST_ACTIVE_DATE, remote.lastActiveDate || ''],
      [STORAGE.REMINDERS_ENABLED, String(!!remote.remindersEnabled)],
    ];
    if (remote.ageBand) {
      entries.unshift([STORAGE.AGE_BAND, remote.ageBand]);
    }
    await AsyncStorage.multiSet(entries);
    if (remote.ageBand) {
      setAgeBand(remote.ageBand as AgeBand);
      setShowAgeGate(false);
    }
    setJuniorConsent(!!remote.juniorConsent);
    setTrackProgress((remote.trackProgress || {}) as TrackProgressMap);
    setStreakDays(Number(remote.streakDays) || 0);
    setRemindersEnabled(!!remote.remindersEnabled);
    if (remote.remindersEnabled) {
      await notificationService.scheduleAwarenessHubDailyReminder();
    } else {
      await notificationService.cancelAwarenessHubReminders();
    }
  };

  const flushHubToSupabase = async () => {
    if (!isSupabaseConfigured()) return;
    const updatedAt = new Date().toISOString();
    const [band, consent, prog, streak, last, rem] = await Promise.all([
      AsyncStorage.getItem(STORAGE.AGE_BAND),
      AsyncStorage.getItem(STORAGE.JUNIOR_CONSENT),
      AsyncStorage.getItem(STORAGE.TRACK_PROGRESS),
      AsyncStorage.getItem(STORAGE.STREAK),
      AsyncStorage.getItem(STORAGE.LAST_ACTIVE_DATE),
      AsyncStorage.getItem(STORAGE.REMINDERS_ENABLED),
    ]);
    let trackProgressParsed: TrackProgressMap = {};
    if (prog) {
      try {
        trackProgressParsed = JSON.parse(prog) as TrackProgressMap;
      } catch {
        trackProgressParsed = {};
      }
    }
    const blob: AwarenessHubStateBlob = {
      updatedAt,
      ageBand: band,
      juniorConsent: consent === 'true',
      trackProgress: trackProgressParsed,
      streakDays: Number(streak) || 0,
      lastActiveDate: last,
      remindersEnabled: rem === 'true',
    };
    await AsyncStorage.setItem(STORAGE.HUB_SYNC_UPDATED_AT, updatedAt);
    await profileService.setAwarenessHubState(blob);
  };

  const scheduleHubRemoteSync = () => {
    if (!isSupabaseConfigured()) return;
    if (hubSyncTimerRef.current) clearTimeout(hubSyncTimerRef.current);
    hubSyncTimerRef.current = setTimeout(() => {
      hubSyncTimerRef.current = null;
      void flushHubToSupabase();
    }, 900);
  };

  useEffect(() => {
    const loadGate = async () => {
      const [savedBand, savedConsent, savedProgress] = await Promise.all([
        AsyncStorage.getItem(STORAGE.AGE_BAND),
        AsyncStorage.getItem(STORAGE.JUNIOR_CONSENT),
        AsyncStorage.getItem(STORAGE.TRACK_PROGRESS),
      ]);
      if (!savedBand) {
        setShowAgeGate(true);
      } else {
        setAgeBand(savedBand as AgeBand);
      }
      setJuniorConsent(savedConsent === 'true');
      if (savedProgress) {
        try {
          setTrackProgress(JSON.parse(savedProgress));
        } catch {
          setTrackProgress({});
        }
      }
      const [streakRaw, remindersRaw, localAt] = await Promise.all([
        AsyncStorage.getItem(STORAGE.STREAK),
        AsyncStorage.getItem(STORAGE.REMINDERS_ENABLED),
        AsyncStorage.getItem(STORAGE.HUB_SYNC_UPDATED_AT),
      ]);
      setStreakDays(streakRaw ? Number(streakRaw) || 0 : 0);
      setRemindersEnabled(remindersRaw === 'true');

      const hasLocalHubData =
        !!savedBand ||
        !!(savedProgress && savedProgress !== '{}' && savedProgress !== 'null');

      if (!isSupabaseConfigured()) return;

      try {
        const remote = await profileService.getAwarenessHubState();
        if (remote?.updatedAt) {
          const shouldPullRemote =
            (!!localAt && remote.updatedAt > localAt) || (!localAt && !hasLocalHubData);
          if (shouldPullRemote) {
            await applyRemoteHub(remote);
          } else if (!localAt && hasLocalHubData) {
            scheduleHubRemoteSync();
          }
        } else if (hasLocalHubData) {
          scheduleHubRemoteSync();
        }
      } catch (e) {
        console.warn('[AwarenessHub] remote sync load', e);
      }
    };
    loadGate();
  }, []);

  useEffect(() => {
    if (params.openAgeGate === '1') {
      setShowAgeGate(true);
    }
  }, [params.openAgeGate]);

  const mergedTracks = TRACKS.map((track) => {
    const persisted = trackProgress[track.id];
    if (!persisted) return track;
    return { ...track, ...persisted };
  });

  const filteredTracks = mergedTracks.filter((track) => filter === 'all' || track.pillar === filter);

  const saveAgeGate = async () => {
    if (!pendingBand) return;
    const isJunior = pendingBand === 'Junior (under 13)';
    if (isJunior && !juniorConsent) {
      Alert.alert('Consent required', 'Junior access requires parental or guardian consent in this version.');
      return;
    }

    await AsyncStorage.setItem(STORAGE.AGE_BAND, pendingBand);
    await AsyncStorage.setItem(STORAGE.JUNIOR_CONSENT, String(isJunior ? juniorConsent : false));
    await AsyncStorage.setItem(STORAGE.HUB_SYNC_UPDATED_AT, new Date().toISOString());
    setAgeBand(pendingBand);
    setShowAgeGate(false);
    scheduleHubRemoteSync();
  };

  const saveTrackProgress = async (next: TrackProgressMap) => {
    setTrackProgress(next);
    await AsyncStorage.setItem(STORAGE.TRACK_PROGRESS, JSON.stringify(next));
    await AsyncStorage.setItem(STORAGE.HUB_SYNC_UPDATED_AT, new Date().toISOString());
    scheduleHubRemoteSync();
  };

  const openQuiz = (track: HubTrack) => {
    const foundationProgress = trackProgress[FOUNDATION_TRACK_ID];
    const foundationCompleted = foundationProgress?.state === 'Completed' || (foundationProgress?.progress || 0) >= 80;
    if (track.id !== FOUNDATION_TRACK_ID && !foundationCompleted) {
      Alert.alert(
        'Start with H-01 first',
        'Complete H-01 (What does healthy look like?) before opening other tracks.'
      );
      const foundationTrack = mergedTracks.find((item) => item.id === FOUNDATION_TRACK_ID);
      if (foundationTrack) {
        openQuizDirect(foundationTrack);
      }
      return;
    }

    if (SENSITIVE_TRACK_IDS.has(track.id)) {
      setPendingSensitiveTrack(track);
      return;
    }
    openQuizDirect(track);
  };

  const openQuizDirect = (track: HubTrack) => {
    setQuizTrack(track);
    setSelectedAnswer(null);
    setReflectiveAnswer('');
    setReorderAnswers([]);
    setShowExplanation(false);
    setQuestionIndex(0);
    setCorrectCount(0);
    setAnsweredCount(0);
  };

  const visibleQuestions = useMemo(() => {
    if (!quizTrack) return [];
    const all = QUESTION_BANK[quizTrack.id] || QUESTION_BANK['H-01'];
    return all.filter((q) => !ageBand || q.ageBands.includes(ageBand)).slice(0, 5);
  }, [quizTrack, ageBand]);

  const currentQuestion = visibleQuestions[questionIndex];
  const shouldShowTrustedSignpost = !!quizTrack && (quizTrack.pillar === 'harmful' || SENSITIVE_TRACK_IDS.has(quizTrack.id));

  useEffect(() => {
    if (currentQuestion?.type === 'scenario_match') {
      setReorderAnswers([...(currentQuestion.options || [])]);
    } else {
      setReorderAnswers([]);
    }
  }, [currentQuestion?.id]);

  const recordStreakActivity = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const last = await AsyncStorage.getItem(STORAGE.LAST_ACTIVE_DATE);
    const existing = Number((await AsyncStorage.getItem(STORAGE.STREAK)) || '0') || 0;
    if (last === today) return;

    let next = 1;
    if (last) {
      const lastDate = new Date(last);
      const diff = Math.floor((new Date(today).getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));
      next = diff === 1 ? existing + 1 : 1;
    }

    await AsyncStorage.multiSet([
      [STORAGE.STREAK, String(next)],
      [STORAGE.LAST_ACTIVE_DATE, today],
      [STORAGE.HUB_SYNC_UPDATED_AT, new Date().toISOString()],
    ]);
    setStreakDays(next);
    scheduleHubRemoteSync();
  };

  const submitQuizAnswer = async () => {
    if (!quizTrack || !currentQuestion) return;
    if (currentQuestion.type === 'scenario_match' && reorderAnswers.length === 0) return;
    if (currentQuestion.type !== 'reflective_short' && currentQuestion.type !== 'scenario_match' && selectedAnswer === null) return;
    if (currentQuestion.type === 'reflective_short' && reflectiveAnswer.trim().length === 0) {
      Alert.alert('Add a reflection', 'Write a short answer before continuing.');
      return;
    }
    setShowExplanation(true);
    const isCorrect =
      currentQuestion.type === 'reflective_short'
        ? true
        : currentQuestion.type === 'scenario_match'
          ? JSON.stringify(reorderAnswers) === JSON.stringify(currentQuestion.reorderTarget || [])
        : selectedAnswer === currentQuestion.correctIndex;
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);
    const nextAnswered = answeredCount + 1;
    setCorrectCount(nextCorrect);
    setAnsweredCount(nextAnswered);

    if (nextAnswered < visibleQuestions.length) {
      return;
    }

    const current = trackProgress[quizTrack.id] || {
      level: quizTrack.level,
      progress: quizTrack.progress,
      state: quizTrack.state,
    };
    const scorePercent = Math.round((nextCorrect / Math.max(1, visibleQuestions.length)) * 100);
    const passed = scorePercent >= 80;
    const increment = passed ? 20 : 8;
    const nextProgress = Math.min(100, current.progress + increment);
    const nextState: TrackState = nextProgress >= 100 || passed ? 'Completed' : 'In progress';
    const nextLevel = passed ? Math.max(current.level, 2) : current.level;

    const nextMap: TrackProgressMap = {
      ...trackProgress,
      [quizTrack.id]: {
        level: nextLevel,
        progress: nextProgress,
        state: nextState,
      },
    };

    await saveTrackProgress(nextMap);
    await recordStreakActivity();
    await shareNudgeService.requestDeferredTrigger('hub-quiz-complete');
    Alert.alert(
      passed ? 'Level complete' : 'Keep going',
      passed
        ? `You passed with ${scorePercent}%. Next level unlocked.`
        : `You scored ${scorePercent}%. Review the explanations and try again.`,
    );
  };

  const handleNextQuestion = () => {
    if (!showExplanation) return;
    if (questionIndex < visibleQuestions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setReflectiveAnswer('');
      setReorderAnswers([]);
      setShowExplanation(false);
    }
  };

  const moveReorderItem = (index: number, direction: 'up' | 'down') => {
    setReorderAnswers((prev) => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const handleReminderToggle = async () => {
    const isJunior = ageBand === 'Junior (under 13)';
    if (isJunior && !juniorConsent) {
      Alert.alert('Unavailable', 'Daily reminders require confirmed parental or guardian consent for this age band.');
      return;
    }
    const next = !remindersEnabled;
    setRemindersEnabled(next);
    await AsyncStorage.setItem(STORAGE.REMINDERS_ENABLED, String(next));
    await AsyncStorage.setItem(STORAGE.HUB_SYNC_UPDATED_AT, new Date().toISOString());
    if (next) {
      await notificationService.scheduleAwarenessHubDailyReminder();
    } else {
      await notificationService.cancelAwarenessHubReminders();
    }
    scheduleHubRemoteSync();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Awareness Hub</Text>
          <Text style={styles.subtitle}>
            Learn to spot harmful patterns and build healthy interactions across everyday environments.
          </Text>
          <Text style={styles.mvpNote}>
            Radicalisation content is intentionally deferred and excluded from this MVP.
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Age group: {ageBand || 'Not set'}</Text>
            <TouchableOpacity onPress={() => setShowAgeGate(true)}>
              <Text style={styles.metaLink}>Update</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Streak: {streakDays} day{streakDays === 1 ? '' : 's'}</Text>
            <TouchableOpacity onPress={handleReminderToggle}>
              <Text style={styles.metaLink}>{remindersEnabled ? 'Reminders: On' : 'Reminders: Off'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.toggleRow}>
          {(['harmful', 'healthy', 'all'] as PillarFilter[]).map((value) => {
            const active = filter === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                onPress={() => setFilter(value)}
              >
                <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                  {value === 'harmful' ? 'Harmful patterns' : value === 'healthy' ? 'Healthy interactions' : 'All'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredTracks.map((track) => (
          <TouchableOpacity key={track.id} style={styles.trackCard} activeOpacity={0.85} onPress={() => openQuiz(track)}>
            <View style={styles.trackHeader}>
              <Text style={styles.trackTitle}>{track.id} - {track.title}</Text>
              <Text style={styles.trackState}>{track.state}</Text>
            </View>
            <Text style={styles.trackMeta}>{track.environment} • Level {track.level}</Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${track.progress}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{track.progress}% complete</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={showAgeGate} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm your age group</Text>
            <Text style={styles.modalText}>
              This is used only to gate age-appropriate Awareness Hub content and support options.
            </Text>
            {AGE_BANDS.map((band) => (
              <TouchableOpacity
                key={band}
                style={[styles.bandBtn, pendingBand === band && styles.bandBtnActive]}
                onPress={() => setPendingBand(band)}
              >
                <Text style={[styles.bandText, pendingBand === band && styles.bandTextActive]}>{band}</Text>
              </TouchableOpacity>
            ))}

            {pendingBand === 'Junior (under 13)' && (
              <TouchableOpacity
                style={[styles.consentBtn, juniorConsent && styles.consentBtnActive]}
                onPress={() => setJuniorConsent((prev) => !prev)}
              >
                <Ionicons
                  name={juniorConsent ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={juniorConsent ? colors.primary : colors.textSecondary}
                />
                <Text style={styles.consentText}>Parental or guardian consent confirmed</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={saveAgeGate}>
              <Text style={styles.saveBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!pendingSensitiveTrack} transparent animationType="fade" onRequestClose={() => setPendingSensitiveTrack(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sensitive topic warning</Text>
            <Text style={styles.modalText}>
              This topic may include sensitive situations. You can skip this for now and return later.
            </Text>
            <View style={styles.warningActions}>
              <TouchableOpacity
                style={[styles.bandBtn, { flex: 1 }]}
                onPress={() => setPendingSensitiveTrack(null)}
              >
                <Text style={styles.bandText}>Skip for now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { flex: 1, marginTop: 0 }]}
                onPress={() => {
                  const track = pendingSensitiveTrack;
                  setPendingSensitiveTrack(null);
                  if (track) openQuizDirect(track);
                }}
              >
                <Text style={styles.saveBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!quizTrack} transparent animationType="fade" onRequestClose={() => setQuizTrack(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{quizTrack?.id} mini check</Text>
            <Text style={styles.modalText}>{currentQuestion?.prompt || 'No question available.'}</Text>
            {currentQuestion?.type === 'reflective_short' ? (
              <View style={styles.reflectiveBox}>
                <Text style={styles.reflectiveLabel}>Write one safe action you could take next.</Text>
                <TouchableOpacity
                  style={[styles.bandBtn, reflectiveAnswer.length > 0 && styles.bandBtnActive]}
                  onPress={() => {
                    // Keep UI simple in this iteration: tap to insert example starter if empty.
                    if (!reflectiveAnswer) setReflectiveAnswer('I can message a trusted adult and ask for support.');
                  }}
                >
                  <Text style={[styles.bandText, reflectiveAnswer.length > 0 && styles.bandTextActive]}>
                    {reflectiveAnswer || 'Tap to add a starter response'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : currentQuestion?.type === 'scenario_match' ? (
              <View style={styles.reflectiveBox}>
                <Text style={styles.reflectiveLabel}>Use arrows to place these in safer order.</Text>
                {reorderAnswers.map((item, idx) => (
                  <View key={`${item}-${idx}`} style={styles.reorderRow}>
                    <Text style={styles.reorderIndex}>{idx + 1}.</Text>
                    <Text style={styles.reorderText}>{item}</Text>
                    <View style={styles.reorderActions}>
                      <TouchableOpacity onPress={() => moveReorderItem(idx, 'up')} style={styles.reorderBtn}>
                        <Ionicons name="chevron-up" size={18} color={colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => moveReorderItem(idx, 'down')} style={styles.reorderBtn}>
                        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.quizAnswers}>
                {(currentQuestion?.options || []).map((option, idx) => (
                  <TouchableOpacity
                    key={`${currentQuestion?.id}-${idx}`}
                    style={[styles.bandBtn, selectedAnswer === idx && styles.bandBtnActive, { flex: 1 }]}
                    onPress={() => setSelectedAnswer(idx)}
                  >
                    <Text style={[styles.bandText, selectedAnswer === idx && styles.bandTextActive]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.saveBtn} onPress={submitQuizAnswer}>
              <Text style={styles.saveBtnText}>{showExplanation ? 'Answer checked' : 'Check answer'}</Text>
            </TouchableOpacity>
            {showExplanation && (
              <View style={styles.explanationBox}>
                <Text style={styles.explanationTitle}>Explanation</Text>
                <Text style={styles.explanationText}>
                  {currentQuestion?.explanation ||
                    'Healthy interactions do not rely on secrecy, pressure, or isolation.'}
                </Text>
                {shouldShowTrustedSignpost && (
                  <View style={styles.signpostBox}>
                    <Text style={styles.signpostText}>
                      Trusted support is available for your age group and region.
                      {ageBand === 'Junior (under 13)'
                        ? ' Review options with a parent, guardian, or trusted adult.'
                        : ' Open Resources to view relevant helplines and guidance.'}
                    </Text>
                    <TouchableOpacity style={styles.signpostBtn} onPress={() => router.push('/(tabs)/resources')}>
                      <Text style={styles.signpostBtnText}>Open trusted resources</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            {showExplanation && questionIndex < visibleQuestions.length - 1 && (
              <TouchableOpacity style={styles.closeQuizBtn} onPress={handleNextQuestion}>
                <Text style={styles.closeQuizText}>Next question</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeQuizBtn} onPress={() => setQuizTrack(null)}>
              <Text style={styles.closeQuizText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpLinkBtn} onPress={() => router.push('/(tabs)/resources')}>
              <Text style={styles.helpLinkText}>I need help</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.floatingHelpBtn} onPress={() => router.push('/(tabs)/resources')}>
        <Ionicons name="help-buoy" size={18} color="#fff" />
        <Text style={styles.floatingHelpText}>I need help</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, gap: 12 },
    header: { marginBottom: 8 },
    title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
    subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    mvpNote: { marginTop: 6, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
    metaRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    metaText: { fontSize: 12, color: colors.textSecondary },
    metaLink: { fontSize: 12, color: colors.primary, fontWeight: '600' },
    toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    toggleBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 6 },
    toggleBtnActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}20` },
    toggleText: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
    toggleTextActive: { color: colors.primary, fontWeight: '700' },
    trackCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, backgroundColor: colors.surface },
    trackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    trackTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    trackState: { fontSize: 12, color: colors.textSecondary },
    trackMeta: { marginTop: 4, fontSize: 12, color: colors.textSecondary },
    progressBg: { marginTop: 10, height: 8, borderRadius: 999, backgroundColor: colors.border, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: colors.primary },
    progressLabel: { marginTop: 4, fontSize: 11, color: colors.textSecondary },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
    modalCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
    modalText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 10 },
    bandBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 10, marginBottom: 8 },
    bandBtnActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}20` },
    bandText: { fontSize: 13, color: colors.textPrimary },
    bandTextActive: { color: colors.primary, fontWeight: '700' },
    consentBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
    consentBtnActive: {},
    consentText: { flex: 1, fontSize: 13, color: colors.textSecondary },
    saveBtn: { marginTop: 8, borderRadius: 10, backgroundColor: colors.primary, paddingVertical: 12, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    warningActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
    quizAnswers: { flexDirection: 'row', gap: 8, marginBottom: 6 },
    explanationBox: {
      marginTop: 10,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: `${colors.primary}55`,
      backgroundColor: `${colors.primary}15`,
    },
    explanationTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
    explanationText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
    signpostBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
    signpostText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: 8 },
    signpostBtn: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: `${colors.primary}70`,
      backgroundColor: `${colors.primary}18`,
      paddingVertical: 8,
      alignItems: 'center',
    },
    signpostBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
    closeQuizBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 8 },
    closeQuizText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
    helpLinkBtn: { marginTop: 6, alignItems: 'center', paddingVertical: 8 },
    helpLinkText: { color: colors.warning, fontWeight: '700', fontSize: 13 },
    reflectiveBox: { marginBottom: 8, gap: 8 },
    reflectiveLabel: { fontSize: 12, color: colors.textSecondary },
    reorderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 8,
      gap: 8,
    },
    reorderIndex: { fontSize: 12, color: colors.textSecondary, width: 16 },
    reorderText: { flex: 1, fontSize: 12, color: colors.textPrimary },
    reorderActions: { flexDirection: 'row', gap: 6 },
    reorderBtn: {
      width: 28,
      height: 28,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    floatingHelpBtn: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      backgroundColor: colors.warning,
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    floatingHelpText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
  });

