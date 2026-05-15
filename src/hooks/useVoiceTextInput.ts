import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { DEFAULT_VOICE_LOCALE, recognitionLangFromTtsLanguage } from '@/lib/voiceTtsCurated';

const VOICE_INPUT_RATIONALE_KEY = '@chat_voice_input_rationale_v1';

export function useVoiceTextInput(
  onChangeText: (text: string) => void,
  getCurrentText: () => string,
  options?: { disabled?: boolean }
) {
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const voiceBaseTextRef = useRef('');
  const disabled = options?.disabled ?? false;

  useSpeechRecognitionEvent('start', () => {
    setIsRecordingVoice(true);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript || '';
    const nextText = [voiceBaseTextRef.current, transcript].filter(Boolean).join(' ').trim();
    onChangeText(nextText);
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsRecordingVoice(false);
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      Alert.alert(
        'Voice input unavailable',
        'Speech recognition or the microphone is not available. You can keep using text.'
      );
      return;
    }
    Alert.alert('Voice input unavailable', event.message || 'Voice recognition could not continue.');
  });

  useSpeechRecognitionEvent('end', () => {
    setIsRecordingVoice(false);
  });

  const ensureVoiceInputRationale = async (): Promise<boolean> => {
    try {
      const seen = await AsyncStorage.getItem(VOICE_INPUT_RATIONALE_KEY);
      if (seen === 'true') return true;
    } catch {
      /* show rationale below */
    }
    return new Promise((resolve) => {
      Alert.alert(
        'Voice input',
        "GutChecks turns what you say into text on your device so you can review and send it. Audio is processed by your phone's speech service (for example Apple or Google), not stored by GutChecks as a voice recording. You can always type instead.",
        [
          { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Continue',
            onPress: async () => {
              await AsyncStorage.setItem(VOICE_INPUT_RATIONALE_KEY, 'true');
              resolve(true);
            },
          },
        ]
      );
    });
  };

  const startVoiceInput = async () => {
    if (disabled) return;
    if (!(await ensureVoiceInputRationale())) return;
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Microphone permission required',
          'Enable microphone and speech permissions to use voice input.'
        );
        return;
      }
      voiceBaseTextRef.current = getCurrentText().trim();
      ExpoSpeechRecognitionModule.start({
        lang: recognitionLangFromTtsLanguage(DEFAULT_VOICE_LOCALE),
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        addsPunctuation: true,
      });
    } catch {
      Alert.alert('Voice input unavailable', 'Could not start voice capture on this device.');
    }
  };

  const stopVoiceInput = () => {
    ExpoSpeechRecognitionModule.stop();
  };

  return { isRecordingVoice, startVoiceInput, stopVoiceInput };
}
