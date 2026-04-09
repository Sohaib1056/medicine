import { useEffect, useState } from 'react'
import type { Supplier } from './pharmacy_AddSupplierDialog'
import { pharmacyApi } from '../../utils/api'

type Props = {
    open: boolean
    onClose: () => void
    supplier: Supplier | null
    onSave: (amount: number, purchaseId?: string, method?: string, note?: string, date?: string) => void
}

export default function Pharmacy_SupplierPaymentDialog({ open, onClose, supplier, onSave }: Props) {
    const [purchases, setPurchases] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const [amount, setAmount] = useState('')
    const [method, setMethod] = useState('cash')
    const [note, setNote] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [purchaseId, setPurchaseId] = useState('')

    useEffect(() => {
        let mounted = true
        if (!open || !supplier?.id) return

        // Reset form
        setAmount('')
        setMethod('cash')
        setNote('')
        setDate(new Date().toISOString().split('T')[0])
        setPurchaseId('')

            ; (async () => {
                try {
                    setLoading(true)
                    const res = await pharmacyApi.listSupplierPurchases(supplier.id)
                    if (!mounted) return
                    setPurchases(res.items || [])
                } catch {
                    if (mounted) setPurchases([])
                } finally {
                    if (mounted) setLoading(false)
                }
            })()

        return () => { mounted = false }
    }, [open, supplier?.id])

    if (!open || !supplier) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const amt = parseFloat(amount || '0')
        if (amt <= 0 || !purchaseId) return
        onSave(amt, purchaseId, method, note, date)
    }

    const remaining = (supplier.totalPurchases || 0) - (supplier.paid || 0)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h3 className="text-lg font-semibold text-slate-800">Record Payment</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="rounded-lg bg-slate-50 p-4 space-y-1">
                        <div className="text-sm font-medium text-slate-700">{supplier.name}</div>
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>Total Purchases: PKR {supplier.totalPurchases?.toFixed(2)}</span>
                            <span className="font-semibold text-rose-600">Remaining: PKR {remaining.toFixed(2)}</span>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Select Invoice (Mandatory)</label>
                        <select
                            value={purchaseId}
                            onChange={e => setPurchaseId(e.target.value)}
                            required
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        >
                            <option value="" disabled>— Select an Invoice —</option>
                            {purchases.map(p => (
                                <option key={p._id} value={p._id}>
                                    {p.invoice} · Rem: Rs {Number(p.remaining || 0).toFixed(0)}
                                </option>
                            ))}
                        </select>
                        {purchases.length === 0 && !loading && (
                            <p className="mt-1 text-xs text-rose-500">No unpaid invoices found for this supplier.</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Amount (PKR)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Payment Method</label>
                            <select
                                value={method}
                                onChange={e => setMethod(e.target.value)}
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            >
                                <option value="cash">Cash</option>
                                <option value="bank">Bank Transfer</option>
                                <option value="card">Card</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Payment Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Note</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Add a remark..."
                            rows={2}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !amount}
                            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
                        >
                            Save Payment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
