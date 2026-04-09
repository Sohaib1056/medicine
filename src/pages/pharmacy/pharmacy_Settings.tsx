import { useEffect, useRef, useState } from 'react'
import Toast from '../../components/ui/Toast'
import { usePharmacySettings } from '../../contexts/PharmacySettingsContext'

export default function Pharmacy_Settings() {
  const { settings, updateSettings } = usePharmacySettings()
  const [activeTab, setActiveTab] = useState<'pharmacy' | 'system'>('pharmacy')

  // Pharmacy Settings form state - initialize from context
  const [pharmacyName, setPharmacyName] = useState(settings.pharmacyName)
  const [phone, setPhone] = useState(settings.phone)
  const [address, setAddress] = useState(settings.address)
  const [email, setEmail] = useState(settings.email)
  const [license, setLicense] = useState(settings.license)
  const [billingFooter, setBillingFooter] = useState(settings.billingFooter)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(settings.logoDataUrl)

  // System Settings form state
  const [taxRate, setTaxRate] = useState<number>(settings.taxRate)
  const [maxSaleLimit, setMaxSaleLimit] = useState<number>(settings.maxSaleLimit)
  const [discountRate, setDiscountRate] = useState<number>(0)
  const [currency, setCurrency] = useState<string>('PKR')
  const [dateFormat, setDateFormat] = useState<string>('DD/MM/YYYY')
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const pharmacyNameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onSave = () => {
      if (activeTab === 'pharmacy') savePharmacy()
      else saveSystem()
    }
    window.addEventListener('pharmacy:settings:save', onSave)
    return () => window.removeEventListener('pharmacy:settings:save', onSave)
  }, [activeTab, pharmacyName, phone, address, email, license, billingFooter, logoDataUrl, taxRate, maxSaleLimit])

  useEffect(() => {
    pharmacyNameRef.current?.focus()
  }, [])

  // Sync local state when context settings change
  useEffect(() => {
    setPharmacyName(settings.pharmacyName || '')
    setPhone(settings.phone || '')
    setAddress(settings.address || '')
    setEmail(settings.email || '')
    setLicense(settings.license || '')
    setBillingFooter(settings.billingFooter || '')
    setLogoDataUrl(settings.logoDataUrl || null)
    setTaxRate(settings.taxRate || 0)
    setMaxSaleLimit(settings.maxSaleLimit || 0)
  }, [settings])

  const savePharmacy = async () => {
    await updateSettings({ pharmacyName, phone, address, email, license, billingFooter, logoDataUrl: logoDataUrl || '' })
    setToast({ type: 'success', message: 'Pharmacy settings saved' })
  }

  const saveSystem = async () => {
    try {
      await updateSettings({ taxRate, maxSaleLimit })
      setToast({ type: 'success', message: 'System settings saved' })
    } catch {
      setToast({ type: 'error', message: 'Failed to save system settings' })
    }
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-2 text-slate-800">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path fillRule="evenodd" d="M8.841 2.718a2.25 2.25 0 0 1 2.318-.495 2.25 2.25 0 0 0 2.682 1.212 2.25 2.25 0 0 1 2.941 1.424 2.25 2.25 0 0 0 1.765 1.765 2.25 2.25 0 0 1 1.424 2.941 2.25 2.25 0 0 0 1.212 2.682 2.25 2.25 0 0 1-.495 2.318 2.25 2.25 0 0 0-1.212 2.682 2.25 2.25 0 0 1-1.424 2.941 2.25 2.25 0 0 0-1.765 1.765 2.25 2.25 0 0 1-2.941 1.424 2.25 2.25 0 0 0-2.682 1.212 2.25 2.25 0 0 1-2.318-.495 2.25 2.25 0 0 0-3.294 0 2.25 2.25 0 0 1-2.318.495 2.25 2.25 0 0 0-1.212-2.682 2.25 2.25 0 0 1-1.424-2.941 2.25 2.25 0 0 0-1.212-2.682 2.25 2.25 0 0 1 .495-2.318 2.25 2.25 0 0 0 1.212-2.682 2.25 2.25 0 0 1 1.424-2.941 2.25 2.25 0 0 0 1.765-1.765 2.25 2.25 0 0 1 2.941-1.424 2.25 2.25 0 0 0 2.682-1.212 2.25 2.25 0 0 1 2.318.495 2.25 2.25 0 0 0 3.294 0Z" clipRule="evenodd" /></svg>
        <h2 className="text-xl font-bold">Settings</h2>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setActiveTab('pharmacy')} className={`rounded-md border px-3 py-1.5 text-sm ${activeTab === 'pharmacy' ? 'border-slate-300 bg-white text-slate-900' : 'border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Pharmacy Settings</button>
        <button type="button" onClick={() => setActiveTab('system')} className={`rounded-md border px-3 py-1.5 text-sm ${activeTab === 'system' ? 'border-slate-300 bg-white text-slate-900' : 'border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>System Settings</button>
      </div>

      {activeTab === 'pharmacy' && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3 font-medium text-slate-800">Pharmacy Settings</div>
          <div className="space-y-4 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-slate-700">Pharmacy Name</label>
                <input ref={pharmacyNameRef} value={pharmacyName} onChange={e => setPharmacyName(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700">Phone Number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" placeholder="+92-21-1234567" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-700">Pharmacy Address</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" rows={3} />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-700">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-700">License Number</label>
              <input value={license} onChange={e => setLicense(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" placeholder="e.g., LIC-123456" />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-700">Billing Footer</label>
              <textarea value={billingFooter} onChange={e => setBillingFooter(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" rows={3} />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-700">Pharmacy Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) { setLogoDataUrl(null); return }
                  const reader = new FileReader()
                  reader.onload = () => setLogoDataUrl(String(reader.result || ''))
                  reader.readAsDataURL(file)
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:text-slate-700"
              />
              {logoDataUrl && (
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                  <img src={logoDataUrl} alt="Logo preview" className="h-10 w-10 rounded border" />
                  <span>Preview</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end">
              <button type="button" onClick={savePharmacy} className="btn">Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3 font-medium text-slate-800">System Settings</div>
          <div className="space-y-4 p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm text-slate-700">Tax Rate (%)</label>
                <input type="number" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value || '0'))} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700">Maximum Value Limit</label>
                <input type="number" value={maxSaleLimit} onChange={e => setMaxSaleLimit(parseFloat(e.target.value || '0'))} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" placeholder="e.g. 5000" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700">Discount Rate (%)</label>
                <input type="number" value={discountRate} onChange={e => setDiscountRate(parseFloat(e.target.value || '0'))} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm text-slate-700">Currency</label>
                <input value={currency} onChange={e => setCurrency(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-700">Date Format</label>
                <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
                  <option>DD/MM/YYYY</option>
                  <option>MM/DD/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button type="button" onClick={saveSystem} className="btn">Save Settings</button>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
