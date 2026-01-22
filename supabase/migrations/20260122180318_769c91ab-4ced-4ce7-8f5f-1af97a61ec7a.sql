-- Allow users to delete their own check-in history
CREATE POLICY "Users can delete their own checkins"
ON public.checkins
FOR DELETE
USING (auth.uid() = user_id);