import { useEffect, useState } from 'react'
import type { Supplier } from './pharmacy_AddSupplierDialog'
import { pharmacyApi } from '../../utils/api'

export default function Pharmacy_AssignSupplierCompaniesDialog({ open, onClose, supplier }: { open: boolean; onClose: ()=>void; supplier: Supplier | null }){
  const [companies, setCompanies] = useState<Array<{ _id: string; name: string; distributorId?: string; distributorName?: string; isVirtual?: boolean }>>([])
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [supplierNames, setSupplierNames] = useState<Record<string, string>>({})

  useEffect(() => {
    let mounted = true
    if (!open || !supplier?.id){ setCompanies([]); setChecked({}); return }
    ;(async () => {
      try {
        const [all, invManufacturers]: [any, string[]] = await Promise.all([
          pharmacyApi.listCompanies({ limit: 1000 }),
          pharmacyApi.listInventoryManufacturers()
        ])
        const arr = (all?.items || all || []) as any[]
        
        // Merge inventory manufacturers that are not already in the companies list
        const companyNames = new Set(arr.map(c => String(c.name || '').toLowerCase().trim()))
        const mergedArr = [...arr]
        for (const m of invManufacturers) {
          if (m && !companyNames.has(m.toLowerCase().trim())) {
            // Add as a "virtual" company that will be created on save if checked
            mergedArr.push({ _id: `virtual:${m}`, name: m, isVirtual: true })
          }
        }

        if (!mounted) return
        setCompanies(mergedArr)
        const map: Record<string, boolean> = {}
        for (const c of mergedArr){ if (String(c.distributorId || '') === supplier.id) map[String(c._id)] = true }
        setChecked(map)

        // Hydrate supplier name map for companies assigned elsewhere when distributorName is missing
        const ids = Array.from(new Set(arr
          .map(c => String(c.distributorId || ''))
          .filter(id => id && id !== supplier.id)))
        if (ids.length){
          try {
            const res: any = await pharmacyApi.listSuppliers()
            const items: any[] = res?.items || res || []
            const nameMap: Record<string, string> = {}
            for (const s of items){
              const sid = String(s._id || s.id || '')
              const nm = String(s.name || '')
              if (sid && nm) nameMap[sid] = nm
            }
            if (mounted) setSupplierNames(nameMap)
          } catch {}
        } else {
          if (mounted) setSupplierNames({})
        }
      } catch {
        setCompanies([])
        setChecked({})
        setSupplierNames({})
      }
    })()
    return () => { mounted = false }
  }, [open, supplier?.id])

  if (!open || !supplier) return null

  const filtered = companies.filter(c => c.name.toLowerCase().includes(query.trim().toLowerCase()))

  const toggle = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }))

  const save = async () => {
    setSaving(true)
    try {
      const nextChecked = Object.entries(checked).filter(([,v])=>v).map(([k])=>k)
      
      // Separate virtual companies that need to be created
      const virtualToCreate = nextChecked
        .filter(id => id.startsWith('virtual:'))
        .map(id => id.replace('virtual:', ''))

      const createdIds: string[] = []
      for (const name of virtualToCreate) {
        try {
          const res: any = await pharmacyApi.createCompany({ name, distributorId: supplier.id, distributorName: supplier.name })
          if (res?._id) createdIds.push(String(res._id))
        } catch (e) {
          console.error('Failed to create company for manufacturer', name, e)
        }
      }

      const realChecked = nextChecked.filter(id => !id.startsWith('virtual:'))
      const currentAssigned = new Set(companies.filter(c => !c.isVirtual && String(c.distributorId||'') === supplier.id).map(c => String(c._id)))
      const nextAssigned = new Set([...realChecked, ...createdIds])
      
      const toAssign: string[] = []
      const toUnassign: string[] = []
      
      for (const id of nextAssigned){ if (!currentAssigned.has(id)) toAssign.push(id) }
      for (const id of currentAssigned){ if (!nextAssigned.has(id)) toUnassign.push(id) }
      
      if (toAssign.length || toUnassign.length) {
        await pharmacyApi.assignSupplierCompanies(supplier.id, { companyIds: toAssign, unassignIds: toUnassign })
      }
      
      try { window.dispatchEvent(new Event('pharmacy:companies:refresh')) } catch {}
      onClose()
    } catch (e) { 
      console.error(e)
      setSaving(false) 
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-800">Assign Companies — {supplier.name}</h3>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100">×</button>
        </div>
        <div className="p-4 border-b border-slate-200">
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search companies" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="max-h-[60vh] overflow-auto p-4">
          <div className="space-y-2">
            {filtered.map(c => (
              <label key={c._id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={!!checked[c._id]} onChange={()=>toggle(c._id)} />
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-slate-800">{c.name}</div>
                    {(c as any).isVirtual && (
                      <div className="text-[10px] font-bold text-sky-600 uppercase tracking-tight">From Inventory Manufacturer</div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-500">{(c as any).isVirtual ? 'Unassigned' : (String(c.distributorId||'') === supplier.id ? 'Assigned' : (c.distributorId ? `Assigned to ${c.distributorName || supplierNames[String(c.distributorId)] || 'another'}` : 'Unassigned'))}</div>
              </label>
            ))}
            {filtered.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-6">No companies</div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="btn-outline-navy">Cancel</button>
          <button disabled={saving} onClick={save} className="btn">Save</button>
        </div>
      </div>
    </div>
  )
}
