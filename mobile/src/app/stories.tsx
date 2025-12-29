import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { Link, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStories } from '@/hooks/useStories';

export default function StoriesScreen() {
  const { data, isLoading } = useStories();
  const [search, setSearch] = useState('');

  const filtered = data?.stories.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0f]" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Stories' }} />
      <View className="px-6 pt-4 pb-2">
        <TextInput
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white"
          placeholder="Search stories..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <ScrollView className="flex-1 px-6">
        {isLoading ? (
          <Text className="text-white/40 mt-4">Loading...</Text>
        ) : filtered?.length === 0 ? (
          <Text className="text-white/40 mt-4">No stories found.</Text>
        ) : (
          <View className="gap-3 pb-10">
            {filtered?.map((story) => (
              <Link key={story.id} href={`/story/${story.id}`} asChild>
                <Pressable className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <Text className="text-white font-medium text-base">{story.title}</Text>
                  <Text className="text-white/50 text-sm mt-1" numberOfLines={2}>
                    {story.body}
                  </Text>
                  <Text className="text-white/30 text-xs mt-2">
                    {new Date(story.createdAt).toLocaleDateString()}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
