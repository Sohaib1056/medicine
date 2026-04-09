import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hospitalApi } from '../../utils/api'
import Toast, { type ToastState } from '../../components/ui/Toast'

export default function Diagnostic_Referrals(){
  const navigate = useNavigate()
  const [list, setList] = useState<any[]>([])
  const [status, setStatus] = useState<'pending'|'completed'|'cancelled'|'all'>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [toast, setToast] = useState<ToastState>(null)
  const [confirmDel, setConfirmDel] = useState<{ open: boolean; id: string } | null>(null)

  useEffect(()=>{ load() }, [status, page, limit, from, to])

  async function load(){
    try{
      const res: any = await hospitalApi.listReferrals({ type: 'diagnostic', status: status==='all'?undefined:status, from: from||undefined, to: to||undefined, page, limit })
      setList(res?.referrals || [])
      setTotal(Number(res?.total || 0))
    }catch{ setList([]); setTotal(0) }
  }

  async function mark(id: string, st: 'completed'|'cancelled'|'pending'){
    try{
      await hospitalApi.updateReferralStatus(id, st)
      if ((st === 'completed' || st === 'cancelled') && status === 'pending'){
        setPage(1)
        setStatus('all')
      } else {
        await load()
      }
      setToast({ type: 'success', message: 'Updated' })
    }catch(e: any){ setToast({ type: 'error', message: e?.message || 'Failed' }) }
  }
  async function remove(id: string){
    setConfirmDel({ open: true, id })
  }

  const filtered = useMemo(()=>{
    const s = q.trim().toLowerCase()
    return (list||[]).filter((r: any)=> !s || `${r.encounterId?.patientId?.fullName||''} ${r.encounterId?.patientId?.mrn||''} ${r.encounterId?.doctorId?.name||''} ${(r.tests||[]).join(' ')}`.toLowerCase().includes(s))
  }, [list, q])

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xl font-semibold text-slate-800">Diagnostic Referrals</div>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={e=>{ setPage(1); setFrom(e.target.value) }} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <span className="text-slate-500 text-sm">to</span>
          <input type="date" value={to} onChange={e=>{ setPage(1); setTo(e.target.value) }} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <select value={status} onChange={e=>{ setPage(1); setStatus(e.target.value as any) }} className="rounded-md border border-slate-300 px-2 py-2 text-sm">
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="all">All</option>
          </select>
          <select value={limit} onChange={e=>{ setPage(1); setLimit(parseInt(e.target.value)||20) }} className="rounded-md border border-slate-300 px-2 py-2 text-sm">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm">
          <div className="font-medium text-slate-800">Results</div>
          <div className="text-slate-600">{total ? `${(page-1)*limit+1}-${Math.min(page*limit,total)} of ${total}` : ''}</div>
        </div>
        <div className="divide-y divide-slate-200">
          {filtered.map((r: any) => (
            <div key={r._id} className="px-4 py-3 text-sm">
              <div className="font-medium">{r.encounterId?.patientId?.fullName || '-'} <span className="text-xs text-slate-500">{r.encounterId?.patientId?.mrn || ''}</span></div>
              <div className="text-xs text-slate-600">{new Date(r.createdAt).toLocaleString()} • Status: {r.status} • By: Dr. {r.encounterId?.doctorId?.name || '-'}</div>
              {(r.tests||[]).length>0 && <div className="mt-1 text-xs text-slate-700"><span className="font-semibold">Tests:</span> {(r.tests||[]).join(', ')}</div>}
              {r.notes && <div className="mt-1 text-xs text-slate-700"><span className="font-semibold">Notes:</span> {r.notes}</div>}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  className="rounded-md border border-sky-300 bg-sky-50 px-3 py-1 text-sm text-sky-700"
                  title="Process referral"
                  onClick={()=>{
                    const p = r?.encounterId?.patientId || {}
                    const d = r?.encounterId?.doctorId || {}
                    navigate('/diagnostic/token-generator', {
                      state: {
                        fromReferralId: r._id,
                        encounterId: r?.encounterId?._id || r?.encounterId,
                        patient: {
                          mrn: p.mrn,
                          fullName: p.fullName,
                          phone: p.phoneNormalized || p.phone,
                          gender: p.gender,
                          address: p.address,
                          fatherName: p.fatherName,
                          cnic: p.cnicNormalized || p.cnic,
                        },
                        referringConsultant: d?.name ? `Dr. ${d.name}` : undefined,
                        requestedTests: r?.tests || [],
                        notes: r?.notes || '',
                      }
                    })
                  }}
                >Process</button>
                <button className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1 text-sm text-emerald-700" onClick={()=>mark(r._id, 'completed')}>Mark Completed</button>
                <button className="rounded-md border border-slate-300 px-3 py-1 text-sm" onClick={()=>mark(r._id, 'pending')}>Mark Pending</button>
                <button className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1 text-sm text-rose-700" onClick={()=>remove(r._id)}>Delete</button>
              </div>
            </div>
          ))}
          {filtered.length===0 && <div className="px-4 py-8 text-center text-slate-500 text-sm">No referrals</div>}
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <button className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
          <div className="text-slate-600">Page {page}</div>
          <button className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50" disabled={page*limit>=total} onClick={()=>setPage(p=>p+1)}>Next</button>
        </div>
      </div>

      {confirmDel?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="border-b border-slate-200 px-5 py-3 font-semibold text-slate-800">Confirm</div>
            <div className="px-5 py-4 text-sm text-slate-700">Delete this referral?</div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button type="button" onClick={()=>setConfirmDel(null)} className="btn-outline-navy">Cancel</button>
              <button
                type="button"
                onClick={async()=>{
                  const id = confirmDel.id
                  setConfirmDel(null)
                  try{
                    await hospitalApi.deleteReferral(id)
                    await load()
                    setToast({ type: 'success', message: 'Deleted' })
                  }catch(e: any){
                    setToast({ type: 'error', message: e?.message || 'Failed' })
                  }
                }}
                className="btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={()=>setToast(null)} />
    </div>
  )
}
