
-- Add download_links jsonb column to episodes table for multi-quality downloads
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS download_links jsonb DEFAULT '[]'::jsonb;

-- Add download_links jsonb column to program_episodes table too
ALTER TABLE public.program_episodes ADD COLUMN IF NOT EXISTS download_links jsonb DEFAULT '[]'::jsonb;
