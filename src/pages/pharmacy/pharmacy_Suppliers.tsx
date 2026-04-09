import { useEffect, useRef, useState } from 'react'
import Pharmacy_AddSupplierDialog, { type Supplier } from '../../components/pharmacy/pharmacy_AddSupplierDialog'
import Pharmacy_SupplierDetailsDialog from '../../components/pharmacy/pharmacy_SupplierDetailsDialog'
import Pharmacy_AssignSupplierCompaniesDialog from '../../components/pharmacy/pharmacy_AssignSupplierCompaniesDialog'
import Pharmacy_SupplierPaymentDialog from '../../components/pharmacy/pharmacy_SupplierPaymentDialog'
import { pharmacyApi } from '../../utils/api'

export default function Pharmacy_Suppliers() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selected, setSelected] = useState<Supplier | null>(null)
  const [assignCompaniesOpen, setAssignCompaniesOpen] = useState(false)

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onAdd = () => setAddOpen(true)
    window.addEventListener('pharmacy:suppliers:add', onAdd)
    return () => {
      window.removeEventListener('pharmacy:suppliers:add', onAdd)
    }
  }, [])

  useEffect(() => {
    addButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const res: any = await pharmacyApi.listSuppliers({ q: query || undefined, page, limit })
          if (!mounted) return
          const mapped: Supplier[] = (res.items || []).map((x: any) => ({
            id: x._id,
            name: x.name,
            company: x.company,
            phone: x.phone,
            address: x.address,
            taxId: x.taxId,
            status: x.status || 'Active',
            totalPurchases: x.totalPurchases || 0,
            paid: x.paid || 0,
            lastOrder: x.lastOrder || '',
          }))
          setSuppliers(mapped)
          setTotal(Number(res.total || mapped.length || 0))
          setTotalPages(Number(res.totalPages || 1))

          // Frontend fallback enrichment: if backend totals are 0 but details have purchases,
          // fetch purchases per supplier and compute totals/lastOrder.
          const zeros = mapped.filter(s => !Number(s.totalPurchases || 0))
          if (zeros.length) {
            const updates = await Promise.all(zeros.map(async (s) => {
              try {
                const r = await pharmacyApi.listSupplierPurchases(s.id)
                const items = (r?.items || []) as any[]
                if (!items.length) return null
                const totalAmount = items.reduce((sum, p: any) => sum + Number(p.totalAmount || 0), 0)
                const paid = items.reduce((sum, p: any) => sum + Number(p.paid || 0), 0)
                const last = items.reduce((max: string, p: any) => (max && max > String(p.date || '')) ? max : String(p.date || ''), '')
                return { id: s.id, totalPurchases: Math.round(totalAmount * 100) / 100, paid: Math.round(paid * 100) / 100, lastOrder: last }
              } catch { return null }
            }))
            const map = new Map(updates.filter(Boolean).map(u => [String((u as any).id), u]))
            if (map.size && mounted) {
              setSuppliers(prev => prev.map(s => {
                const u = map.get(s.id) as any
                return u ? { ...s, totalPurchases: u.totalPurchases, paid: u.paid, lastOrder: u.lastOrder || s.lastOrder } : s
              }))
            }
          }
        } catch (e) {
          console.error(e)
        }
      })()
    return () => { mounted = false }
  }, [reloadTick, query, page, limit])

  useEffect(() => {
    function onReturn() { setReloadTick(t => t + 1) }
    window.addEventListener('pharmacy:return', onReturn as any)
    return () => { window.removeEventListener('pharmacy:return', onReturn as any) }
  }, [])



  const addSupplier = async (s: Supplier) => {
    try {
      const created = await pharmacyApi.createSupplier({
        name: s.name,
        company: s.company,
        phone: s.phone,
        address: s.address,
        taxId: s.taxId,
        status: s.status,
      })
      // If a company was selected in the dialog, assign it to this supplier server-side
      if (s.companyIds && s.companyIds.length) {
        try { await pharmacyApi.assignSupplierCompanies(created._id, { companyIds: s.companyIds }) } catch { }
      }
      setSuppliers(prev => [{ ...s, id: created._id }, ...prev])
    } catch (e) {
      console.error(e)
    }
  }
  const openEdit = (s: Supplier) => { setSelected(s); setEditOpen(true) }
  const saveEdit = async (s: Supplier) => {
    await pharmacyApi.updateSupplier(s.id, {
      name: s.name,
      company: s.company,
      phone: s.phone,
      address: s.address,
      taxId: s.taxId,
      status: s.status,
    })
    setSuppliers(prev => prev.map(x => x.id === s.id ? s : x))
  }
  const remove = async (id: string) => {
    await pharmacyApi.deleteSupplier(id)
    setSuppliers(prev => prev.filter(x => x.id !== id))
  }

  const openDetails = (s: Supplier) => { setSelected(s); setDetailsOpen(true) }

  const openAssignCompanies = (s: Supplier) => { setSelected(s); setAssignCompaniesOpen(true) }

  const startPayment = (s: Supplier) => {
    setSelected(s)
    setPaymentOpen(true)
  }
  const savePayment = async (amount: number, purchaseId?: string, method?: string, note?: string, date?: string) => {
    if (!selected) return
    await pharmacyApi.recordSupplierPayment(selected.id, { amount, purchaseId, method, note, date })
    // Update supplier quick totals locally
    setSuppliers(prev => prev.map(x => x.id === selected.id ? { ...x, paid: (x.paid || 0) + amount } : x))
    setPaymentOpen(false)
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="text-xl font-bold text-slate-800">Supplier Management</div>
        <div className="flex items-center gap-2">
          <button ref={addButtonRef} type="button" onClick={()=>setAddOpen(true)} className="btn">+ Add Supplier</button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-3">
          <input id="pharmacy-suppliers-search" value={query} onChange={e=>{ setQuery(e.target.value); setPage(1) }} placeholder="Search suppliers.." className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" />
          <select value={limit} onChange={e=>{ setLimit(parseInt(e.target.value)); setPage(1) }} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {suppliers.map(s => {
          const remaining = (s.totalPurchases || 0) - (s.paid || 0)
          return (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100" />
                  <div>
                    <div className="font-semibold text-slate-800">{s.name}</div>
                    <div className="mt-1 text-xs text-slate-500 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full border" /></span>
                      <span>Last Order: {s.lastOrder || '-'}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">Total Purchases: PKR {(s.totalPurchases || 0).toFixed(0)}</span>
                      <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-700">Paid: PKR {(s.paid || 0).toFixed(0)}</span>
                      <span className="rounded bg-rose-100 px-2 py-1 text-rose-700">Remaining: PKR {remaining.toFixed(0)}</span>
                      <span className={`rounded px-2 py-1 ${s.status === 'Active' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-700'}`}>{s.status}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => startPayment(s)} className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">Record Payment</button>
                  <button type="button" onClick={() => openEdit(s)} className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">✎</button>
                  <button type="button" onClick={() => remove(s.id)} className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">🗑</button>
                  <button type="button" onClick={() => openAssignCompanies(s)} className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">Assign Companies</button>
                </div>
              </div>

              <div className="mt-3 text-right">
                <button type="button" onClick={() => openDetails(s)} className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">View Details</button>
              </div>
            </div>
          )
        })}

        {suppliers.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500">No suppliers</div>
        )}
        <div className="flex items-center justify-between px-1 text-sm text-slate-600">
          <div>
            {total > 0 ? (
              <>Showing {Math.min((page-1)*limit + 1, total)}-{Math.min((page-1)*limit + suppliers.length, total)} of {total}</>
            ) : 'No results'}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-50">Prev</button>
            <div>Page {page} of {totalPages}</div>
            <button type="button" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      <Pharmacy_AddSupplierDialog open={addOpen} onClose={()=>setAddOpen(false)} onSave={addSupplier} />
      <Pharmacy_AddSupplierDialog open={editOpen} onClose={()=>setEditOpen(false)} onSave={saveEdit} initial={selected ?? undefined} title="Edit Supplier" submitLabel="Save" />
      <Pharmacy_SupplierDetailsDialog open={detailsOpen} onClose={()=>setDetailsOpen(false)} supplier={selected} />
      <Pharmacy_AssignSupplierCompaniesDialog open={assignCompaniesOpen} onClose={()=>setAssignCompaniesOpen(false)} supplier={selected} />
      <Pharmacy_SupplierPaymentDialog open={paymentOpen} onClose={()=>setPaymentOpen(false)} supplier={selected} onSave={savePayment} />
    </div >
  )
}
