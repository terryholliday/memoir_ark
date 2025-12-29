import { create } from 'zustand';

interface DraftStoryState {
  title: string;
  body: string;
  audioUri: string | null;
  setTitle: (title: string) => void;
  setBody: (body: string) => void;
  setAudioUri: (uri: string | null) => void;
  reset: () => void;
}

const initial = { title: '', body: '', audioUri: null } as const;

export const useDraftStoryStore = create<DraftStoryState>((set) => ({
  ...initial,
  setTitle: (title) => set({ title }),
  setBody: (body) => set({ body }),
  setAudioUri: (audioUri) => set({ audioUri }),
  reset: () => set({ ...initial }),
}));
