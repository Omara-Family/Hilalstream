
-- Episode Reviews/Ratings table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  episode_id UUID NOT NULL,
  series_id UUID,
  program_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, episode_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON public.reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_reviews_episode ON public.reviews(episode_id);
CREATE INDEX idx_reviews_series ON public.reviews(series_id);

-- User Badges table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert badges" ON public.user_badges FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all badges" ON public.user_badges FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Watch Parties table
CREATE TABLE public.watch_parties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  episode_id UUID NOT NULL,
  series_slug TEXT NOT NULL,
  episode_number INTEGER NOT NULL DEFAULT 1,
  code TEXT NOT NULL UNIQUE DEFAULT substring(md5(random()::text), 1, 6),
  is_active BOOLEAN NOT NULL DEFAULT true,
  current_time_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.watch_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active parties" ON public.watch_parties FOR SELECT USING (is_active = true);
CREATE POLICY "Users can create parties" ON public.watch_parties FOR INSERT WITH CHECK (host_id = auth.uid());
CREATE POLICY "Hosts can update own parties" ON public.watch_parties FOR UPDATE USING (host_id = auth.uid());
CREATE POLICY "Hosts can delete own parties" ON public.watch_parties FOR DELETE USING (host_id = auth.uid());

-- Party Messages table
CREATE TABLE public.party_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID NOT NULL REFERENCES public.watch_parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.party_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Party members can view messages" ON public.party_messages FOR SELECT USING (true);
CREATE POLICY "Users can send messages" ON public.party_messages FOR INSERT WITH CHECK (user_id = auth.uid());

-- Enable realtime for party messages and watch parties
ALTER PUBLICATION supabase_realtime ADD TABLE public.party_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_parties;

-- Trigger for reviews updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
