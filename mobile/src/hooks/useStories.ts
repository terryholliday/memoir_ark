import { useQuery } from '@tanstack/react-query';
import { listStories } from '@/api/stories';
import { useAuthStore } from '@/store/auth';

export function useStories() {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: ['stories'],
    queryFn: () => listStories({ token }),
  });
}
