import { useState, useEffect } from 'react';

export interface AppSettings {
  autoCategorize: boolean;
  autoClearChecked: boolean;
}

const SETTINGS_KEY = 'shopping-app-settings';

const defaultSettings: AppSettings = {
  autoCategorize: false,
  autoClearChecked: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return { settings, updateSettings };
}
