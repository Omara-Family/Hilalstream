
-- Create comments table for episode discussions
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments
CREATE POLICY "Anyone can view comments"
  ON public.comments FOR SELECT
  USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "Users can insert own comments"
  ON public.comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (user_id = auth.uid());

-- Admins can delete any comment
CREATE POLICY "Admins can delete any comment"
  ON public.comments FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add indexes
CREATE INDEX idx_comments_episode_id ON public.comments(episode_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);

-- Add updated_at trigger
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
