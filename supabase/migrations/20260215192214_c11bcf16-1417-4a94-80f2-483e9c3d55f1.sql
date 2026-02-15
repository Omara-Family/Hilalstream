
-- Add streak tracking columns to profiles
ALTER TABLE public.profiles
ADD COLUMN current_streak integer NOT NULL DEFAULT 0,
ADD COLUMN longest_streak integer NOT NULL DEFAULT 0,
ADD COLUMN last_watch_date date;
