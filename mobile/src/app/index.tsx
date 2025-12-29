import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStories } from '@/hooks/useStories';

export default function HomeScreen() {
  const { data, isLoading } = useStories();

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0f]">
      <ScrollView className="flex-1 px-6 pt-8">
        {/* Header */}
        <Text className="text-3xl font-bold text-white mb-2">Origins</Text>
        <Text className="text-white/60 mb-8">Preserve your stories. Build your legacy.</Text>

        {/* Primary Actions */}
        <View className="flex-row gap-4 mb-10">
          <Link href="/create-story" asChild>
            <Pressable className="flex-1 bg-white py-4 rounded-xl items-center">
              <Text className="text-black font-semibold text-base">Create Story</Text>
            </Pressable>
          </Link>
          <Link href="/timeline" asChild>
            <Pressable className="flex-1 bg-white/10 border border-white/20 py-4 rounded-xl items-center">
              <Text className="text-white font-semibold text-base">Timeline</Text>
            </Pressable>
          </Link>
        </View>

        {/* Recent Stories */}
        <Text className="text-lg font-semibold text-white mb-4">Recent Stories</Text>
        {isLoading ? (
          <Text className="text-white/40">Loading...</Text>
        ) : data?.stories.length === 0 ? (
          <Text className="text-white/40">No stories yet. Create your first one!</Text>
        ) : (
          <View className="gap-3">
            {data?.stories.slice(0, 5).map((story) => (
              <Link key={story.id} href={`/story/${story.id}`} asChild>
                <Pressable className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <Text className="text-white font-medium text-base">{story.title}</Text>
                  <Text className="text-white/50 text-sm mt-1" numberOfLines={2}>
                    {story.body}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </View>
        )}

        {/* Navigation Links */}
        <View className="mt-10 gap-3 pb-10">
          <Link href="/stories" asChild>
            <Pressable className="bg-white/5 border border-white/10 rounded-xl p-4 flex-row justify-between items-center">
              <Text className="text-white font-medium">All Stories</Text>
              <Text className="text-white/40">→</Text>
            </Pressable>
          </Link>
          <Link href="/artifacts" asChild>
            <Pressable className="bg-white/5 border border-white/10 rounded-xl p-4 flex-row justify-between items-center">
              <Text className="text-white font-medium">Artifacts</Text>
              <Text className="text-white/40">→</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
