/**
 * API 키 관리 스토어
 * Dev 환경: localStorage에 저장
 * Production 환경: Supabase에 암호화 저장
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { APIKey, ServiceName } from "@/lib/types/api-keys";

interface ApiKeysState {
  // Dev 환경용 localStorage 키 (하위 호환성)
  youtubeApiKey: string | null;
  setYoutubeApiKey: (key: string) => void;
  clearYoutubeApiKey: () => void;

  // Production 환경용 Supabase 키
  keys: APIKey[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setKeys: (keys: APIKey[]) => void;
  addKey: (key: APIKey) => void;
  removeKey: (serviceName: ServiceName) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Helpers
  hasKey: (serviceName: ServiceName) => boolean;
  getKey: (serviceName: ServiceName) => APIKey | undefined;

  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useApiKeysStore = create<ApiKeysState>()(
  persist(
    (set, get) => ({
      // Dev 환경용 (localStorage)
      youtubeApiKey: null,
      setYoutubeApiKey: (key: string) => set({ youtubeApiKey: key }),
      clearYoutubeApiKey: () => set({ youtubeApiKey: null }),

      // Production 환경용 (Supabase)
      keys: [],
      isLoading: false,
      error: null,

      setKeys: (keys) => set({ keys, error: null }),

      addKey: (key) =>
        set((state) => {
          const existingIndex = state.keys.findIndex(
            (k) => k.service_name === key.service_name
          );

          if (existingIndex >= 0) {
            const newKeys = [...state.keys];
            newKeys[existingIndex] = key;
            return { keys: newKeys };
          } else {
            return { keys: [...state.keys, key] };
          }
        }),

      removeKey: (serviceName) =>
        set((state) => ({
          keys: state.keys.filter((k) => k.service_name !== serviceName),
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      reset: () => set({ keys: [], isLoading: false, error: null }),

      // Helpers
      hasKey: (serviceName) => {
        const state = get();
        return state.keys.some((k) => k.service_name === serviceName);
      },

      getKey: (serviceName) => {
        const state = get();
        return state.keys.find((k) => k.service_name === serviceName);
      },

      // Hydration
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: "api-keys-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
