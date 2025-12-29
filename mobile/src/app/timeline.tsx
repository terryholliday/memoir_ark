import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStories } from '@/hooks/useStories';

export default function TimelineScreen() {
  const { data, isLoading } = useStories();

  const sorted = [...(data?.stories ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0f]" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Timeline' }} />
      <ScrollView className="flex-1 px-6 pt-4">
        {isLoading ? (
          <Text className="text-white/40">Loading...</Text>
        ) : sorted.length === 0 ? (
          <Text className="text-white/40">No stories in your timeline yet.</Text>
        ) : (
          <View className="border-l-2 border-white/20 pl-6 gap-6 pb-10">
            {sorted.map((story) => (
              <View key={story.id} className="relative">
                <View className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-cyan-500" />
                <Text className="text-white/40 text-xs mb-1">
                  {new Date(story.createdAt).toLocaleDateString()}
                </Text>
                <Text className="text-white font-medium text-base">{story.title}</Text>
                <Text className="text-white/50 text-sm mt-1" numberOfLines={3}>
                  {story.body}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
