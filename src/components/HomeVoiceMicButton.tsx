import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoiceTextInput } from '@/hooks/useVoiceTextInput';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
  color: string;
  mutedColor: string;
};

/** Loaded on Home only so OTA bundles do not eagerly import speech recognition at startup. */
export default function HomeVoiceMicButton({
  value,
  onChangeText,
  disabled,
  color,
  mutedColor,
}: Props) {
  const { isRecordingVoice, startVoiceInput, stopVoiceInput } = useVoiceTextInput(
    onChangeText,
    () => value,
    { disabled }
  );

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={isRecordingVoice ? stopVoiceInput : startVoiceInput}
      disabled={disabled}
      accessibilityLabel="Voice input"
      accessibilityRole="button"
    >
      <Ionicons
        name={isRecordingVoice ? 'mic' : 'mic-outline'}
        size={22}
        color={disabled ? mutedColor : color}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
