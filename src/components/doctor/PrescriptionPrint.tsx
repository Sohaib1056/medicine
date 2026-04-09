type Props = {
  printId?: string
  isPreview?: boolean
  noHeaderPrint?: boolean
  doctor: { name?: string; specialization?: string; qualification?: string; departmentName?: string; phone?: string }
  settings: { name: string; address: string; phone: string; logoDataUrl?: string }
  patient: { name?: string; mrn?: string; gender?: string; fatherName?: string; age?: string; phone?: string; address?: string }
  items: Array<{ name: string; frequency?: string; duration?: string; dose?: string; instruction?: string; route?: string }>
  medicationNotes?: string
  labTests?: string[]
  labNotes?: string
  diagnosticTests?: string[]
  diagnosticNotes?: string
  primaryComplaint?: string
  primaryComplaintHistory?: string
  familyHistory?: string
  treatmentHistory?: string
  allergyHistory?: string
  history?: string
  examFindings?: string
  diagnosis?: string
  advice?: string
  improvement?: string
  followupDate?: string
  createdAt?: string | Date
  vitals?: {
    pulse?: number
    temperatureC?: number
    bloodPressureSys?: number
    bloodPressureDia?: number
    respiratoryRate?: number
    bloodSugar?: number
    weightKg?: number
    heightCm?: number
    bmi?: number
    bsa?: number
    spo2?: number
  }
}

