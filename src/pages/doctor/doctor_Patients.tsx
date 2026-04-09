import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { corporateApi, diagnosticApi, hospitalApi, labApi } from '../../utils/api'
import { Eye, X } from 'lucide-react'

type DoctorSession = { id: string; name: string; username: string }

type Token = {
  _id: string
  createdAt: string
  tokenNo?: string
  slotNo?: number
  apptStart?: string
  apptEnd?: string
  slotStart?: string
  slotEnd?: string
  patientName: string
  mrNo: string
  patientPhone?: string
  patientAge?: string
  patientGender?: string
  patientAddress?: string
  encounterId?: string
  doctorId?: string
  doctorName?: string
  department?: string
  fee: number
  paidMethod?: string
  billingType?: string
  status: 'queued'|'in-progress'|'completed'|'returned'|'cancelled'
}

type DrawerTab = 'visits'|'prescriptions'|'lab'|'diagnostics'|'finance'

export default function Doctor_Patients() {
  const navigate = useNavigate()
  const [doc, setDoc] = useState<DoctorSession | null>(null)
  const [list, setList] = useState<Token[]>([])
  const [presEncounterIds, setPresEncounterIds] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('visits')
  const [drawerToken, setDrawerToken] = useState<Token | null>(null)
  const [drawerBusy, setDrawerBusy] = useState(false)

  const [viewOpen, setViewOpen] = useState(false)
  const [viewToken, setViewToken] = useState<Token | null>(null)
  const [viewPaymentMethod, setViewPaymentMethod] = useState<string>('')
  const [viewPaymentLoading, setViewPaymentLoading] = useState(false)
  const [histVisits, setHistVisits] = useState<Token[]>([])
  const [histPres, setHistPres] = useState<any[]>([])
  const [histLab, setHistLab] = useState<any[]>([])
  const [histDiag, setHistDiag] = useState<any[]>([])
  const [histFinance, setHistFinance] = useState<any[]>([])
  const [filter, setFilter] = useState<'all'|'queued'|'in-progress'|'completed'|'returned'|'cancelled'>('all')
  const [sortBy, setSortBy] = useState<'date'|'name'|'status'>('date')

  function openView(t: Token){
    setViewToken(t)
    setViewOpen(true)
    setViewPaymentMethod('')
    setViewPaymentLoading(true)
    ;(async () => {
      try {
        const finRes: any = await corporateApi.listTransactions({ refType: 'opd_token', refId: String(t._id), page: 1, limit: 5 } as any)
        const tx: any = (finRes?.transactions || finRes?.items || [])[0]
        const method = tx?.method || tx?.paymentMethod || tx?.paidMethod || tx?.paid_method || tx?.mode || tx?.paymentMode || tx?.payment_mode
        if (method) setViewPaymentMethod(String(method))
      } catch {
        // ignore
      } finally {
        setViewPaymentLoading(false)
      }
    })()
  }

  function closeView(){
    setViewOpen(false)
    setViewToken(null)
    setViewPaymentMethod('')
    setViewPaymentLoading(false)
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem('doctor.session')
      const sess = raw ? JSON.parse(raw) : null
      setDoc(sess)
      // Compat: if legacy id (not 24-hex), try to resolve to backend _id by username/name
      const hex24 = /^[a-f\d]{24}$/i
      if (sess && !hex24.test(String(sess.id||''))) {
        ;(async () => {
          try {
            const res = await hospitalApi.listDoctors() as any
            const docs: any[] = res?.doctors || []
            const match = docs.find(d => String(d.username||'').toLowerCase() === String(sess.username||'').toLowerCase()) ||
                          docs.find(d => String(d.name||'').toLowerCase() === String(sess.name||'').toLowerCase())
            if (match) {
              const fixed = { ...sess, id: String(match._id || match.id) }
              try { localStorage.setItem('doctor.session', JSON.stringify(fixed)) } catch {}
              setDoc(fixed)
            }
          } catch {}
        })()
      }
    } catch {}
  }, [])

  useEffect(() => { load() }, [doc?.id, from, to])
  useEffect(() => {
    if (!doc?.id) return
    const id = setInterval(() => { load() }, 15000)
    return () => clearInterval(id)
  }, [doc?.id])

  // Refresh immediately when a prescription is saved elsewhere
  useEffect(() => {
    const handler = () => { load() }
    window.addEventListener('doctor:pres-saved', handler as any)
    return () => window.removeEventListener('doctor:pres-saved', handler as any)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id])

  async function load(){
    try {
      if (!doc?.id) { setList([]); setPresEncounterIds([]); return }
      const params: any = { doctorId: doc.id }
      if (from) params.from = from
      if (to) params.to = to
      const [tokRes, presRes] = await Promise.all([
        hospitalApi.listTokens(params) as any,
        hospitalApi.listPrescriptions({ doctorId: doc.id, from, to }) as any,
      ])
      const items: Token[] = (tokRes.tokens || []).map((t: any) => ({
        _id: t._id,
        createdAt: t.createdAt,
        tokenNo: t.tokenNo,
        slotNo: t.slotNo,
        apptStart: t.apptStart,
        apptEnd: t.apptEnd,
        slotStart: t.slotStart,
        slotEnd: t.slotEnd,
        patientName: t.patientName || '-',
        mrNo: t.mrn || '-',
        patientPhone: t.patientId?.phoneNormalized || t.phone || t.patientPhone || undefined,
        patientAge: t.patientId?.age || t.age || undefined,
        patientGender: t.patientId?.gender || t.gender || undefined,
        patientAddress: t.patientId?.address || t.address || undefined,
        encounterId: String(t.encounterId || ''),
        doctorId: t.doctorId?._id || String(t.doctorId || ''),
        doctorName: t.doctorId?.name || '',
        department: t.departmentId?.name || '',
        fee: Number(t.fee || 0),
        paidMethod: t.paidMethod || t.paid_method || t.paymentMethod || undefined,
        billingType: t.billingType || t.billing_type || undefined,
        status: t.status,
      }))
      const presIds: string[] = (presRes.prescriptions || []).map((p: any) => String(p.encounterId?._id || p.encounterId || ''))
      setList(items)
      setPresEncounterIds(presIds)
    } catch {
      // backend likely down; keep current list
    }
  }

  async function openHistory(t: Token){
    setDrawerToken(t)
    setDrawerOpen(true)
    setDrawerTab('visits')
    setDrawerBusy(true)
    try {
      const mrn = String(t.mrNo || '').trim()
      const drId = doc?.id
      const [tokRes, presRes, labRes, diagRes, finRes] = await Promise.all([
        drId ? (hospitalApi.listTokens({ doctorId: drId, from: from || undefined, to: to || undefined }) as any) : Promise.resolve({ tokens: [] }),
        mrn ? (hospitalApi.listPrescriptions({ patientMrn: mrn, page: 1, limit: 50 }) as any) : Promise.resolve({ prescriptions: [] }),
        mrn ? (labApi.listOrders({ q: mrn, page: 1, limit: 50 }) as any) : Promise.resolve({ orders: [] }),
        mrn ? (diagnosticApi.listOrders({ q: mrn, page: 1, limit: 50 }) as any) : Promise.resolve({ orders: [] }),
        mrn ? (corporateApi.listTransactions({ patientMrn: mrn, page: 1, limit: 50 }) as any) : Promise.resolve({ transactions: [] }),
      ])

      const tokensAll: any[] = tokRes?.tokens || []
      const visits: Token[] = tokensAll
        .filter(x => String(x?.mrn || x?.mrNo || '').trim() === mrn)
        .map(x => ({
          _id: String(x._id || x.id),
          createdAt: String(x.createdAt || ''),
          patientName: String(x.patientName || '-'),
          mrNo: String(x.mrn || '-'),
          encounterId: String(x.encounterId || ''),
          doctorId: x.doctorId?._id || String(x.doctorId || ''),
          doctorName: x.doctorId?.name || '',
          department: x.departmentId?.name || '',
          fee: Number(x.fee || 0),
          status: x.status,
        }))
        .sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())

      setHistVisits(visits)
      setHistPres(presRes?.prescriptions || [])
      setHistLab(labRes?.orders || [])
      setHistDiag(diagRes?.orders || [])
      setHistFinance(finRes?.transactions || [])
    } catch {
      setHistVisits([])
      setHistPres([])
      setHistLab([])
      setHistDiag([])
      setHistFinance([])
    } finally {
      setDrawerBusy(false)
    }
  }

  const filteredPatients = useMemo(() => {
    const presSet = new Set(presEncounterIds.filter(Boolean))
    let patients = (list || []).filter(t => t.doctorId === doc?.id)
    
    // Apply status filter
    if (filter !== 'all') {
      if (filter === 'queued') {
        // For queued, exclude those with prescriptions
        patients = patients.filter(t => t.status === 'queued' && (!t.encounterId || !presSet.has(String(t.encounterId))))
      } else {
        patients = patients.filter(t => t.status === filter)
      }
    } else {
      // For 'all', exclude those with prescriptions from queued patients
      patients = patients.filter(t => !(t.status === 'queued' && t.encounterId && presSet.has(String(t.encounterId))))
    }
    
    // Apply search filter
    const q = query.trim().toLowerCase()
    if (q) {
      patients = patients.filter(t => [t.patientName, t.mrNo]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q)))
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'name':
        patients.sort((a, b) => a.patientName.localeCompare(b.patientName))
        break
      case 'status':
        patients.sort((a, b) => a.status.localeCompare(b.status))
        break
      case 'date':
      default:
        patients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }
    
    return patients
  }, [list, doc, presEncounterIds, filter, sortBy, query])


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xl font-semibold text-slate-800">All Patients</div>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={e=>{ setFrom(e.target.value); }} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <span className="text-slate-500 text-sm">to</span>
          <input type="date" value={to} onChange={e=>{ setTo(e.target.value); }} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <button
            type="button"
            onClick={()=>{ setFrom(''); setTo('') }}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
            title="Reset dates"
          >Reset</button>
          <button
            type="button"
            onClick={()=>{ const t = new Date().toISOString().slice(0,10); setFrom(t); setTo(t) }}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
          >Today</button>
        </div>
      </div>

      {/* Enhanced Filter Controls */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className="mb-1 block text-xs font-medium text-slate-600">Search Patients</label>
            <input
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder="Search by name or MR#"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
            />
          </div>
          <div className="lg:col-span-3">
            <label className="mb-1 block text-xs font-medium text-slate-600">Filter by Status</label>
            <select value={filter} onChange={e=>setFilter(e.target.value as any)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200">
              <option value="all">All Patients</option>
              <option value="queued">In Queue</option>
              <option value="completed">Completed</option>
              <option value="returned">Returned</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="lg:col-span-3">
            <label className="mb-1 block text-xs font-medium text-slate-600">Sort by</label>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200">
              <option value="date">Date (Newest First)</option>
              <option value="name">Name (A-Z)</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Quick Stats</label>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
              <div className="text-slate-600">Total: {filteredPatients.length}</div>
              <div className="text-slate-500">Filtered: {list.filter(t => t.doctorId === doc?.id).length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3 text-slate-800">Patient List</div>
        <div className="divide-y divide-slate-200">
          {filteredPatients.map((t: Token, idx: number) => (
            <div
              key={t._id}
              role="button"
              tabIndex={0}
              onClick={()=>navigate(`/doctor/prescription?tokenId=${encodeURIComponent(t._id)}`)}
              onKeyDown={(e)=>{ if (e.key==='Enter' || e.key===' ') { e.preventDefault(); navigate(`/doctor/prescription?tokenId=${encodeURIComponent(t._id)}`) } }}
              className="w-full text-left flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 focus:outline-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">{idx+1}</div>
                <div>
                  <div className="font-medium">{t.patientName}</div>
                  <div className="text-xs text-slate-500">
                    <span>MR: {t.mrNo}</span>
                    <span> • </span>
                    <span>Token#: </span>
                    <span className="font-semibold text-slate-700">{t.tokenNo || '-'}</span>
                    <span> • </span>
                    <span>Slot: </span>
                    <span className="font-semibold text-slate-700">{formatTimeRange(getSlotStart(t), getSlotEnd(t))}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`rounded border px-2 py-1 ${normalizeStatus(t.status)==='completed'?'border-emerald-200 bg-emerald-50 text-emerald-700': normalizeStatus(t.status)==='queued'?'border-blue-200 bg-blue-50 text-blue-700':'border-slate-200 text-slate-600'}`}>{normalizeStatus(t.status).replace('-', ' ')}</span>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 p-2 hover:bg-slate-50"
                  onClick={(e)=>{ e.stopPropagation(); openView(t) }}
                  title="View details"
                  aria-label="View details"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  className="rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-50 text-amber-700"
                  onClick={async (e)=>{ e.stopPropagation(); try { await hospitalApi.updateTokenStatus(t._id, t.status==='returned'?'queued':'returned'); await load() } catch {} }}
                  title="Return token"
                >{t.status==='returned'?'Unreturn':'Return'}</button>
              </div>
            </div>
          ))}
          {filteredPatients.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-500">
              {filter === 'all' ? 'No patients found' : `No patients with status '${filter}' found`}
            </div>
          )}
        </div>
      </div>

      {drawerOpen && drawerToken && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/30">
          <button type="button" className="absolute inset-0" onClick={()=>setDrawerOpen(false)} aria-label="Close" />
          <div className="relative z-10 h-full w-full max-w-3xl overflow-hidden bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-800">{drawerToken.patientName}</div>
                  <div className="mt-0.5 text-xs text-slate-500">MR: {drawerToken.mrNo} • {drawerToken.department || '-'} • {new Date(drawerToken.createdAt).toLocaleString()}</div>
                </div>
                <button type="button" onClick={()=>setDrawerOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">Close</button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={()=>setDrawerTab('visits')} className={`rounded-full px-3 py-1.5 text-xs ${drawerTab==='visits'?'bg-slate-900 text-white':'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Visits</button>
                <button type="button" onClick={()=>setDrawerTab('prescriptions')} className={`rounded-full px-3 py-1.5 text-xs ${drawerTab==='prescriptions'?'bg-violet-700 text-white':'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Prescriptions</button>
                <button type="button" onClick={()=>setDrawerTab('lab')} className={`rounded-full px-3 py-1.5 text-xs ${drawerTab==='lab'?'bg-sky-600 text-white':'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Lab</button>
                <button type="button" onClick={()=>setDrawerTab('diagnostics')} className={`rounded-full px-3 py-1.5 text-xs ${drawerTab==='diagnostics'?'bg-emerald-600 text-white':'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Diagnostics</button>
                <button type="button" onClick={()=>setDrawerTab('finance')} className={`rounded-full px-3 py-1.5 text-xs ${drawerTab==='finance'?'bg-amber-600 text-white':'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Finance</button>
              </div>
            </div>

            <div className="h-[calc(100vh-120px)] overflow-y-auto p-5">
              {drawerBusy && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Loading history…</div>
              )}

              {!drawerBusy && drawerTab==='visits' && (
                <div className="space-y-3">
                  {histVisits.map(v => (
                    <div key={v._id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-slate-800">{new Date(v.createdAt).toLocaleString()}</div>
                        <div className="text-xs text-slate-600">Fee: {v.fee}</div>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">Status: {v.status} • Dept: {v.department || '-'} • Encounter: {v.encounterId || '-'}</div>
                    </div>
                  ))}
                  {histVisits.length===0 && <div className="text-sm text-slate-500">No previous visits found.</div>}
                </div>
              )}

              {!drawerBusy && drawerTab==='prescriptions' && (
                <div className="space-y-3">
                  {histPres.map((p:any, i:number) => (
                    <div key={String(p._id||p.id||i)} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-slate-800">{new Date(p.createdAt || p.updatedAt || Date.now()).toLocaleString()}</div>
                        <div className="text-xs text-slate-600">Mode: {p.prescriptionMode || 'electronic'}</div>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">Diagnosis: {p.diagnosis || '-'}</div>
                      <div className="mt-2 whitespace-pre-wrap text-xs text-slate-700">{(p.items||[]).map((it:any)=>it?.name).filter(Boolean).slice(0,8).join('\n') || 'No items'}</div>
                    </div>
                  ))}
                  {histPres.length===0 && <div className="text-sm text-slate-500">No previous prescriptions found.</div>}
                </div>
              )}

              {!drawerBusy && drawerTab==='lab' && (
                <div className="space-y-3">
                  {histLab.map((o:any, i:number) => (
                    <div key={String(o._id||o.id||i)} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-slate-800">{o.tokenNo || o.orderNo || 'Lab Order'}</div>
                        <div className="text-xs text-slate-600">{o.status || '-'}</div>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</div>
                      <div className="mt-2 text-xs text-slate-700">{Array.isArray(o.tests) ? o.tests.join(', ') : (o.testsText || '')}</div>
                    </div>
                  ))}
                  {histLab.length===0 && <div className="text-sm text-slate-500">No lab orders found.</div>}
                </div>
              )}

              {!drawerBusy && drawerTab==='diagnostics' && (
                <div className="space-y-3">
                  {histDiag.map((o:any, i:number) => (
                    <div key={String(o._id||o.id||i)} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-slate-800">{o.tokenNo || o.orderNo || 'Diagnostic Order'}</div>
                        <div className="text-xs text-slate-600">{o.status || '-'}</div>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</div>
                      <div className="mt-2 text-xs text-slate-700">{Array.isArray(o.tests) ? o.tests.join(', ') : (o.testsText || '')}</div>
                    </div>
                  ))}
                  {histDiag.length===0 && <div className="text-sm text-slate-500">No diagnostic orders found.</div>}
                </div>
              )}

              {!drawerBusy && drawerTab==='finance' && (
                <div className="space-y-3">
                  {histFinance.map((tr:any, i:number) => (
                    <div key={String(tr._id||tr.id||i)} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-slate-800">{tr.serviceType || tr.refType || 'Transaction'}</div>
                        <div className="text-xs text-slate-600">{tr.status || '-'}</div>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{tr.createdAt ? new Date(tr.createdAt).toLocaleString() : ''}</div>
                      <div className="mt-2 text-xs text-slate-700">Amount: {tr.amount ?? tr.net ?? tr.total ?? '-'}</div>
                    </div>
                  ))}
                  {histFinance.length===0 && <div className="text-sm text-slate-500">No finance transactions found.</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewOpen && viewToken && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
          <button type="button" className="absolute inset-0" onClick={closeView} aria-label="Close" />
          <div className="relative z-10 w-full sm:max-w-3xl">
            <div className="max-h-[85dvh] overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div>
                  <div className="text-lg font-semibold text-slate-800">{viewToken.patientName}</div>
                  <div className="mt-0.5 text-xs text-slate-500">MR: {viewToken.mrNo} • Token#: {viewToken.tokenNo || '-'} • {new Date(viewToken.createdAt).toLocaleString()}</div>
                </div>
                <button type="button" onClick={closeView} className="inline-flex items-center justify-center rounded-md border border-slate-300 p-2 hover:bg-slate-50" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[calc(85dvh-64px)] overflow-y-auto p-5">
                <Section title="Patient Details">
                  <DetailsGrid
                    items={[
                      { label: 'Name', value: viewToken.patientName },
                      { label: 'MR#', value: viewToken.mrNo },
                      { label: 'Phone', value: viewToken.patientPhone || '-' },
                      { label: 'Age', value: viewToken.patientAge || '-' },
                      { label: 'Gender', value: viewToken.patientGender || '-' },
                      { label: 'Address', value: viewToken.patientAddress || '-' },
                    ]}
                  />
                </Section>

                <Section title="Doctor Details">
                  <DetailsGrid
                    items={[
                      { label: 'Doctor', value: viewToken.doctorName || '-' },
                      { label: 'Department', value: viewToken.department || '-' },
                    ]}
                  />
                </Section>

                <Section title="Payment Method">
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div className="text-xs text-slate-500">Payment Method</div>
                    <div className="mt-0.5 text-sm font-medium text-slate-800">
                      {viewPaymentLoading ? 'Loading...' : (viewPaymentMethod || viewToken.paidMethod || viewToken.billingType || '-')}
                    </div>
                  </div>
                </Section>

                <Section title="Token Details">
                  <DetailsGrid
                    items={[
                      { label: 'Token#', value: viewToken.tokenNo || '-' },
                      { label: 'Appointment Slot', value: formatTimeRange(getSlotStart(viewToken), getSlotEnd(viewToken)) },
                      { label: 'Status', value: viewToken.status },
                      { label: 'Fee', value: String(viewToken.fee || 0) },
                      { label: 'Created', value: new Date(viewToken.createdAt).toLocaleString() },
                    ]}
                  />
                </Section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: any }){
  return (
    <div className="mb-5">
      <div className="mb-2 text-sm font-semibold text-slate-800">{title}</div>
      {children}
    </div>
  )
}

function DetailsGrid({ items }: { items: Array<{ label: string; value: any }> }){
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs text-slate-500">{it.label}</div>
          <div className="mt-0.5 text-sm font-medium text-slate-800 break-words">{String(it.value ?? '-') || '-'}</div>
        </div>
      ))}
    </div>
  )
}

function normalizeStatus(status: Token['status']){
  return status === 'in-progress' ? 'queued' : status
}

function getSlotStart(t: Token){
  return t.slotStart || t.apptStart || undefined
}

function getSlotEnd(t: Token){
  return t.slotEnd || t.apptEnd || undefined
}

function parseHHMM(value?: string){
  if (!value) return null
  const v = String(value).trim()
  const m = v.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const hh = Math.max(0, Math.min(23, parseInt(m[1], 10)))
  const mm = Math.max(0, Math.min(59, parseInt(m[2], 10)))
  return { hh, mm }
}

function formatHHMM({ hh, mm }: { hh: number; mm: number }){
  const d = new Date()
  d.setHours(hh, mm, 0, 0)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function addMinutes(time: { hh: number; mm: number }, minutes: number){
  const base = time.hh * 60 + time.mm
  const next = base + minutes
  const hh = ((Math.floor(next / 60) % 24) + 24) % 24
  const mm = ((next % 60) + 60) % 60
  return { hh, mm }
}

function formatTimeRange(startStr?: string, endStr?: string){
  const start = parseHHMM(startStr)
  const end = parseHHMM(endStr)
  if (start && end) {
    const startDisp = formatHHMM(start).replace(/\s?(AM|PM)$/i, '')
    const endDisp = formatHHMM(end)
    return `${startDisp}-${endDisp}`
  }
  if (start && !end) {
    const endAuto = addMinutes(start, 10)
    const startDisp = formatHHMM(start).replace(/\s?(AM|PM)$/i, '')
    const endDisp = formatHHMM(endAuto)
    return `${startDisp}-${endDisp}`
  }
  if (startStr) return String(startStr)
  return '-'
}
