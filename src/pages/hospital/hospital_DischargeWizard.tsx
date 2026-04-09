import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import Hospital_BloodDonationConsent from '../../components/hospital/hospital_BloodDonationConsent'
import Hospital_TestTubeConsent from '../../components/hospital/hospital_TestTubeConsent'
import IpdDischargeForm from '../../components/hospital/hospital_IpdDischargeForm'
import IpdInvoiceSlip from '../../components/hospital/hospital_IpdInvoiceslip'
import ReceivedDeathForm from '../../components/hospital/hospital_ReceivedDeathForm'
import Hospital_ShortStayForm from '../../components/hospital/hospital_ShortStayForm'
import DeathCertificateForm from '../../components/hospital/hospital_DeathCertificateForm'
import Hospital_BirthCertificateForm from '../../components/hospital/hospital_BirthCertificateForm'
import { hospitalApi } from '../../utils/api'

const formDefs = [
  { key: 'DischargeSummary', label: 'Discharge Summary', render: (p: any) => <IpdDischargeForm encounterId={p?.encounterId} patient={p} isER={p?.isER} onSaved={p?.onSaved} /> },
  { key: 'Invoice', label: 'Final Invoice', render: (p: any) => <IpdInvoiceSlip patientId={p?.id} embedded isER={p?.isER} /> },
  { key: 'ShortStay', label: 'Short Stay', render: (p: any) => <Hospital_ShortStayForm encounterId={p?.encounterId} patient={p} isER={p?.isER} onSaved={p?.onSaved} /> },
  { key: 'DeathCertificate', label: 'Death Certificate', render: (p: any) => <DeathCertificateForm encounterId={p?.encounterId} patient={p} isER={p?.isER} onSaved={p?.onSaved} /> },
  { key: 'BirthCertificate', label: 'Birth Certificate', render: (p: any) => <Hospital_BirthCertificateForm encounterId={p?.encounterId} patient={p} isER={p?.isER} onSaved={p?.onSaved} /> },
  { key: 'ReceivedDeath', label: 'Received Death', render: (p: any) => <ReceivedDeathForm encounterId={p?.encounterId} patient={p} isER={p?.isER} onSaved={p?.onSaved} /> },
  { key: 'BloodDonationConsent', label: 'Blood Donation Consent', render: (p: any) => <Hospital_BloodDonationConsent patient={{ name: p?.name, phone: p?.phone, address: p?.address }} /> },
  { key: 'TestTubeConsent', label: 'Test Tube Consent', render: (p: any) => <Hospital_TestTubeConsent patient={{ name: p?.name, phone: p?.phone, address: p?.address }} /> },
]

