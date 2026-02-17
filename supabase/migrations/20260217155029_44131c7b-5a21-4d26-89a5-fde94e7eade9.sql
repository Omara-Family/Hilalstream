
-- Fix overly permissive INSERT policy on notifications
DROP POLICY "Admins can insert notifications" ON public.notifications;

CREATE POLICY "System and admins can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR user_id = auth.uid()
);
