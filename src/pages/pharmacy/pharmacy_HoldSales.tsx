import { useEffect, useMemo, useRef, useState } from 'react'
import { pharmacyApi } from '../../utils/api'
import { useNavigate } from 'react-router-dom'

type HoldLine = { medicineId: string; name: string; unitPrice: number; qty: number; discountRs?: number }
type HoldDoc = { _id: string; createdAtIso?: string; createdAt?: string; billDiscountPct?: number; lines?: HoldLine[] }

export default function Pharmacy_HoldSales(){
  const navigate = useNavigate()
  const [items, setItems] = useState<HoldDoc[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [openId, setOpenId] = useState<string>('') // expand row for details
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [holdToDelete, setHoldToDelete] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res: any = await pharmacyApi.listHoldSales()
      const list: HoldDoc[] = res?.items || []
      setItems(list)
    } catch (e) {
      setItems([])
      setError('Failed to load held bills')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter(h => {
      const id = String(h._id || '').toLowerCase()
      const when = String(h.createdAtIso || h.createdAt || '').toLowerCase()
      const lines = (h.lines || []).map(l => String(l.name || '')).join(' ').toLowerCase()
      return id.includes(s) || when.includes(s) || lines.includes(s)
    })
  }, [items, q])

  const restore = async (id: string) => {
    if (!id) return
    try {
      const doc: any = await pharmacyApi.getHoldSale(id)
      const lines: HoldLine[] = (doc?.lines || [])
      const payload = lines.map(l => ({ name: l.name, productId: l.medicineId, qty: Number(l.qty || 0) }))
      try {
        localStorage.setItem('pharmacy.pos.pendingAddLines', JSON.stringify(payload))
        localStorage.setItem('pharmacy.pos.pendingRestoreHoldId', String(id))
        localStorage.setItem('pharmacy.pos.pendingBillDiscountPct', String(doc?.billDiscountPct ?? 0))
      } catch {}
      navigate('/pharmacy/pos')
    } catch {
      alert('Failed to restore held bill')
    }
  }
  const confirmRemove = (id: string) => {
    setHoldToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const remove = async () => {
    if (!holdToDelete) return
    try { await pharmacyApi.deleteHoldSale(holdToDelete); await load() } catch { alert('Failed to delete held bill') }
    finally { setDeleteConfirmOpen(false); setHoldToDelete(null) }
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="text-xl font-bold text-slate-800">Held Bills</div>
        <button type="button" onClick={load} className="btn-outline-navy">{loading ? 'Refreshing...' : 'Refresh'}</button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_160px] items-end">
          <div>
            <label className="mb-1 block text-sm text-slate-700">Search</label>
            <input ref={searchRef} id="pharmacy-holds-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="bill id, date/time, item name" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div><button type="button" onClick={load} className="btn w-full disabled:opacity-60" disabled={loading}>{loading ? 'Loading...' : 'Apply'}</button></div>
        </div>
        {error && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-2 font-medium">Held At</th>
              <th className="px-4 py-2 font-medium">Bill ID</th>
              <th className="px-4 py-2 font-medium">Items</th>
              <th className="px-4 py-2 font-medium">Bill Discount (%)</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {filtered.map(h => {
              const id = String(h._id || '')
              const when = new Date(String(h.createdAtIso || h.createdAt || new Date().toISOString())).toLocaleString()
              const cnt = (h.lines || []).length
              const disc = Number(h.billDiscountPct || 0)
              const open = openId === id
              return (
                <tr key={id} className="align-top">
                  <td className="px-4 py-2">{when}</td>
                  <td className="px-4 py-2">{id}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span>{cnt}</span>
                      <button type="button" onClick={()=> setOpenId(p => p===id ? '' : id)} className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50">{open ? 'Hide' : 'View'}</button>
                    </div>
                    {open && (
                      <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                        <div className="text-xs text-slate-600">Lines</div>
                        <ul className="mt-1 space-y-1 text-xs">
                          {(h.lines || []).map((l, i) => (
                            <li key={i} className="flex items-center justify-between gap-2">
                              <span className="truncate">{l.name}</span>
                              <span className="text-slate-600">Qty {l.qty} · Rs {Number(l.unitPrice||0).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">{disc.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={()=>restore(id)} className="btn">Restore to POS</button>
                      <button type="button" onClick={()=>confirmRemove(id)} className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700">Delete</button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length===0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">{loading ? 'Loading...' : 'No held bills'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <svg className="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5Zm0 9a1 1 0 100-2 1 1 0 000 2Z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Delete Held Bill?</h2>
            </div>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              This action cannot be undone. The held bill will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setDeleteConfirmOpen(false); setHoldToDelete(null); }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={remove}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
