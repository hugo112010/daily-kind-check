-- Create reminders_log table to track sent reminders
CREATE TABLE public.reminders_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    reminder_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    deadline_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS
ALTER TABLE public.reminders_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own reminders
CREATE POLICY "Users can view their own reminders"
ON public.reminders_log
FOR SELECT
USING (auth.uid() = user_id);