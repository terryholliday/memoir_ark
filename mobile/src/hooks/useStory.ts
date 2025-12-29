import { useQuery } from '@tanstack/react-query';
import { getStory } from '@/api/stories';
import type { StoryId } from '@/types/story';
import { useAuthStore } from '@/store/auth';

export function useStory(id: StoryId) {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: ['story', id],
    queryFn: () => getStory({ token, id }),
    enabled: Boolean(id),
  });
}
