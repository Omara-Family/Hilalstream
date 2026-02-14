import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  favorites: string[];
  setUser: (user: User | null) => void;
  setFavorites: (favs: string[]) => void;
  toggleFavorite: (seriesId: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  favorites: [],

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setFavorites: (favs) => set({ favorites: favs }),

  toggleFavorite: async (seriesId) => {
    const { user, favorites } = get();
    if (!user) return;

    const isFav = favorites.includes(seriesId);
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('series_id', seriesId);
      set({ favorites: favorites.filter(id => id !== seriesId) });
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, series_id: seriesId });
      set({ favorites: [...favorites, seriesId] });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, favorites: [] });
  },

  initialize: () => {
    // Set up auth state listener FIRST
    supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      set({ user, isAuthenticated: !!user, isLoading: false });

      if (user) {
        // Load favorites
        const { data } = await supabase
          .from('favorites')
          .select('series_id')
          .eq('user_id', user.id);
        if (data) {
          set({ favorites: data.map(f => f.series_id) });
        }
      }
    });

    // Then get existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      set({ user, isAuthenticated: !!user, isLoading: false });
    });
  },
}));
