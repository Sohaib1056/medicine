import { useEffect, useMemo, useState } from 'react'
import { Search, Printer, FileDown } from 'lucide-react'
import { labApi } from '../../utils/api'
import { downloadLabReportPdf, previewLabReportPdf } from '../../utils/printLabReport'

type Patient = {
  _id: string
  mrn: string
  fullName: string
  phoneNormalized?: string
  cnicNormalized?: string
  age?: string
  gender?: string
  address?: string
}

type Sample = {
  orderId: string
  sampleId: string
  createdAt: string
  tests: string[]
  priority: string
  collectionTime?: string
  reportingTime?: string
  collectionDateTime?: string
  reportingDateTime?: string
  status: string
  reportStatus: 'pending' | 'approved' | 'rejected'
  rows: Array<{ id?: string; test: string; normal?: string; unit?: string; value?: string; prevValue?: string; flag?: any; comment?: string }>
  interpretation?: string
  referringConsultant?: string
  paymentMethod?: 'Cash'|'Card'|'Bank'|'Online'
  paymentDetails?: {
    reference?: string
    cardBrand?: string
    cardLast4?: string
    bankName?: string
    bankAccountLast4?: string
    onlineProvider?: string
    onlineTxnId?: string
  }
  receivedAmount?: number
  receivableAmount?: number
}

type Profiling = {
  patient: Patient
  numberOfVisits: number
  samples: Sample[]
}

function formatDateTime(iso?: string) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString() + ', ' + d.toLocaleTimeString()
}

