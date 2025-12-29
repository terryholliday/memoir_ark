import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'proveniq.origins.auth.token';

interface AuthState {
  token: string | null;
  isHydrated: boolean;
  loadFromStorage: () => Promise<void>;
  signInDev: (opts: { email: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  isHydrated: false,

  loadFromStorage: async () => {
    const current = get();
    if (current.isHydrated) return;

    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    set({ token: token ?? null, isHydrated: true });
  },

  signInDev: async (opts) => {
    const token = `dev:${opts.email}:${Date.now()}`;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token });
  },

  signOut: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ token: null });
  },
}));
