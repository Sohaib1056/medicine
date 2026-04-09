import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pharmacyApi } from '../../utils/api'

export default function Pharmacy_PurchaseDrafts(){
  const navigate = useNavigate()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [err, setErr] = useState<string>('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setErr('')
    try {
      const res: any = await pharmacyApi.listPurchaseDrafts({
        from: from || undefined,
        to: to || undefined,
        search: search || undefined,
        company: company || undefined,
        limit: 200,
      })
      setItems(res?.items ?? res ?? [])
    } catch (e: any) {
      setItems([])
      setErr('Failed to load')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const rows = useMemo(() => {
    return (items || []).map((d: any) => {
      const l = (d?.lines && d.lines[0]) || null
      return {
        id: String(d?._id || ''),
        date: String(d?.date || d?.createdAtIso || ''),
        invoice: String(d?.invoice || '-'),
        supplier: String(d?.supplierName || '-'),
        company: String(d?.companyName || d?.company || ''),
        firstItem: l ? String(l?.name || '-') : '-',
        linesCount: Array.isArray(d?.lines) ? d.lines.length : 0,
        total: Number(d?.totalAmount || d?.totals?.net || 0),
        status: String(d?.status || 'Pending'),
      }
    })
  }, [items])

  const confirmRemove = (id: string) => {
    setDraftToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const remove = async () => {
    if (!draftToDelete) return
    try {
      await pharmacyApi.deletePurchaseDraft(draftToDelete)
      await load()
    } catch (e) {
      console.error(e)
      alert('Failed to delete')
    } finally {
      setDeleteConfirmOpen(false)
      setDraftToDelete(null)
    }
  }

  return (
    <div className="space-y-4 p-6">
      <div className="text-xl font-bold text-slate-800">Held Invoices</div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm text-slate-700">From</label>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700">To</label>
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm text-slate-700">Search</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="invoice, supplier, item" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700">Company</label>
            <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="optional" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="mt-3">
          <button type="button" onClick={load} className="btn disabled:opacity-60" disabled={loading}>{loading ? 'Loading...' : 'Apply'}</button>
        </div>
        {err && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Invoice</th>
              <th className="px-4 py-2 font-medium">Supplier</th>
              <th className="px-4 py-2 font-medium">First Item</th>
              <th className="px-4 py-2 font-medium">Lines</th>
              <th className="px-4 py-2 font-medium">Total</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-2">{r.date ? String(r.date).slice(0,10) : '-'}</td>
                <td className="px-4 py-2">{r.invoice}</td>
                <td className="px-4 py-2">{r.supplier}</td>
                <td className="px-4 py-2">{r.firstItem}</td>
                <td className="px-4 py-2">{r.linesCount}</td>
                <td className="px-4 py-2">PKR {Number(r.total||0).toLocaleString()}</td>
                <td className="px-4 py-2">{r.status}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={()=>navigate(`/pharmacy/inventory/edit-invoice/${r.id}?from=pending`)} className="rounded-md bg-sky-600 px-2 py-1 text-xs text-white hover:bg-sky-700">Restore</button>
                    <button type="button" onClick={()=>confirmRemove(r.id)} className="rounded-md bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length===0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">{loading ? 'Loading...' : 'No drafts'}</td></tr>
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
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Delete Draft Invoice?</h2>
            </div>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              This action cannot be undone. The draft invoice will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setDeleteConfirmOpen(false); setDraftToDelete(null); }}
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
