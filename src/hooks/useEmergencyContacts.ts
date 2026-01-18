import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export const useEmergencyContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchContacts = async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (name: string, email: string, isPrimary: boolean = false) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('emergency_contacts')
      .insert({
        user_id: user.id,
        name,
        email,
        is_primary: isPrimary,
      });

    if (!error) {
      await fetchContacts();
    }

    return { error };
  };

  const updateContact = async (id: string, updates: { name?: string; email?: string; is_primary?: boolean }) => {
    const { error } = await supabase
      .from('emergency_contacts')
      .update(updates)
      .eq('id', id);

    if (!error) {
      await fetchContacts();
    }

    return { error };
  };

  const deleteContact = async (id: string) => {
    if (contacts.length <= 1) {
      return { error: new Error('Cannot delete the last contact') };
    }

    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', id);

    if (!error) {
      await fetchContacts();
    }

    return { error };
  };

  useEffect(() => {
    fetchContacts();
  }, [user]);

  return { contacts, loading, error, addContact, updateContact, deleteContact, refetch: fetchContacts };
};
