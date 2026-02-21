
-- Add notification preferences to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS newsletter_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS favorites_notifications boolean NOT NULL DEFAULT false;

-- Create email_logs table for deduplication and tracking
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'newsletter',
  reference_id uuid NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint to prevent duplicate emails per user/type/reference
CREATE UNIQUE INDEX idx_email_logs_unique ON public.email_logs (user_id, type, reference_id);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view email logs"
  ON public.email_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only system (service role) inserts logs - no user policy needed since edge functions use service role
