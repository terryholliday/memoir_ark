import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStory } from '@/hooks/useStory';

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error } = useStory(id ?? '');

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#0a0a0f] items-center justify-center">
        <Stack.Screen options={{ title: 'Story' }} />
        <Text className="text-white/40">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (error || !data?.story) {
    return (
      <SafeAreaView className="flex-1 bg-[#0a0a0f] items-center justify-center px-6">
        <Stack.Screen options={{ title: 'Story' }} />
        <Text className="text-red-400 text-center">Story not found.</Text>
      </SafeAreaView>
    );
  }

  const story = data.story;

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0f]" edges={['bottom']}>
      <Stack.Screen options={{ title: story.title }} />
      <ScrollView className="flex-1 px-6 pt-4">
        <Text className="text-2xl font-bold text-white mb-2">{story.title}</Text>
        <Text className="text-white/40 text-sm mb-6">
          {new Date(story.createdAt).toLocaleDateString()}
        </Text>
        <Text className="text-white/80 text-base leading-6">{story.body}</Text>

        {story.audioUri && (
          <View className="mt-8 bg-white/5 border border-white/10 rounded-xl p-4">
            <Text className="text-white/60 text-sm">🎙️ Audio attached</Text>
            <Text className="text-white/40 text-xs mt-1">{story.audioUri}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
