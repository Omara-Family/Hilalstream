
-- ============================================
-- HilalStream Complete Database Schema
-- ============================================

-- 1) Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'user');

-- 2) User roles table (separate from profiles per security best practices)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3) Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4) Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: check if admin or editor
CREATE OR REPLACE FUNCTION public.is_admin_or_editor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'editor')
  )
$$;

-- 5) Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6) Series table
CREATE TABLE public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description_ar TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  poster_image TEXT DEFAULT '',
  backdrop_image TEXT DEFAULT '',
  release_year INT NOT NULL DEFAULT 2024,
  genre TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  rating NUMERIC DEFAULT 0,
  total_views INT DEFAULT 0,
  is_trending BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

-- Indexes for series
CREATE INDEX idx_series_slug ON public.series(slug);
CREATE INDEX idx_series_release_year ON public.series(release_year);
CREATE INDEX idx_series_is_trending ON public.series(is_trending) WHERE is_trending = true;
CREATE INDEX idx_series_total_views ON public.series(total_views DESC);

-- Full-text search index
ALTER TABLE public.series ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title_ar, '') || ' ' || coalesce(title_en, '') || ' ' || coalesce(description_ar, '') || ' ' || coalesce(description_en, ''))
  ) STORED;
CREATE INDEX idx_series_search ON public.series USING GIN(search_vector);

-- 7) Episodes table
CREATE TABLE public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES public.series(id) ON DELETE CASCADE NOT NULL,
  episode_number INT NOT NULL,
  title_ar TEXT DEFAULT '',
  title_en TEXT DEFAULT '',
  video_servers JSONB DEFAULT '[]'::jsonb,
  download_url TEXT,
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(series_id, episode_number)
);
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_episodes_series_id ON public.episodes(series_id);
CREATE INDEX idx_episodes_number ON public.episodes(episode_number);

-- 8) Favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  series_id UUID REFERENCES public.series(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, series_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_favorites_user ON public.favorites(user_id);

-- 9) Continue watching table
CREATE TABLE public.continue_watching (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE NOT NULL,
  progress_seconds INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, episode_id)
);
ALTER TABLE public.continue_watching ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_continue_watching_user ON public.continue_watching(user_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- User roles policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Series policies
CREATE POLICY "Anyone can view series"
  ON public.series FOR SELECT
  USING (true);

CREATE POLICY "Admin/Editor can insert series"
  ON public.series FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admin/Editor can update series"
  ON public.series FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admin can delete series"
  ON public.series FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Episodes policies
CREATE POLICY "Anyone can view episodes"
  ON public.episodes FOR SELECT
  USING (true);

CREATE POLICY "Admin/Editor can insert episodes"
  ON public.episodes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admin/Editor can update episodes"
  ON public.episodes FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admin can delete episodes"
  ON public.episodes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Favorites policies
CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all favorites"
  ON public.favorites FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can add favorites"
  ON public.favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove favorites"
  ON public.favorites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Continue watching policies
CREATE POLICY "Users manage own continue_watching"
  ON public.continue_watching FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_series_timestamp
  BEFORE UPDATE ON public.series
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_episodes_timestamp
  BEFORE UPDATE ON public.episodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_continue_watching_timestamp
  BEFORE UPDATE ON public.continue_watching
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Increment episode views + series total_views
CREATE OR REPLACE FUNCTION public.increment_episode_views(_episode_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _series_id UUID;
BEGIN
  UPDATE public.episodes SET views = views + 1 WHERE id = _episode_id
  RETURNING series_id INTO _series_id;
  
  IF _series_id IS NOT NULL THEN
    UPDATE public.series SET total_views = total_views + 1 WHERE id = _series_id;
  END IF;
END;
$$;

-- Search function
CREATE OR REPLACE FUNCTION public.search_series(_query TEXT, _limit INT DEFAULT 20, _offset INT DEFAULT 0)
RETURNS SETOF public.series
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.series
  WHERE search_vector @@ plainto_tsquery('simple', _query)
  ORDER BY ts_rank(search_vector, plainto_tsquery('simple', _query)) DESC
  LIMIT _limit
  OFFSET _offset;
$$;

-- Trending algorithm: mark top 10 most viewed as trending
CREATE OR REPLACE FUNCTION public.update_trending()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.series SET is_trending = false WHERE is_trending = true;
  
  UPDATE public.series SET is_trending = true
  WHERE id IN (
    SELECT id FROM public.series ORDER BY total_views DESC LIMIT 10
  );
END;
$$;

-- Storage bucket for posters
INSERT INTO storage.buckets (id, name, public) VALUES ('posters', 'posters', true);

CREATE POLICY "Anyone can view posters"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'posters');

CREATE POLICY "Admin/Editor can upload posters"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'posters' AND public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admin/Editor can update posters"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'posters' AND public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admin can delete posters"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'posters' AND public.has_role(auth.uid(), 'admin'));
