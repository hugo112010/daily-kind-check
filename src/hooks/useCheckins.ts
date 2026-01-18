import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Checkin {
  id: string;
  user_id: string;
  created_at: string;
}

export const useCheckins = () => {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCheckins = async () => {
    if (!user) {
      setCheckins([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCheckins(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const performCheckin = async () => {
    if (!user) return { error: new Error('Not authenticated') };

    // Create checkin record
    const { error: checkinError } = await supabase
      .from('checkins')
      .insert({
        user_id: user.id,
      });

    if (checkinError) return { error: checkinError };

    // Update last_checkin_at in profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ last_checkin_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (!profileError) {
      await fetchCheckins();
    }

    return { error: profileError };
  };

  useEffect(() => {
    fetchCheckins();
  }, [user]);

  return { checkins, loading, error, performCheckin, refetch: fetchCheckins };
};