export default function PrescriptionPrint(props: Props) {
  const {
    printId = 'prescription-print',
    isPreview = false,
    doctor,
    settings,
    patient,
    items,
    primaryComplaint,
    diagnosticTests,
    createdAt,
    vitals,
    labTests,
  } = props
  const dt = createdAt ? new Date(createdAt) : new Date()

  const URDU_FREQ: Record<string, string> = {
    'OD': 'دن میں ایک بار',
    'BD': 'صبح + شام',
    'TDS': 'صبح + دوپہر + شام',
    'TID': 'صبح + دوپہر + شام',
    'QID': 'دن میں چار بار',
    'HS': 'رات سوتے وقت',
  }

  const translateFreq = (f?: string) => {
    const raw = String(f || '').trim()
    const s = raw.toUpperCase()
    const l = raw.toLowerCase()
    if (URDU_FREQ[s]) return URDU_FREQ[s]
    if (/once\s*a\s*day|daily/.test(l)) return 'دن میں ایک بار'
    if (/twice\s*a\s*day|two\s*times\s*(per\s*)?day|bid\b|bd\b/.test(l)) return 'صبح + شام'
    if (/three\s*times\s*(per\s*)?day|thrice\s*a\s*day|tid\b|tds\b/.test(l)) return 'صبح + دوپہر + شام'
    if (/four\s*times\s*(per\s*)?day|qid\b|qds\b/.test(l)) return 'دن میں چار بار'
    const hasMorning = /\bmorning\b/.test(l)
    const hasNoon = /\bnoon\b|\bafternoon\b/.test(l)
    const hasEvening = /\bevening\b/.test(l)
    const hasNight = /\bnight\b|\bhs\b/.test(l)
    const partsText = [hasMorning ? 'صبح' : '', hasNoon ? 'دوپہر' : '', hasEvening ? 'شام' : '', hasNight ? 'رات' : ''].filter(Boolean)
    if (partsText.length === 1) return partsText[0]
    if (partsText.length > 1) return partsText.join(' + ')
    if (s.includes('/')) {
      const parts = s.split('/').map(x => x.trim()).filter(Boolean)
      if (parts.length === 1) return 'دن میں ایک بار'
      if (parts.length === 2) return 'صبح + شام'
      if (parts.length === 3) return 'صبح + دوپہر + شام'
      if (parts.length >= 4) return 'دن میں چار بار'
    }
    return f || '-'
  }
  const rows = (items || []).map((m, i) => {
    const freqRaw = m.frequency || ''
    const freq = translateFreq(freqRaw)
    const timesPerDay = (() => {
      const combine = `${freqRaw} ${freq}`.toLowerCase()
      if (/(^|\s)(qid|qds)(\s|$)/.test(combine)) return 4
      if (/(^|\s)(tds|tid)(\s|$)/.test(combine)) return 3
      if (/(^|\s)(bd|bid)(\s|$)/.test(combine)) return 2
      if (/(^|\s)(od|hs|daily|once\s*a\s*day)(\s|$)/.test(combine)) return 1
      if (combine.includes('+')) return combine.split('+').filter(Boolean).length
      if (combine.includes('/')) return combine.split('/').filter(Boolean).length
      const hasMorning = /\bmorning\b/.test(combine)
      const hasNoon = /\bnoon\b|\bafternoon\b/.test(combine)
      const hasEvening = /\bevening\b/.test(combine)
      const hasNight = /\bnight\b|\bhs\b/.test(combine)
      const urduCnt = [/صبح/, /دوپہر/, /شام/, /رات/].reduce((c, r) => (r.test(combine) ? c + 1 : c), 0)
      const engCnt = [hasMorning, hasNoon, hasEvening, hasNight].filter(Boolean).length
      const total = Math.max(urduCnt, engCnt)
      return total > 0 ? total : 1
    })()
    const doseRaw = String((m as any).dose || (m as any).qty || '-').trim()
    const cleanDoseRaw = doseRaw.replace(/tablets?|capsules?|drops?|sachets?|syrups?|sy?p|injections?|inj|creams?/gi, '').replace(/\(\s*s\s*\)/gi, '').trim()
    const dose = cleanDoseRaw === '' ? '-' : cleanDoseRaw
    const durationRaw = String(m.duration || '').trim()
    const duration = durationRaw || '-'

    const qtyStr = String((m as any).qty ?? '').trim()
    const qtyNum = (() => {
      const n = parseFloat(qtyStr.replace(/[^0-9.]/g, ''))
      return isFinite(n) && n > 0 ? n : NaN
    })()
    let totalQty: number | string = '-'
    let nDose = parseFloat(cleanDoseRaw)
    if (isNaN(nDose)) nDose = 1
    if (/(^|[^0-9])0?\.5([^0-9]|$)/.test(doseRaw) || /1\/2/.test(doseRaw)) nDose = 0.5

    let days = 0
    const durMatch = durationRaw.match(/(\d+)/)
    if (durMatch) {
      let v = parseInt(durMatch[1])
      const dl = durationRaw.toLowerCase()
      if (dl.includes('week')) v *= 7
      if (dl.includes('month')) v *= 30
      days = Math.max(0, v)
    }

    const times = timesPerDay

    const computed = (days > 0) ? Math.ceil(nDose * times * days) : NaN
    if (isFinite(computed) && computed > 0) totalQty = computed
    else if (!isNaN(qtyNum) && qtyNum > 0) totalQty = Math.ceil(qtyNum)

    const route = (m as any).route || m.route || '-'

    return { sr: i + 1, name: m.name || '-', freq, dose, duration, instruction: (m as any).instruction || '-', route, qty: totalQty }
  })

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Nastaliq+Urdu:wght@400;700&family=Outfit:wght@400;600;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@100;300;400;700;900&display=swap" rel="stylesheet" />

      <div
        id={printId}
        style={isPreview ? { width: '100%', maxWidth: '900px', margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" } : { position: 'fixed', left: 0, top: 0, width: 900, visibility: 'hidden', pointerEvents: 'none', zIndex: -1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <div className={`mx-auto max-w-4xl bg-white p-8 ${!isPreview ? 'flex flex-col min-h-[290mm]' : ''}`}>
          <div className="flex-grow">
            <div className="mb-5 relative overflow-hidden rounded-[1.8rem] border-[1.2px] border-slate-200 bg-gradient-to-r from-blue-50/60 via-white to-indigo-50/60 p-4 shadow-xl print:shadow-none border-b-[6px] border-b-blue-600">
              {/* Artistic Floating Elements */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10 text-blue-600/5">
                <svg className="absolute -top-5 -right-5 w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-5v5h-2v-5H6v-2h5V6h2v5h5v2z"/></svg>
              </div>
              
              <div className="relative z-10 flex items-center justify-between gap-5">
                {/* Left: Brand Identity */}
                <div className="flex-[1.3] flex flex-col">
                  <div className="flex items-center gap-5">
                    {settings?.logoDataUrl && (
                      <div className="relative shrink-0">
                        <div className="absolute -inset-4 bg-blue-100/50 rounded-full blur-2xl"></div>
                        <img src={settings.logoDataUrl} alt="logo" className="relative h-20 w-20 object-contain drop-shadow-sm print:h-18 print:w-18" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <h1 style={{ fontFamily: "'Cinzel Decorative', serif" }} className="text-[40px] font-900 tracking-[-0.01em] leading-none text-slate-900 border-b-2 border-blue-600/30 pb-1.5">
                        {settings?.name || 'BIN BARKAT'}
                      </h1>
                      <div className="mt-3 flex items-center gap-2.5">
                        <span className="h-[1.5px] w-5 bg-blue-500 rounded-full"></span>
                        <p style={{ fontFamily: "'Montserrat', sans-serif" }} className="text-[12px] font-800 tracking-[0.12em] text-slate-700 uppercase leading-none">
                          {settings?.address || 'Shah Kot, Nankana Sahib'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Modern Doctor Profile */}
                <div className="flex-1 flex flex-col items-end text-right">
                  <div className="mb-1.5">
                    <span style={{ fontFamily: "'Montserrat', sans-serif" }} className="text-[9px] font-900 tracking-[0.18em] text-blue-700 uppercase px-2.5 py-1 border border-blue-200 bg-blue-50/90 rounded-full">
                      Chief Medical Officer
                    </span>
                  </div>
                  
                  <h2 style={{ fontFamily: "'Libre Baskerville', serif" }} className="text-[34px] font-700 italic text-slate-900 leading-none mb-1.5">
                    Dr. {doctor?.name}
                  </h2>
                  
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-2">
                      {(doctor?.qualification || '').split(',').map((q, idx) => (
                        <span key={idx} style={{ fontFamily: "'Montserrat', sans-serif" }} className="text-[11px] font-800 text-slate-700 bg-white/80 px-2 py-0.5 rounded shadow-sm border border-slate-100">
                          {q.trim()}
                        </span>
                      ))}
                    </div>
                    <p style={{ fontFamily: "'Montserrat', sans-serif" }} className="text-[11px] font-700 tracking-[0.05em] text-blue-600 uppercase leading-none">
                      {doctor?.specialization}
                    </p>
                  </div>

                  {doctor?.phone && (
                    <div className="mt-4 flex items-center gap-2.5">
                      <div className="text-[9px] font-900 uppercase tracking-[0.18em] text-slate-600">Helpline</div>
                      <div style={{ fontFamily: "'Montserrat', sans-serif" }} className="text-[18px] font-900 text-slate-900 tabular-nums tracking-tighter border-t-2 border-slate-900 pt-0.5 leading-none">
                        {doctor.phone}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-3 border border-slate-800 text-[11px]">
              <div className="border-b border-r border-slate-800 p-1">
                <span className="font-bold">Print Date:</span> {dt.toLocaleString()}
              </div>
              <div className="border-b border-r border-slate-800 p-1">
                <span className="font-bold">MR No:</span> {patient?.mrn}
              </div>
              <div className="border-b border-slate-800 p-1">
                <span className="font-bold">Age/Gender:</span> {patient?.age} / {patient?.gender === 'Male' ? 'M' : patient?.gender === 'Female' ? 'F' : ''}
              </div>

              <div className="border-r border-slate-800 p-1">
                <span className="font-bold">Patient Name:</span> {patient?.name}
              </div>
              <div className="border-r border-slate-800 p-1">
                <span className="font-bold">Contact No:</span> {patient?.phone}
              </div>
              <div className="p-1">
                <span className="font-bold">Created On:</span> {dt.toLocaleString()}
              </div>
            </div>

            <div className="mb-0 border-b border-t border-slate-300 py-2">
              <div className="grid grid-cols-3 gap-y-1 text-[11px]">
                <div><span className="font-bold">BP:</span> {vitals?.bloodPressureSys && vitals?.bloodPressureDia ? `${vitals.bloodPressureSys}/${vitals.bloodPressureDia}` : '/'} (mmhg)</div>
                <div><span className="font-bold">Pulse:</span> {vitals?.pulse ?? ''} (pulse/min)</div>
                <div><span className="font-bold">Temperature:</span> {vitals?.temperatureC ?? ''} (F)</div>
                <div><span className="font-bold">Height:</span> {vitals?.heightCm ?? ''} (cm)</div>
                <div><span className="font-bold">Weight:</span> {vitals?.weightKg ?? ''} (kg)</div>
                <div><span className="font-bold">RespRate:</span> {vitals?.respiratoryRate ?? ''} (breaths/min)</div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-[30%] flex flex-col gap-4">
                <div className="mt-2">
                  <div className="text-[11px] font-bold mb-1">Test/Investigations:</div>
                  <div className="border border-slate-800 rounded-sm overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-800 p-1 font-bold text-[10px]">Laboratory</div>
                    <table className="w-full text-[9px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left p-1 border-r border-slate-800 w-8">Sr#</th>
                          <th className="text-left p-1">Test Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(labTests || []).map((t, i) => (
                          <tr key={i} className="border-b border-slate-800 border-dotted last:border-0">
                            <td className="p-1 border-r border-slate-800 text-center font-bold">{i + 1}.</td>
                            <td className="p-1">{t}</td>
                          </tr>
                        ))}
                        {(!labTests || labTests.length === 0) && (
                          <tr><td colSpan={2} className="p-2 text-slate-400 italic">No lab tests</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold mb-1">Complaints</div>
                  <div className="min-h-[100px] border border-slate-800 p-2 text-[10px] whitespace-pre-wrap break-words rounded-sm">{primaryComplaint}</div>
                </div>
              </div>

              <div className="w-[70%] flex flex-col">
                <div className="mb-4 flex items-baseline gap-2">
                  <span className="text-[11px] font-bold text-slate-900 border-b-2 border-slate-900">Diagnostic Tests:</span>
                  <span className="text-[11px] font-bold text-slate-800">{Array.isArray(diagnosticTests) && diagnosticTests.length ? diagnosticTests.join(', ') : '—'}</span>
                </div>

                <div className="border-t border-slate-300 pt-2">
                  <div className="mb-2 text-[12px] font-extrabold text-slate-900 flex items-center gap-2">
                    <div className="h-4 w-1 bg-blue-600 rounded-full"></div>
                    Doctor Prescription:
                  </div>

                  <table className="w-full border-collapse text-[11px] table-fixed border-t-2 border-slate-900">
                    <thead>
                      <tr className="border-b border-slate-400 bg-slate-50">
                        <th className="py-1.5 text-center w-[6%] font-bold border-r border-slate-300">#</th>
                        <th className="py-1.5 pl-2 text-left w-[25%] font-bold border-r border-slate-300">Medicine</th>
                        <th className="py-1.5 text-center w-[12%] font-bold border-r border-slate-300">Route</th>
                        <th className="py-1.5 text-center w-[10%] font-bold border-r border-slate-300">Dose</th>
                        <th className="py-1.5 text-center w-[12%] font-bold border-r border-slate-300">Days</th>
                        <th className="py-1.5 text-center w-[25%] font-bold border-r border-slate-300">Instructions</th>
                        <th className="py-1.5 text-center w-[15%] font-bold">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i} className="border-b border-slate-300 group hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 text-center font-bold text-slate-900 border-r border-slate-200">{r.sr}.</td>
                          <td className="py-2.5 pl-2 break-words text-[11px] font-bold text-slate-800 border-r border-slate-200">{r.name}</td>
                          <td className="py-2.5 text-center border-r border-slate-200 text-[10px] font-semibold">{r.route}</td>
                          <td className="py-2.5 text-center border-r border-slate-200">
                            <div className="urdu-font text-[12px] font-bold leading-tight">{r.dose} گولی</div>
                          </td>
                          <td className="py-2.5 text-center text-[10px] font-semibold border-r border-slate-200">{r.duration}</td>
                          <td className="py-2.5 text-center border-r border-slate-200">
                            <div className="urdu-font text-[12px] font-bold leading-tight">{r.freq}</div>
                          </td>
                          <td className="py-2.5 text-center text-[11px] font-bold text-blue-700">{r.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
        <style>{`
        .urdu-font { 
          font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', serif !important; 
          direction: rtl;
        }
        @page { size: A4; margin: 0; }
        @media print {
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
          header, nav, aside, footer, .no-print, .app-header, .sidebar { display: none !important; }
          #${printId} { display: block !important; position: static !important; width: 100% !important; min-height: 100vh !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; background: #ffffff !important; visibility: visible !important; z-index: auto !important; }
          #${printId} .max-w-4xl { max-width: 210mm !important; }
        }
      `}</style>
      </div>
    </>
  )
}
