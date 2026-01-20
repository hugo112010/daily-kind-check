-- Add notification_method column to profiles (email or sms)
ALTER TABLE public.profiles 
ADD COLUMN notification_method TEXT NOT NULL DEFAULT 'email';

-- Add phone column to profiles for SMS notifications
ALTER TABLE public.profiles 
ADD COLUMN phone TEXT;

-- Prevent direct user manipulation of alerts_log (only service role should write)
CREATE POLICY "Deny user insert on alerts_log"
ON public.alerts_log
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny user update on alerts_log"
ON public.alerts_log
FOR UPDATE
USING (false);

CREATE POLICY "Deny user delete on alerts_log"
ON public.alerts_log
FOR DELETE
USING (false);

-- Same for reminders_log - deny direct user writes
CREATE POLICY "Deny user insert on reminders_log"
ON public.reminders_log
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny user update on reminders_log"
ON public.reminders_log
FOR UPDATE
USING (false);

CREATE POLICY "Deny user delete on reminders_log"
ON public.reminders_log
FOR DELETE
USING (false);