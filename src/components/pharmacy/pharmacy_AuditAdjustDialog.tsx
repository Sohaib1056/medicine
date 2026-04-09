import { useEffect, useMemo, useState } from 'react'
import { pharmacyApi } from '../../utils/api'

type Props = { open: boolean; onClose: () => void; onDone?: () => void }

export default function Pharmacy_AuditAdjustDialog({ open, onClose, onDone }: Props) {
  const [name, setName] = useState('')
  const [inventoryNames, setInventoryNames] = useState<string[]>([])
  const [systemCount, setSystemCount] = useState<number>(0)
  const [physicalCount, setPhysicalCount] = useState<number>(0)
  const [reason, setReason] = useState<string>('Damage')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open) return
    let mounted = true
    setName('')
    setSystemCount(0)
    setPhysicalCount(0)
    setReason('Damage')
    setNote('')
    pharmacyApi.listInventory({ limit: 1000 }).then((res: any) => {
      if (!mounted) return
      const items: any[] = res?.items ?? []
      const names = Array.from(new Set(items.map((it:any)=> String((it.name||'').trim())).filter(Boolean))) as string[]
      setInventoryNames(names)
    }).catch(() => {})
    return () => { mounted = false }
  }, [open])

  useEffect(() => {
    if (!open) return
    const key = (name || '').trim()
    if (!key) return
    let mounted = true
    pharmacyApi.listInventory({ search: key, limit: 50 }).then((res:any) => {
      if (!mounted) return
      const items: any[] = res?.items || []
      const it = items.find((x:any)=> String(x.name||'').trim().toLowerCase() === key.toLowerCase()) || items[0]
      if (!it) return
      setSystemCount(Number(it.onHand || 0))
    }).catch(() => {})
    return () => { mounted = false }
  }, [open, name])

  const delta = useMemo(() => Number(physicalCount || 0) - Number(systemCount || 0), [physicalCount, systemCount])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-xl bg-white p-0 shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-xl font-bold text-slate-800">Audit Adjustment</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Medicine</label>
              <input list="audit-inventory-meds" value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-md border border-amber-400 px-3 py-2 text-sm" placeholder="Medicine name" />
              <datalist id="audit-inventory-meds">
                {inventoryNames.map((n)=> (<option key={n} value={n} />))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">System Stock</label>
              <input value={systemCount || 0} onChange={e=>setSystemCount(Number(e.target.value||0))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Physical Count</label>
              <input value={physicalCount || ''} onChange={e=>setPhysicalCount(Number(e.target.value||0))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Difference</label>
              <div className={`rounded-md border px-3 py-2 text-sm ${delta === 0 ? 'border-slate-300 text-slate-700' : (delta < 0 ? 'border-rose-300 text-rose-700' : 'border-emerald-300 text-emerald-700')}`}>
                {delta}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Reason</label>
              <select value={reason} onChange={e=>setReason(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option>Damage</option>
                <option>Expiry</option>
                <option>Theft</option>
                <option>Miscount</option>
                <option>Supplier shortage</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Note</label>
              <input value={note} onChange={e=>setNote(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Optional" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="btn-outline-navy">Cancel</button>
          <button
            onClick={async()=>{
              if (!(name||'').trim()) return
              const payload = {
                name: name.trim(),
                physicalCount: Number(physicalCount || 0),
                systemCount: Number(systemCount || 0),
                reason: (reason || '').trim() || undefined,
                note: (note || '').trim() || undefined,
                datetime: new Date().toISOString(),
              }
              try {
                await pharmacyApi.adjustInventory(payload)
                if (onDone) onDone()
                onClose()
              } catch {}
            }}
            className="btn"
          >Save</button>
        </div>
      </div>
    </div>
  )
}