export default function Hospital_DischargeWizard(){
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isER = searchParams.get('type') === 'er'
  const [encounterId, setEncounterId] = useState<string>('')

  const [patient, setPatient] = useState<any>({ id: '', name: '', bed: '', doctor: '', admitted: '', mrn: '', admissionNo: '' })

  // Resolve encounter (treat :id as encounterId if possible; else fallback by patientId)
  useEffect(()=>{ (async()=>{
    const routeId = String(id||'')
    if (!routeId) return

    // If coming from ER, try token lookup first to avoid 404 on IPD endpoint
    if (isER) {
      try {
        const res: any = await hospitalApi.getToken(routeId)
        const t = res?.token
        if (t && t._id) {
          const encId = String(t.encounterId || t._id)
          const p = t.patientId || {}
          setEncounterId(encId)
          setPatient({
            id: String(p._id || ''),
            name: String(p.fullName || t.patientName || ''),
            bed: '',
            doctor: t.doctorId?.name || '',
            admitted: t.createdAt,
            mrn: String(p.mrn || t.mrn || ''),
            address: String(p.address || ''),
            phone: String(p.phoneNormalized || t.phone || ''),
            age: String(p.age || ''),
            gender: String(p.gender || ''),
            admissionNo: '',
          })
          return
        }
      } catch {}
    }

    // Try IPD admission first (for IPD discharges)
    try {
      const e = await hospitalApi.getIPDAdmissionByIdSilent(routeId) as any
      const enc = e?.encounter
      if (enc && enc._id){
        setEncounterId(String(enc._id))
        setPatient({
          id: String(enc.patientId?._id||''),
          name: String(enc.patientId?.fullName||''),
          bed: enc.bedLabel||'',
          doctor: enc.doctorId?.name||'',
          admitted: enc.startAt,
          mrn: enc.patientId?.mrn||'',
          address: enc.patientId?.address||'',
          phone: enc.patientId?.phoneNormalized||'',
          age: enc.patientId?.age||'',
          gender: enc.patientId?.gender||'',
          admissionNo: enc.admissionNo || '',
        })
        return
      }
    } catch {}
    // Fallback 1: assume :id is patientId -> get most recent admitted/discharged
    try {
      const res = await hospitalApi.listIPDAdmissions({ patientId: routeId, limit: 1 }) as any
      const enc = (res?.admissions||[])[0]
      if (enc){
        setEncounterId(String(enc._id))
        setPatient({
          id: routeId,
          name: String(enc.patientId?.fullName||''),
          bed: enc.bedLabel||'',
          doctor: enc.doctorId?.name||'',
          admitted: enc.startAt,
          mrn: enc.patientId?.mrn||'',
          address: enc.patientId?.address||'',
          phone: enc.patientId?.phoneNormalized||'',
          age: enc.patientId?.age||'',
          gender: enc.patientId?.gender||'',
          admissionNo: enc.admissionNo || '',
        })
        return
      }
    } catch {}
    // Fallback 2: treat :id as ER token -> fetch token and use its encounter
    try {
      const res: any = await hospitalApi.getToken(routeId)
      const t = res?.token
      if (t && t._id) {
        const encId = String(t.encounterId || t._id)
        const p = t.patientId || {}
        setEncounterId(encId)
        setPatient({
          id: String(p._id || ''),
          name: String(p.fullName || t.patientName || ''),
          bed: '',
          doctor: t.doctorId?.name || '',
          admitted: t.createdAt,
          mrn: String(p.mrn || t.mrn || ''),
          address: String(p.address || ''),
          phone: String(p.phoneNormalized || t.phone || ''),
          age: String(p.age || ''),
          gender: String(p.gender || ''),
          admissionNo: '',
        })
        return
      }
    } catch {}
  })() }, [id, isER])

  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<string[]>(['DischargeSummary','Invoice'])
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false })

  // Filter forms: hide Blood Donation Consent and Test Tube Consent for emergency
  const visibleFormDefs = formDefs.filter(fd => {
    if (!isER) return true
    return fd.key !== 'BloodDonationConsent' && fd.key !== 'TestTubeConsent'
  })

  useEffect(() => {
    if (!toast.visible) return
    const t = setTimeout(() => setToast({ message: '', visible: false }), 3000)
    return () => clearTimeout(t)
  }, [toast.visible])
  

  return (
    <div className="space-y-4">
      {/* Top header removed to avoid duplication with form header */}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {['Select Forms','Fill Forms'].map((t, i)=> (
            <button key={i} onClick={()=>setStep(i)} className={`rounded-md px-3 py-1 text-sm ${step===i?'bg-navy text-white':'bg-slate-100 text-slate-700'}`}>{i+1}. {t}</button>
          ))}
        </div>
      </div>
      {step===0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="text-lg font-semibold text-slate-800">Select Forms</div>
          <div className="grid md:grid-cols-2 gap-2">
            {visibleFormDefs.map(fd => (
              <label key={fd.key} className="flex items-center gap-2 text-sm border border-slate-200 rounded-md px-3 py-2">
                <input type="checkbox" checked={selected.includes(fd.key)} onChange={(e)=> setSelected(s=> e.target.checked ? [...s, fd.key] : s.filter(x=>x!==fd.key))} />
                {fd.label}
              </label>
            ))}
          </div>
          <div className="pt-2 flex items-center gap-2">
            <button disabled={selected.length===0} onClick={()=>setStep(1)} className="btn disabled:opacity-50">Continue</button>
          </div>
        </div>
      )}

      {step===1 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="text-lg font-semibold text-slate-800">Fill Forms</div>
          <div className="space-y-10">
            {selected.map(k=> {
              const fd = formDefs.find(x=>x.key===k)
              if (!fd) return null
              return (
                <div key={k} className="border border-slate-200 rounded-md p-3">
                  <div className="mb-2 text-sm font-medium text-slate-700">{fd.label}</div>
                  {/* Minimal structured fields for backend persistence */}
                  {k==='DischargeSummary' && (
                    <IpdDischargeForm encounterId={encounterId} patient={patient} isER={isER} onSaved={() => setToast({ message: `${fd.label} submitted successfully`, visible: true })} />
                  )}
                  <div className="overflow-auto">
                    {k!=='DischargeSummary' && fd.render({ ...patient, encounterId, isER, onSaved: () => setToast({ message: `${fd.label} submitted successfully`, visible: true }) })}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="pt-2 flex items-center gap-2">
            <button onClick={()=>setStep(0)} className="btn-outline-navy">Back</button>
          </div>
        </div>
      )}

      {/* Toast notification at bottom right */}
      {toast.visible && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-lg">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{toast.message}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

