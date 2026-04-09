import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { hospitalApi } from '../utils/api';

export type HospitalSettings = {
  name: string;
  logoDataUrl?: string;
  phone?: string;
  address?: string;
  code?: string;
  slipFooter?: string;
};

type HospitalSettingsContextType = {
  settings: HospitalSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
};

const defaultSettings: HospitalSettings = {
  name: 'MindSpire HMS',
  logoDataUrl: undefined,
};

const HospitalSettingsContext = createContext<HospitalSettingsContextType | undefined>(undefined);

export const HospitalSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<HospitalSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await hospitalApi.getSettings() as HospitalSettings;
      if (data) {
        setSettings({
          ...defaultSettings,
          ...data,
          // Ensure name isn't empty
          name: data.name || defaultSettings.name
        });
      }
    } catch (err) {
      console.error('Failed to fetch hospital settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <HospitalSettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </HospitalSettingsContext.Provider>
  );
};

export const useHospitalSettings = () => {
  const context = useContext(HospitalSettingsContext);
  if (context === undefined) {
    throw new Error('useHospitalSettings must be used within a HospitalSettingsProvider');
  }
  return context;
};
