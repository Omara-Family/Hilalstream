import { create } from 'zustand';
import type { User } from '@/types';

interface AppState {
  user: User | null;
  favorites: string[];
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  toggleFavorite: (seriesId: string) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  favorites: JSON.parse(localStorage.getItem('hilal_favorites') || '[]'),
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  toggleFavorite: (seriesId) => {
    const { favorites } = get();
    const updated = favorites.includes(seriesId)
      ? favorites.filter(id => id !== seriesId)
      : [...favorites, seriesId];
    localStorage.setItem('hilal_favorites', JSON.stringify(updated));
    set({ favorites: updated });
  },

  logout: () => {
    localStorage.removeItem('hilal_token');
    set({ user: null, isAuthenticated: false });
  },
}));
