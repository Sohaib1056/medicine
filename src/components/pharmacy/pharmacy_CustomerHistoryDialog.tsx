import { useEffect, useState, useCallback } from 'react'
import { X, Calendar, Package, Plus, Clock, History } from 'lucide-react'
import { pharmacyApi } from '../../utils/api'

type SaleLine = {
  medicineId: string
  name: string
  unitPrice: number
  qty: number
  discountRs?: number
}

type Sale = {
  _id: string
  datetime: string
  billNo: string
  subtotal: number
  total: number
  discountPct: number
  lines: SaleLine[]
}

type Props = {
  open: boolean
  onClose: () => void
  customer: { id: string; name: string; phone: string }
  onReorder: (lines: SaleLine[]) => void | Promise<void>
}

export default function Pharmacy_CustomerHistoryDialog({ open, onClose, customer, onReorder }: Props) {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [reordering, setReordering] = useState(false)

  const reorderSelected = useCallback(async () => {
    if (!selectedSale) return
    if (reordering) return
    setReordering(true)
    try {
      await onReorder(selectedSale.lines)
      onClose()
    } finally {
      setReordering(false)
    }
  }, [selectedSale, onReorder, onClose, reordering])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    pharmacyApi.getCustomerHistory(customer.id)
      .then(res => setSales(Array.isArray(res) ? res : (res.items || [])))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [open, customer.id])

  useEffect(() => {
    if (!open) return
    if (loading) return
    if (!sales.length) {
      setSelectedSale(null)
      setSelectedIndex(0)
      return
    }

    const clamped = Math.max(0, Math.min(selectedIndex, sales.length - 1))
    if (clamped !== selectedIndex) setSelectedIndex(clamped)
    setSelectedSale(sales[clamped])
  }, [open, loading, sales, selectedIndex])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        if (!sales.length) return
        setSelectedIndex(i => Math.min(sales.length - 1, i + 1))
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        if (!sales.length) return
        setSelectedIndex(i => Math.max(0, i - 1))
        return
      }

      // Ctrl+Enter to Re-order selected invoice
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault()
        e.stopPropagation()
        reorderSelected()
      }
    }

    window.addEventListener('keydown', onKeyDown as any, true)
    return () => window.removeEventListener('keydown', onKeyDown as any, true)
  }, [open, sales.length, reorderSelected, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <History className="h-6 w-6 text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Purchase History</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{customer.name} · {customer.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Sales List */}
          <div className="w-1/3 overflow-y-auto border-r border-slate-200 bg-slate-50">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Records...</span>
              </div>
            )}
            {!loading && sales.length === 0 && (
              <div className="py-20 text-center text-sm text-slate-400 font-medium">No purchase history found</div>
            )}
            {!loading && sales.map((s, idx) => (
              <button
                key={s._id}
                onClick={() => { setSelectedIndex(idx); setSelectedSale(s) }}
                className={`w-full px-4 py-4 text-left transition-all border-b border-slate-200 ${selectedSale?._id === s._id ? 'bg-white shadow-inner ring-2 ring-inset ring-sky-500/10 border-l-4 border-l-sky-500' : 'hover:bg-slate-100'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-900 uppercase">{s.billNo}</span>
                  <span className="text-[10px] font-bold text-slate-400">{new Date(s.datetime).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">PKR {s.total.toFixed(2)}</span>
                  <span className="text-[10px] font-medium text-slate-500 italic">{(s.lines || []).length} Items</span>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Sale Details */}
          <div className="flex-1 overflow-y-auto bg-white p-6">
            {selectedSale ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Invoice Details</h4>
                    <div className="mt-1 flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(selectedSale.datetime).toLocaleString()}</span>
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {selectedSale.billNo}</span>
                    </div>
                  </div>
                  <button
                    onClick={reorderSelected}
                    disabled={reordering}
                    className="flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-black text-white hover:bg-sky-700 transition-all shadow-lg shadow-sky-200 active:scale-95"
                  >
                    <Plus className="h-5 w-5" /> RE-ORDER NOW (Ctrl+Enter)
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="mb-3 grid grid-cols-12 gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <div className="col-span-6">Medicine Name</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                  <div className="space-y-2">
                    {selectedSale.lines.map((l: any, i: number) => (
                      <div key={i} className="grid grid-cols-12 gap-2 text-sm font-medium items-center">
                        <div className="col-span-6 text-slate-900 truncate">{l.name}</div>
                        <div className="col-span-2 text-center text-slate-600 bg-slate-100 rounded-md py-1">{l.qty}</div>
                        <div className="col-span-2 text-right text-slate-600">{l.unitPrice.toFixed(2)}</div>
                        <div className="col-span-2 text-right font-bold text-slate-900">{(l.qty * l.unitPrice).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-10 border-t border-slate-100 pt-6">
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase text-slate-400">Subtotal</div>
                    <div className="text-lg font-bold text-slate-700">PKR {selectedSale.subtotal.toFixed(2)}</div>
                  </div>
                  {selectedSale.discountPct > 0 && (
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase text-rose-500">Discount ({selectedSale.discountPct}%)</div>
                      <div className="text-lg font-bold text-rose-600">- PKR {(selectedSale.subtotal - selectedSale.total).toFixed(2)}</div>
                    </div>
                  )}
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase text-sky-600">Total Paid</div>
                    <div className="text-2xl font-black text-slate-900 tracking-tighter">PKR {selectedSale.total.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <Package className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select an invoice to view items</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
