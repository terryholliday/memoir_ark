import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ArtifactsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0f]" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Artifacts' }} />
      <ScrollView className="flex-1 px-6 pt-4">
        <Text className="text-white/60 mb-6">
          Artifacts are physical items linked to your stories. Scan or upload photos to attach evidence.
        </Text>

        <View className="bg-white/5 border border-white/10 rounded-xl p-6 items-center">
          <Text className="text-white/40 text-4xl mb-3">📦</Text>
          <Text className="text-white font-medium text-center">No artifacts yet</Text>
          <Text className="text-white/50 text-sm text-center mt-1">
            Artifacts will appear here once you attach items to your stories.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
