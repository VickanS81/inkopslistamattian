import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useApiKey() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setApiKey(null);
      setIsLoading(false);
      return;
    }

    fetchApiKey();
  }, [user]);

  const fetchApiKey = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching API key:', error);
    } else {
      setApiKey(data?.api_key || null);
    }
    setIsLoading(false);
  };

  const generateApiKey = async () => {
    if (!user) return null;

    // Delete existing key first
    await supabase
      .from('user_api_keys')
      .delete()
      .eq('user_id', user.id);

    // Create new key
    const { data, error } = await supabase
      .from('user_api_keys')
      .insert({ user_id: user.id })
      .select('api_key')
      .single();

    if (error) {
      console.error('Error generating API key:', error);
      return null;
    }

    setApiKey(data.api_key);
    return data.api_key;
  };

  const deleteApiKey = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting API key:', error);
      return;
    }

    setApiKey(null);
  };

  return {
    apiKey,
    isLoading,
    generateApiKey,
    deleteApiKey,
  };
}
