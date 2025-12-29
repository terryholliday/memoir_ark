import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export function useAudioRecorder() {
  const [state, setState] = useState<RecordingState>('idle');
  const [uri, setUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError('Microphone permission denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setState('recording');

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          setDuration(Math.floor(status.durationMillis / 1000));
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const recordingUri = recordingRef.current.getURI();
      setUri(recordingUri);
      recordingRef.current = null;
      setState('stopped');

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
    }
  }, []);

  const reset = useCallback(() => {
    setUri(null);
    setDuration(0);
    setState('idle');
    setError(null);
  }, []);

  return {
    state,
    uri,
    duration,
    error,
    startRecording,
    stopRecording,
    reset,
  };
}
