import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  favorites: string[];
  setUser: (user: User | null) => void;
  setFavorites: (favs: string[]) => void;
  toggleFavorite: (seriesId: string) => void;
  logout: () => void;
  initialize: () => void;
}

const loadFavorites = async (userId: string) => {
  const { data } = await supabase
    .from('favorites')
    .select('series_id')
    .eq('user_id', userId);
  return data?.map(f => f.series_id) ?? [];
};

const checkAdmin = async (userId: string) => {
  const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
  return data === true;
};

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  favorites: [],

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false, isAdmin: user ? get().isAdmin : false }),
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
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      console.log('signOut result:', { error });
    } catch (e) {
      console.error('signOut exception:', e);
    }
    set({ user: null, isAuthenticated: false, isAdmin: false, favorites: [] });
  },

  initialize: () => {
    let lastUserId: string | null = null;

    const handleUser = async (user: User | null) => {
      // If same user, just update session – don't re-check admin
      if (user && user.id === lastUserId) {
        set({ user, isAuthenticated: true, isLoading: false });
        return;
      }

      lastUserId = user?.id ?? null;
      set({ user, isAuthenticated: !!user, isLoading: false });

      if (user) {
        const [favs, admin] = await Promise.all([
          loadFavorites(user.id),
          checkAdmin(user.id),
        ]);
        set({ favorites: favs, isAdmin: admin });
      } else {
        set({ favorites: [], isAdmin: false });
      }
    };

    supabase.auth.onAuthStateChange((_event, session) => {
      handleUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUser(session?.user ?? null);
    });
  },
}));
