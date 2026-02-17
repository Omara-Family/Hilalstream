
-- Create programs table (mirrors series)
CREATE TABLE public.programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_ar TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  poster_image TEXT DEFAULT '',
  backdrop_image TEXT DEFAULT '',
  release_year INTEGER NOT NULL DEFAULT 2024,
  genre TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  rating NUMERIC DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  is_trending BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create program_episodes table (mirrors episodes)
CREATE TABLE public.program_episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  title_ar TEXT DEFAULT '',
  title_en TEXT DEFAULT '',
  video_servers JSONB DEFAULT '[]',
  download_url TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_episodes ENABLE ROW LEVEL SECURITY;

-- Programs RLS policies (same as series)
CREATE POLICY "Anyone can view programs" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Admin/Editor can insert programs" ON public.programs FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admin/Editor can update programs" ON public.programs FOR UPDATE USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admin can delete programs" ON public.programs FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Program episodes RLS policies (same as episodes)
CREATE POLICY "Anyone can view program_episodes" ON public.program_episodes FOR SELECT USING (true);
CREATE POLICY "Admin/Editor can insert program_episodes" ON public.program_episodes FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admin/Editor can update program_episodes" ON public.program_episodes FOR UPDATE USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admin can delete program_episodes" ON public.program_episodes FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Updated at triggers
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_program_episodes_updated_at BEFORE UPDATE ON public.program_episodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Increment views function for program episodes
CREATE OR REPLACE FUNCTION public.increment_program_episode_views(_episode_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _program_id UUID;
BEGIN
  UPDATE public.program_episodes SET views = views + 1 WHERE id = _episode_id
  RETURNING program_id INTO _program_id;
  IF _program_id IS NOT NULL THEN
    UPDATE public.programs SET total_views = total_views + 1 WHERE id = _program_id;
  END IF;
END;
$$;
