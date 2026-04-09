import { useEffect, useState, useRef } from 'react'
import { pharmacyApi } from '../../utils/api'
import SearchableSelect from '../common/SearchableSelect'
import Pharmacy_AuthVerifyDialog from './Pharmacy_AuthVerifyDialog'

type Props = {
  open: boolean
  onClose: () => void
  medicine?: string
}

export default function Pharmacy_EditInventoryItem({ open, onClose, medicine }: Props) {
  const saveButtonRef = useRef<HTMLButtonElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const onlyDate = (s?: string) => {
    if (!s) return ''
    try {
      const m = String(s).match(/^(\d{4}-\d{2}-\d{2})/)
      if (m) return m[1]
      const d = new Date(s)
      if (!isNaN(d.getTime())) return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)
    } catch {}
    return ''
  }
  // Basic fields
  const [name, setName] = useState('')
  const [genericName, setGenericName] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [unitType, setUnitType] = useState('')
  const [barcode, setBarcode] = useState('')

  // Stock fields
  const [onHand, setOnHand] = useState<number>(0)
  const [minStock, setMinStock] = useState<number | ''>('')
  const [maxPackAllow, setMaxPackAllow] = useState<number | ''>('')
  const [unitsPerPack, setUnitsPerPack] = useState<number>(1)
  const [shelfNumber, setShelfNumber] = useState('')

  // Pricing fields
  const [buyPerPack, setBuyPerPack] = useState<number>(0)
  const [buyPerUnit, setBuyPerUnit] = useState<number>(0)
  const [salePerPack, setSalePerPack] = useState<number>(0)
  const [salePerUnit, setSalePerUnit] = useState<number>(0)
  const [defaultDiscountPct, setDefaultDiscountPct] = useState<number>(0)

  // Line Tax fields
  const [lineTaxType, setLineTaxType] = useState<'percent' | 'fixed'>('percent')
  const [lineTaxValue, setLineTaxValue] = useState<number>(0)

  // Image and Description fields
  const [image, setImage] = useState('')
  const [description, setDescription] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)

  // Narcotic flag
  const [narcotic, setNarcotic] = useState<boolean>(false)

  // Invoice/Supplier fields
  const [date, setDate] = useState('')
  const [invoice, setInvoice] = useState('')
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [companies, setCompanies] = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')
  const [companyName, setCompanyName] = useState('')

  const [authOpen, setAuthOpen] = useState(false)
  const [onAuthVerified, setOnAuthVerified] = useState<(() => void) | null>(null)

  useEffect(()=>{
    if (!open) return
    const today = new Date().toISOString().slice(0,10)
    setDate(today)
    setInvoice('')
    setName(String(medicine||'').trim())
    setMinStock('')
    setMaxPackAllow('')
    setUploadError('')
    setUploadLoading(false)
    const key = (medicine||'').trim()
    if (!key) return
    let mounted = true
    pharmacyApi.listAllSuppliers().then((res:any)=>{
      if (!mounted) return
      setSuppliers(res?.items ?? res ?? [])
    }).catch(()=>{})
    pharmacyApi.listInventory({ search: key, limit: 1 }).then((res:any)=>{
      if (!mounted) return
      const it = (res?.items || [])[0]
      if (!it) return
      // Basic fields
      setGenericName(String(it.genericName || it.lastGenericName || ''))
      setManufacturer(String(it.manufacturer || ''))
      setCategory(String(it.category||''))
      setBrand(String(it.brand || it.lastBrand || ''))
      setUnitType(String(it.unitType || it.lastUnitType || ''))
      setBarcode(String(it.barcode || it.lastBarcode || ''))
      setNarcotic(Boolean(it.narcotic))

      // Stock fields
      if (it.minStock != null) setMinStock(Number(it.minStock))
      if (it.maxPackAllow != null) setMaxPackAllow(Number(it.maxPackAllow))
      setUnitsPerPack((it.unitsPerPack!=null && it.unitsPerPack>0)? it.unitsPerPack : 1)
      setOnHand(Number(it.onHand||0))
      setShelfNumber(String(it.shelfNumber || it.lastShelfNumber || ''))

      // Pricing fields
      if (it.lastBuyPerPack != null) setBuyPerPack(Number(it.lastBuyPerPack))
      if (it.lastBuyPerUnit != null) setBuyPerUnit(Number(it.lastBuyPerUnit))
      if (it.lastSalePerPack != null) setSalePerPack(Number(it.lastSalePerPack))
      if (it.lastSalePerUnit != null) setSalePerUnit(Number(it.lastSalePerUnit))
      if (it.defaultDiscountPct != null) setDefaultDiscountPct(Number(it.defaultDiscountPct))
      if (it.lastLineTaxType) setLineTaxType(it.lastLineTaxType as 'percent' | 'fixed')
      if (it.lastLineTaxValue != null) setLineTaxValue(Number(it.lastLineTaxValue))

      // Image and Description fields
      if (it.image != null) setImage(String(it.image))
      if (it.description != null) setDescription(String(it.description))

      // Invoice fields
      // Invoice fields
      if (it.lastInvoice) setInvoice(String(it.lastInvoice))
      if (it.lastInvoiceDate) setDate(onlyDate(String(it.lastInvoiceDate)))
      if (it.lastSupplier) {
        setSupplierName(String(it.lastSupplier))
        const s = (suppliers||[]).find((x:any)=> String(x.name||'') === String(it.lastSupplier||''))
        if (s) setSupplierId(s._id)
      }
      if (it.lastCompany) setCompanyName(String(it.lastCompany))
      if (it.lastCompanyId) setCompanyId(String(it.lastCompanyId))
    }).catch(()=>{})
    return ()=>{ mounted = false }
  }, [open, medicine])

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  useEffect(()=>{
    if (!open) return
    if (supplierName && suppliers.length && !supplierId){
      const s = suppliers.find((x:any)=> String(x.name||'') === String(supplierName||''))
      if (s) setSupplierId(s._id)
    }
  }, [open, suppliers, supplierName])

  // Auto-calculate unit prices when pack prices or unitsPerPack change
  useEffect(() => {
    if (unitsPerPack > 0) {
      if (buyPerPack > 0) {
        setBuyPerUnit(Number((buyPerPack / unitsPerPack).toFixed(3)))
      }
      if (salePerPack > 0) {
        setSalePerUnit(Number((salePerPack / unitsPerPack).toFixed(3)))
      }
    }
  }, [buyPerPack, salePerPack, unitsPerPack])

  // Auto-set Max Discount equal to margin
  useEffect(() => {
    const sale = Number(salePerUnit || 0)
    const buy = Number(buyPerUnit || 0)
    if (sale > 0) {
      const marginPct = Math.max(0, Math.min(100, ((sale - buy) / sale) * 100))
      setDefaultDiscountPct(Number(marginPct.toFixed(2)))
    } else {
      setDefaultDiscountPct(0)
    }
  }, [buyPerUnit, salePerUnit])

  // Load companies for the selected supplier and preserve/auto-select like Add Invoice
  useEffect(()=>{
    if (!open) return
    let mounted = true
    ;(async()=>{
      try {
        if (!supplierId){ setCompanies([]); setCompanyId(''); setCompanyName(''); return }
        const res: any = await pharmacyApi.listAllCompanies({ distributorId: supplierId })
        if (!mounted) return
        const list = res?.items ?? res ?? []
        setCompanies(list)
        const found = companyId ? list.find((x: any) => String(x._id) === String(companyId)) : null
        if (found){
          setCompanyName(found.name || '')
        } else if (list.length === 1){
          setCompanyId(String(list[0]._id))
          setCompanyName(String(list[0].name || ''))
        } else {
          setCompanyId('')
          setCompanyName('')
        }
      } catch {
        if (!mounted) return
        setCompanies([])
        setCompanyId('')
        setCompanyName('')
      }
    })()
    return ()=>{ mounted = false }
  }, [open, supplierId])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl bg-white p-0 shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-xl font-bold text-slate-800">Edit Inventory Item</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">Basic Information</h4>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="lg:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Medicine Name</label>
                  <input ref={nameInputRef} value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Generic Name</label>
                  <input value={genericName} onChange={e=>setGenericName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Manufacturer</label>
                  <input value={manufacturer} onChange={e=>setManufacturer(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Manufacturer name" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Barcode</label>
                  <input value={barcode} onChange={e=>setBarcode(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Scan or enter barcode" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                  <input value={category} onChange={e=>setCategory(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Brand</label>
                  <input value={brand} onChange={e=>setBrand(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Unit Type</label>
                  <input value={unitType} onChange={e=>setUnitType(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="e.g., Tablet, Syrup" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="narcotic"
                    checked={narcotic}
                    onChange={e => setNarcotic(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="narcotic" className="text-sm font-medium text-slate-700">Narcotic Item</label>
                </div>
              </div>
            </div>

            {/* Image and Description */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">Product Details</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Product Image</label>
                  {image && (
                    <div className="mb-2">
                      <img src={image} alt="Product" className="h-24 w-24 rounded-md object-cover border border-slate-200" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={uploadLoading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploadError('')
                      setUploadLoading(true)
                      try {
                        const result = await pharmacyApi.uploadInventoryImage(file)
                        setImage(result.url)
                      } catch (err: any) {
                        setUploadError(err?.message || 'Upload failed')
                      } finally {
                        setUploadLoading(false)
                        e.target.value = ''
                      }
                    }}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {uploadLoading && (
                    <p className="mt-1 text-xs text-slate-500">Uploading...</p>
                  )}
                  {uploadError && (
                    <p className="mt-1 text-xs text-red-600">{uploadError}</p>
                  )}
                  {image && (
                    <button
                      type="button"
                      onClick={() => { setImage(''); setUploadError('') }}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                  <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Enter detailed description of the medicine/product" />
                </div>
              </div>
            </div>

            {/* Stock Information */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">Stock Information</h4>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Total Items (On Hand)</label>
                  <input type="number" value={onHand||''} onChange={e=>setOnHand(Number(e.target.value||0))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Units/Pack</label>
                  <input type="number" value={unitsPerPack||''} onChange={e=>setUnitsPerPack(Number(e.target.value||0))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Min Stock</label>
                  <input type="number" autoComplete="off" value={minStock} onChange={e=>{ const v = e.target.value; setMinStock(v===''? '': Number(v||0)) }} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Max Pack Allow</label>
                  <input type="number" autoComplete="off" value={maxPackAllow} onChange={e=>{ const v = e.target.value; setMaxPackAllow(v===''? '': Number(v||0)) }} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Max packs per sale" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Shelf Number</label>
                  <input value={shelfNumber} onChange={e=>setShelfNumber(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="e.g., A-12" />
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">Pricing Information</h4>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Buy Price/Pack</label>
                  <input type="number" step="0.01" value={buyPerPack||''} onChange={e=>setBuyPerPack(Number(e.target.value||0))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Buy Price/Unit</label>
                  <input type="number" step="0.01" value={buyPerUnit||''} onChange={e=>setBuyPerUnit(Number(e.target.value||0))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Sale Price/Pack</label>
                  <input type="number" step="0.01" value={salePerPack||''} onChange={e=>setSalePerPack(Number(e.target.value||0))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Sale Price/Unit</label>
                  <input type="number" step="0.01" value={salePerUnit||''} onChange={e=>setSalePerUnit(Number(e.target.value||0))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Max. Discount%/Unit</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={defaultDiscountPct || 0}
                    readOnly
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                {/* Line Tax */}
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Line Tax</label>
                  <div className="flex gap-2">
                    <select
                      value={lineTaxType === 'percent' ? '%' : 'PKR'}
                      onChange={e => setLineTaxType(e.target.value === '%' ? 'percent' : 'fixed')}
                      className="w-20 rounded-md border border-slate-300 px-2 py-2 text-sm"
                    >
                      <option>%</option>
                      <option>PKR</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={lineTaxValue || ''}
                      onChange={e => setLineTaxValue(Number(e.target.value || 0))}
                      className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Supplier Information */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900 uppercase tracking-wide">Supplier Information</h4>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
                  <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Invoice No.</label>
                  <input value={invoice} onChange={e=>setInvoice(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Supplier</label>
                  <SearchableSelect
                    value={supplierId}
                    onChange={(v)=>{ setSupplierId(v); const s = suppliers.find((x:any)=> String(x._id)===String(v)); setSupplierName(s?.name||'') }}
                    options={(suppliers||[]).map((s:any)=>({ value: String(s._id), label: String(s.name||'') }))}
                    placeholder="Type to search supplier..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Company</label>
                  <SearchableSelect
                    value={companyId}
                    disabled={!supplierId}
                    onChange={(v)=>{ setCompanyId(v); const c = companies.find((x:any)=> String(x._id)===String(v)); setCompanyName(c?.name||'') }}
                    options={(companies||[]).map((c:any)=>({ value: String(c._id), label: String(c.name||'') }))}
                    placeholder={supplierId ? 'Type to search company...' : 'Select supplier first'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="btn-outline-navy">Cancel</button>
          <button
            ref={saveButtonRef}
            onClick={()=>{
              if (!(name||'').trim()) return
              const saveAction = async () => {
                try {
                  const oldKey = String(medicine||'').trim().toLowerCase()
                  await pharmacyApi.updateInventoryItem(oldKey, {
                    name: String(name).trim(),
                    genericName: (genericName||'').trim() || undefined,
                    manufacturer: (manufacturer||'').trim() || undefined,
                    category: (category||'').trim() || undefined,
                    brand: (brand||'').trim() || undefined,
                    unitType: (unitType||'').trim() || undefined,
                    barcode: (barcode||'').trim() || undefined,
                    narcotic: narcotic || undefined,
                    minStock: (minStock===''? undefined : Number(minStock)),
                    maxPackAllow: (maxPackAllow===''? undefined : Number(maxPackAllow)),
                    unitsPerPack: unitsPerPack || 1,
                    onHand: onHand || 0,
                    shelfNumber: (shelfNumber||'').trim() || undefined,
                    buyPerPack: buyPerPack || 0,
                    buyPerUnit: buyPerUnit || 0,
                    salePerPack: salePerPack || 0,
                    salePerUnit: salePerUnit || 0,
                    defaultDiscountPct: (() => {
                      const sale = Number(salePerUnit || 0)
                      const buy = Number(buyPerUnit || 0)
                      const marginPct = sale > 0 ? Math.max(0, Math.min(100, ((sale - buy) / sale) * 100)) : 0
                      return Number(marginPct.toFixed(2))
                    })(),
                    lineTaxType: lineTaxType || undefined,
                    lineTaxValue: lineTaxValue || 0,
                    image: (image||'').trim() || undefined,
                    description: (description||'').trim() || undefined,
                    invoice: (invoice||'').trim() || undefined,
                    date: onlyDate(date) || undefined,
                    supplierId: supplierId || undefined,
                    supplierName: supplierName || undefined,
                    companyId: companyId || undefined,
                    companyName: companyName || undefined,
                  })
                  onClose()
                } catch {}
              }
              setOnAuthVerified(() => saveAction)
              setAuthOpen(true)
            }}
            className="btn"
          >Save</button>
        </div>
      </div>
      <Pharmacy_AuthVerifyDialog 
        open={authOpen} 
        onClose={() => { setAuthOpen(false); setOnAuthVerified(null) }} 
        onVerified={() => { if (onAuthVerified) onAuthVerified() }} 
      />
    </div>
  )
}
