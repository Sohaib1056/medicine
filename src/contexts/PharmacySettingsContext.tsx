import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { pharmacyApi } from '../utils/api'

interface PharmacySettings {
  pharmacyName: string
  phone: string
  address: string
  email: string
  billingFooter: string
  logoDataUrl: string | null
  taxRate: number
  maxSaleLimit: number
  license: string
}

interface PharmacySettingsContextType {
  settings: PharmacySettings
  refreshSettings: () => Promise<void>
  updateSettings: (newSettings: Partial<PharmacySettings>) => Promise<void>
}

const defaultSettings: PharmacySettings = {
  pharmacyName: 'Pharmacy',
  phone: '',
  address: '',
  email: '',
  billingFooter: '',
  logoDataUrl: null,
  taxRate: 0,
  maxSaleLimit: 0,
  license: '',
}

const PharmacySettingsContext = createContext<PharmacySettingsContextType | undefined>(undefined)

export function PharmacySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PharmacySettings>(defaultSettings)

  const refreshSettings = useCallback(async () => {
    try {
      const s = await pharmacyApi.getSettings()
      setSettings({
        pharmacyName: s.pharmacyName || 'Pharmacy',
        phone: s.phone || '',
        address: s.address || '',
        email: s.email || '',
        billingFooter: s.billingFooter || '',
        logoDataUrl: s.logoDataUrl || null,
        taxRate: Number(s.taxRate || 0),
        maxSaleLimit: Number(s.maxSaleLimit || 0),
        license: s.license || '',
      })
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
  }, [])

  const updateSettings = useCallback(async (newSettings: Partial<PharmacySettings>) => {
    try {
      await pharmacyApi.updateSettings(newSettings)
      await refreshSettings()
    } catch (e) {
      console.error('Failed to update settings:', e)
      throw e
    }
  }, [refreshSettings])

  useEffect(() => {
    refreshSettings()
  }, [refreshSettings])

  return (
    <PharmacySettingsContext.Provider value={{ settings, refreshSettings, updateSettings }}>
      {children}
    </PharmacySettingsContext.Provider>
  )
}

export function usePharmacySettings() {
  const context = useContext(PharmacySettingsContext)
  if (context === undefined) {
    throw new Error('usePharmacySettings must be used within a PharmacySettingsProvider')
  }
  return context
}
