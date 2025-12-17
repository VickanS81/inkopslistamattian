import { useState, useEffect, useCallback } from 'react';

export interface AppSettings {
  autoCategorize: boolean;
  autoClearChecked: boolean;
  showOnlyCategoriesWithItems: boolean;
}

const SETTINGS_KEY = 'shopping-app-settings';

const defaultSettings: AppSettings = {
  autoCategorize: false,
  autoClearChecked: false,
  showOnlyCategoriesWithItems: false,
};

function getInitialSettings(): AppSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  return defaultSettings;
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(getInitialSettings);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  return { settings, updateSettings };
}
