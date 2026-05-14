import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/lib/themeContext';
import { getThemeColors } from '@/lib/theme';
import { recommendProtectService } from '@/lib/recommendProtectService';

export default function RecommendCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; event?: string }>();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [message, setMessage] = useState('Updating recommendation status...');

  useEffect(() => {
    const run = async () => {
      const token = typeof params.token === 'string' ? params.token : '';
      const event = typeof params.event === 'string' ? params.event : '';
      if (!token || (event !== 'opened' && event !== 'downloaded')) {
        setMessage('Could not verify recommendation status.');
        return;
      }

      const nextStatus = event === 'downloaded' ? 'Downloaded' : 'Opened';
      const verification = await recommendProtectService.verifyReferralEvent(token, event);
      if (verification === 'invalid') {
        setMessage('Referral event could not be verified.');
        return;
      }
      if (verification === 'unavailable') {
        // Spec behavior: when tracking is unavailable, keep slot at Sent and show no hard error.
        setMessage('Thanks. Status update is pending verification.');
        return;
      }
      const updated = await recommendProtectService.markSlotStatusByToken(token, nextStatus);
      if (updated) {
        setMessage(`Recommendation status updated: ${nextStatus}.`);
      } else {
        setMessage('Recommendation token not found on this device.');
      }
    };

    run();
  }, [params.event, params.token]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Recommend & Protect</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => router.replace('/(tabs)/')}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 18,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

