import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDraftStoryStore } from '@/store/draftStory';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';

export default function CreateStoryScreen() {
  const { title, body, audioUri, setTitle, setBody, setAudioUri, reset } = useDraftStoryStore();
  const recorder = useAudioRecorder();

  const handleToggleRecording = async () => {
    if (recorder.state === 'recording') {
      await recorder.stopRecording();
    } else {
      await recorder.startRecording();
    }
  };

  const handleAttachAudio = () => {
    if (recorder.uri) {
      setAudioUri(recorder.uri);
      Alert.alert('Audio Attached', 'Your recording has been attached to the story.');
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your story.');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Missing Content', 'Please enter some content for your story.');
      return;
    }

    // Stub submit - no fake persistence
    Alert.alert(
      'Story Ready',
      'This is a scaffold. In production, the story would be submitted to the Origins backend.',
      [
        {
          text: 'OK',
          onPress: () => {
            reset();
            recorder.reset();
            router.back();
          },
        },
      ]
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0f]" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Create Story' }} />
      <ScrollView className="flex-1 px-6 pt-4" keyboardShouldPersistTaps="handled">
        {/* Title */}
        <Text className="text-white/60 text-sm mb-2">Title</Text>
        <TextField
          value={title}
          onChangeText={setTitle}
          placeholder="Enter story title..."
          className="mb-6"
        />

        {/* Body */}
        <Text className="text-white/60 text-sm mb-2">Story</Text>
        <TextField
          value={body}
          onChangeText={setBody}
          placeholder="Tell your story..."
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          className="mb-6 min-h-[160px]"
        />

        {/* Audio Recording */}
        <Text className="text-white/60 text-sm mb-2">Voice Recording (Optional)</Text>
        <View className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          {recorder.error && (
            <Text className="text-red-400 text-sm mb-3">{recorder.error}</Text>
          )}

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-lg font-mono">
              {formatDuration(recorder.duration)}
            </Text>
            <View
              className={`w-3 h-3 rounded-full ${
                recorder.state === 'recording' ? 'bg-red-500' : 'bg-white/20'
              }`}
            />
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={handleToggleRecording}
              className={`flex-1 py-3 rounded-lg items-center ${
                recorder.state === 'recording' ? 'bg-red-600' : 'bg-white/10'
              }`}
            >
              <Text className="text-white font-medium">
                {recorder.state === 'recording' ? '⏹ Stop' : '🎙️ Record'}
              </Text>
            </Pressable>

            {recorder.uri && recorder.state === 'stopped' && (
              <Pressable
                onPress={handleAttachAudio}
                className="flex-1 py-3 rounded-lg items-center bg-cyan-600"
              >
                <Text className="text-white font-medium">Attach</Text>
              </Pressable>
            )}
          </View>

          {audioUri && (
            <View className="mt-3 pt-3 border-t border-white/10">
              <Text className="text-green-400 text-sm">✓ Audio attached</Text>
            </View>
          )}
        </View>

        {/* Submit */}
        <Button title="Save Story" onPress={handleSubmit} className="mb-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
