import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type DbSeries = Tables<'series'>;
export type DbEpisode = Tables<'episodes'>;
export type DbProfile = Tables<'profiles'>;

export const api = {
  // ---- Series ----
  async getSeries(params?: { genre?: string; year?: string; limit?: number; offset?: number }) {
    let query = supabase
      .from('series')
      .select('id, title_ar, title_en, slug, description_ar, description_en, poster_image, backdrop_image, release_year, genre, tags, rating, total_views, is_trending, created_at')
      .order('created_at', { ascending: false });

    if (params?.genre) {
      query = query.contains('genre', [params.genre]);
    }
    if (params?.year) {
      query = query.eq('release_year', parseInt(params.year));
    }
    if (params?.limit) {
      query = query.limit(params.limit);
    }
    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params?.limit || 20) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getTrending() {
    const { data, error } = await supabase
      .from('series')
      .select('id, title_ar, title_en, slug, description_ar, description_en, poster_image, backdrop_image, release_year, genre, tags, rating, total_views, is_trending, created_at')
      .eq('is_trending', true)
      .order('total_views', { ascending: false })
      .limit(10);
    if (error) throw error;
    return data;
  },

  async getSeriesBySlug(slug: string) {
    const { data, error } = await supabase
      .from('series')
      .select('id, title_ar, title_en, slug, description_ar, description_en, poster_image, backdrop_image, release_year, genre, tags, rating, total_views, is_trending, created_at')
      .eq('slug', slug)
      .single();
    if (error) throw error;
    return data;
  },

  // ---- Episodes ----
  async getEpisodes(seriesId: string) {
    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('series_id', seriesId)
      .order('episode_number', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getEpisodeByNumber(seriesId: string, episodeNumber: number) {
    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('series_id', seriesId)
      .eq('episode_number', episodeNumber)
      .single();
    if (error) throw error;
    return data;
  },

  // ---- Search ----
  async searchSeries(query: string, limit = 20, offset = 0) {
    const { data, error } = await supabase.rpc('search_series', {
      _query: query,
      _limit: limit,
      _offset: offset,
    });
    if (error) throw error;
    return data;
  },

  // ---- Favorites ----
  async getFavorites(userId: string) {
    const { data, error } = await supabase
      .from('favorites')
      .select('series_id, series:series_id(id, title_ar, title_en, slug, poster_image, release_year, rating, total_views, is_trending, genre, tags, backdrop_image, description_ar, description_en, created_at)')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async addFavorite(userId: string, seriesId: string) {
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, series_id: seriesId });
    if (error) throw error;
  },

  async removeFavorite(userId: string, seriesId: string) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('series_id', seriesId);
    if (error) throw error;
  },

  async isFavorite(userId: string, seriesId: string) {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('series_id', seriesId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  // ---- Auth ----
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  // ---- Views ----
  async incrementViews(episodeId: string) {
    await supabase.rpc('increment_episode_views', { _episode_id: episodeId });
  },

  // ---- Stream proxy ----
  getStreamProxyUrl(episodeId: string, serverIndex: number) {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    return `https://${projectId}.supabase.co/functions/v1/stream-proxy?episode=${episodeId}&server=${serverIndex}`;
  },
};
