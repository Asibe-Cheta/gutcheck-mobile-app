import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Updates from 'expo-updates';
import { readOtaDebugSnapshot, type OtaDebugSnapshot } from '@/lib/otaDiagnostics';

type Props = {
  textSecondary: string;
  primary: string;
  surface: string;
  border: string;
};

/** Visible proof that an OTA bundle is running (or that expo-updates is disabled). */
export default function OtaDebugBanner({ textSecondary, primary, surface, border }: Props) {
  const [snap, setSnap] = useState<OtaDebugSnapshot | null>(null);

  useEffect(() => {
    void (async () => {
      const stored = await readOtaDebugSnapshot();
      setSnap(stored);
    })();
  }, []);

  const updateIdShort = Updates.updateId ? String(Updates.updateId).slice(0, 8) : 'embedded';
  const marker = snap?.checkAvailable === true ? 'update pending/reload' : snap?.checkAvailable === false ? 'no remote update' : '—';

  return (
    <View style={[styles.box, { backgroundColor: surface, borderColor: border }]}>
      <Text style={[styles.title, { color: primary }]}>Update diagnostics · app 2.2.3</Text>
      <Text style={[styles.line, { color: textSecondary }]}>
        enabled={String(Updates.isEnabled)} · channel={Updates.channel ?? 'none'} · runtime=
        {Updates.runtimeVersion ?? '?'}
      </Text>
      <Text style={[styles.line, { color: textSecondary }]}>
        bundle={updateIdShort} · check={marker}
      </Text>
      {snap?.fetchError ? (
        <Text style={[styles.line, { color: '#e57373' }]}>error: {snap.fetchError}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  line: {
    fontSize: 11,
    lineHeight: 16,
  },
});
