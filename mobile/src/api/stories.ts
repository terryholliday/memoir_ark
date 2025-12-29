import { apiFetch, isApiConfigured } from './client';
import type { Story, StoryId } from '@/types/story';

export interface ListStoriesResponse {
  stories: Story[];
}

export interface GetStoryResponse {
  story: Story;
}

const mockStories: Story[] = [
  {
    id: 'story_001',
    title: 'Origins: First Story',
    body: 'This is a scaffold story returned by the API client when EXPO_PUBLIC_API_BASE_URL is not configured.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'story_002',
    title: 'Memory Structure',
    body: 'Stories are structured evidence. The mobile client scaffolds capture flows without fake persistence.',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
];

export async function listStories(opts: { token?: string | null }): Promise<ListStoriesResponse> {
  if (!isApiConfigured()) {
    return { stories: mockStories };
  }

  return apiFetch<ListStoriesResponse>('/api/v1/stories', {
    method: 'GET',
    token: opts.token ?? null,
  });
}

export async function getStory(opts: { token?: string | null; id: StoryId }): Promise<GetStoryResponse> {
  if (!isApiConfigured()) {
    const story = mockStories.find((s) => s.id === opts.id);
    if (!story) throw new Error('Story not found (mock)');
    return { story };
  }

  return apiFetch<GetStoryResponse>(`/api/v1/stories/${encodeURIComponent(opts.id)}`, {
    method: 'GET',
    token: opts.token ?? null,
  });
}