export default function Lab_PatientProfiling() {
  const [q, setQ] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(false)

  const [dialog, setDialog] = useState<{ open: boolean; title: string; message: string }>(() => ({ open: false, title: '', message: '' }))

  const [selectedId, setSelectedId] = useState<string>('')
  const [profile, setProfile] = useState<Profiling | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  const selected = useMemo(() => patients.find(p => String(p._id) === String(selectedId)) || null, [patients, selectedId])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const term = q.trim()
      if (!term) {
        setPatients([])
        return
      }
      try {
        setLoadingPatients(true)
        const res: any = await labApi.searchPatients({ q: term, limit: 50 })
        const list: Patient[] = (res?.patients || []).map((p: any) => ({
          _id: String(p._id),
          mrn: String(p.mrn || ''),
          fullName: String(p.fullName || '-'),
          phoneNormalized: p.phoneNormalized ? String(p.phoneNormalized) : undefined,
          cnicNormalized: p.cnicNormalized ? String(p.cnicNormalized) : undefined,
          age: p.age ? String(p.age) : undefined,
          gender: p.gender ? String(p.gender) : undefined,
          address: p.address ? String(p.address) : undefined,
        }))
        if (cancelled) return
        setPatients(list)
        if (list.length === 1) setSelectedId(String(list[0]._id))
      } catch (e) {
        console.error(e)
        if (!cancelled) setPatients([])
      } finally {
        if (!cancelled) setLoadingPatients(false)
      }
    }

    const t = window.setTimeout(run, 200)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [q])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!selectedId) {
        setProfile(null)
        return
      }
      try {
        setLoadingProfile(true)
        const res: any = await labApi.getPatientProfiling({ patientId: selectedId })
        if (cancelled) return
        setProfile(res || null)
      } catch (e) {
        console.error(e)
        if (!cancelled) setProfile(null)
      } finally {
        if (!cancelled) setLoadingProfile(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [selectedId])

  const checkReady = (s: Sample) => {
    const st = String(s.status || '').toLowerCase()
    if (st !== 'completed') return { ok: false, message: 'Sample is not completed yet.' }
    if (String(s.reportStatus || 'pending') !== 'approved') return { ok: false, message: 'Report is not approved yet.' }
    return { ok: true, message: '' }
  }

  const printReport = async (s: Sample) => {
    const ready = checkReady(s)
    if (!ready.ok) {
      setDialog({ open: true, title: 'Cannot Print', message: ready.message })
      return
    }
    if (!profile?.patient) return

    // Optional due recovery prompt (does not block printing)
    try {
      const due = Math.max(0, Number(s.receivableAmount || 0))
      if (due > 0) {
        const raw = prompt(`Due amount PKR ${due.toFixed(2)}.\nEnter amount to recover now (or Cancel to skip):`, String(due.toFixed(2)))
        if (raw != null) {
          const amt = Math.max(0, Number(String(raw).replace(/[^0-9.]/g, '')) || 0)
          if (amt > 0) {
            await labApi.collectOrderPayment(String(s.orderId), { amount: Math.min(due, amt), paymentMethod: 'Cash' })
          }
        }
      }
    } catch (e) {
      console.error(e)
    }

    await previewLabReportPdf({
      tokenNo: s.sampleId,
      createdAt: s.createdAt,
      sampleTime: s.collectionTime,
      reportingTime: s.reportingTime,
      patient: {
        fullName: profile.patient.fullName,
        phone: profile.patient.phoneNormalized,
        mrn: profile.patient.mrn,
        age: profile.patient.age,
        gender: profile.patient.gender,
        address: profile.patient.address,
      },
      rows: (s.rows || []).map(r => ({
        id: String(r.id || ''),
        test: String(r.test || ''),
        normal: r.normal,
        unit: r.unit,
        value: r.value,
        prevValue: (r as any).prevValue,
        flag: (r as any).flag === 'critical_low' || (r as any).flag === 'critical_high' ? 'critical' : (r as any).flag,
        comment: r.comment,
      })),
      interpretation: s.interpretation,
      referringConsultant: s.referringConsultant,
      profileLabel: (s.tests || []).join(', '),
    })
  }

  const downloadPdf = async (s: Sample) => {
    const ready = checkReady(s)
    if (!ready.ok) {
      setDialog({ open: true, title: 'Cannot Download PDF', message: ready.message })
      return
    }
    if (!profile?.patient) return

    // Optional due recovery prompt (does not block download)
    try {
      const due = Math.max(0, Number(s.receivableAmount || 0))
      if (due > 0) {
        const raw = prompt(`Due amount PKR ${due.toFixed(2)}.\nEnter amount to recover now (or Cancel to skip):`, String(due.toFixed(2)))
        if (raw != null) {
          const amt = Math.max(0, Number(String(raw).replace(/[^0-9.]/g, '')) || 0)
          if (amt > 0) {
            await labApi.collectOrderPayment(String(s.orderId), { amount: Math.min(due, amt), paymentMethod: 'Cash' })
          }
        }
      }
    } catch (e) {
      console.error(e)
    }

    await downloadLabReportPdf({
      tokenNo: s.sampleId,
      createdAt: s.createdAt,
      sampleTime: s.collectionTime,
      reportingTime: s.reportingTime,
      patient: {
        fullName: profile.patient.fullName,
        phone: profile.patient.phoneNormalized,
        mrn: profile.patient.mrn,
        age: profile.patient.age,
        gender: profile.patient.gender,
        address: profile.patient.address,
      },
      rows: (s.rows || []).map(r => ({
        test: String(r.test || ''),
        normal: r.normal,
        unit: r.unit,
        value: r.value,
        prevValue: (r as any).prevValue,
        flag: (r as any).flag === 'critical_low' || (r as any).flag === 'critical_high' ? 'critical' : (r as any).flag,
        comment: r.comment,
      })),
      interpretation: s.interpretation,
      referringConsultant: s.referringConsultant,
      profileLabel: (s.tests || []).join(', '),
    })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">Patient Profiling</h2>

      {dialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="text-lg font-semibold text-slate-900">{dialog.title}</div>
            <div className="mt-2 text-sm text-slate-600">{dialog.message}</div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setDialog({ open: false, title: '', message: '' })}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={e => { setQ(e.target.value); if (!e.target.value.trim()) { setSelectedId(''); setProfile(null) } }}
              placeholder="Search by name, CNIC, or phone"
              className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
            />
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">CNIC</th>
                  <th className="px-3 py-2">Phone</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => {
                  const active = String(p._id) === String(selectedId)
                  return (
                    <tr
                      key={p._id}
                      className={`border-b border-slate-100 cursor-pointer ${active ? 'bg-violet-50' : 'hover:bg-slate-50'}`}
                      onClick={() => setSelectedId(String(p._id))}
                    >
                      <td className="px-3 py-2 whitespace-nowrap font-medium text-slate-900">{p.fullName}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-slate-700">{p.cnicNormalized || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-700">{p.phoneNormalized || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {loadingPatients && <div className="p-3 text-xs text-slate-500">Searching...</div>}
            {!loadingPatients && q.trim() && patients.length === 0 && <div className="p-3 text-xs text-slate-500">No patients found</div>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xl font-bold text-slate-900">Basic Information</div>

            {loadingProfile && selectedId && (
              <div className="mt-3 text-sm text-slate-600">Loading...</div>
            )}

            {!loadingProfile && !selected && (
              <div className="mt-3 text-sm text-slate-600">Select a patient to view profile.</div>
            )}

            {!loadingProfile && selected && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-xs text-slate-500">Patient ID</div>
                  <div className="font-semibold text-slate-900">{selected.mrn || '-'}</div>

                  <div className="pt-2 text-xs text-slate-500">Patient Name</div>
                  <div className="font-semibold text-slate-900">{selected.fullName || '-'}</div>

                  <div className="pt-2 text-xs text-slate-500">Phone</div>
                  <div className="font-semibold text-slate-900">{selected.phoneNormalized || '-'}</div>

                  <div className="pt-2 text-xs text-slate-500">Gender</div>
                  <div className="font-semibold text-slate-900">{selected.gender || '-'}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-slate-500">Number of Visits</div>
                  <div className="font-semibold text-slate-900">{profile?.numberOfVisits ?? '-'}</div>

                  <div className="pt-2 text-xs text-slate-500">CNIC</div>
                  <div className="font-semibold text-slate-900">{selected.cnicNormalized || '-'}</div>

                  <div className="pt-2 text-xs text-slate-500">Age</div>
                  <div className="font-semibold text-slate-900">{selected.age || '-'}</div>

                  <div className="pt-2 text-xs text-slate-500">Address</div>
                  <div className="font-semibold text-slate-900">{selected.address || '-'}</div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xl font-bold text-slate-900">Complete Profiling</div>
            <div className="mt-1 text-xs text-slate-500">Samples for this patient</div>

            {!loadingProfile && selected && (profile?.samples || []).length === 0 && (
              <div className="mt-4 text-sm text-slate-600">No samples found.</div>
            )}

            <div className="mt-4 space-y-3">
              {(profile?.samples || []).map(s => (
                <div key={s.orderId} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900">Sample ID: {s.sampleId || '-'}</div>
                      <div className="text-xs text-slate-600">Tests: {(s.tests || []).join(', ') || '-'}</div>
                      <div className="text-xs text-slate-600">Collection DateTime: {formatDateTime(s.collectionDateTime || s.createdAt)}</div>
                      <div className="text-xs text-slate-600">Reporting DateTime: {formatDateTime(s.reportingDateTime)}</div>
                      <div className="text-xs text-slate-600">Status: {String(s.status || '-')}</div>
                      <div className="text-xs text-slate-600">Payment: {String(s.paymentMethod || '-')}{renderPaymentDetail(s)}</div>
                      <div className="text-xs text-slate-600">Paid: PKR {Number(s.receivedAmount||0).toFixed(2)} • Due: PKR {Number(s.receivableAmount||0).toFixed(2)}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadPdf(s)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
                      >
                        <FileDown className="h-4 w-4" /> PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => printReport(s)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
                      >
                        <Printer className="h-4 w-4" /> Print
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-500">Created: {formatDateTime(s.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function renderPaymentDetail(s: Sample) {
  const d: any = (s as any).paymentDetails || {}
  const method = String((s as any).paymentMethod || '')
  if (!method) return null
  const parts: string[] = []
  if (d.reference) parts.push(String(d.reference))
  if (method === 'Card') {
    const seg = [d.cardBrand, d.cardLast4 ? `****${d.cardLast4}` : ''].filter(Boolean).join(' ')
    if (seg) parts.push(seg)
  }
  if (method === 'Bank') {
    const seg = [d.bankName, d.bankAccountLast4 ? `****${d.bankAccountLast4}` : ''].filter(Boolean).join(' ')
    if (seg) parts.push(seg)
  }
  if (method === 'Online') {
    const seg = [d.onlineProvider, d.onlineTxnId].filter(Boolean).join(' ')
    if (seg) parts.push(seg)
  }
  if (parts.length === 0) return null
  return <span className="text-slate-500">{' '}({parts.join(' · ')})</span>
}
