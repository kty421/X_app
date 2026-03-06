import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { cloneTheme, createTheme, type ThemeDraft, type ThemeSet } from '@/src/domain/theme';
import { defaultThemes } from '@/src/features/themes/defaultThemes';

interface ThemeStoreState {
  themes: ThemeSet[];
  currentThemeId: string;
  addTheme: (draft: ThemeDraft) => string;
  updateTheme: (id: string, draft: ThemeDraft) => void;
  duplicateTheme: (id: string) => void;
  deleteTheme: (id: string) => void;
  setCurrentTheme: (id: string) => void;
  getCurrentTheme: () => ThemeSet;
}

const createFallbackTheme = (): ThemeSet =>
  createTheme({
    name: '新しいテーマ',
    includeKeywords: ['人工知能'],
    excludeKeywords: [],
    includeAccounts: [],
    language: 'all',
    hideRetweets: true,
    hideReplies: true,
    safeMode: true,
  });

const getInitialState = () => ({
  themes: defaultThemes,
  currentThemeId: defaultThemes[0].id,
});

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set, get) => ({
      ...getInitialState(),
      addTheme: (draft) => {
        const nextTheme = createTheme(draft);
        set((state) => ({
          themes: [...state.themes, nextTheme],
          currentThemeId: nextTheme.id,
        }));
        return nextTheme.id;
      },
      updateTheme: (id, draft) => {
        set((state) => ({
          themes: state.themes.map((theme) =>
            theme.id === id
              ? {
                  ...createTheme(draft, id),
                  createdAt: theme.createdAt,
                  updatedAt: new Date().toISOString(),
                }
              : theme
          ),
        }));
      },
      duplicateTheme: (id) => {
        const theme = get().themes.find((item) => item.id === id);
        if (!theme) return;

        const duplicated = cloneTheme(theme);
        set((state) => ({
          themes: [...state.themes, duplicated],
          currentThemeId: duplicated.id,
        }));
      },
      deleteTheme: (id) => {
        set((state) => {
          const remaining = state.themes.filter((theme) => theme.id !== id);
          const fallbackThemes = remaining.length > 0 ? remaining : [createFallbackTheme()];
          const nextCurrentId = fallbackThemes.some((theme) => theme.id === state.currentThemeId)
            ? state.currentThemeId
            : fallbackThemes[0].id;

          return {
            themes: fallbackThemes,
            currentThemeId: nextCurrentId,
          };
        });
      },
      setCurrentTheme: (id) => {
        if (!get().themes.some((theme) => theme.id === id)) return;
        set({ currentThemeId: id });
      },
      getCurrentTheme: () => {
        const state = get();
        return state.themes.find((theme) => theme.id === state.currentThemeId) ?? state.themes[0];
      },
    }),
    {
      name: 'focusx.theme.store.v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (state) => {
        if (!state || typeof state !== 'object') return getInitialState();

        const typedState = state as { themes?: ThemeSet[]; currentThemeId?: string };
        const themes =
          typedState.themes && typedState.themes.length > 0 ? typedState.themes : defaultThemes;
        const currentThemeId =
          typedState.currentThemeId && themes.some((theme) => theme.id === typedState.currentThemeId)
            ? typedState.currentThemeId
            : themes[0].id;

        return {
          ...getInitialState(),
          themes,
          currentThemeId,
        };
      },
      partialize: (state) => ({
        themes: state.themes,
        currentThemeId: state.currentThemeId,
      }),
    }
  )
);
