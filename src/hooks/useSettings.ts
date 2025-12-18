import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AppSettings {
  autoCategorize: boolean;
  autoClearChecked: boolean;
  showOnlyCategoriesWithItems: boolean;
}

const defaultSettings: AppSettings = {
  autoCategorize: false,
  autoClearChecked: false,
  showOnlyCategoriesWithItems: false,
};

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings from database
  useEffect(() => {
    if (!user) {
      setSettings(defaultSettings);
      setIsLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching settings:', error);
          setSettings(defaultSettings);
        } else if (data) {
          setSettings({
            autoCategorize: data.auto_categorize,
            autoClearChecked: data.auto_clear_checked,
            showOnlyCategoriesWithItems: data.show_only_categories_with_items,
          });
        } else {
          // No settings found, create default settings
          const { error: insertError } = await supabase
            .from('user_settings')
            .insert({
              user_id: user.id,
              auto_categorize: defaultSettings.autoCategorize,
              auto_clear_checked: defaultSettings.autoClearChecked,
              show_only_categories_with_items: defaultSettings.showOnlyCategoriesWithItems,
            });
          
          if (insertError) {
            console.error('Error creating settings:', insertError);
          }
          setSettings(defaultSettings);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    if (!user) return;

    // Optimistically update local state
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    // Update in database
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          auto_categorize: newSettings.autoCategorize,
          auto_clear_checked: newSettings.autoClearChecked,
          show_only_categories_with_items: newSettings.showOnlyCategoriesWithItems,
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating settings:', error);
        // Revert on error - refetch from database
        const { data } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          setSettings({
            autoCategorize: data.auto_categorize,
            autoClearChecked: data.auto_clear_checked,
            showOnlyCategoriesWithItems: data.show_only_categories_with_items,
          });
        }
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  }, [user, settings]);

  return { settings, updateSettings, isLoading };
}
