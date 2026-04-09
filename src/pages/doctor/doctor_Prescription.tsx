import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { diagnosticApi, hospitalApi, labApi, pharmacyApi } from '../../utils/api'
import PrescriptionPrint from '../../components/doctor/PrescriptionPrint'
import SuggestField from '../../components/SuggestField'
import PrescriptionVitals from '../../components/doctor/PrescriptionVitals'
import PrescriptionDiagnosticOrders from '../../components/doctor/PrescriptionDiagnosticOrders'
import { Pencil, Trash2 } from 'lucide-react'
import { getSavedPrescriptionPdfTemplate, previewPrescriptionPdf } from '../../utils/prescriptionPdf'
import type { PrescriptionPdfTemplate } from '../../utils/prescriptionPdf'

type DoctorSession = { id: string; name: string; username: string }

type Token = {
  id: string
  createdAt: string
  patientName: string
  mrNo: string
  tokenNo?: string
  encounterId: string
  doctorId?: string
  doctorName?: string
  status?: 'queued' | 'completed'
}

type MedicineRow = {
  name: string
  morning?: string
  noon?: string
  evening?: string
  night?: string
  days?: string
  qty?: string
  route?: string
  instruction?: string
  durationUnit?: 'day(s)' | 'week(s)' | 'month(s)'
  durationText?: string
  freqText?: string
}

type PreviousPrescriptionOption = {
  id: string
  createdAt: string
  encounterId?: string
  diagnosis?: string
  patientName?: string
  mrn?: string
  visitNo?: string
}

//

export default function Doctor_Prescription() {
  const [searchParams] = useSearchParams()
  const [doc, setDoc] = useState<DoctorSession | null>(null)
  const [tokens, setTokens] = useState<Token[]>([])
  const [presEncounterIds, setPresEncounterIds] = useState<string[]>([])
  const [historyToken, setHistoryToken] = useState<Token | null>(null)
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<string>('')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [form, setForm] = useState({
    patientKey: '',
    primaryComplaint: '',
    primaryComplaintHistory: '',
    familyHistory: '',
    allergyHistory: '',
    treatmentHistory: '',
    history: '',
    examFindings: '',
    diagnosis: '',
    advice: '',
    labTestsText: '',
    labNotes: '',
    medicationNotes: '',
    vitalsDisplay: {},
    vitalsNormalized: {},
    diagDisplay: { testsText: '', notes: '' },
    meds: [{ name: '', morning: '', noon: '', evening: '', night: '', days: '', qty: '', route: '', instruction: '', durationUnit: 'day(s)', durationText: '', freqText: '' }] as MedicineRow[],
  })
  const [saved, setSaved] = useState(false)
  const [settings] = useState<{ name: string; address: string; phone: string; logoDataUrl?: string }>({ name: 'Hospital', address: '', phone: '' })
  const [pat] = useState<{ address?: string; phone?: string; fatherName?: string; gender?: string; age?: string } | null>(null)
  const [doctorInfo, setDoctorInfo] = useState<{ name?: string; specialization?: string; phone?: string; qualification?: string; departmentName?: string } | null>(null)
  const [toast, setToast] = useState<null | { type: 'success' | 'error'; message: string }>(null)
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 2500)
  }

  const stripImprovementFollowupFromHistory = (raw?: string) => {
    const s = String(raw || '')
    if (!s.trim()) return ''
    const lines = s
      .split(/\r?\n/)
      .map(l => String(l || '').trimEnd())
      .filter(l => {
        const t = l.trimStart()
        if (!t) return false
        if (/^improvement\s*:/i.test(t)) return false
        if (/^follow-?up\s*:/i.test(t)) return false
        return true
      })
    return lines.join('\n').trim()
  }
  const vitalsRef = useRef<any>(null)
  const diagRef = useRef<any>(null)
  const rightTabsRef = useRef<HTMLElement | null>(null)
  const [showRightTabsPrev, setShowRightTabsPrev] = useState(false)
  const [showRightTabsNext, setShowRightTabsNext] = useState(false)
  const [sugVersion, setSugVersion] = useState(0)
  const [medNameSuggestions, setMedNameSuggestions] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'details' | 'medications' | 'vitals' | 'labs' | 'diagnostics'>('details')
  const [createOther, setCreateOther] = useState<string>('')
  const [examOther, setExamOther] = useState<string>('')
  const [riskOther, setRiskOther] = useState<string>('')
  const [fhOther, setFhOther] = useState<string>('')
  const [selectOther, setSelectOther] = useState<string>('')
  const [aorticSelected, setAorticSelected] = useState<string[]>([])
  const [aorticOpen, setAorticOpen] = useState(false)
  const aorticRef = useRef<HTMLDivElement | null>(null)
  const [note1, setNote1] = useState<string>('')
  const [note2, setNote2] = useState<string>('')
  const [atriumOther, setAtriumOther] = useState<string>('')
  const [multiSelectRows, setMultiSelectRows] = useState<string[]>([''])
  const [multiInput, setMultiInput] = useState<string>('')
  const [improvement, setImprovement] = useState<string>('')
  const [followupDate, setFollowupDate] = useState<string>('')
  const [createChecks, setCreateChecks] = useState<Record<string, boolean>>({})
  const [rightTab, setRightTab] = useState<'drugs' | 'templates' | 'lab' | 'radiology'>('drugs')
  const [drugQuery, setDrugQuery] = useState<string>('')
  const [templateQuery, setTemplateQuery] = useState<string>('')
  const [drugOptions, setDrugOptions] = useState<string[]>([])
  const [inventoryDrugOptions, setInventoryDrugOptions] = useState<{ name: string; onHand?: number; price?: number }[]>([])
  const [loadingInventoryDrugs, setLoadingInventoryDrugs] = useState(false)
  const [inventoryDrugsError, setInventoryDrugsError] = useState<string>('')
  const [labTestQuery, setLabTestQuery] = useState<string>('')
  const [labTestOptions, setLabTestOptions] = useState<string[]>([])
  const [allLabTestOptions, setAllLabTestOptions] = useState<string[]>([])
  const [loadingLabTests, setLoadingLabTests] = useState(false)
  const [labTestsError, setLabTestsError] = useState<string>('')
  const [radiologyQuery, setRadiologyQuery] = useState<string>('')
  const [radiologyOptions, setRadiologyOptions] = useState<string[]>([])
  const [allRadiologyOptions, setAllRadiologyOptions] = useState<string[]>([])
  const [loadingRadiologyTests, setLoadingRadiologyTests] = useState(false)
  const [radiologyTestsError, setRadiologyTestsError] = useState<string>('')
  const [drugPick, setDrugPick] = useState<string>('')
  const [openAllTemplatesDialog, setOpenAllTemplatesDialog] = useState(false)
  const [allTemplatesQuery, setAllTemplatesQuery] = useState('')
  const [openDeleteTemplateDialog, setOpenDeleteTemplateDialog] = useState(false)
  const [deleteTemplateId, setDeleteTemplateId] = useState<string>('')
  const [deleteTemplateName, setDeleteTemplateName] = useState<string>('')
  const [openAllLabTestsDialog, setOpenAllLabTestsDialog] = useState(false)
  const [allLabTestsQuery, setAllLabTestsQuery] = useState('')
  const [selectedAllLabTests, setSelectedAllLabTests] = useState<Record<string, boolean>>({})
  const [openAllDiagnosticsDialog, setOpenAllDiagnosticsDialog] = useState(false)
  const [allDiagnosticsQuery, setAllDiagnosticsQuery] = useState('')
  const [selectedAllDiagnostics, setSelectedAllDiagnostics] = useState<Record<string, boolean>>({})
  const [openAllDrugsDialog, setOpenAllDrugsDialog] = useState(false)
  const [allDrugsQuery, setAllDrugsQuery] = useState('')
  const [selectedAllDrugs, setSelectedAllDrugs] = useState<Record<string, boolean>>({})
  const lastSavedKeyRef = useRef<string>('')
  const [dbPrescription, setDbPrescription] = useState<any>(null)
  const pendingSelectEncounterIdRef = useRef<string>('')

  const [previousPrescriptions, setPreviousPrescriptions] = useState<PreviousPrescriptionOption[]>([])
  const [previousPrescriptionId, setPreviousPrescriptionId] = useState<string>('')
  const [loadingPreviousPrescriptions, setLoadingPreviousPrescriptions] = useState(false)
  const [previousPrescriptionsError, setPreviousPrescriptionsError] = useState<string>('')
  const [openPreviousPrescriptionsDialog, setOpenPreviousPrescriptionsDialog] = useState(false)
  const [printingPreviousPrescriptionId, setPrintingPreviousPrescriptionId] = useState<string>('')

  const [openTemplateDialog, setOpenTemplateDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateTab, setTemplateTab] = useState<'prescriptions' | 'medications' | 'labs' | 'radiology'>('prescriptions')
  const [templateLabPick, setTemplateLabPick] = useState('')
  const [templateRadiologyPick, setTemplateRadiologyPick] = useState('')
  const [templates, setTemplates] = useState<any[]>([])
  const [templatePreview, setTemplatePreview] = useState<any>(null)
  const [openSaveAsTemplateDialog, setOpenSaveAsTemplateDialog] = useState(false)
  const [saveAsTemplateName, setSaveAsTemplateName] = useState('')
  const [savingAsTemplate, setSavingAsTemplate] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string>('')
  const [templateCreateChecks, setTemplateCreateChecks] = useState<Record<string, boolean>>({})
  const [templateCreateOther, setTemplateCreateOther] = useState<string>('')
  const [templateExamOther, setTemplateExamOther] = useState<string>('')
  const [templateRiskOther, setTemplateRiskOther] = useState<string>('')
  const [templateFhOther, setTemplateFhOther] = useState<string>('')
  const [templateSelectOther, setTemplateSelectOther] = useState<string>('')
  const [templateAorticSelected, setTemplateAorticSelected] = useState<string[]>([])
  const [templateAorticOpen, setTemplateAorticOpen] = useState(false)
  const templateAorticRef = useRef<HTMLDivElement | null>(null)
  const [templateNote1, setTemplateNote1] = useState<string>('')
  const [templateNote2, setTemplateNote2] = useState<string>('')
  const [templateAtriumOther, setTemplateAtriumOther] = useState<string>('')
  const [templateMultiSelectRows, setTemplateMultiSelectRows] = useState<string[]>([''])
  const [templateMultiInput, setTemplateMultiInput] = useState<string>('')
  const [templateForm, setTemplateForm] = useState({
    primaryComplaint: '',
    primaryComplaintHistory: '',
    familyHistory: '',
    allergyHistory: '',
    treatmentHistory: '',
    history: '',
    examFindings: '',
    diagnosis: '',
    advice: '',
    meds: [{ name: '', morning: '', noon: '', evening: '', night: '', days: '', qty: '', route: '', instruction: '', durationUnit: 'day(s)', durationText: '', freqText: '' }] as MedicineRow[],
    medicationNotes: '',
    labTestsText: '',
    labNotes: '',
    radiologyTestsText: '',
    radiologyNotes: '',
  })

  const pendingSelectTokenIdRef = useRef<string>('')
  useEffect(() => {
    try {
      const raw = localStorage.getItem('doctor.session')
      const sess = raw ? JSON.parse(raw) : null
      setDoc(sess)
      // Compat: upgrade legacy id to backend id if needed
      const hex24 = /^[a-f\d]{24}$/i
      if (sess && !hex24.test(String(sess.id || ''))) {
        ; (async () => {
          try {
            const res = await hospitalApi.listDoctors() as any
            const docs: any[] = res?.doctors || []
            const match = docs.find(d => String(d.username || '').toLowerCase() === String(sess.username || '').toLowerCase()) ||
              docs.find(d => String(d.name || '').toLowerCase() === String(sess.name || '').toLowerCase())
            if (match) {
              const fixed = { ...sess, id: String(match._id || match.id) }
              try { localStorage.setItem('doctor.session', JSON.stringify(fixed)) } catch { }
              setDoc(fixed)
            }
          } catch { }
        })()
      }
    } catch { }
  }, [])

  useEffect(() => {
    const tokenId = String(searchParams.get('tokenId') || '')
    if (!tokenId) return
    const loadTokenVitals = async () => {
      try {
        const res: any = await hospitalApi.getToken(tokenId)
        const token = res?.token || res
        if (token?.vitals) {
          const vitalsDisplay = toDisplayVitals(token.vitals)
          setForm(f => ({ ...f, vitalsDisplay, vitalsNormalized: token.vitals }))
          setTimeout(() => {
            vitalsRef.current?.setDisplay?.(vitalsDisplay)
          }, 100)
        }
      } catch (e) {
        console.error('Failed to load token vitals:', e)
      }
    }
    loadTokenVitals()
  }, [searchParams])

  useEffect(() => {
    const tokenId = String(searchParams.get('tokenId') || '')
    const date = String(searchParams.get('date') || '')
    const encounterId = String(searchParams.get('encounterId') || '')
    const prescriptionId = String(searchParams.get('prescriptionId') || '')
    if (date) {
      setFrom(date)
      setTo(date)
    } else {
      // Default to today's date range when opening the page without an explicit date.
      // This keeps the header inputs on "Today" and loads today's tokens from backend.
      const today = new Date().toISOString().slice(0, 10)
      setFrom((prev: string) => prev || today)
      setTo((prev: string) => prev || today)
    }
    setEditingPrescriptionId(prescriptionId)
    if (tokenId) {
      pendingSelectTokenIdRef.current = tokenId
    }
    if (encounterId) {
      pendingSelectEncounterIdRef.current = encounterId
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  useEffect(() => {
    if (!editingPrescriptionId) return
    let cancelled = false
      ; (async () => {
        setDbPrescription(null)
        try {
          const res: any = await hospitalApi.getPrescription(editingPrescriptionId)
          const p = res?.prescription
          if (!p || cancelled) return

          // Ensure the patient dropdown shows the edited encounter.
          const encId = String(p?.encounterId?._id || p?.encounterId || '').trim()
          const hex24 = /^[a-f\d]{24}$/i
          const tokenId = encId ? (hex24.test(encId) ? encId : `encounter:${encId}`) : ''
          const patientName = p?.encounterId?.patientId?.fullName || '-'
          const mrNo = p?.encounterId?.patientId?.mrn || '-'
          const tokenNo = (p?.encounterId?.tokenNo ?? p?.encounterId?.tokenNumber ?? p?.encounterId?.token) != null
            ? String(p?.encounterId?.tokenNo ?? p?.encounterId?.tokenNumber ?? p?.encounterId?.token)
            : undefined

          if (tokenId) {
            setHistoryToken({
              id: tokenId,
              createdAt: p?.createdAt || new Date().toISOString(),
              patientName,
              mrNo,
              tokenNo,
              encounterId: encId,
              doctorId: doc?.id,
              doctorName: p?.encounterId?.doctorId?.name || '',
              status: 'completed',
            })
            setForm((f: typeof form) => ({ ...f, patientKey: tokenId }))
          }

          setDbPrescription(p)
          applyPrescriptionToPage(p)
        } catch (e: any) {
          showToast('error', e?.message || 'Failed to load prescription')
        } finally {
          // no-op
        }
      })()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPrescriptionId, doc?.id])

  useEffect(() => { loadTokens(); loadPresIds() }, [doc?.id, from, to])

  useEffect(() => {
    const h = () => { loadTokens(); loadPresIds() }
    window.addEventListener('doctor:pres-saved', h as any)
    return () => window.removeEventListener('doctor:pres-saved', h as any)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id])

  // Bootstrap suggestions from previous prescriptions
  useEffect(() => {
    ; (async () => {
      try {
        if (!doc?.id) return
        const res = await hospitalApi.listPrescriptions({ doctorId: doc.id, page: 1, limit: 200 }) as any
        const rows: any[] = res?.prescriptions || []
        const primaries: string[] = []
        const histories: string[] = []
        const primHist: string[] = []
        const family: string[] = []
        const allergy: string[] = []
        const treatment: string[] = []
        const exams: string[] = []
        const diagnosis: string[] = []
        const advice: string[] = []
        const labTestsAll: string[] = []
        const labNotes: string[] = []
        const diagTestsAll: string[] = []
        const diagNotes: string[] = []
        const doses: string[] = []
        const routes: string[] = []
        const instrs: string[] = []
        const freqs: string[] = []
        const durs: string[] = []
        const vPulse: string[] = []
        const vTemp: string[] = []
        const vSys: string[] = []
        const vDia: string[] = []
        const vResp: string[] = []
        const vSugar: string[] = []
        const vWeight: string[] = []
        const vHeight: string[] = []
        const vSpo2: string[] = []
        for (const r of rows) {
          if (r.primaryComplaint) primaries.push(String(r.primaryComplaint))
          if (r.history) histories.push(String(r.history))
          if (r.primaryComplaintHistory) primHist.push(String(r.primaryComplaintHistory))
          if (r.familyHistory) family.push(String(r.familyHistory))
          if (r.allergyHistory) allergy.push(String(r.allergyHistory))
          if (r.treatmentHistory) treatment.push(String(r.treatmentHistory))
          if (r.examFindings) exams.push(String(r.examFindings))
          if (r.diagnosis) diagnosis.push(String(r.diagnosis))
          if (r.advice) advice.push(String(r.advice))
          if (Array.isArray(r.labTests)) labTestsAll.push(...(r.labTests as any[]).map(x => String(x || '')))
          if (r.labNotes) labNotes.push(String(r.labNotes))
          if (Array.isArray(r.diagnosticTests)) diagTestsAll.push(...(r.diagnosticTests as any[]).map((x: any) => String(x || '')))
          if (r.diagnosticNotes) diagNotes.push(String(r.diagnosticNotes))
          // collect vitals suggestions from previous prescriptions
          try {
            const vv = r.vitals || {}
            if (vv.pulse != null) vPulse.push(String(vv.pulse))
            if (vv.temperatureC != null) vTemp.push(String(vv.temperatureC))
            if (vv.bloodPressureSys != null) vSys.push(String(vv.bloodPressureSys))
            if (vv.bloodPressureDia != null) vDia.push(String(vv.bloodPressureDia))
            if (vv.respiratoryRate != null) vResp.push(String(vv.respiratoryRate))
            if (vv.bloodSugar != null) vSugar.push(String(vv.bloodSugar))
            if (vv.weightKg != null) vWeight.push(String(vv.weightKg))
            if (vv.heightCm != null) vHeight.push(String(vv.heightCm))
            if (vv.spo2 != null) vSpo2.push(String(vv.spo2))
          } catch { }
          try {
            const items = Array.isArray(r.items) ? (r.items as any[]) : []
            for (const it of items) {
              if (it?.dose) doses.push(String(it.dose))
              if (it?.frequency) freqs.push(String(it.frequency))
              if (it?.duration) durs.push(String(it.duration))
              if (it?.notes) {
                const notes = String(it.notes)
                const mRoute = notes.match(/Route:\s*([^;]+)/i)
                const mInstr = notes.match(/Instruction:\s*([^;]+)/i)
                if (mRoute && mRoute[1]) routes.push(mRoute[1].trim())
                if (mInstr && mInstr[1]) instrs.push(mInstr[1].trim())
              }
            }
          } catch { }
        }
        addMany('primaryComplaint', primaries)
        addMany('history', histories)
        addMany('primaryComplaintHistory', primHist)
        addMany('familyHistory', family)
        addMany('allergyHistory', allergy)
        addMany('treatmentHistory', treatment)
        addMany('examFindings', exams)
        addMany('diagnosis', diagnosis)
        addMany('advice', advice)
        addMany('labTest', labTestsAll)
        addMany('labNotes', labNotes)
        addMany('diagTest', diagTestsAll)
        addMany('diagNotes', diagNotes)
        addMany('dose', doses)
        addMany('route', routes)
        addMany('instruction', instrs)
        // frequency choices in UI are normalized; still store historical labels
        addMany('frequencyTag', freqs)
        addMany('durationTag', durs)
        // vitals suggestions
        addMany('vitals.pulse', vPulse)
        addMany('vitals.temperature', vTemp)
        addMany('vitals.sys', vSys)
        addMany('vitals.dia', vDia)
        addMany('vitals.resp', vResp)
        addMany('vitals.sugar', vSugar)
        addMany('vitals.weight', vWeight)
        addMany('vitals.height', vHeight)
        addMany('vitals.spo2', vSpo2)
      } catch { }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id])

  useEffect(() => {
    ; (async () => {
      try {
        if (!doc?.id) { setDoctorInfo(null); return }
        const [drRes, depRes] = await Promise.all([
          hospitalApi.listDoctors() as any,
          hospitalApi.listDepartments() as any,
        ])
        const doctors: any[] = drRes?.doctors || []
        const depArray: any[] = ((depRes as any)?.departments || (depRes as any) || []) as any[]
        const d = doctors.find(x => String(x._id || x.id) === String(doc.id))
        const deptName = d?.primaryDepartmentId ? (depArray.find((z: any) => String(z._id || z.id) === String(d.primaryDepartmentId))?.name || '') : ''
        if (d) setDoctorInfo({ name: d.name || '', specialization: d.specialization || '', phone: d.phone || '', qualification: d.qualification || '', departmentName: deptName })
      } catch { }
    })()
  }, [doc?.id])

  async function loadTokens() {
    try {
      if (!doc?.id) { setTokens([]); return }
      const params: any = { doctorId: doc.id }
      if (from) params.from = from
      if (to) params.to = to
      const res = await hospitalApi.listTokens(params) as any
      const items: Token[] = (res.tokens || []).map((t: any) => ({
        id: t._id,
        createdAt: t.createdAt,
        patientName: t.patientName || '-',
        mrNo: t.mrn || '-',
        tokenNo: (t.tokenNo ?? t.tokenNumber ?? t.token) != null ? String(t.tokenNo ?? t.tokenNumber ?? t.token) : undefined,
        encounterId: String(t.encounterId || ''),
        doctorId: t.doctorId?._id || String(t.doctorId || ''),
        doctorName: t.doctorId?.name || '',
        status: t.status,
      }))
      setTokens(items)
    } catch {
      setTokens([])
    }
  }

  async function loadPresIds() {
    try {
      if (!doc?.id) { setPresEncounterIds([]); return }
      const res = await hospitalApi.listPrescriptions({ doctorId: doc.id, page: 1, limit: 500 }) as any
      const ids: string[] = (res.prescriptions || []).map((p: any) => String(p.encounterId?._id || p.encounterId || ''))
      setPresEncounterIds(ids)
    } catch {
      setPresEncounterIds([])
    }
  }

  const todayKey = new Date().toISOString().slice(0, 10)
  const keyFromCreatedAt = (createdAt?: string) => String(createdAt || '').slice(0, 10)

  const myPatients = useMemo(() => {
    const presSet = new Set(presEncounterIds.filter(Boolean))
    return tokens
      .filter((t: Token) => t.doctorId === doc?.id)
      // Active patients only. Backend may use 'queued' or 'in-progress' for waiting tokens.
      // Filter out terminal states.
      .filter((t: Token) => !t.status || !['completed', 'returned', 'cancelled'].includes(String(t.status)))
      // Default: show today's queued patients. If from/to is set, backend already filtered; don't force today-only.
      .filter((t: Token) => (from || to) ? true : (keyFromCreatedAt(t.createdAt) === todayKey))
      // Completed patients are those whose prescription is submitted; exclude those from queue
      .filter((t: Token) => !t.encounterId || !presSet.has(String(t.encounterId)))
      .sort((a: Token, b: Token) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [tokens, doc, presEncounterIds, todayKey, from, to])

  const patientOptions = useMemo(() => {
    if (historyToken) {
      const exists = myPatients.some((t: Token) => String(t.id) === String(historyToken.id))
      if (!exists) return [historyToken, ...myPatients]
    }
    return myPatients
  }, [myPatients, historyToken])

  const selectedToken = useMemo(() => {
    const sel = patientOptions.find((t: Token) => `${t.id}` === form.patientKey)
    return sel || null
  }, [patientOptions, form.patientKey])

  useEffect(() => {
    const pending = String(pendingSelectTokenIdRef.current || '')
    if (!pending) return
    if (form.patientKey) return
    const exists = myPatients.some((t: Token) => String(t.id) === pending)
    if (!exists) return
    setForm((f: typeof form) => ({ ...f, patientKey: pending }))
    pendingSelectTokenIdRef.current = ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPatients])

  useEffect(() => {
    const encId = String(pendingSelectEncounterIdRef.current || '').trim()
    if (!encId) return
    if (!doc?.id) return
    if (form.patientKey) return

      ; (async () => {
        try {
          const res: any = await hospitalApi.getPrescriptionByEncounter(encId)
          const p = res?.prescription
          const rawTokenId = String(p?.encounterId?._id || p?.encounterId?.id || '')
          const hex24 = /^[a-f\d]{24}$/i
          const tokenId = hex24.test(rawTokenId) ? rawTokenId : `encounter:${encId}`
          const patientName = p?.encounterId?.patientId?.fullName || '-'
          const mrNo = p?.encounterId?.patientId?.mrn || '-'
          const tokenNo = (p?.encounterId?.tokenNo ?? p?.encounterId?.tokenNumber ?? p?.encounterId?.token) != null
            ? String(p?.encounterId?.tokenNo ?? p?.encounterId?.tokenNumber ?? p?.encounterId?.token)
            : undefined
          setHistoryToken({
            id: tokenId,
            createdAt: p?.createdAt || new Date().toISOString(),
            patientName,
            mrNo,
            tokenNo,
            encounterId: encId,
            doctorId: doc.id,
            doctorName: p?.encounterId?.doctorId?.name || '',
            status: 'completed',
          })
          setForm((f: typeof form) => ({ ...f, patientKey: tokenId }))
        } catch {
          // if cannot load, keep normal flow
        } finally {
          pendingSelectEncounterIdRef.current = ''
        }
      })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id, form.patientKey])

  const parseNotesField = (notes?: string) => {
    const raw = String(notes || '')
    const mRoute = raw.match(/Route:\s*([^;]+)/i)
    const mInstr = raw.match(/Instruction:\s*([^;]+)/i)
    return {
      route: mRoute && mRoute[1] ? mRoute[1].trim() : '',
      instruction: mInstr && mInstr[1] ? mInstr[1].trim() : '',
    }
  }

  const toDisplayVitals = (v: any) => {
    const s = (x: any) => (x == null ? '' : String(x))
    if (!v) return {}
    return {
      pulse: s(v.pulse),
      temperature: s(v.temperatureC),
      bloodPressureSys: s(v.bloodPressureSys),
      bloodPressureDia: s(v.bloodPressureDia),
      respiratoryRate: s(v.respiratoryRate),
      bloodSugar: s(v.bloodSugar),
      weightKg: s(v.weightKg),
      height: s(v.heightCm),
      spo2: s(v.spo2),
    }
  }

  const applyPrescriptionToPage = (p: any) => {
    if (!p) return

    const items = Array.isArray(p.items) ? p.items : []
    const meds: MedicineRow[] = items.length ? items.map((it: any) => {
      const parsed = parseNotesField(it?.notes)
      return {
        name: String(it?.name || ''),
        qty: it?.qty != null ? String(it.qty)
          : (it?.dose != null ? String(it.dose) : ''),
        freqText: it?.freqText != null ? String(it.freqText)
          : (it?.frequency != null ? String(it.frequency) : ''),
        durationText: it?.durationText != null ? String(it.durationText)
          : (it?.duration != null ? String(it.duration) : ''),
        durationUnit: it?.durationUnit != null ? String(it.durationUnit) : 'day(s)',
        days: it?.days != null ? String(it.days) : '',
        morning: it?.morning != null ? String(it.morning) : '',
        noon: it?.noon != null ? String(it.noon) : '',
        evening: it?.evening != null ? String(it.evening) : '',
        night: it?.night != null ? String(it.night) : '',
        route: String(it?.route || parsed.route || ''),
        instruction: String(it?.instruction || parsed.instruction || ''),
      }
    }) : [{ name: '', morning: '', noon: '', evening: '', night: '', days: '', qty: '', route: '', instruction: '', durationUnit: 'day(s)', durationText: '', freqText: '' }]

    const vitalsDisplay = toDisplayVitals(p.vitals)
    const diagDisplay = {
      testsText: Array.isArray(p.diagnosticTests) ? p.diagnosticTests.join('\n') : '',
      notes: String(p.diagnosticNotes || ''),
    }

    setDbPrescription(null)
    setForm((f: typeof form) => ({
      ...f,
      primaryComplaint: String(p.primaryComplaint || ''),
      primaryComplaintHistory: String(p.primaryComplaintHistory || ''),
      familyHistory: String(p.familyHistory || ''),
      allergyHistory: String(p.allergyHistory || ''),
      treatmentHistory: String(p.treatmentHistory || ''),
      history: String(p.history || ''),
      examFindings: String(p.examFindings || ''),
      diagnosis: String(p.diagnosis || ''),
      advice: String(p.advice || ''),
      labTestsText: Array.isArray(p.labTests) ? p.labTests.join('\n') : '',
      labNotes: String(p.labNotes || ''),
      medicationNotes: String((p as any).medicationNotes || ''),
      vitalsDisplay,
      vitalsNormalized: p.vitals || {},
      diagDisplay,
      meds,
    }))
    setImprovement(String(p.improvement || ''))
    setFollowupDate(String(p.followupDate || ''))
    setMultiSelectRows(Array.isArray(p.customEntries) ? p.customEntries : [''])
    setAorticSelected(Array.isArray(p.aorticSelected) ? p.aorticSelected : [])
    try {
      const ex = (p as any).detailsExtras || {}
      if (ex && typeof ex === 'object') {
        if (ex.createChecks) setCreateChecks(ex.createChecks)
        if (ex.createOther != null) setCreateOther(String(ex.createOther || ''))
        if (ex.examOther != null) setExamOther(String(ex.examOther || ''))
        if (ex.riskOther != null) setRiskOther(String(ex.riskOther || ''))
        if (ex.fhOther != null) setFhOther(String(ex.fhOther || ''))
        if (ex.selectOther != null) setSelectOther(String(ex.selectOther || ''))
        if (Array.isArray(ex.aorticSelected)) setAorticSelected(ex.aorticSelected)
        if (ex.atriumOther != null) setAtriumOther(String(ex.atriumOther || ''))
        if (ex.note1 != null) setNote1(String(ex.note1 || ''))
        if (ex.note2 != null) setNote2(String(ex.note2 || ''))
      }
    } catch { }
    try { vitalsRef.current?.setDisplay?.(vitalsDisplay) } catch { }
    try { diagRef.current?.setDisplay?.(diagDisplay) } catch { }
    lastSavedKeyRef.current = ''
  }

  useEffect(() => {
    ; (async () => {
      const selected = selectedToken
      if (!selected?.encounterId) return
      if (editingPrescriptionId) return
      setDbPrescription(null)
      try {
        const res: any = await hospitalApi.getPrescriptionByEncounter(selected.encounterId)
        const p = res?.prescription
        if (!p) return
        setDbPrescription(p)
        applyPrescriptionToPage(p)
      } catch {
      } finally {
        // no-op
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.patientKey, selectedToken?.encounterId])

  // Prefill vitals from Reception token if present and no prescription loaded yet
  useEffect(() => {
    ; (async () => {
      const sel = selectedToken
      if (!sel?.id) return
      if (dbPrescription) return
      try {
        const res: any = await hospitalApi.getToken(sel.id)
        const token = res?.token || res
        const v = token?.vitals
        if (!v) return
        const s = (x: any) => (x == null ? '' : String(x))
        const displayVitals = {
          pulse: s(v.pulse),
          temperature: s(v.temperatureC),
          bloodPressureSys: s(v.bloodPressureSys),
          bloodPressureDia: s(v.bloodPressureDia),
          respiratoryRate: s(v.respiratoryRate),
          bloodSugar: s(v.bloodSugar),
          weightKg: s(v.weightKg),
          height: s(v.heightCm),
          spo2: s(v.spo2),
        }
        setForm((f: typeof form) => ({
          ...f,
          vitalsDisplay: displayVitals,
          vitalsNormalized: {
            pulse: v.pulse,
            temperatureC: v.temperatureC,
            bloodPressureSys: v.bloodPressureSys,
            bloodPressureDia: v.bloodPressureDia,
            respiratoryRate: v.respiratoryRate,
            bloodSugar: v.bloodSugar,
            weightKg: v.weightKg,
            heightCm: v.heightCm,
            bmi: v.bmi,
            bsa: v.bsa,
            spo2: v.spo2,
          },
        }))
        try { vitalsRef.current?.setDisplay?.(displayVitals) } catch { }
      } catch { /* ignore missing token or vitals */ }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedToken?.id, dbPrescription])

  useEffect(() => {
    let cancelled = false
    const mrn = String(selectedToken?.mrNo || '').trim()
    setPreviousPrescriptionId('')
    setPreviousPrescriptionsError('')
    setPreviousPrescriptions([])
    if (!mrn) return

      ; (async () => {
        setLoadingPreviousPrescriptions(true)
        try {
          const res: any = await hospitalApi.listPrescriptions({ patientMrn: mrn, page: 1, limit: 50 })
          const rows: any[] = Array.isArray(res?.prescriptions) ? res.prescriptions : []
          const currentEncId = String(selectedToken?.encounterId || '').trim()
          const items: PreviousPrescriptionOption[] = rows
            .map((r: any) => ({
              id: String(r._id || r.id || ''),
              createdAt: String(r.createdAt || ''),
              encounterId: String(r?.encounterId?._id || r?.encounterId || ''),
              diagnosis: r?.diagnosis ? String(r.diagnosis) : '',
              patientName: String(r?.encounterId?.patientId?.fullName || r?.patientName || ''),
              mrn: String(r?.encounterId?.patientId?.mrn || r?.mrNo || ''),
              visitNo: String(r?.encounterId?.visitNo || r?.encounterId?.visitNumber || r?.encounterId?.visitId || ''),
            }))
            .filter(x => x.id)
            .filter(x => !currentEncId || String(x.encounterId || '') !== currentEncId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

          if (cancelled) return
          setPreviousPrescriptions(items)
        } catch (e: any) {
          if (cancelled) return
          setPreviousPrescriptionsError(e?.message || 'Failed to load previous prescriptions')
          setPreviousPrescriptions([])
        } finally {
          if (!cancelled) setLoadingPreviousPrescriptions(false)
        }
      })()

    return () => { cancelled = true }
  }, [selectedToken?.mrNo, selectedToken?.encounterId])

  useEffect(() => {
    if (activeTab !== 'vitals' && activeTab !== 'diagnostics') return
    const t = setInterval(() => {
      if (activeTab === 'vitals') {
        try {
          const disp = vitalsRef.current?.getDisplay?.()
          const norm = vitalsRef.current?.getNormalized?.()
          if (disp) setForm((f: typeof form) => ({ ...f, vitalsDisplay: disp, vitalsNormalized: norm || f.vitalsNormalized }))
        } catch { }
      }
      if (activeTab === 'diagnostics') {
        try {
          const dd = diagRef.current?.getDisplay?.()
          if (dd) setForm((f: typeof form) => ({ ...f, diagDisplay: dd }))
        } catch { }
      }
    }, 600)
    return () => clearInterval(t)
  }, [activeTab])

  // Autosave disabled. Prescription is persisted only when the user clicks Save.
  const setMed = (i: number, key: keyof MedicineRow, value: string) => {
    setForm((f: typeof form) => {
      const next = [...f.meds]
      next[i] = { ...next[i], [key]: value }
      return { ...f, meds: next }
    })
  }

  const setTemplateMed = (i: number, key: keyof MedicineRow, value: string) => {
    setTemplateForm((f: any) => {
      const next = [...(f.meds || [])]
      next[i] = { ...(next[i] as any), [key]: value }
      return { ...f, meds: next as any }
    })
  }

  const addTemplateAfter = (i: number) => {
    setTemplateForm((f: any) => {
      const next = [...(f.meds || [])]
      next.splice(i + 1, 0, { name: '', morning: '', noon: '', evening: '', night: '', days: '', qty: '', route: '', instruction: '', durationUnit: 'day(s)', durationText: '', freqText: '' } as any)
      return { ...f, meds: next as any }
    })
  }

  const removeTemplateAt = (i: number) => {
    setTemplateForm((f: any) => {
      const next = [...(f.meds || [])]
      next.splice(i, 1)
      if (!next.length) next.push({ name: '', morning: '', noon: '', evening: '', night: '', days: '', qty: '', route: '', instruction: '', durationUnit: 'day(s)', durationText: '', freqText: '' } as any)
      return { ...f, meds: next as any }
    })
  }

  const templateAppendToField = (key: 'primaryComplaint' | 'history', value: string) => {
    const v = String(value || '').trim()
    if (!v) return
    setTemplateForm((f: any) => {
      const raw = String((f as any)[key] || '')
      const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
      if (parts.some(p => p.toLowerCase() === v.toLowerCase())) return f as any
      return { ...f, [key]: [...parts, v].join(', ') } as any
    })
  }

  const templateHasInField = (key: 'primaryComplaint' | 'history', value: string) => {
    const v = String(value || '').trim().toLowerCase()
    if (!v) return false
    const raw = String((templateForm as any)[key] || '')
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
    return parts.some(p => p.toLowerCase() === v)
  }

  const templateToggleInField = (key: 'primaryComplaint' | 'history', value: string) => {
    const v = String(value || '').trim()
    if (!v) return
    setTemplateForm((f: any) => {
      const raw = String((f as any)[key] || '')
      const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
      const exists = parts.some(p => p.toLowerCase() === v.toLowerCase())
      const next = exists ? parts.filter(p => p.toLowerCase() !== v.toLowerCase()) : [...parts, v]
      return { ...f, [key]: next.join(', ') } as any
    })
  }

  const templateToggleAortic = (value: string) => {
    const v = String(value || '').trim()
    if (!v) return
    setTemplateAorticSelected((prev: string[]) => {
      const exists = prev.some((x: string) => x.toLowerCase() === v.toLowerCase())
      return exists ? prev.filter((x: string) => x.toLowerCase() !== v.toLowerCase()) : [...prev, v]
    })
    templateAppendToField('history', v)
  }
  // Frequency now textable; we keep morning/noon/evening/night as fallback only

  async function searchMedicines(q: string) {
    try {
      const term = String(q || '').trim()
      if (!term) { setMedNameSuggestions([]); return }

      // 1+ char: show local inventory matches immediately
      const lower = term.toLowerCase()
      const local = (inventoryDrugOptions || [])
        .map((r: { name: string }) => String(r?.name || '').trim())
        .filter(Boolean)
        .filter((n: string) => n.toLowerCase().includes(lower))

      // 2+ chars: also try remote search (if local list doesn't contain the medicine)
      let remote: string[] = []
      if (term.length >= 2) {
        try {
          const res: any = await pharmacyApi.searchMedicines(term)
          remote = Array.isArray(res?.medicines)
            ? res.medicines.map((m: any) => String(m.name || m.genericName || '').trim()).filter(Boolean)
            : (Array.isArray(res)
              ? res.map((m: any) => String(m.name || m.genericName || m || '').trim()).filter(Boolean)
              : [])
        } catch {
          remote = []
        }
      }

      const uniq = Array.from(new Set([...local, ...remote].filter(Boolean)))
      setMedNameSuggestions(uniq.slice(0, 30))
    } catch { setMedNameSuggestions([]) }
  }

  async function loadInventoryDrugs() {
    setLoadingInventoryDrugs(true)
    setInventoryDrugsError('')
    try {
      const limit = 500
      let page = 1
      let totalPages = 1
      const rows: { name: string; onHand?: number; price?: number }[] = []
      const seen = new Set<string>()

      while (page <= totalPages) {
        const res: any = await pharmacyApi.listInventory({ page, limit })
        const items: any[] = Array.isArray(res?.items) ? res.items : []
        totalPages = Number(res?.totalPages || 1)

        for (const it of items) {
          const name = String(it?.name || '').trim()
          if (!name) continue
          const onHand = (it?.onHand != null) ? Number(it.onHand) : undefined
          if (onHand != null && onHand <= 0) continue
          const price = (it?.lastSalePerUnit != null && it?.lastSalePerUnit !== '') ? Number(it.lastSalePerUnit) : undefined
          const key = name.toLowerCase()
          if (seen.has(key)) continue
          seen.add(key)
          rows.push({ name, onHand, price: (price != null && !Number.isNaN(price)) ? price : undefined })
        }

        if (rows.length >= 5000) break
        page += 1
      }

      rows.sort((a, b) => a.name.localeCompare(b.name))
      setInventoryDrugOptions(rows)
      setDrugOptions(rows.map((r: { name: string }) => r.name).slice(0, 200))
    } catch (err: any) {
      setInventoryDrugsError(err?.message || 'Failed to load inventory')
      setInventoryDrugOptions([])
      setDrugOptions([])
    } finally {
      setLoadingInventoryDrugs(false)
    }
  }

  const inventoryDrugByName = useMemo(() => {
    const m = new Map<string, { onHand?: number; price?: number }>()
    for (const it of inventoryDrugOptions) {
      const key = String(it?.name || '').trim().toLowerCase()
      if (!key) continue
      m.set(key, { onHand: it.onHand, price: it.price })
    }
    return m
  }, [inventoryDrugOptions])

  async function filterInventoryDrugs(q: string) {
    const term = String(q || '').trim().toLowerCase()
    if (!term) {
      setDrugOptions(inventoryDrugOptions.map((r: { name: string }) => r.name).slice(0, 200))
      return
    }
    const local = inventoryDrugOptions
      .filter((r: { name: string }) => r.name.toLowerCase().includes(term))
      .map((r: { name: string }) => r.name)
    if (local.length) {
      setDrugOptions(local.slice(0, 200))
      return
    }
    try {
      const res: any = await pharmacyApi.listInventory({ search: term, page: 1, limit: 200 })
      const items: any[] = Array.isArray(res?.items) ? res.items : []
      const names = items
        .map(it => ({ name: String(it?.name || '').trim(), onHand: (it?.onHand != null) ? Number(it.onHand) : undefined }))
        .filter(it => it.name && (it.onHand == null || it.onHand > 0))
        .map(it => it.name)
      setDrugOptions(Array.from(new Set(names)).slice(0, 200))
    } catch {
      setDrugOptions([])
    }
  }

  async function searchPanelMedicines(q: string) {
    const term = String(q || '').trim()
    if (!term) {
      setDrugOptions(inventoryDrugOptions.map((r: { name: string }) => r.name).slice(0, 200))
      return
    }
    const lower = term.toLowerCase()
    const local = inventoryDrugOptions
      .filter((r: { name: string }) => r.name.toLowerCase().includes(lower))
      .map((r: { name: string }) => r.name)
    if (local.length) {
      setDrugOptions(local.slice(0, 200))
      return
    }
    if (term.length < 2) { setDrugOptions([]); return }
    await filterInventoryDrugs(term)
  }

  useEffect(() => {
    if (rightTab !== 'drugs') return
    if (inventoryDrugOptions.length) return
    loadInventoryDrugs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightTab])

  useEffect(() => {
    if (!openAllDrugsDialog) return
    if (inventoryDrugOptions.length) return
    loadInventoryDrugs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAllDrugsDialog])

  useEffect(() => {
    if (activeTab !== 'medications') return
    if (inventoryDrugOptions.length) return
    loadInventoryDrugs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  useEffect(() => {
    if (!openTemplateDialog) return
    if (templateTab !== 'medications') return
    if (inventoryDrugOptions.length) return
    loadInventoryDrugs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTemplateDialog, templateTab])

  async function loadAllLabTests() {
    setLoadingLabTests(true)
    setLabTestsError('')
    try {
      const limit = 500
      let page = 1
      let totalPages = 1
      const rows: string[] = []
      const seen = new Set<string>()

      while (page <= totalPages) {
        const res: any = await labApi.listTests({ page, limit })
        const items: any[] = Array.isArray(res?.items) ? res.items : Array.isArray(res?.tests) ? res.tests : []
        totalPages = Number(res?.totalPages || 1)
        for (const it of items) {
          const name = String(it?.name || it?.title || it || '').trim()
          if (!name) continue
          const key = name.toLowerCase()
          if (seen.has(key)) continue
          seen.add(key)
          rows.push(name)
        }
        if (rows.length >= 5000) break
        page += 1
      }

      rows.sort((a, b) => a.localeCompare(b))
      setAllLabTestOptions(rows)
      setLabTestOptions(rows.slice(0, 200))
    } catch (err: any) {
      setLabTestsError(err?.message || 'Failed to load lab tests')
      setAllLabTestOptions([])
      setLabTestOptions([])
    } finally {
      setLoadingLabTests(false)
    }
  }

  function addLabTestToForm(name: string) {
    const n = String(name || '').trim()
    if (!n) return
    setForm((f: typeof form) => {
      const existing = String((f as any).labTestsText || '')
      const lines = existing.split(/\n|,/).map(s => s.trim()).filter(Boolean)
      const lower = new Set(lines.map(x => x.toLowerCase()))
      if (!lower.has(n.toLowerCase())) lines.push(n)
      return { ...f, labTestsText: lines.join('\n') }
    })
  }

  function addManyLabTestsToForm(names: string[]) {
    const picks = (Array.isArray(names) ? names : []).map(s => String(s || '').trim()).filter(Boolean)
    if (!picks.length) return
    setForm((f: typeof form) => {
      const existing = String((f as any).labTestsText || '')
      const lines = existing.split(/\n|,/).map(s => s.trim()).filter(Boolean)
      const lower = new Set(lines.map(x => x.toLowerCase()))
      for (const n of picks) {
        if (!lower.has(n.toLowerCase())) { lines.push(n); lower.add(n.toLowerCase()) }
      }
      return { ...f, labTestsText: lines.join('\n') }
    })
  }

  function filterLabTests(q: string) {
    const term = String(q || '').trim().toLowerCase()
    if (!term) {
      setLabTestOptions(allLabTestOptions.slice(0, 200))
      return
    }
    const list = allLabTestOptions.filter((t: string) => t.toLowerCase().includes(term))
    setLabTestOptions(list.slice(0, 200))
  }

  useEffect(() => {
    if (rightTab !== 'lab') return
    if (allLabTestOptions.length) return
    loadAllLabTests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightTab])

  useEffect(() => {
    if (!openAllLabTestsDialog) return
    if (allLabTestOptions.length) return
    loadAllLabTests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAllLabTestsDialog])

  useEffect(() => {
    if (!openTemplateDialog) return
    if (templateTab !== 'labs') return
    if (allLabTestOptions.length) return
    loadAllLabTests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTemplateDialog, templateTab])

  async function loadAllRadiologyTests() {
    setLoadingRadiologyTests(true)
    setRadiologyTestsError('')
    try {
      const limit = 500
      let page = 1
      let totalPages = 1
      const rows: string[] = []
      const seen = new Set<string>()

      while (page <= totalPages) {
        const res: any = await diagnosticApi.listTests({ page, limit })
        const items: any[] = Array.isArray(res?.items) ? res.items : Array.isArray(res?.tests) ? res.tests : []
        totalPages = Number(res?.totalPages || 1)
        for (const it of items) {
          const name = String(it?.name || it?.title || it || '').trim()
          if (!name) continue
          const key = name.toLowerCase()
          if (seen.has(key)) continue
          seen.add(key)
          rows.push(name)
        }
        if (rows.length >= 5000) break
        page += 1
      }

      rows.sort((a, b) => a.localeCompare(b))
      setAllRadiologyOptions(rows)
      setRadiologyOptions(rows.slice(0, 200))
    } catch (err: any) {
      setRadiologyTestsError(err?.message || 'Failed to load radiology tests')
      setAllRadiologyOptions([])
      setRadiologyOptions([])
    } finally {
      setLoadingRadiologyTests(false)
    }
  }

  function addRadiologyToForm(name: string) {
    const n = String(name || '').trim()
    if (!n) return
    setForm((f: typeof form) => {
      const prev = String(f.diagDisplay?.testsText || '')
      const lines = prev.split(/\n|,/).map(s => s.trim()).filter(Boolean)
      const lower = new Set(lines.map(x => x.toLowerCase()))
      if (!lower.has(n.toLowerCase())) lines.push(n)
      const nextText = lines.join('\n')
      const next = { ...f, diagDisplay: { ...(f.diagDisplay || {}), testsText: nextText } }
      return next
    })
    try {
      const dd = diagRef.current?.getDisplay?.() || {}
      const prev = String(dd?.testsText || '')
      const lines = prev.split(/\n|,/).map((s: any) => String(s || '').trim()).filter(Boolean)
      const lower = new Set(lines.map((x: any) => String(x).toLowerCase()))
      if (!lower.has(n.toLowerCase())) lines.push(n)
      diagRef.current?.setDisplay?.({ ...dd, testsText: lines.join('\n') })
    } catch { }
  }

  function addManyDiagnosticsToForm(names: string[]) {
    const picks = (Array.isArray(names) ? names : []).map(s => String(s || '').trim()).filter(Boolean)
    if (!picks.length) return
    setForm((f: typeof form) => {
      const prev = String(f.diagDisplay?.testsText || '')
      const lines = prev.split(/\n|,/).map(s => s.trim()).filter(Boolean)
      const lower = new Set(lines.map(x => x.toLowerCase()))
      for (const n of picks) {
        if (!lower.has(n.toLowerCase())) { lines.push(n); lower.add(n.toLowerCase()) }
      }
      const nextText = lines.join('\n')
      return { ...f, diagDisplay: { ...(f.diagDisplay || {}), testsText: nextText } }
    })
    try {
      const dd = diagRef.current?.getDisplay?.() || {}
      const prev = String(dd?.testsText || '')
      const lines = prev.split(/\n|,/).map((s: any) => String(s || '').trim()).filter(Boolean)
      const lower = new Set(lines.map((x: any) => String(x).toLowerCase()))
      for (const n of picks) {
        if (!lower.has(n.toLowerCase())) { lines.push(n); lower.add(n.toLowerCase()) }
      }
      diagRef.current?.setDisplay?.({ ...dd, testsText: lines.join('\n') })
    } catch { }
  }

  function filterRadiology(q: string) {
    const term = String(q || '').trim().toLowerCase()
    if (!term) {
      setRadiologyOptions(allRadiologyOptions.slice(0, 200))
      return
    }
    const list = allRadiologyOptions.filter((t: string) => t.toLowerCase().includes(term))
    setRadiologyOptions(list.slice(0, 200))
  }

  useEffect(() => {
    if (rightTab !== 'radiology') return
    if (allRadiologyOptions.length) return
    loadAllRadiologyTests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightTab])

  useEffect(() => {
    if (!openAllDiagnosticsDialog) return
    if (allRadiologyOptions.length) return
    loadAllRadiologyTests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAllDiagnosticsDialog])

  useEffect(() => {
    if (!openTemplateDialog) return
    if (templateTab !== 'radiology') return
    if (allRadiologyOptions.length) return
    loadAllRadiologyTests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTemplateDialog, templateTab])

  useEffect(() => {
    const el = rightTabsRef.current
    if (!el) return
    const calc = () => {
      const hasOverflow = el.scrollWidth > el.clientWidth + 2
      const hasMoreLeft = el.scrollLeft > 2
      const hasMoreRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
      setShowRightTabsPrev(hasOverflow && hasMoreLeft)
      setShowRightTabsNext(hasOverflow && hasMoreRight)
    }
    calc()
    const onResize = () => calc()
    window.addEventListener('resize', onResize)
    const onScroll = () => calc()
    el.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('resize', onResize)
      el.removeEventListener('scroll', onScroll)
    }
  }, [rightTab])

  function scrollRightTabsPrev() {
    const el = rightTabsRef.current
    if (!el) return
    el.scrollBy({ left: -Math.max(120, Math.floor(el.clientWidth * 0.7)), behavior: 'smooth' })
  }

  function scrollRightTabsNext() {
    const el = rightTabsRef.current
    if (!el) return
    el.scrollBy({ left: Math.max(120, Math.floor(el.clientWidth * 0.7)), behavior: 'smooth' })
  }

  const addDrugToMeds = (name: string) => {
    const n = String(name || '').trim()
    if (!n) return
    setForm((f: typeof form) => {
      const next = [...f.meds]
      const idx = next.findIndex((r: MedicineRow) => !(r.name || '').trim())
      if (idx >= 0) next[idx] = { ...next[idx], name: n }
      else next.push({ name: n, morning: '', noon: '', evening: '', night: '', days: '', qty: '', route: '', instruction: '', durationUnit: 'day(s)', durationText: '', freqText: '' })
      return { ...f, meds: next }
    })
  }

  const addManyDrugsToMeds = (names: string[]) => {
    const picks = (Array.isArray(names) ? names : [])
      .map(s => String(s || '').trim())
      .filter(Boolean)
    if (!picks.length) return
    setForm((f: typeof form) => {
      const next = [...(Array.isArray(f.meds) ? f.meds : [])]
      const existing = new Set(next.map((r: any) => String(r?.name || '').trim().toLowerCase()).filter(Boolean))
      for (const n of picks) {
        const key = n.toLowerCase()
        if (existing.has(key)) continue
        const idx = next.findIndex((r: any) => !(r?.name || '').trim())
        if (idx >= 0) next[idx] = { ...next[idx], name: n }
        else next.push({ name: n, morning: '', noon: '', evening: '', night: '', days: '', qty: '', route: '', instruction: '', durationUnit: 'day(s)', durationText: '', freqText: '' })
        existing.add(key)
      }
      return { ...f, meds: next }
    })
  }

  const filteredAllDrugs = useMemo(() => {
    const q = String(allDrugsQuery || '').trim().toLowerCase()
    const rows = Array.isArray(inventoryDrugOptions) ? inventoryDrugOptions : []
    if (!q) return rows
    return rows.filter((r: any) => String(r?.name || '').toLowerCase().includes(q))
  }, [allDrugsQuery, inventoryDrugOptions])

  const medsNameLowerSet = useMemo(() => {
    const s = new Set<string>()
    try {
      const rows = Array.isArray((form as any)?.meds) ? (form as any).meds : []
      for (const r of rows) {
        const name = String(r?.name || '').trim().toLowerCase()
        if (name) s.add(name)
      }
    } catch { }
    return s
  }, [form.meds])

  const drugPickOptions = useMemo(() => {
    const rows = Array.isArray(drugOptions) ? drugOptions : []
    return rows.filter((d: any) => {
      const name = String(d || '').trim()
      if (!name) return false
      return !medsNameLowerSet.has(name.toLowerCase())
    })
  }, [drugOptions, medsNameLowerSet])
  const addAfter = (i: number) => {
    setForm((f: typeof form) => {
      const next = [...f.meds]
      next.splice(i + 1, 0, { name: '', morning: '', noon: '', evening: '', night: '', days: '', qty: '', route: '', instruction: '', durationUnit: 'day(s)', durationText: '', freqText: '' })
      return { ...f, meds: next }
    })
  }

  const resetTemplateDialog = () => {
    setEditingTemplateId('')
    setTemplateName('')
    setTemplateTab('prescriptions')
    setTemplateLabPick('')
    setTemplateRadiologyPick('')
    setTemplateCreateChecks({})
    setTemplateCreateOther('')
    setTemplateExamOther('')
    setTemplateRiskOther('')
    setTemplateFhOther('')
    setTemplateSelectOther('')
    setTemplateAorticSelected([])
    setTemplateAorticOpen(false)
    setTemplateNote1('')
    setTemplateNote2('')
    setTemplateAtriumOther('')
    setTemplateMultiSelectRows([''])
    setTemplateMultiInput('')
    setTemplateForm({
      primaryComplaint: '',
      primaryComplaintHistory: '',
      familyHistory: '',
      allergyHistory: '',
      treatmentHistory: '',
      history: '',
      examFindings: '',
      diagnosis: '',
      advice: '',
      meds: [{ name: '', morning: '', noon: '', evening: '', night: '', days: '', qty: '', route: '', instruction: '', durationUnit: 'day(s)', durationText: '', freqText: '' }] as any,
      medicationNotes: '',
      labTestsText: '',
      labNotes: '',
      radiologyTestsText: '',
      radiologyNotes: '',
    } as any)
  }

  const loadTemplates = async (params?: { q?: string }) => {
    try {
      if (!doc?.id) return
      const res: any = await hospitalApi.listDoctorTemplates(String(doc.id), { q: params?.q })
      let rows: any[] = Array.isArray(res?.templates) ? res.templates : []
      setTemplates(rows)
    } catch {
      setTemplates([])
    }
  }

  const saveTemplate = async () => {
    try {
      const name = String(templateName || '').trim()
      if (!name) { alert('Template Name is required'); return }
      if (!doc?.id) { alert('Doctor session missing'); return }

      const data = {
        templateForm,
        templateCreateChecks,
        templateCreateOther,
        templateExamOther,
        templateRiskOther,
        templateFhOther,
        templateSelectOther,
        templateAorticSelected,
        templateNote1,
        templateNote2,
        templateAtriumOther,
        templateMultiSelectRows,
        templateMultiInput,
      }

      if (editingTemplateId) {
        await hospitalApi.updateDoctorTemplate(String(doc.id), String(editingTemplateId), { name, data })
      } else {
        await hospitalApi.createDoctorTemplate(String(doc.id), { name, data })
      }

      await loadTemplates({ q: String(templateQuery || '').trim() || undefined })
      setOpenTemplateDialog(false)
      resetTemplateDialog()
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg.includes('409') || msg.toLowerCase().includes('already exists')) {
        alert('Template name already exists')
      } else {
        alert(e?.message || 'Failed to save template')
      }
    }
  }

  const openEditTemplate = (t: any) => {
    const data = t?.data || {}
    setEditingTemplateId(String(t?._id || ''))
    setTemplateName(String(t?.name || ''))
    setTemplateTab('prescriptions')
    setTemplateLabPick('')
    setTemplateRadiologyPick('')
    setTemplateCreateChecks(data?.templateCreateChecks || {})
    setTemplateCreateOther(String(data?.templateCreateOther || ''))
    setTemplateExamOther(String(data?.templateExamOther || ''))
    setTemplateRiskOther(String(data?.templateRiskOther || ''))
    setTemplateFhOther(String(data?.templateFhOther || ''))
    setTemplateSelectOther(String(data?.templateSelectOther || ''))
    setTemplateAorticSelected(Array.isArray(data?.templateAorticSelected) ? data.templateAorticSelected : [])
    setTemplateNote1(String(data?.templateNote1 || ''))
    setTemplateNote2(String(data?.templateNote2 || ''))
    setTemplateAtriumOther(String(data?.templateAtriumOther || ''))
    setTemplateMultiSelectRows(Array.isArray(data?.templateMultiSelectRows) ? data.templateMultiSelectRows : [''])
    setTemplateMultiInput(String(data?.templateMultiInput || ''))
    setTemplateForm({
      ...(data?.templateForm || {}),
      meds: Array.isArray(data?.templateForm?.meds) && data.templateForm.meds.length ? data.templateForm.meds : [{ name: '', morning: '', noon: '', evening: '', night: '', days: '', qty: '', route: '', instruction: '', durationUnit: 'day(s)', durationText: '', freqText: '' }],
    })
    setOpenTemplateDialog(true)
  }

  const applyTemplateToPrescription = (t: any, mode: 'append' | 'replace' = 'append') => {
    try {
      const data = t?.data || {}
      const tf = data?.templateForm || {}

      const toUniqueLines = (raw: any) => {
        const lines = String(raw || '')
          .split(/\r?\n|,/)
          .map(s => s.trim())
          .filter(Boolean)
        const seen = new Set<string>()
        const out: string[] = []
        for (const l of lines) {
          const k = l.toLowerCase()
          if (seen.has(k)) continue
          seen.add(k)
          out.push(l)
        }
        return out
      }

      const mergeText = (cur: any, incoming: any) => {
        const a = String(cur || '').trim()
        const b = String(incoming || '').trim()
        if (!a) return b
        if (!b) return a
        if (a.toLowerCase() === b.toLowerCase()) return a
        return `${a}\n${b}`
      }

      const mergeTrueMap = (cur: Record<string, boolean>, incoming: Record<string, boolean>) => {
        const out: Record<string, boolean> = { ...(cur || {}) }
        const inc = incoming || {}
        for (const k of Object.keys(inc)) {
          if (inc[k]) out[k] = true
        }
        return out
      }

      const unionStrings = (cur: any, incoming: any) => {
        const a = Array.isArray(cur) ? cur : []
        const b = Array.isArray(incoming) ? incoming : []
        const seen = new Set<string>()
        const out: string[] = []
        for (const x of [...a, ...b]) {
          const v = String(x || '').trim()
          if (!v) continue
          const k = v.toLowerCase()
          if (seen.has(k)) continue
          seen.add(k)
          out.push(v)
        }
        return out
      }

      const mergeMeds = (cur: any[], incoming: any[]) => {
        const safeCur = Array.isArray(cur) ? cur : []
        const safeInc = Array.isArray(incoming) ? incoming : []
        const existing = new Set<string>()
        for (const r of safeCur) {
          const n = String(r?.name || '').trim().toLowerCase()
          if (n) existing.add(n)
        }
        const added = safeInc.filter(r => {
          const n = String(r?.name || '').trim().toLowerCase()
          if (!n) return false
          return !existing.has(n)
        })
        const out = [...safeCur, ...added]
        return out.length ? out : [{ name: '', morning: '', noon: '', evening: '', night: '', days: '', qty: '', route: '', instruction: '', durationUnit: 'day(s)', durationText: '', freqText: '' }]
      }

      const mergeLinesField = (cur: any, incoming: any) => {
        const merged = [...toUniqueLines(cur), ...toUniqueLines(incoming)]
        // unique again after concat
        const seen = new Set<string>()
        const out: string[] = []
        for (const l of merged) {
          const k = l.toLowerCase()
          if (seen.has(k)) continue
          seen.add(k)
          out.push(l)
        }
        return out.join('\n')
      }

      const incChecks = (data?.templateCreateChecks || {}) as Record<string, boolean>
      setCreateChecks((prev: Record<string, boolean>) => (mode === 'replace' ? incChecks : mergeTrueMap(prev || {}, incChecks)))
      setCreateOther((prev: string) => (mode === 'replace' ? String(data?.templateCreateOther || '') : mergeText(prev, data?.templateCreateOther)))
      setExamOther((prev: string) => (mode === 'replace' ? String(data?.templateExamOther || '') : mergeText(prev, data?.templateExamOther)))
      setRiskOther((prev: string) => (mode === 'replace' ? String(data?.templateRiskOther || '') : mergeText(prev, data?.templateRiskOther)))
      setFhOther((prev: string) => (mode === 'replace' ? String(data?.templateFhOther || '') : mergeText(prev, data?.templateFhOther)))
      setSelectOther((prev: string) => (mode === 'replace' ? String(data?.templateSelectOther || '') : mergeText(prev, data?.templateSelectOther)))
      const incAortic = Array.isArray(data?.templateAorticSelected) ? data.templateAorticSelected : []
      setAorticSelected((prev: string[]) => (mode === 'replace' ? incAortic : unionStrings(prev, incAortic)))
      setNote1((prev: string) => (mode === 'replace' ? String(data?.templateNote1 || '') : mergeText(prev, data?.templateNote1)))
      setNote2((prev: string) => (mode === 'replace' ? String(data?.templateNote2 || '') : mergeText(prev, data?.templateNote2)))
      setAtriumOther((prev: string) => (mode === 'replace' ? String(data?.templateAtriumOther || '') : mergeText(prev, data?.templateAtriumOther)))
      const incMultiRows = Array.isArray(data?.templateMultiSelectRows) ? data.templateMultiSelectRows : ['']
      setMultiSelectRows((prev: string[]) => (mode === 'replace' ? incMultiRows : unionStrings(prev, incMultiRows)))
      setMultiInput((prev: string) => (mode === 'replace' ? String(data?.templateMultiInput || '') : mergeText(prev, data?.templateMultiInput)))

      const meds = Array.isArray(tf?.meds) && tf.meds.length ? tf.meds : [{ name: '', morning: '', noon: '', evening: '', night: '', days: '', qty: '', route: '', instruction: '', durationUnit: 'day(s)', durationText: '', freqText: '' }]

      setForm((f: any) => ({
        ...f,
        primaryComplaint: mode === 'replace' ? String(tf?.primaryComplaint || '') : mergeText(f?.primaryComplaint, tf?.primaryComplaint),
        primaryComplaintHistory: mode === 'replace' ? String(tf?.primaryComplaintHistory || '') : mergeText(f?.primaryComplaintHistory, tf?.primaryComplaintHistory),
        familyHistory: mode === 'replace' ? String(tf?.familyHistory || '') : mergeText(f?.familyHistory, tf?.familyHistory),
        allergyHistory: mode === 'replace' ? String(tf?.allergyHistory || '') : mergeText(f?.allergyHistory, tf?.allergyHistory),
        treatmentHistory: mode === 'replace' ? String(tf?.treatmentHistory || '') : mergeText(f?.treatmentHistory, tf?.treatmentHistory),
        history: mode === 'replace' ? String(tf?.history || '') : mergeText(f?.history, tf?.history),
        examFindings: mode === 'replace' ? String(tf?.examFindings || '') : mergeText(f?.examFindings, tf?.examFindings),
        diagnosis: mode === 'replace' ? String(tf?.diagnosis || '') : mergeText(f?.diagnosis, tf?.diagnosis),
        advice: mode === 'replace' ? String(tf?.advice || '') : mergeText(f?.advice, tf?.advice),
        meds: mode === 'replace' ? meds : mergeMeds(f?.meds || [], meds),
        labTestsText: mode === 'replace' ? String(tf?.labTestsText || '') : mergeLinesField(f?.labTestsText, tf?.labTestsText),
        labNotes: mode === 'replace' ? String(tf?.labNotes || '') : mergeText(f?.labNotes, tf?.labNotes),
        medicationNotes: mode === 'replace' ? String(tf?.medicationNotes || '') : mergeText(f?.medicationNotes, tf?.medicationNotes),
        diagDisplay: {
          ...(f?.diagDisplay || { testsText: '', notes: '' }),
          testsText: mode === 'replace' ? String(tf?.radiologyTestsText || '') : mergeLinesField(f?.diagDisplay?.testsText, tf?.radiologyTestsText),
          notes: mode === 'replace' ? String(tf?.radiologyNotes || '') : mergeText(f?.diagDisplay?.notes, tf?.radiologyNotes),
        },
      }))

      try {
        const nextTests = mode === 'replace'
          ? String(tf?.radiologyTestsText || '')
          : mergeLinesField((form as any)?.diagDisplay?.testsText, tf?.radiologyTestsText)
        const nextNotes = mode === 'replace'
          ? String(tf?.radiologyNotes || '')
          : mergeText((form as any)?.diagDisplay?.notes, tf?.radiologyNotes)
        diagRef.current?.setDisplay?.({ testsText: nextTests, notes: nextNotes })
      } catch { }

      try {
        setActiveTab('details')
        setRightTab('drugs')
        showToast('success', `Template ${mode === 'replace' ? 'replaced' : 'applied'}${t?.name ? `: ${String(t.name)}` : ''}`)
      } catch { }
    } catch { }
  }

  const saveCurrentAsTemplate = async (templateName: string) => {
    try {
      if (!doc?.id) { alert('Doctor session missing'); return }
      const name = String(templateName || '').trim()
      if (!name) { alert('Template name is required'); return }

      setSavingAsTemplate(true)

      const data = {
        templateForm: {
          primaryComplaint: String(form.primaryComplaint || ''),
          primaryComplaintHistory: String(form.primaryComplaintHistory || ''),
          familyHistory: String(form.familyHistory || ''),
          allergyHistory: String(form.allergyHistory || ''),
          treatmentHistory: String(form.treatmentHistory || ''),
          history: String(form.history || ''),
          examFindings: String(form.examFindings || ''),
          diagnosis: String(form.diagnosis || ''),
          advice: String(form.advice || ''),
          meds: Array.isArray(form.meds) && form.meds.length ? form.meds : [{ name: '', morning: '', noon: '', evening: '', night: '', days: '', qty: '', route: '', instruction: '', durationUnit: 'day(s)', durationText: '', freqText: '' }],
          medicationNotes: String(form.medicationNotes || ''),
          labTestsText: String(form.labTestsText || ''),
          labNotes: String(form.labNotes || ''),
          radiologyTestsText: String((form as any)?.diagDisplay?.testsText || ''),
          radiologyNotes: String((form as any)?.diagDisplay?.notes || ''),
        },
        templateCreateChecks: createChecks,
        templateCreateOther,
        templateExamOther,
        templateRiskOther,
        templateFhOther,
        templateSelectOther: selectOther,
        templateAorticSelected: aorticSelected,
        templateNote1: note1,
        templateNote2: note2,
        templateAtriumOther: atriumOther,
        templateMultiSelectRows: multiSelectRows,
        templateMultiInput: multiInput,
      }

      await hospitalApi.createDoctorTemplate(String(doc.id), { name, data })
      await loadTemplates({ q: String(templateQuery || '').trim() || undefined })
      showToast('success', 'Template saved')
      setRightTab('templates')
      setOpenSaveAsTemplateDialog(false)
      setSaveAsTemplateName('')
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg.includes('409') || msg.toLowerCase().includes('already exists')) {
        alert('Template name already exists')
      } else {
        alert(e?.message || 'Failed to save template')
      }
    } finally {
      setSavingAsTemplate(false)
    }
  }

  const openSaveAsTemplate = () => {
    if (!doc?.id) { alert('Doctor session missing'); return }
    setSaveAsTemplateName('')
    setOpenSaveAsTemplateDialog(true)
  }

  const deleteTemplate = async (id: string) => {
    try {
      if (!doc?.id) { alert('Doctor session missing'); return }
      await hospitalApi.deleteDoctorTemplate(String(doc.id), String(id))
      await loadTemplates({ q: String(templateQuery || '').trim() || undefined })
    } catch (e: any) {
      alert(e?.message || 'Failed to delete template')
    }
  }

  const requestDeleteTemplate = (t: any) => {
    setDeleteTemplateId(String(t?._id || ''))
    setDeleteTemplateName(String(t?.name || ''))
    setOpenDeleteTemplateDialog(true)
  }

  useEffect(() => {
    if (rightTab !== 'templates') return
    loadTemplates({ q: String(templateQuery || '').trim() || undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightTab])

  useEffect(() => {
    if (rightTab !== 'templates') return
    const t = setTimeout(() => {
      loadTemplates({ q: String(templateQuery || '').trim() || undefined })
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateQuery])

  function parseNumberAndUnit(raw: string, opts: { defaultUnit: string; allowedUnits: string[] }) {
    const s = String(raw || '').trim()
    const match = s.match(/^(\d+(?:\.\d+)?)\s*(.*)$/)
    const num = match?.[1] || ''
    const tail = String(match?.[2] || '').trim()
    const allowed = opts.allowedUnits || []
    const unitFromTail = tail && allowed.some(u => u.toLowerCase() === tail.toLowerCase())
      ? allowed.find(u => u.toLowerCase() === tail.toLowerCase()) || tail
      : ''

    return {
      num,
      unit: unitFromTail || opts.defaultUnit,
    }
  }

  function combineNumberAndUnit(num: string, unit: string) {
    const n = String(num || '').trim()
    const u = String(unit || '').trim()
    if (!n) return ''
    return `${n} ${u}`.trim()
  }

  const mergeTextOnce = (cur: any, incoming: any, joiner: string = '\n') => {
    const a = String(cur || '').trim()
    const b = String(incoming || '').trim()
    if (!a) return b
    if (!b) return a
    if (a.toLowerCase().includes(b.toLowerCase())) return a
    return `${a}${joiner}${b}`
  }

  const appendLabeledLineOnce = (cur: any, label: string, value: any) => {
    const v = String(value || '').trim()
    if (!v) return String(cur || '').trim()
    const line = `${label}: ${v}`
    return mergeTextOnce(cur, line, '\n')
  }
  const removeAt = (i: number) => {
    setForm((f: typeof form) => {
      if (f.meds.length <= 1) return f
      const next = f.meds.filter((_: MedicineRow, idx: number) => idx !== i)
      return { ...f, meds: next }
    })
  }
  const save = async (e: FormEvent) => {
    e.preventDefault()
    const sel = selectedToken

    if (!doc || !sel || !sel.encounterId) { showToast('error', 'Select a patient first'); return }
    const items = (form.meds || [])
      .filter((m: MedicineRow) => (m.name || '').trim())
      .map((m: MedicineRow) => ({
        name: String(m.name).trim(),
        dose: m.qty ? String(m.qty).trim() : undefined,
        frequency: (m.freqText && m.freqText.trim()) ? m.freqText.trim() : (['morning', 'noon', 'evening', 'night'].map((k: string) => (m as any)[k]).filter(Boolean).join('/ ') || undefined),
        duration: (m.durationText && m.durationText.trim()) ? m.durationText.trim() : (m.days ? `${m.days} ${m.durationUnit || 'day(s)'}` : undefined),
        notes: (m.route || m.instruction) ? [m.route ? `Route: ${m.route}` : null, m.instruction ? `Instruction: ${m.instruction}` : null].filter(Boolean).join('; ') : undefined,
        // Do not persist total qty as per-dose; leave it undefined to let renderer compute.
        freqText: (m as any).freqText ? String((m as any).freqText).trim() : undefined,
        durationText: (m as any).durationText ? String((m as any).durationText).trim() : undefined,
        durationUnit: (m as any).durationUnit ? String((m as any).durationUnit).trim() : undefined,
        days: (m as any).days ? String((m as any).days).trim() : undefined,
        morning: (m as any).morning ? String((m as any).morning).trim() : undefined,
        noon: (m as any).noon ? String((m as any).noon).trim() : undefined,
        evening: (m as any).evening ? String((m as any).evening).trim() : undefined,
        night: (m as any).night ? String((m as any).night).trim() : undefined,
        route: m.route ? String(m.route).trim() : undefined,
        instruction: m.instruction ? String(m.instruction).trim() : undefined,
      }))
    const labTests = form.labTestsText.split(/\n|,/).map((s: string) => s.trim()).filter(Boolean)
    try {
      const mergedPrimaryComplaint = mergeTextOnce(form.primaryComplaint, createOther, ', ')
      const mergedExamFindings = mergeTextOnce(form.examFindings, examOther, '\n')
      let mergedHistory = String(form.history || '')
      mergedHistory = appendLabeledLineOnce(mergedHistory, 'Risk', riskOther)
      mergedHistory = appendLabeledLineOnce(mergedHistory, 'Family History', fhOther)
      mergedHistory = appendLabeledLineOnce(mergedHistory, 'Other', selectOther)
      mergedHistory = appendLabeledLineOnce(mergedHistory, 'Atrium', atriumOther)
      mergedHistory = appendLabeledLineOnce(mergedHistory, 'Note 1', note1)
      mergedHistory = appendLabeledLineOnce(mergedHistory, 'Note 2', note2)

      let vRaw = undefined as any
      try { vRaw = vitalsRef.current?.getNormalized?.() } catch { }
      const hasVitals = vRaw && Object.values(vRaw).some(x => x != null && !(typeof x === 'number' && isNaN(x)))
      let vitals: any = undefined
      if (hasVitals) vitals = vRaw
      else if (Object.keys((form as any).vitalsNormalized || {}).length) vitals = (form as any).vitalsNormalized
      else if ((form as any).vitalsDisplay && Object.values((form as any).vitalsDisplay).some(Boolean)) {
        const d: any = (form as any).vitalsDisplay
        const n = (x?: any) => { const v = parseFloat(String(x || '').trim()); return isFinite(v) ? v : undefined }
        vitals = {
          pulse: n(d.pulse),
          temperatureC: n(d.temperature),
          bloodPressureSys: n(d.bloodPressureSys),
          bloodPressureDia: n(d.bloodPressureDia),
          respiratoryRate: n(d.respiratoryRate),
          bloodSugar: n(d.bloodSugar),
          weightKg: n(d.weightKg),
          heightCm: n(d.height),
          spo2: n(d.spo2),
        }
      }
      const dRaw = diagRef.current?.getData?.()
      const diagnosticTests = Array.isArray(dRaw?.tests) && dRaw?.tests?.length ? dRaw?.tests : undefined
      const diagnosticNotes = dRaw?.notes || undefined
      const detailsExtras: any = {
        createChecks,
        createOther,
        examOther,
        riskOther,
        fhOther,
        selectOther,
        atriumOther,
        note1,
        note2,
      }
      await hospitalApi.upsertPrescriptionByEncounter(sel.encounterId, {
        items,
        labTests: labTests.length ? labTests : [],
        labNotes: form.labNotes || undefined,
        medicationNotes: (form as any).medicationNotes || undefined,
        diagnosticTests: diagnosticTests || [],
        diagnosticNotes,
        primaryComplaint: mergedPrimaryComplaint || undefined,
        primaryComplaintHistory: form.primaryComplaintHistory || undefined,
        familyHistory: form.familyHistory || undefined,
        allergyHistory: form.allergyHistory || undefined,
        treatmentHistory: form.treatmentHistory || undefined,
        history: stripImprovementFollowupFromHistory(mergedHistory) || undefined,
        examFindings: mergedExamFindings || undefined,
        diagnosis: form.diagnosis || undefined,
        advice: form.advice || undefined,
        improvement: improvement || undefined,
        followupDate: followupDate || undefined,
        customEntries: (multiSelectRows || []).map(s => String(s || '').trim()).filter(Boolean),
        aorticSelected: (aorticSelected || []).map(s => String(s || '').trim()).filter(Boolean),
        detailsExtras,
        vitals,
      })

      try {
        const hex24 = /^[a-f\d]{24}$/i
        if (sel?.id && hex24.test(String(sel.id))) await hospitalApi.updateTokenStatus(sel.id, 'completed')
      } catch { }

      // Save new suggestions locally
      addOne('primaryComplaint', form.primaryComplaint)
      addOne('history', form.history)
      addOne('primaryComplaintHistory', form.primaryComplaintHistory)
      addOne('familyHistory', form.familyHistory)
      addOne('allergyHistory', form.allergyHistory)
      addOne('treatmentHistory', form.treatmentHistory)
      addOne('examFindings', form.examFindings)
      addOne('diagnosis', form.diagnosis)
      addOne('advice', form.advice)
      addMany('labTest', labTests)
      addOne('labNotes', form.labNotes)
      try {
        for (const m of form.meds || []) {
          if (m.qty) addOne('dose', m.qty)
          if (m.instruction) addOne('instruction', m.instruction)
          if (m.route) addOne('route', m.route)
        }
      } catch { }
      try { window.dispatchEvent(new CustomEvent('doctor:pres-saved')) } catch { }
      try { showToast('success', 'Prescription saved') } catch { }
      setSaved(true)
      setForm({ patientKey: '', primaryComplaint: '', primaryComplaintHistory: '', familyHistory: '', allergyHistory: '', treatmentHistory: '', history: '', examFindings: '', diagnosis: '', advice: '', labTestsText: '', labNotes: '', medicationNotes: '', vitalsDisplay: {}, vitalsNormalized: {}, diagDisplay: { testsText: '', notes: '' }, meds: [{ name: '', morning: '', noon: '', evening: '', night: '', qty: '', route: '', instruction: '', durationText: '', freqText: '' }] })
      try { vitalsRef.current?.setDisplay?.({}) } catch { }
      try { diagRef.current?.setDisplay?.({ testsText: '', notes: '' }) } catch { }
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      try { showToast('error', err?.message || 'Failed to save prescription') } catch { alert(err?.message || 'Failed to save prescription') }
    }
  }

  const goTab = (tab: 'details' | 'medications' | 'vitals' | 'labs' | 'diagnostics') => {
    if (activeTab === 'vitals') {
      try {
        const disp = vitalsRef.current?.getDisplay?.()
        const norm = vitalsRef.current?.getNormalized?.()
        setForm((f: typeof form) => ({ ...f, vitalsDisplay: disp || f.vitalsDisplay, vitalsNormalized: norm || f.vitalsNormalized }))
      } catch { }
    }
    if (activeTab === 'diagnostics') {
      try {
        const dd = diagRef.current?.getDisplay?.()
        if (dd) setForm((f: typeof form) => ({ ...f, diagDisplay: dd }))
      } catch { }
    }
    setActiveTab(tab)
  }

  // Removed unused quick referral helpers to satisfy linter

  async function referToPharmacyQuick() {
    const sel = selectedToken
    if (!doc?.id || !sel?.encounterId) { showToast('error', 'Select a patient first'); return }
    try {
      const items = (form.meds || [])
        .filter((m: MedicineRow) => (m.name || '').trim())
        .map((m: MedicineRow) => ({
          name: String(m.name).trim(),
          dose: m.qty ? String(m.qty).trim() : undefined,
          frequency: (m.freqText && m.freqText.trim()) ? m.freqText.trim() : (['morning', 'noon', 'evening', 'night'].map((k: string) => (m as any)[k]).filter(Boolean).join('/ ') || undefined),
          duration: (m.durationText && m.durationText.trim()) ? m.durationText.trim() : (m.days ? `${m.days} ${m.durationUnit || 'day(s)'}` : undefined),
          notes: (m.route || m.instruction) ? [m.route ? `Route: ${m.route}` : null, m.instruction ? `Instruction: ${m.instruction}` : null].filter(Boolean).join('; ') : undefined,
        }))
      if (!items.length) { showToast('error', 'Please add medicines first'); return }

      // Ensure prescription exists so Pharmacy can open intake
      await hospitalApi.upsertPrescriptionByEncounter(sel.encounterId, {
        items,
        medicationNotes: (form as any).medicationNotes || undefined,
      })
      const presRes: any = await hospitalApi.getPrescriptionByEncounter(sel.encounterId)
      const presId = String(presRes?.prescription?._id || presRes?.prescription?.id || '')
      if (!presId) { showToast('error', 'Failed to resolve prescription'); return }

      const notes = String((form as any).medicationNotes || '').trim() || undefined
      await hospitalApi.createReferral({ type: 'pharmacy', encounterId: sel.encounterId, doctorId: doc.id, prescriptionId: presId, notes })
      showToast('success', 'Pharmacy referral created')
    } catch (e: any) {
      showToast('error', e?.message || 'Failed to create pharmacy referral')
    }
  }

  const sel = selectedToken

  // Suggestions: store per-doctor in localStorage
  const keyFor = (name: string) => `doctor.suggest.${doc?.id || 'anon'}.${name}`
  const loadList = (name: string): string[] => {
    try {
      const raw = localStorage.getItem(keyFor(name))
      const arr = raw ? JSON.parse(raw) : []
      if (Array.isArray(arr)) return Array.from(new Set(arr.map((s: any) => String(s || '').trim()).filter(Boolean)))
      return []
    } catch { return [] }
  }
  const saveList = (name: string, values: string[]) => {
    const uniq = Array.from(new Set(values.map(v => String(v || '').trim()).filter(Boolean)))
    try { localStorage.setItem(keyFor(name), JSON.stringify(uniq.slice(0, 200))) } catch { }
  }
  const addOne = (name: string, value?: string) => {
    const v = String(value || '').trim(); if (!v) return
    const arr = loadList(name)
    if (!arr.includes(v)) { saveList(name, [v, ...arr]); setSugVersion((x: number) => x + 1) }
  }
  const addMany = (name: string, values: string[]) => {
    const arr = loadList(name)
    const next = [...values.map((s: string) => String(s || '').trim()).filter(Boolean), ...arr]
    saveList(name, Array.from(new Set(next)))
    setSugVersion((x: number) => x + 1)
  }

  // Seeds for dropdowns (hardcoded defaults)
  const seedsRoute = [
    'Oral',
    'Intramuscular',
    'Nasal',
    'Intravenous',
    'Topical',
    'Intraosseous',
    'Intrathecal',
    'Intraperitoneal',
    'Intradermal',
    'Nasogastric',
    'Ophthalmic',
    'Subcutaneous',
    'Sublingual',
    'Per Rectum',
    'Per Vaginal',
    'Inhalation',
    'Intraoccular',
  ]
  const seedsDose = [
    'Tablet(s)',
    'Capsule(s)',
    'Drop',
    'Tablespoon',
    'Teaspoon',
    'Unit(s)',
    'ml',
    'mg',
    'IU',
    'Puff(s)',
    'Sachet',
    'Injection',
    'Dose step',
    'Dropper',
    'Spray',
    'ml/h',
    'Units/kg',
  ]
  const seedsInstruction = [
    'Before Breakfast',
    'After Breakfast',
    'Before Lunch',
    'After Lunch',
    'Before Dinner',
    'After Dinner',
    'Empty Stomach',
    'At Bedtime',
    'Immediately',
    'Before Meal',
    'After Meal',
    'When required',
    'As Needed',
    'Every 1 hours',
    'Every 2 hours',
    'Every 4 hours',
    'Every 6 hours',
    'Every other day',
    'Once a week',
    'Twice a week',
    'Thrice a week',
    'Once a month',
    'Once in 2 month',
    'Once in 3 month',
    'For itching',
    'For increasing immunity',
    'For increasing urine',
    'For increasing appetite',
    'For improving blood deficiency',
    'For keeping calm',
    'For breathing difficulty',
    'STAT',
    'For kidneys',
    'For Diabetes',
    'For Blood pressure',
    'For swelling',
    'For diarrhea',
    'For muscles',
    'For nerves',
    'For chest infection',
    'For stomach',
    'For sleep',
    'For abdominal gas',
    'For transplant',
    'For light pain',
    'For severe pain',
    'For joint pain',
    'PRN',
    'For joints',
    'For uric acid',
    'For thyroid',
    'For bladder',
    'For keep calm',
    'For fever',
    'For muscle pain',
    'For muscle strain',
    'For strength of joints',
    'Steroid medicine',
    'To prevent uric acid effects',
    'To reduce inflamation',
    'To prevent fits',
    'For bone strength',
    'Before dialysis',
    'At start of dialysis',
    'During dialysis',
    'After dialysis',
    'For headache',
    'For stomach pain',
    'For abdominal bloating',
    'For chest burning',
    'For chest pain',
    'Vaccine to prevent hepatitis B',
    'Vaccine to prevent flu',
    'Vaccine to prevent meningitis',
    'Vaccine for pneumonia',
    'For pain',
  ]
  const seedsDuration = [
    'Day(s)',
    'Week(s)',
    'Month(s)',
    'Continuously',
    'When required',
    'STAT',
    'PRN',
  ]
  const seedsFrequency = [
    'Only Once',
    'Once a day',
    'Twice a day',
    'Thrice a day',
    'Four Times a day',
    '3 days',
    'Before Bed',
    'Every hour',
    'Every 2 hours',
    'Every 3 hours',
    'Every 4 hours',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'Every Other day',
    'Every 3 days',
    'Once a week',
    'Twice a week',
    'Thrice a week',
    'Every 10 days',
    'Every 15 days',
    'Once a month',
    'Twice a month',
    'Once 3 months',
    'Once 6 month',
    'Once a Year',
    'Every Morning',
    'Every Evening',
    'Every Night',
    'Continuously',
    'If Needed',
    'Before Breakfast',
    'After Breakfast',
    'Before Lunch',
    'After Lunch',
    'Before Meal',
    'After Meal',
    'Before Dinner',
    'After Dinner',
    'As Advised',
    'Before Breakfast & Lunch',
    'After Breakfast & Lunch',
    'Before Breakfast & Dinner',
    'After Breakfast & Dinner',
    'Before Lunch & Dinner',
    'After Lunch & Dinner',
    'Before Breakfast. Lunch & Dinner',
    'After Breakfast. Lunch & Dinner',
    'At Noon',
    'At Noon & Eevening',
    'Morning. Evening. Night',
    'Morning & Noon',
    'At 6am. 10 am. 2pm. 6 pm. 10pm',
    'Twice a day for 21 days. Then only at night  for 2 months',
    'Thrice a day for 21 days. Then only at night  for 2 months',
    'Thrice a day for 21 days. Then onwards for next 2 months take 1 capsule by skipping 1 day',
    'At the start of Dialysis',
    'Before Dialysis',
    'During Dialysis',
    'Twice a week after Dialysis',
    'Thrice a week after Dialysis',
    'After Dialysis in double lumen',
    'First Injection now. then after 1 month, next at 2 month ends. 3rd injection at 6 months end',
    'Once a Year',
    'One injection now. next after a month',
    'One injection now. next after a month, then after 6 months',
  ]

  const labSeeds = ['CBC', 'LFT', 'KFT']

  const sugLabTests = useMemo(() => Array.from(new Set([...labSeeds, ...loadList('labTest')])), [doc?.id, sugVersion])
  const sugLabNotes = useMemo(() => loadList('labNotes'), [doc?.id, sugVersion])
  const sugDiagTests = useMemo(() => loadList('diagTest'), [doc?.id, sugVersion])
  const sugDiagNotes = useMemo(() => loadList('diagNotes'), [doc?.id, sugVersion])
  const sugDose = useMemo(() => Array.from(new Set([...(seedsDose as string[])])), [doc?.id, sugVersion])
  const sugInstr = useMemo(() => Array.from(new Set([...(seedsInstruction as string[])])), [doc?.id, sugVersion])
  const sugRoute = useMemo(() => Array.from(new Set([...(seedsRoute as string[])])), [doc?.id, sugVersion])
  const sugDuration = useMemo(() => Array.from(new Set([...(seedsDuration as string[])])), [doc?.id, sugVersion])
  const sugFreq = useMemo(() => Array.from(new Set([...(seedsFrequency as string[])])), [doc?.id, sugVersion])
  // Vitals suggestions
  const sugVPulse = useMemo(() => loadList('vitals.pulse'), [doc?.id, sugVersion])
  const sugVTemp = useMemo(() => loadList('vitals.temperature'), [doc?.id, sugVersion])
  const sugVSys = useMemo(() => loadList('vitals.sys'), [doc?.id, sugVersion])
  const sugVDia = useMemo(() => loadList('vitals.dia'), [doc?.id, sugVersion])
  const sugVResp = useMemo(() => loadList('vitals.resp'), [doc?.id, sugVersion])
  const sugVSugar = useMemo(() => loadList('vitals.sugar'), [doc?.id, sugVersion])
  const sugVWeight = useMemo(() => loadList('vitals.weight'), [doc?.id, sugVersion])
  const sugVHeight = useMemo(() => loadList('vitals.height'), [doc?.id, sugVersion])
  const sugVSpo2 = useMemo(() => loadList('vitals.spo2'), [doc?.id, sugVersion])

  const appendToField = (key: 'primaryComplaint' | 'history', value: string) => {
    const v = String(value || '').trim()
    if (!v) return
    setForm((f: typeof form) => {
      const prev = String((f as any)[key] || '').trim()
      const next = key === 'history'
        ? (prev ? `${prev}\n${v}` : v)
        : (prev ? `${prev}${prev.endsWith(',') ? '' : ','} ${v}` : v)
      return { ...f, [key]: next } as any
    })
  }

  const toggleInField = (key: 'primaryComplaint' | 'history', value: string) => {
    const v = String(value || '').trim()
    if (!v) return
    setForm((f: typeof form) => {
      const raw = String((f as any)[key] || '')
      const parts = key === 'history'
        ? (raw.split(/\n+/).map(s => s.trim()).filter(Boolean).length > 1
          ? raw.split(/\n+/).map(s => s.trim()).filter(Boolean)
          : raw.split(/,\s+/).map(s => s.trim()).filter(Boolean))
        : raw.split(/,\s+/).map(s => s.trim()).filter(Boolean)
      const idx = parts.findIndex(x => x.toLowerCase() === v.toLowerCase())
      const nextParts = idx >= 0 ? parts.filter((_, i) => i !== idx) : [...parts, v]
      return { ...f, [key]: key === 'history' ? nextParts.join('\n') : nextParts.join(', ') } as any
    })
  }

  const hasInField = (key: 'primaryComplaint' | 'history', value: string) => {
    const v = String(value || '').trim().toLowerCase()
    if (!v) return false
    const raw = String((form as any)[key] || '')
    const parts = key === 'history'
      ? (raw.split(/\n+/).map(s => s.trim()).filter(Boolean).length > 1
        ? raw.split(/\n+/).map(s => s.trim())
        : raw.split(/,\s+/).map(s => s.trim()))
      : raw.split(/,\s+/).map(s => s.trim())
    return parts.map(s => s.toLowerCase()).filter(Boolean).includes(v)
  }

  const cardClass = (selected: boolean) => {
    const base = 'rounded-md border border-slate-200 px-3 py-2 text-xs shadow-sm transition-colors'
    const normal = 'bg-white text-black hover:bg-blue-800 hover:text-white'
    const active = 'bg-blue-800 text-white'
    return `${base} ${selected ? active : normal}`
  }

  const setHistoryWithAortic = (selected: string[]) => {
    const selectedNorm = (selected || []).map(s => String(s || '').trim()).filter(Boolean)
    setForm((f: typeof form) => {
      const raw = String((f as any).history || '')
      const parts = raw.split(/\n+/).map(s => s.trim()).filter(Boolean).length > 1
        ? raw.split(/\n+/).map(s => s.trim()).filter(Boolean)
        : raw.split(/,\s+/).map(s => s.trim()).filter(Boolean)
      const filtered = parts.filter(p => !aorticOptions.some(a => a.toLowerCase() === p.toLowerCase()))
      const nextParts = [...filtered, ...selectedNorm]
      return { ...f, history: nextParts.join('\n') } as any
    })
  }

  const toggleAortic = (value: string) => {
    const v = String(value || '').trim()
    if (!v) return
    setAorticSelected((prev: string[]) => {
      const exists = prev.some((x: string) => x.toLowerCase() === v.toLowerCase())
      const next = exists ? prev.filter((x: string) => x.toLowerCase() !== v.toLowerCase()) : [...prev, v]
      setHistoryWithAortic(next)
      return next
    })
  }

  useEffect(() => {
    const onDown = (e: any) => {
      const el = aorticRef.current
      if (!el) return
      if (!el.contains(e.target)) setAorticOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const quickCreateChecks = ['C/P', 'GHABRAHAT', 'CHEST TIGHTNESS', 'SOB', 'APD/GERD', 'ATYPICAL C/P', 'Rt SIDED C/P', 'PALPITATION', 'CONSTIPATION']
  const quickCreateButtons = ['C/P', 'SOB FC', 'Rt SIDED PAIN', 'CONSTIPATION', 'ATYPICAL C/P', 'PALPITATION', 'CHEST TIGHTNESS', 'VERTIGO', 'GHABRAHAT', 'LT ARM PAIN', 'APD/GERD', 'SYNCOPE']
  const quickExamButtons = [
    'CHEST=B/L \u2193 AIR ENTRY AT BASES',
    'CHEST=B/L CLEAR',
    'CHEST=B/L COARSE CREPTS',
    'CHEST=B/L FINE CREPTS',
    'CHEST=B/L MIX CREPTS',
    'CHEST=B/L RHONCHI',
    'CHEST=B/L WHEESE',
    'CHEST=unilateral \u2193 AIR ENTRY AT BASES',
    'CHEST=unilateral COARSE CREPTS',
    'CHEST=unilateral FINE CREPTS',
    'CHEST=unilateral MIX CREPTS',
    'CHEST=unilateral RHONCHI',
    'CHEST=unilateral WHEESE',
    'JVP\u2191',
    'JVP\u00b0',
    'PE\u00b0',
    'PE+1',
    'PE+2',
    'PE+3',
    'S1 S2 ++?',
    'S1 S2 +0',
    'S1 S2 +EDM',
    'S1 S2 +ESM',
    'S1 S2 +flow murmur',
    'S1 S2 +MDM',
    'S1 S2 +M.M',
    'S1 S2 +PSM',
    'S1 S2 +S3',
    'S1 S2 +S4',
  ]

  const quickRiskButtons = [
    'DM1',
    'DM2 Insulin Controlled',
    'DM2 Insulin un-Controlled',
    'DM2 OHGs Controlled',
    'DM2 OHGs Un-Controlled',
    'Ex-smoker',
    'HTN Controlled',
    'HTN Un-Controlled',
    'IHD',
    'PCI',
    'Smoker',
    'Stable IHD',
  ]
  const quickFamilyButtons = ['F-DM.HTN.IHD', 'M-DM.HTN.IHD', 'Strong FH']
  const aorticOptions = [
    'Normal Aortic Root. Normal Aortic Valve with fair opening.',
    'Normal Aortic Root. Sclerotic Aortic Valve with fair opening.',
    'Normal Aortic Root. Thickened Sclerotic Aortic Valve with fair opening.',
  ]
  const quickAtriumButtons = [
    'Dilated Left Atrium. Dilated Right Atrium.',
    'Dilated Left Atrium. Normal sized Right Atrium.',
    'Full sized Left Atrium. Normal sized Right Atrium.',
    'Normal sized Left Atrium. Normal sized Right Atrium',
  ]

  const openPreviousPrescriptions = () => {
    if (!selectedToken?.mrNo) return
    setOpenPreviousPrescriptionsDialog(true)
  }

  const handlePreviewPreviousPrescriptionPdf = async (id: string) => {
    if (!id) return
    try {
      setPrintingPreviousPrescriptionId(id)
      const data: any = await fetchPrintData(id)
      const tpl: PrescriptionPdfTemplate = getSavedPrescriptionPdfTemplate(doc?.id)
      const ex: any = data?.detailsExtras || {}
      const prevPrimaryComplaint = mergeTextOnce(String(data?.primaryComplaint || ''), ex?.createOther, ', ')
      const prevExamFindings = mergeTextOnce(String(data?.examFindings || ''), ex?.examOther, '\n')
      let prevHistory = String(data?.history || '')
      prevHistory = appendLabeledLineOnce(prevHistory, 'Risk', ex?.riskOther)
      prevHistory = appendLabeledLineOnce(prevHistory, 'Family History', ex?.fhOther)
      prevHistory = appendLabeledLineOnce(prevHistory, 'Other', ex?.selectOther)
      prevHistory = appendLabeledLineOnce(prevHistory, 'Atrium', ex?.atriumOther)
      prevHistory = appendLabeledLineOnce(prevHistory, 'Note 1', ex?.note1)
      prevHistory = appendLabeledLineOnce(prevHistory, 'Note 2', ex?.note2)
      await previewPrescriptionPdf({
        doctor: data.doctor || {},
        settings: data.settings || {},
        patient: data.patient || {},
        items: data.items || [],
        vitals: data.vitals,
        primaryComplaint: prevPrimaryComplaint,
        primaryComplaintHistory: data.primaryComplaintHistory,
        familyHistory: data.familyHistory,
        allergyHistory: data.allergyHistory,
        treatmentHistory: data.treatmentHistory,
        history: prevHistory,
        examFindings: prevExamFindings,
        diagnosis: data.diagnosis,
        advice: data.advice,
        medicationNotes: data.medicationNotes,
        labTests: data.labTests || [],
        labNotes: data.labNotes || '',
        diagnosticTests: data.diagnosticTests || [],
        diagnosticNotes: data.diagnosticNotes || '',
        improvement: data.improvement,
        followupDate: data.followupDate,
        createdAt: data.createdAt,
      }, tpl)
    } catch (e: any) {
      showToast('error', e?.message || 'Failed to preview prescription PDF')
    } finally {
      setPrintingPreviousPrescriptionId('')
    }
  }

  return (
    <div className="w-full">
      <div className="no-print">
        <div className="text-xl font-semibold text-slate-800">Prescription</div>
        {toast && (
          <div className="mt-2">
            <div className={`rounded-md border px-3 py-2 text-sm ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
              {toast.message}
            </div>
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 text-sm">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
          <span className="text-slate-500">to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
          <button type="button" onClick={() => { const t = new Date().toISOString().slice(0, 10); setFrom(t); setTo(t) }} className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">Today</button>
          <button type="button" onClick={() => { setFrom(''); setTo('') }} className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">Reset</button>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          <form onSubmit={save} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm text-slate-700">Select Patient</label>
                <select value={form.patientKey} onChange={e => setForm((f: typeof form) => ({ ...f, patientKey: e.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Select patient</option>
                  {patientOptions.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.patientName} • {p.mrNo}{p.tokenNo ? ` • T#${p.tokenNo}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-700">Previous Prescription</label>
                <select
                  value={previousPrescriptionId}
                  disabled={!selectedToken?.mrNo || loadingPreviousPrescriptions}
                  onChange={async (e) => {
                    const id = e.target.value
                    setPreviousPrescriptionId(id)
                    setPreviousPrescriptionsError('')
                    if (!id) return
                    try {
                      const res: any = await hospitalApi.getPrescription(id)
                      const p = res?.prescription
                      applyPrescriptionToPage(p)
                      showToast('success', 'Loaded previous prescription')
                    } catch (err: any) {
                      setPreviousPrescriptionsError(err?.message || 'Failed to load previous prescription')
                      showToast('error', err?.message || 'Failed to load previous prescription')
                    }
                  }}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                >
                  <option value="">Select previous prescription</option>
                  {previousPrescriptions.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : p.id}{p.diagnosis ? ` • ${p.diagnosis}` : ''}
                    </option>
                  ))}
                </select>
                {previousPrescriptionsError && <div className="mt-1 text-xs text-rose-600">{previousPrescriptionsError}</div>}
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-700">&nbsp;</label>
                <button
                  type="button"
                  onClick={openPreviousPrescriptions}
                  disabled={!selectedToken?.mrNo}
                  className="h-10 w-full rounded-md border border-blue-800 bg-white px-3 text-sm font-medium text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Show Previous Prescriptions
                </button>
              </div>
            </div>

            {openPreviousPrescriptionsDialog && (
              <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-2 sm:px-4">
                <div className="w-full max-w-5xl rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <div className="text-base font-semibold text-slate-900">Previous Prescriptions</div>
                    <button
                      type="button"
                      onClick={() => setOpenPreviousPrescriptionsDialog(false)}
                      className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-lg text-slate-700 hover:bg-slate-50"
                      aria-label="Close"
                      title="Close"
                    >
                      ×
                    </button>
                  </div>

                  <div className="max-h-[75vh] overflow-y-auto p-3 sm:p-4">
                    {loadingPreviousPrescriptions ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">Loading...</div>
                    ) : previousPrescriptions.length === 0 ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">No previous prescriptions found.</div>
                    ) : (
                      <div className="space-y-3">
                        {previousPrescriptions.map(p => (
                          <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <div className="font-medium text-slate-900 truncate">{p.patientName || '-'}</div>
                                <div className="mt-1 text-xs text-slate-600">
                                  MR: {p.mrn || '-'}
                                  {p.visitNo ? (
                                    <>
                                      {' • '}Visit#: <span className="font-semibold text-slate-900">{p.visitNo}</span>
                                    </>
                                  ) : null}
                                </div>
                                <div className="mt-1 text-xs text-slate-600">
                                  Date: <span className="font-semibold text-slate-900">{p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}</span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                                <button
                                  type="button"
                                  disabled={printingPreviousPrescriptionId === p.id}
                                  onClick={() => handlePreviewPreviousPrescriptionPdf(p.id)}
                                  className="rounded-md border border-blue-800 bg-white px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Prescription PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviousPrescriptionId(p.id)
                                    setOpenPreviousPrescriptionsDialog(false)
                                      ; (async () => {
                                        try {
                                          const res: any = await hospitalApi.getPrescription(p.id)
                                          const pres = res?.prescription
                                          applyPrescriptionToPage(pres)
                                          showToast('success', 'Loaded previous prescription')
                                        } catch (e: any) {
                                          showToast('error', e?.message || 'Failed to load previous prescription')
                                        }
                                      })()
                                  }}
                                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                                >
                                  Load
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setOpenPreviousPrescriptionsDialog(false)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 sm:w-auto"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-2 border-b border-slate-200">
              <nav className="-mb-px flex gap-2">
                <button type="button" onClick={() => goTab('details')} className={`px-3 py-2 text-sm ${activeTab === 'details' ? 'border-b-2 border-sky-600 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>Presecriptions</button>
                <button type="button" onClick={() => goTab('medications')} className={`px-3 py-2 text-sm ${activeTab === 'medications' ? 'border-b-2 border-sky-600 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>Medications</button>
                <button type="button" onClick={() => goTab('vitals')} className={`px-3 py-2 text-sm ${activeTab === 'vitals' ? 'border-b-2 border-sky-600 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>Vitals</button>
                <button type="button" onClick={() => goTab('labs')} className={`px-3 py-2 text-sm ${activeTab === 'labs' ? 'border-b-2 border-sky-600 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>Lab Orders</button>
                <button type="button" onClick={() => goTab('diagnostics')} className={`px-3 py-2 text-sm ${activeTab === 'diagnostics' ? 'border-b-2 border-sky-600 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>Diagnostic Orders</button>
              </nav>
            </div>
            {activeTab === 'details' && (
              <>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="grid gap-3">
                    <div className="text-sm font-semibold text-slate-800">Complaint</div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {quickCreateChecks.map((label) => (
                        <label key={label} className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={!!createChecks[label]}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setCreateChecks(prev => ({ ...prev, [label]: checked }))
                              toggleInField('primaryComplaint', label)
                            }}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-1 grid gap-2">
                      <input
                        value={createOther}
                        onChange={e => setCreateOther(e.target.value)}
                        placeholder="Other"
                        className="w-full rounded-md border border-slate-500 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="grid gap-2">

                    </div>

                    <div className="mt-7 grid gap-2 sm:grid-cols-3">
                      {quickCreateButtons.map((x) => (
                        <button
                          key={x}
                          type="button"
                          onClick={() => toggleInField('primaryComplaint', x)}
                          className={cardClass(hasInField('primaryComplaint', x))}
                        >
                          {x}
                        </button>
                      ))}
                    </div>

                    <div className="mt-1 grid gap-2">
                      <input
                        value={createOther}
                        onChange={e => setCreateOther(e.target.value)}
                        placeholder="Other"
                        className="w-full rounded-md border border-slate-500 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="mt-1 grid gap-2">
                      <div className="text-sm font-semibold text-slate-800">Medical History</div>
                      <div className="mt-9 grid gap-2 sm:grid-cols-3">
                        {quickExamButtons.map((x) => (
                          <button
                            key={x}
                            type="button"
                            onClick={() => toggleInField('history', x)}
                            className={cardClass(hasInField('history', x))}
                          >
                            {x}
                          </button>
                        ))}
                      </div>
                      <div className="mt-1">
                        <input
                          value={examOther}
                          onChange={e => setExamOther(e.target.value)}
                          placeholder="Other"
                          className="w-full rounded-md border border-slate-500 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-1 grid gap-2">
                      <div className="mt-8 grid gap-2 sm:grid-cols-3">
                        {quickRiskButtons.map((x) => (
                          <button
                            key={x}
                            type="button"
                            onClick={() => toggleInField('history', x)}
                            className={cardClass(hasInField('history', x))}
                          >
                            {x}
                          </button>
                        ))}
                      </div>
                      <div className="mt-1">
                        <input
                          value={riskOther}
                          onChange={e => setRiskOther(e.target.value)}
                          placeholder="Other"
                          className="w-full rounded-md border border-slate-500 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-1 grid gap-2">
                      <div className="mt-9 grid gap-2 sm:grid-cols-3">
                        {quickFamilyButtons.map((x) => (
                          <button
                            key={x}
                            type="button"
                            onClick={() => toggleInField('history', x)}
                            className={cardClass(hasInField('history', x))}
                          >
                            {x}
                          </button>
                        ))}
                      </div>
                      <input
                        value={fhOther}
                        onChange={e => setFhOther(e.target.value)}
                        placeholder="Other"
                        className="w-full rounded-md border border-slate-500 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="mt-8 grid gap-2 sm:grid-cols-2">
                      <div ref={aorticRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setAorticOpen(v => !v)}
                          className="flex min-h-[42px] w-full items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm"
                        >
                          <div className="flex flex-wrap gap-2">
                            {aorticSelected.length === 0 ? (
                              <span className="text-slate-500">Select</span>
                            ) : (
                              aorticSelected.map((x) => (
                                <span key={x} className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs text-black">
                                  <span className="truncate max-w-[260px]">{x}</span>
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => { e.stopPropagation(); toggleAortic(x) }}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleAortic(x) } }}
                                    className="grid h-5 w-5 place-items-center rounded-full bg-blue-800 text-xs text-white cursor-pointer"
                                    aria-label="Remove"
                                  >
                                    ×
                                  </span>
                                </span>
                              ))
                            )}
                          </div>
                          <span className="text-slate-600">▾</span>
                        </button>

                        {aorticOpen && (
                          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                            {aorticOptions.map((opt) => {
                              const selected = aorticSelected.some(x => x.toLowerCase() === opt.toLowerCase())
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => toggleAortic(opt)}
                                  className={`block w-full px-3 py-2 text-left text-sm ${selected ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                                >
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      <input
                        value={selectOther}
                        onChange={e => setSelectOther(e.target.value)}
                        placeholder="Other"
                        className="w-full rounded-md border border-slate-500 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="mt-2 grid gap-2">
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={note1}
                          onChange={e => setNote1(e.target.value)}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={note2}
                          onChange={e => setNote2(e.target.value)}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-2 grid gap-2">
                      <div>
                        <label className="mb-1 block text-sm text-slate-700">Diagnosis / Disease</label>
                        <input
                          value={String(form.diagnosis || '')}
                          onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                          placeholder="Enter diagnosis"
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-slate-700">Advice / Referral</label>
                        <textarea
                          rows={2}
                          value={String(form.advice || '')}
                          onChange={e => setForm(f => ({ ...f, advice: e.target.value }))}
                          placeholder="Advice for patient"
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-2 grid gap-2">
                      <div className="grid gap-2 sm:grid-cols-3">
                        {quickAtriumButtons.map((x) => (
                          <button
                            key={x}
                            type="button"
                            onClick={() => toggleInField('history', x)}
                            className={cardClass(hasInField('history', x))}
                          >
                            {x}
                          </button>
                        ))}
                      </div>
                      <input
                        value={atriumOther}
                        onChange={e => setAtriumOther(e.target.value)}
                        placeholder="Other"
                        className="w-full rounded-md border border-slate-500 px-3 py-2 text-sm"
                      />

                    </div>

                    <div className="mt-9 grid gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          value={multiInput}
                          onChange={(e) => setMultiInput(e.target.value)}
                          placeholder="Other"
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const v = String(multiInput || '').trim()
                            if (!v) return
                            setMultiSelectRows(prev => {
                              const cleaned = prev.map(x => String(x || '').trim()).filter(Boolean)
                              if (cleaned.some(x => x.toLowerCase() === v.toLowerCase())) return cleaned
                              return [...cleaned, v]
                            })
                            appendToField('history', v)
                            setMultiInput('')
                          }}
                          className="inline-flex items-center rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
                        >
                          + Add
                        </button>
                      </div>

                      {multiSelectRows.map((x, idx) => (
                        String(x || '').trim() ? (
                          <div key={`${x}-${idx}`} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                            <div className="text-slate-800">{String(x).trim()}</div>
                            <button
                              type="button"
                              onClick={() => {
                                const v = String(x || '').trim()
                                setMultiSelectRows((prev: string[]) => prev.filter((_: string, i: number) => i !== idx))
                                setForm((f: typeof form) => {
                                  const raw = String((f as any).history || '')
                                  const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
                                  const nextParts = parts.filter(p => p.toLowerCase() !== v.toLowerCase())
                                  return { ...f, history: nextParts.join(', ') } as any
                                })
                              }}
                              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                              title="Delete"
                              aria-label="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        ) : null
                      ))}
                    </div>

                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm text-slate-700">Improvement</label>
                        <select
                          value={improvement}
                          onChange={(e) => {
                            const v = e.target.value
                            setImprovement(v)
                          }}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        >
                          <option value="">Select Improvement</option>
                          <option value="0%">0%</option>
                          <option value="10%">10%</option>
                          <option value="20%">20%</option>
                          <option value="30%">30%</option>
                          <option value="40%">40%</option>
                          <option value="50%">50%</option>
                          <option value="60%">60%</option>
                          <option value="70%">70%</option>
                          <option value="80%">80%</option>
                          <option value="90%">90%</option>
                          <option value="100%">100%</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-slate-700">Recommended Follow-up Appointment Date</label>
                        <input
                          type="date"
                          value={followupDate}
                          onChange={(e) => {
                            const v = e.target.value
                            setFollowupDate(v)
                          }}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </>
            )}
            {activeTab === 'medications' && (
              <div>
                <div className="mb-1 block text-sm text-slate-700">Medicines</div>
                <div className="grid gap-3">
                  {form.meds.map((m, idx) => (
                    <div key={idx} className="rounded-xl border border-blue-800 bg-white p-3">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-sm text-slate-700">Name</label>
                          <SuggestField as="input" value={m.name || ''} onChange={v => { setMed(idx, 'name', v); searchMedicines(v) }} suggestions={medNameSuggestions} placeholder="Medicine name" />
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <div className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800">
                              {(() => {
                                const it = inventoryDrugByName.get(String(m.name || '').trim().toLowerCase())
                                const v = it?.price
                                return (v == null || Number.isNaN(Number(v))) ? '-' : String(Number(v).toFixed(1))
                              })()}
                            </div>
                            <div className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800">
                              {(() => {
                                const it = inventoryDrugByName.get(String(m.name || '').trim().toLowerCase())
                                const v = it?.onHand
                                return (v == null || Number.isNaN(Number(v))) ? '-' : String(v)
                              })()}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm text-slate-700">Duration</label>
                          <div className="flex flex-col gap-1">
                            {(() => {
                              const parsed = parseNumberAndUnit(String(m.durationText || ''), { defaultUnit: 'Day(s)', allowedUnits: sugDuration })
                              return (
                                <>
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    step={1}
                                    value={parsed.num}
                                    onChange={e => {
                                      const v = e.target.value
                                      setMed(idx, 'durationText', combineNumberAndUnit(v, parsed.unit))
                                    }}
                                    placeholder="Duration"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                  />
                                  <select
                                    value={parsed.unit}
                                    onChange={e => {
                                      const unit = e.target.value
                                      const now = parseNumberAndUnit(String((form.meds[idx] as any)?.durationText || ''), { defaultUnit: 'Day(s)', allowedUnits: sugDuration })
                                      const num = String(now.num || '').trim() || '1'
                                      setMed(idx, 'durationText', combineNumberAndUnit(num, unit))
                                    }}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                  >
                                    {sugDuration.map((s, i) => (
                                      <option key={`${s}-${i}`} value={s}>{s}</option>
                                    ))}
                                  </select>
                                </>
                              )
                            })()}
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm text-slate-700">Dosage</label>
                          <div className="flex flex-col gap-1">
                            {(() => {
                              const parsed = parseNumberAndUnit(String(m.qty || ''), { defaultUnit: 'Tablet(s)', allowedUnits: sugDose })
                              return (
                                <>
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    step={1}
                                    value={parsed.num}
                                    onChange={e => {
                                      const v = e.target.value
                                      setMed(idx, 'qty', combineNumberAndUnit(v, parsed.unit))
                                    }}
                                    placeholder="Dosage"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                  />
                                  <select
                                    value={parsed.unit}
                                    onChange={e => {
                                      const unit = e.target.value
                                      const now = parseNumberAndUnit(String((form.meds[idx] as any)?.qty || ''), { defaultUnit: 'Tablet(s)', allowedUnits: sugDose })
                                      const num = String(now.num || '').trim() || '1'
                                      setMed(idx, 'qty', combineNumberAndUnit(num, unit))
                                    }}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                  >
                                    {sugDose.map((s, i) => (
                                      <option key={`${s}-${i}`} value={s}>{s}</option>
                                    ))}
                                  </select>
                                </>
                              )
                            })()}
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm text-slate-700">Route</label>
                          <SuggestField as="input" value={m.route || ''} onChange={v => setMed(idx, 'route', v)} suggestions={sugRoute} placeholder="Select Route" />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm text-slate-700">Frequency</label>
                          <SuggestField as="input" value={m.freqText || ''} onChange={v => setMed(idx, 'freqText', v)} suggestions={sugFreq} placeholder="Frequency" />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm text-slate-700">Instruction</label>
                          <SuggestField as="input" value={m.instruction || ''} onChange={v => setMed(idx, 'instruction', v)} suggestions={sugInstr} placeholder="Instruction" />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <button type="button" onClick={() => removeAt(idx)} className="w-full rounded-md bg-rose-600 px-2 py-2 text-xs font-medium text-white hover:bg-rose-700 sm:w-auto sm:py-1" title="Remove">🗑️ Remove</button>
                        <button type="button" onClick={() => addAfter(idx)} className="w-full rounded-md bg-sky-600 px-2 py-2 text-xs font-medium text-white hover:bg-sky-700 sm:w-auto sm:py-1">+ Drug</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-sm text-slate-700">Medication Note</label>
                  <textarea
                    rows={3}
                    value={(form as any).medicationNotes || ''}
                    onChange={e => setForm(f => ({ ...f, medicationNotes: e.target.value }))}
                    placeholder="Medication note"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
            {activeTab === 'vitals' && (
              <div>
                <PrescriptionVitals
                  ref={vitalsRef}
                  initial={(form as any).vitalsDisplay}
                  suggestions={{
                    pulse: sugVPulse,
                    temperature: sugVTemp,
                    bloodPressureSys: sugVSys,
                    bloodPressureDia: sugVDia,
                    respiratoryRate: sugVResp,
                    bloodSugar: sugVSugar,
                    weightKg: sugVWeight,
                    height: sugVHeight,
                    spo2: sugVSpo2,
                  }}
                  onBlurStore={(field: any, value: string) => addOne(`vitals.${String(field)}`, value)}
                />
              </div>
            )}
            {activeTab === 'diagnostics' && (
              <div>
                <PrescriptionDiagnosticOrders ref={diagRef} initialTestsText={(form as any).diagDisplay?.testsText} initialNotes={(form as any).diagDisplay?.notes} suggestionsTests={sugDiagTests} suggestionsNotes={sugDiagNotes} />
              </div>
            )}
            {activeTab === 'labs' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-700">Lab Tests (comma or one per line)</label>
                  <SuggestField mode="lab-tests" rows={3} value={form.labTestsText} onChange={v => setForm(f => ({ ...f, labTestsText: v }))} suggestions={sugLabTests} placeholder="CBC, LFT, KFT" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-700">Lab Notes</label>
                  <SuggestField rows={2} value={form.labNotes} onChange={v => setForm(f => ({ ...f, labNotes: v }))} suggestions={sugLabNotes} />
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <button type="button" disabled={!sel} onClick={() => setOpenPreviousPrescriptionsDialog(true)} className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50">Previous Prescriptions</button>
              <button
                type="button"
                disabled={!sel || !(form.meds || []).some((m: any) => String(m?.name || '').trim())}
                onClick={referToPharmacyQuick}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                Refer to Pharmacy
              </button>
              <button type="button" disabled={!doc?.id} onClick={openSaveAsTemplate} className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50">Save as Template</button>
              <button type="submit" className="btn">Save</button>
            </div>
            {saved && <div className="text-sm text-emerald-600">Saved</div>}
          </form>

          {openSaveAsTemplateDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
                <div className="border-b border-slate-200 px-5 py-3 text-base font-semibold text-slate-800">Save as Template</div>
                <div className="px-5 py-4">
                  <label className="mb-1 block text-sm text-slate-700">Template Name</label>
                  <input
                    value={saveAsTemplateName}
                    onChange={e => setSaveAsTemplateName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (!savingAsTemplate) saveCurrentAsTemplate(saveAsTemplateName)
                      }
                    }}
                    placeholder="e.g., Fever template"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                    autoFocus
                  />
                  <div className="mt-2 text-xs text-slate-500">This will save your current prescription content as a reusable template.</div>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
                  <button
                    type="button"
                    disabled={savingAsTemplate}
                    onClick={() => { setOpenSaveAsTemplateDialog(false); setSaveAsTemplateName('') }}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingAsTemplate || !String(saveAsTemplateName || '').trim()}
                    onClick={() => saveCurrentAsTemplate(saveAsTemplateName)}
                    className="rounded-md bg-violet-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {savingAsTemplate ? 'Saving…' : 'Save Template'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white flex h-full min-h-0 flex-col">
            <div className="p-3">
              <select
                value={drugPick}
                onChange={e => {
                  const v = e.target.value
                  if (v) {
                    addDrugToMeds(v)
                    setDrugPick('')
                  } else {
                    setDrugPick('')
                  }
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select drug</option>
                {(drugPickOptions || []).slice(0, 200).map((d, i) => (
                  <option key={`${d}-${i}`} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="border-b border-slate-200 px-3">
              <div className="relative">
                <nav ref={rightTabsRef} className="scrollbar-hover-thin -mb-px flex gap-2 overflow-x-auto whitespace-nowrap px-8 text-sm">
                  <button type="button" onClick={() => setRightTab('drugs')} className={`px-3 py-2 ${rightTab === 'drugs' ? 'border-b-2 border-sky-600 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>Drugs</button>
                  <button type="button" onClick={() => setRightTab('templates')} className={`px-3 py-2 ${rightTab === 'templates' ? 'border-b-2 border-sky-600 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>Templates</button>
                </nav>
                {showRightTabsPrev && (
                  <button type="button" onClick={scrollRightTabsPrev} aria-label="Previous tabs" title="Previous" className="absolute left-0 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm hover:bg-slate-50">
                    &lt;
                  </button>
                )}
                {showRightTabsNext && (
                  <button type="button" onClick={scrollRightTabsNext} aria-label="More tabs" title="More" className="absolute right-0 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm hover:bg-slate-50">
                    &gt;
                  </button>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-2">
              {rightTab === 'templates' && (
                <div className="divide-y divide-slate-100">
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => { setAllTemplatesQuery(''); setOpenAllTemplatesDialog(true) }}
                      className="w-full rounded-md border border-blue-800 bg-white px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50"
                    >
                      Show All Templates
                    </button>
                  </div>
                  {templatePreview && (
                    <div className="p-2">
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{String(templatePreview?.name || 'Template Preview')}</div>
                          <button type="button" onClick={() => setTemplatePreview(null)} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs">Close</button>
                        </div>
                        <div className="space-y-1 text-xs text-slate-700">
                          {(() => {
                            const tf = templatePreview?.data?.templateForm || {}
                            const meds = Array.isArray(tf?.meds) ? tf.meds.filter((m: any) => String(m?.name || '').trim()) : []
                            const labs = String(tf?.labTestsText || '').split(/\r?\n|,/).map(s => s.trim()).filter(Boolean)
                            const diag = String(tf?.radiologyTestsText || '').split(/\r?\n|,/).map(s => s.trim()).filter(Boolean)
                            return (
                              <>
                                <div><span className="font-medium">Diagnosis:</span> {String(tf?.diagnosis || '').slice(0, 120) || '—'}</div>
                                <div><span className="font-medium">Meds:</span> {meds.length ? String(meds.length) : '0'}</div>
                                <div><span className="font-medium">Lab:</span> {labs.length ? String(labs.length) : '0'}</div>
                                <div><span className="font-medium">Diagnostics:</span> {diag.length ? String(diag.length) : '0'}</div>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      value={templateQuery}
                      onChange={e => setTemplateQuery(e.target.value)}
                      placeholder="Search template"
                      className="w-full flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        resetTemplateDialog()
                        setOpenTemplateDialog(true)
                        setTemplateTab('prescriptions')
                      }}
                      className="w-full rounded-md border border-blue-800 bg-white px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50 sm:w-auto"
                    >
                      Add
                    </button>
                  </div>
                  {(() => {
                    const q = String(templateQuery || '').trim().toLowerCase()
                    const list = (templates || []).filter((t: any) => {
                      const name = String(t?.name || '')
                      if (!q) return true
                      return name.toLowerCase().includes(q)
                    })
                    if (!list.length) return <div className="p-3 text-sm text-slate-500">No templates</div>
                    const previewCount = 8
                    const preview = list.slice(0, previewCount)
                    const hasMore = list.length > previewCount
                    return (
                      <div className="divide-y divide-slate-100">
                        {preview.map((t: any) => (
                          <div
                            key={String(t?._id)}
                            className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-slate-50"
                            onClick={() => applyTemplateToPrescription(t, 'append')}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); applyTemplateToPrescription(t, 'append') } }}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm text-slate-800">{String(t?.name || '')}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setTemplatePreview(t) }}
                                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                                title="Preview"
                                aria-label="Preview"
                              >
                                Preview
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); applyTemplateToPrescription(t, 'replace') }}
                                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                                title="Replace"
                                aria-label="Replace"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); openEditTemplate(t) }}
                                className="grid h-8 w-8 place-items-center rounded-md border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                                title="Edit"
                                aria-label="Edit"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); requestDeleteTemplate(t) }}
                                className="grid h-8 w-8 place-items-center rounded-md border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                                title="Delete"
                                aria-label="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {hasMore && (
                          <div className="p-2">
                            <button
                              type="button"
                              onClick={() => { setAllTemplatesQuery(''); setOpenAllTemplatesDialog(true) }}
                              className="w-full rounded-md border border-blue-800 bg-white px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50"
                            >
                              View All
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
              {rightTab === 'lab' && (
                <div className="divide-y divide-slate-100">
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selected: Record<string, boolean> = {}
                        try {
                          const existing = String((form as any)?.labTestsText || '')
                          const lines = existing.split(/\n|,/).map(s => s.trim()).filter(Boolean)
                          for (const x of lines) selected[x] = true
                        } catch { }
                        setAllLabTestsQuery('')
                        setSelectedAllLabTests(selected)
                        setOpenAllLabTestsDialog(true)
                      }}
                      className="w-full rounded-md border border-blue-800 bg-white px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50"
                    >
                      Show All Lab Tests
                    </button>
                  </div>
                  <div className="p-2">
                    <input
                      value={labTestQuery}
                      onChange={e => { const v = e.target.value; setLabTestQuery(v); filterLabTests(v) }}
                      placeholder="Search lab test"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  {loadingLabTests && (
                    <div className="p-3 text-sm text-slate-500">Loading lab tests…</div>
                  )}
                  {!loadingLabTests && !!labTestsError && (
                    <div className="p-3 text-sm text-red-600">{labTestsError}</div>
                  )}
                  {(() => {
                    const previewCount = 10
                    const list = (labTestOptions || [])
                    const preview = list.slice(0, previewCount)
                    const hasMore = list.length > previewCount
                    return (
                      <>
                        {preview.map((t, i) => (
                          <div key={`${t}-${i}`} className="flex items-center justify-between gap-2 px-2 py-2">
                            <div className="text-xs text-slate-800">{t}</div>
                            <button type="button" onClick={() => addLabTestToForm(t)} aria-label="Add" title="Add" className="grid h-7 w-7 place-items-center rounded-md border border-slate-300 text-sm font-semibold leading-none hover:bg-slate-50">+</button>
                          </div>
                        ))}
                        {hasMore && (
                          <div className="p-2">
                            <button
                              type="button"
                              onClick={() => {
                                const selected: Record<string, boolean> = {}
                                try {
                                  const existing = String((form as any)?.labTestsText || '')
                                  const lines = existing.split(/\n|,/).map(s => s.trim()).filter(Boolean)
                                  for (const x of lines) selected[x] = true
                                } catch { }
                                setAllLabTestsQuery('')
                                setSelectedAllLabTests(selected)
                                setOpenAllLabTestsDialog(true)
                              }}
                              className="w-full rounded-md border border-blue-800 bg-white px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50"
                            >
                              View All
                            </button>
                          </div>
                        )}
                      </>
                    )
                  })()}
                  {!loadingLabTests && !labTestsError && !labTestOptions.length && (
                    <div className="p-3 text-sm text-slate-500">No lab tests found</div>
                  )}
                </div>
              )}
              {rightTab === 'radiology' && (
                <div className="divide-y divide-slate-100">
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selected: Record<string, boolean> = {}
                        try {
                          const existing = String((form as any)?.diagDisplay?.testsText || '')
                          const lines = existing.split(/\n|,/).map(s => s.trim()).filter(Boolean)
                          for (const x of lines) selected[x] = true
                        } catch { }
                        setAllDiagnosticsQuery('')
                        setSelectedAllDiagnostics(selected)
                        setOpenAllDiagnosticsDialog(true)
                      }}
                      className="w-full rounded-md border border-blue-800 bg-white px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50"
                    >
                      Show All Diagnostics
                    </button>
                  </div>
                  <div className="p-2">
                    <input
                      value={radiologyQuery}
                      onChange={e => { const v = e.target.value; setRadiologyQuery(v); filterRadiology(v) }}
                      placeholder="Search radiology test"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  {loadingRadiologyTests && (
                    <div className="p-3 text-sm text-slate-500">Loading radiology tests…</div>
                  )}
                  {!loadingRadiologyTests && !!radiologyTestsError && (
                    <div className="p-3 text-sm text-red-600">{radiologyTestsError}</div>
                  )}
                  {(() => {
                    const previewCount = 10
                    const list = (radiologyOptions || [])
                    const preview = list.slice(0, previewCount)
                    const hasMore = list.length > previewCount
                    return (
                      <>
                        {preview.map((t, i) => (
                          <div key={`${t}-${i}`} className="flex items-center justify-between gap-2 px-2 py-2">
                            <div className="text-xs text-slate-800">{t}</div>
                            <button type="button" onClick={() => addRadiologyToForm(t)} aria-label="Add" title="Add" className="grid h-7 w-7 place-items-center rounded-md border border-slate-300 text-sm font-semibold leading-none hover:bg-slate-50">+</button>
                          </div>
                        ))}
                        {hasMore && (
                          <div className="p-2">
                            <button
                              type="button"
                              onClick={() => {
                                const selected: Record<string, boolean> = {}
                                try {
                                  const existing = String((form as any)?.diagDisplay?.testsText || '')
                                  const lines = existing.split(/\n|,/).map(s => s.trim()).filter(Boolean)
                                  for (const x of lines) selected[x] = true
                                } catch { }
                                setAllDiagnosticsQuery('')
                                setSelectedAllDiagnostics(selected)
                                setOpenAllDiagnosticsDialog(true)
                              }}
                              className="w-full rounded-md border border-blue-800 bg-white px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50"
                            >
                              View All
                            </button>
                          </div>
                        )}
                      </>
                    )
                  })()}
                  {!loadingRadiologyTests && !radiologyTestsError && !radiologyOptions.length && (
                    <div className="p-3 text-sm text-slate-500">No radiology tests found</div>
                  )}
                </div>
              )}
              {rightTab === 'drugs' && (
                <div className="divide-y divide-slate-100">
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selected: Record<string, boolean> = {}
                        try {
                          const rows = Array.isArray((form as any)?.meds) ? (form as any).meds : []
                          for (const r of rows) {
                            const name = String(r?.name || '').trim()
                            if (!name) continue
                            selected[name] = true
                          }
                        } catch { }
                        setAllDrugsQuery('')
                        setSelectedAllDrugs(selected)
                        setOpenAllDrugsDialog(true)
                      }}
                      className="w-full rounded-md border border-blue-800 bg-white px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50"
                    >
                      Show All Drugs
                    </button>
                  </div>
                  <div className="p-2">
                    <input
                      value={drugQuery}
                      onChange={e => { const v = e.target.value; setDrugQuery(v); searchPanelMedicines(v) }}
                      placeholder="Search drug"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  {loadingInventoryDrugs && (
                    <div className="p-3 text-sm text-slate-500">Loading inventory…</div>
                  )}
                  {!loadingInventoryDrugs && !!inventoryDrugsError && (
                    <div className="p-3 text-sm text-red-600">{inventoryDrugsError}</div>
                  )}
                  {(() => {
                    const previewCount = 10
                    const list = (drugOptions || [])
                    const preview = list.slice(0, previewCount)
                    const hasMore = list.length > previewCount
                    return (
                      <>
                        {preview.map((d, i) => (
                          <div key={`${d}-${i}`} className="flex items-center justify-between gap-2 py-2">
                            <div className="text-xs text-slate-800">{d}</div>
                            <button type="button" onClick={() => addDrugToMeds(d)} aria-label="Add" title="Add" className="grid h-7 w-7 place-items-center rounded-md border border-slate-300 text-sm font-semibold leading-none hover:bg-slate-50">+</button>
                          </div>
                        ))}
                        {hasMore && (
                          <div className="p-2">
                            <button
                              type="button"
                              onClick={() => {
                                const selected: Record<string, boolean> = {}
                                try {
                                  const rows = Array.isArray((form as any)?.meds) ? (form as any).meds : []
                                  for (const r of rows) {
                                    const name = String(r?.name || '').trim()
                                    if (!name) continue
                                    selected[name] = true
                                  }
                                } catch { }
                                setAllDrugsQuery('')
                                setSelectedAllDrugs(selected)
                                setOpenAllDrugsDialog(true)
                              }}
                              className="w-full rounded-md border border-blue-800 bg-white px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50"
                            >
                              View All
                            </button>
                          </div>
                        )}
                      </>
                    )
                  })()}
                  {!loadingInventoryDrugs && !inventoryDrugsError && !drugOptions.length && (
                    <div className="p-3 text-sm text-slate-500">No drugs found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {openAllDrugsDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-2 sm:px-4">
          <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-base font-semibold text-slate-900">All Medicines (Pharmacy Inventory)</div>
              <button
                type="button"
                onClick={() => { setOpenAllDrugsDialog(false) }}
                className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-lg text-slate-700 hover:bg-slate-50"
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto p-3 sm:p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={allDrugsQuery}
                  onChange={e => setAllDrugsQuery(e.target.value)}
                  placeholder="Search medicine"
                  className="w-full flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAllDrugs({})}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next: Record<string, boolean> = {}
                      for (const r of filteredAllDrugs.slice(0, 3000)) {
                        const name = String((r as any)?.name || '').trim()
                        if (!name) continue
                        next[name] = true
                      }
                      setSelectedAllDrugs(next)
                    }}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    Select All
                  </button>
                </div>
              </div>

              <div className="mt-3">
                {loadingInventoryDrugs && (
                  <div className="p-3 text-sm text-slate-500">Loading inventory…</div>
                )}
                {!loadingInventoryDrugs && !!inventoryDrugsError && (
                  <div className="p-3 text-sm text-red-600">{inventoryDrugsError}</div>
                )}

                {!loadingInventoryDrugs && !inventoryDrugsError && (
                  <div className="grid gap-2">
                    {filteredAllDrugs.slice(0, 500).map((r: any, i: number) => {
                      const name = String(r?.name || '').trim()
                      const onHand = r?.onHand
                      const price = r?.price
                      const checked = !!selectedAllDrugs[name]
                      return (
                        <label key={`${name}-${i}`} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50">
                          <div className="flex min-w-0 items-center gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const v = e.target.checked
                                setSelectedAllDrugs(prev => {
                                  const next = { ...prev }
                                  if (v) next[name] = true
                                  else delete next[name]
                                  return next
                                })
                              }}
                            />
                            <div className="min-w-0">
                              <div className="truncate text-sm text-slate-900">{name}</div>
                              <div className="text-xs text-slate-500">
                                {onHand != null ? `On hand: ${onHand}` : ''}{onHand != null && price != null ? ' • ' : ''}{price != null ? `Price: ${price}` : ''}
                              </div>
                            </div>
                          </div>
                        </label>
                      )
                    })}
                    {filteredAllDrugs.length > 500 && (
                      <div className="p-2 text-xs text-slate-500">Showing first 500 results. Refine search to see more.</div>
                    )}
                    {!filteredAllDrugs.length && (
                      <div className="p-3 text-sm text-slate-500">No medicines found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">Selected: {Object.keys(selectedAllDrugs).length}</div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpenAllDrugsDialog(false)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const names = Object.keys(selectedAllDrugs).filter(Boolean)
                    addManyDrugsToMeds(names)
                    setOpenAllDrugsDialog(false)
                    setActiveTab('medications')
                    showToast('success', `${names.length} medicine(s) added`)
                  }}
                  disabled={!Object.keys(selectedAllDrugs).length}
                  className="w-full rounded-md bg-blue-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-blue-900 sm:w-auto"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {openAllTemplatesDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-2 sm:px-4">
          <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-base font-semibold text-slate-900">All Templates</div>
              <button
                type="button"
                onClick={() => setOpenAllTemplatesDialog(false)}
                className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-lg text-slate-700 hover:bg-slate-50"
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto p-3 sm:p-4">
              <input
                value={allTemplatesQuery}
                onChange={e => setAllTemplatesQuery(e.target.value)}
                placeholder="Search template"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="mt-3 divide-y divide-slate-100">
                {(() => {
                  const q = String(allTemplatesQuery || '').trim().toLowerCase()
                  const list = (templates || []).filter((t: any) => {
                    const name = String(t?.name || '')
                    if (!q) return true
                    return name.toLowerCase().includes(q)
                  })
                  if (!list.length) return <div className="p-3 text-sm text-slate-500">No templates</div>
                  return list.map((t: any) => (
                    <div
                      key={`all-${String(t?._id)}`}
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-slate-50"
                      onClick={() => { applyTemplateToPrescription(t); setOpenAllTemplatesDialog(false) }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); applyTemplateToPrescription(t); setOpenAllTemplatesDialog(false) } }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-slate-800">{String(t?.name || '')}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openEditTemplate(t) }}
                          className="grid h-8 w-8 place-items-center rounded-md border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                          title="Edit"
                          aria-label="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); requestDeleteTemplate(t) }}
                          className="grid h-8 w-8 place-items-center rounded-md border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                          title="Delete"
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {openDeleteTemplateDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-2 sm:px-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-base font-semibold text-slate-900">Delete Template</div>
              <button
                type="button"
                onClick={() => setOpenDeleteTemplateDialog(false)}
                className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-lg text-slate-700 hover:bg-slate-50"
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>

            <div className="p-4">
              <div className="text-sm text-slate-700">Are you sure you want to delete this template?</div>
              {!!deleteTemplateName && (
                <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                  {deleteTemplateName}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpenDeleteTemplateDialog(false)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = String(deleteTemplateId || '').trim()
                  if (!id) { setOpenDeleteTemplateDialog(false); return }
                  await deleteTemplate(id)
                  setOpenDeleteTemplateDialog(false)
                }}
                className="w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 sm:w-auto"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {openAllLabTestsDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-2 sm:px-4">
          <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-base font-semibold text-slate-900">All Lab Tests</div>
              <button
                type="button"
                onClick={() => setOpenAllLabTestsDialog(false)}
                className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-lg text-slate-700 hover:bg-slate-50"
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto p-3 sm:p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={allLabTestsQuery}
                  onChange={e => setAllLabTestsQuery(e.target.value)}
                  placeholder="Search lab test"
                  className="w-full flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelectedAllLabTests({})} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">Clear</button>
                </div>
              </div>

              <div className="mt-3">
                {loadingLabTests && (
                  <div className="p-3 text-sm text-slate-500">Loading lab tests…</div>
                )}
                {!loadingLabTests && !!labTestsError && (
                  <div className="p-3 text-sm text-red-600">{labTestsError}</div>
                )}
                {!loadingLabTests && !labTestsError && (
                  <div className="grid gap-2">
                    {allLabTestOptions
                      .filter(t => {
                        const q = String(allLabTestsQuery || '').trim().toLowerCase()
                        if (!q) return true
                        return String(t || '').toLowerCase().includes(q)
                      })
                      .slice(0, 500)
                      .map((t: string, i: number) => {
                        const name = String(t || '').trim()
                        if (!name) return null
                        const checked = !!selectedAllLabTests[name]
                        return (
                          <label key={`${name}-${i}`} className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const v = e.target.checked
                                setSelectedAllLabTests(prev => {
                                  const next = { ...prev }
                                  if (v) next[name] = true
                                  else delete next[name]
                                  return next
                                })
                              }}
                            />
                            <div className="min-w-0 truncate text-sm text-slate-900">{name}</div>
                          </label>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">Selected: {Object.keys(selectedAllLabTests).length}</div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setOpenAllLabTestsDialog(false)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 sm:w-auto">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    const names = Object.keys(selectedAllLabTests).filter(Boolean)
                    addManyLabTestsToForm(names)
                    setOpenAllLabTestsDialog(false)
                    setActiveTab('details')
                    showToast('success', `${names.length} lab test(s) added`)
                  }}
                  disabled={!Object.keys(selectedAllLabTests).length}
                  className="w-full rounded-md bg-blue-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-blue-900 sm:w-auto"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {openAllDiagnosticsDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-2 sm:px-4">
          <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-base font-semibold text-slate-900">All Diagnostics</div>
              <button
                type="button"
                onClick={() => setOpenAllDiagnosticsDialog(false)}
                className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-lg text-slate-700 hover:bg-slate-50"
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto p-3 sm:p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={allDiagnosticsQuery}
                  onChange={e => setAllDiagnosticsQuery(e.target.value)}
                  placeholder="Search diagnostic test"
                  className="w-full flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelectedAllDiagnostics({})} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">Clear</button>
                </div>
              </div>

              <div className="mt-3">
                {loadingRadiologyTests && (
                  <div className="p-3 text-sm text-slate-500">Loading diagnostics…</div>
                )}
                {!loadingRadiologyTests && !!radiologyTestsError && (
                  <div className="p-3 text-sm text-red-600">{radiologyTestsError}</div>
                )}
                {!loadingRadiologyTests && !radiologyTestsError && (
                  <div className="grid gap-2">
                    {allRadiologyOptions
                      .filter(t => {
                        const q = String(allDiagnosticsQuery || '').trim().toLowerCase()
                        if (!q) return true
                        return String(t || '').toLowerCase().includes(q)
                      })
                      .slice(0, 500)
                      .map((t: string, i: number) => {
                        const name = String(t || '').trim()
                        if (!name) return null
                        const checked = !!selectedAllDiagnostics[name]
                        return (
                          <label key={`${name}-${i}`} className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const v = e.target.checked
                                setSelectedAllDiagnostics(prev => {
                                  const next = { ...prev }
                                  if (v) next[name] = true
                                  else delete next[name]
                                  return next
                                })
                              }}
                            />
                            <div className="min-w-0 truncate text-sm text-slate-900">{name}</div>
                          </label>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">Selected: {Object.keys(selectedAllDiagnostics).length}</div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setOpenAllDiagnosticsDialog(false)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 sm:w-auto">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    const names = Object.keys(selectedAllDiagnostics).filter(Boolean)
                    addManyDiagnosticsToForm(names)
                    setOpenAllDiagnosticsDialog(false)
                    setActiveTab('details')
                    showToast('success', `${names.length} diagnostic test(s) added`)
                  }}
                  disabled={!Object.keys(selectedAllDiagnostics).length}
                  className="w-full rounded-md bg-blue-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-blue-900 sm:w-auto"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {openTemplateDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-2 sm:px-4">
          <div className="w-full max-w-5xl rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-base font-semibold text-slate-900">Add Template</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setOpenTemplateDialog(false); resetTemplateDialog() }}
                  className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-lg text-slate-700 hover:bg-slate-50"
                  aria-label="Close"
                  title="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="max-h-[85vh] overflow-y-auto p-3 sm:p-4">
              <div className="mb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="w-full flex-1">
                    <label className="mb-1 block text-sm text-slate-700">Template Name</label>
                    <input
                      value={templateName}
                      onChange={e => setTemplateName(e.target.value)}
                      placeholder="Template name"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={saveTemplate}
                    className="w-full rounded-md bg-blue-800 px-3 py-2 text-sm font-medium text-white hover:bg-blue-900 sm:w-auto"
                  >
                    Save Template
                  </button>
                </div>
              </div>

              <div className="mt-2 border-b border-slate-200">
                <nav className="-mb-px flex gap-2 overflow-x-auto whitespace-nowrap">
                  <button type="button" onClick={() => setTemplateTab('prescriptions')} className={`px-3 py-2 text-sm ${templateTab === 'prescriptions' ? 'border-b-2 border-sky-600 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>Prescriptions</button>
                  <button type="button" onClick={() => setTemplateTab('medications')} className={`px-3 py-2 text-sm ${templateTab === 'medications' ? 'border-b-2 border-sky-600 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>Medications</button>
                  <button type="button" onClick={() => setTemplateTab('labs')} className={`px-3 py-2 text-sm ${templateTab === 'labs' ? 'border-b-2 border-sky-600 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>Lab Orders</button>
                  <button type="button" onClick={() => setTemplateTab('radiology')} className={`px-3 py-2 text-sm ${templateTab === 'radiology' ? 'border-b-2 border-sky-600 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>Radiology Orders</button>
                </nav>
              </div>

              <div className="pt-3">
                {templateTab === 'prescriptions' && (
                  <>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="grid gap-3">
                        <div className="grid gap-2 sm:grid-cols-3">
                          {quickCreateChecks.map((label) => (
                            <label key={label} className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={!!templateCreateChecks[label]}
                                onChange={(e) => {
                                  const checked = e.target.checked
                                  setTemplateCreateChecks(prev => ({ ...prev, [label]: checked }))
                                  templateToggleInField('primaryComplaint', label)
                                }}
                              />
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>

                        <div className="mt-1 grid gap-2">
                          <input
                            value={templateCreateOther}
                            onChange={e => setTemplateCreateOther(e.target.value)}
                            placeholder="Other"
                            className="w-full rounded-md border border-slate-500 px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="grid gap-2">

                        </div>

                        <div className="mt-7 grid gap-2 sm:grid-cols-3">
                          {quickCreateButtons.map((x) => (
                            <button
                              key={x}
                              type="button"
                              onClick={() => templateToggleInField('primaryComplaint', x)}
                              className={cardClass(templateHasInField('primaryComplaint', x))}
                            >
                              {x}
                            </button>
                          ))}
                        </div>

                        <div className="mt-1 grid gap-2">
                          <input
                            value={templateCreateOther}
                            onChange={e => setTemplateCreateOther(e.target.value)}
                            placeholder="Other"
                            className="w-full rounded-md border border-slate-500 px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="mt-1 grid gap-2">
                          <div className="mt-9 grid gap-2 sm:grid-cols-3">
                            {quickExamButtons.map((x) => (
                              <button
                                key={x}
                                type="button"
                                onClick={() => templateToggleInField('history', x)}
                                className={cardClass(templateHasInField('history', x))}
                              >
                                {x}
                              </button>
                            ))}
                          </div>
                          <div className="mt-1">
                            <input
                              value={templateExamOther}
                              onChange={e => setTemplateExamOther(e.target.value)}
                              placeholder="Other"
                              className="w-full rounded-md border border-slate-500 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div className="mt-1 grid gap-2">
                          <div className="mt-8 grid gap-2 sm:grid-cols-3">
                            {quickRiskButtons.map((x) => (
                              <button
                                key={x}
                                type="button"
                                onClick={() => templateToggleInField('history', x)}
                                className={cardClass(templateHasInField('history', x))}
                              >
                                {x}
                              </button>
                            ))}
                          </div>
                          <div className="mt-1">
                            <input
                              value={templateRiskOther}
                              onChange={e => setTemplateRiskOther(e.target.value)}
                              placeholder="Other"
                              className="w-full rounded-md border border-slate-500 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div className="mt-1 grid gap-2">
                          <div className="mt-9 grid gap-2 sm:grid-cols-3">
                            {quickFamilyButtons.map((x) => (
                              <button
                                key={x}
                                type="button"
                                onClick={() => templateToggleInField('history', x)}
                                className={cardClass(templateHasInField('history', x))}
                              >
                                {x}
                              </button>
                            ))}
                          </div>
                          <input
                            value={templateFhOther}
                            onChange={e => setTemplateFhOther(e.target.value)}
                            placeholder="Other"
                            className="w-full rounded-md border border-slate-500 px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="mt-8 grid gap-2 sm:grid-cols-2">
                          <div ref={templateAorticRef} className="relative">
                            <button
                              type="button"
                              onClick={() => setTemplateAorticOpen(v => !v)}
                              className="flex min-h-[42px] w-full items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm"
                            >
                              <div className="flex flex-wrap gap-2">
                                {templateAorticSelected.length === 0 ? (
                                  <span className="text-slate-500">Select</span>
                                ) : (
                                  templateAorticSelected.map((x) => (
                                    <span key={x} className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs text-black">
                                      <span className="truncate max-w-[260px]">{x}</span>
                                      <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => { e.stopPropagation(); templateToggleAortic(x) }}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); templateToggleAortic(x) } }}
                                        className="grid h-5 w-5 place-items-center rounded-full bg-blue-800 text-xs text-white cursor-pointer"
                                        aria-label="Remove"
                                      >
                                        ×
                                      </span>
                                    </span>
                                  ))
                                )}
                              </div>
                              <span className="text-slate-600">▾</span>
                            </button>

                            {templateAorticOpen && (
                              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                                {aorticOptions.map((opt) => {
                                  const selected = templateAorticSelected.some(x => x.toLowerCase() === opt.toLowerCase())
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => templateToggleAortic(opt)}
                                      className={`block w-full px-3 py-2 text-left text-sm ${selected ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                                    >
                                      {opt}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>

                          <input
                            value={templateSelectOther}
                            onChange={e => setTemplateSelectOther(e.target.value)}
                            placeholder="Other"
                            className="w-full rounded-md border border-slate-500 px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="mt-2 grid gap-2">
                          <div className="relative">
                            <textarea
                              rows={2}
                              value={templateNote1}
                              onChange={e => setTemplateNote1(e.target.value)}
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="relative">
                            <textarea
                              rows={2}
                              value={templateNote2}
                              onChange={e => setTemplateNote2(e.target.value)}
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div className="mt-2 grid gap-2">
                          <div className="grid gap-2 sm:grid-cols-3">
                            {quickAtriumButtons.map((x) => (
                              <button
                                key={x}
                                type="button"
                                onClick={() => templateToggleInField('history', x)}
                                className={cardClass(templateHasInField('history', x))}
                              >
                                {x}
                              </button>
                            ))}
                          </div>
                          <input
                            value={templateAtriumOther}
                            onChange={e => setTemplateAtriumOther(e.target.value)}
                            placeholder="Other"
                            className="w-full rounded-md border border-slate-500 px-3 py-2 text-sm"
                          />

                        </div>

                        <div className="mt-9 grid gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              value={templateMultiInput}
                              onChange={(e) => setTemplateMultiInput(e.target.value)}
                              placeholder="Other"
                              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const v = String(templateMultiInput || '').trim()
                                if (!v) return
                                setTemplateMultiSelectRows(prev => {
                                  const cleaned = prev.map(x => String(x || '').trim()).filter(Boolean)
                                  if (cleaned.some(x => x.toLowerCase() === v.toLowerCase())) return cleaned
                                  return [...cleaned, v]
                                })
                                templateAppendToField('history', v)
                                setTemplateMultiInput('')
                              }}
                              className="inline-flex items-center rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
                            >
                              + Add
                            </button>
                          </div>

                          {templateMultiSelectRows.map((x, idx) => (
                            String(x || '').trim() ? (
                              <div key={`${x}-${idx}`} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                                <div className="text-slate-800">{String(x).trim()}</div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const v = String(x || '').trim()
                                    setTemplateMultiSelectRows(prev => prev.filter((_, i) => i !== idx))
                                    setTemplateForm(f => {
                                      const raw = String((f as any).history || '')
                                      const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
                                      const nextParts = parts.filter(p => p.toLowerCase() !== v.toLowerCase())
                                      return { ...f, history: nextParts.join(', ') } as any
                                    })
                                  }}
                                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                                  title="Delete"
                                  aria-label="Delete"
                                >
                                  🗑️
                                </button>
                              </div>
                            ) : null
                          ))}
                        </div>
                      </div>
                    </div>

                  </>
                )}

                {templateTab === 'medications' && (
                  <div>
                    <div className="mb-1 block text-sm text-slate-700">Medicines</div>
                    <div className="grid gap-3">
                      {(templateForm.meds || []).map((m, idx) => (
                        <div key={idx} className="rounded-xl border border-blue-800 bg-white p-3">
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <label className="mb-1 block text-sm text-slate-700">Name</label>
                              <SuggestField as="input" value={(m as any).name || ''} onChange={v => setTemplateMed(idx, 'name', v)} suggestions={(inventoryDrugOptions || []).map(r => r.name)} placeholder="Medicine name" />
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <div className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800">
                                  {(() => {
                                    const it = inventoryDrugByName.get(String((m as any).name || '').trim().toLowerCase())
                                    const v = it?.price
                                    return (v == null || Number.isNaN(Number(v))) ? '-' : String(Number(v).toFixed(1))
                                  })()}
                                </div>
                                <div className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800">
                                  {(() => {
                                    const it = inventoryDrugByName.get(String((m as any).name || '').trim().toLowerCase())
                                    const v = it?.onHand
                                    return (v == null || Number.isNaN(Number(v))) ? '-' : String(v)
                                  })()}
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="mb-1 block text-sm text-slate-700">Duration</label>
                              <div className="flex flex-col gap-1">
                                {(() => {
                                  const parsed = parseNumberAndUnit(String((m as any).durationText || ''), { defaultUnit: 'Day(s)', allowedUnits: sugDuration })
                                  return (
                                    <>
                                      <input
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        step={1}
                                        value={parsed.num}
                                        onChange={e => {
                                          const v = e.target.value
                                          setTemplateMed(idx, 'durationText', combineNumberAndUnit(v, parsed.unit))
                                        }}
                                        placeholder="Duration"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                      />
                                      <select
                                        value={parsed.unit}
                                        onChange={e => {
                                          const unit = e.target.value
                                          const now = parseNumberAndUnit(String((templateForm.meds[idx] as any)?.durationText || ''), { defaultUnit: 'Day(s)', allowedUnits: sugDuration })
                                          const num = String(now.num || '').trim() || '1'
                                          setTemplateMed(idx, 'durationText', combineNumberAndUnit(num, unit))
                                        }}
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                      >
                                        {sugDuration.map((s, i) => (
                                          <option key={`${s}-${i}`} value={s}>{s}</option>
                                        ))}
                                      </select>
                                    </>
                                  )
                                })()}
                              </div>
                            </div>

                            <div>
                              <label className="mb-1 block text-sm text-slate-700">Dosage</label>
                              <div className="flex flex-col gap-1">
                                {(() => {
                                  const parsed = parseNumberAndUnit(String((m as any).qty || ''), { defaultUnit: 'Tablet(s)', allowedUnits: sugDose })
                                  return (
                                    <>
                                      <input
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        step={1}
                                        value={parsed.num}
                                        onChange={e => {
                                          const v = e.target.value
                                          setTemplateMed(idx, 'qty', combineNumberAndUnit(v, parsed.unit))
                                        }}
                                        placeholder="Dosage"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                      />
                                      <select
                                        value={parsed.unit}
                                        onChange={e => {
                                          const unit = e.target.value
                                          const now = parseNumberAndUnit(String((templateForm.meds[idx] as any)?.qty || ''), { defaultUnit: 'Tablet(s)', allowedUnits: sugDose })
                                          const num = String(now.num || '').trim() || '1'
                                          setTemplateMed(idx, 'qty', combineNumberAndUnit(num, unit))
                                        }}
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                      >
                                        {sugDose.map((s, i) => (
                                          <option key={`${s}-${i}`} value={s}>{s}</option>
                                        ))}
                                      </select>
                                    </>
                                  )
                                })()}
                              </div>
                            </div>

                            <div>
                              <label className="mb-1 block text-sm text-slate-700">Route</label>
                              <SuggestField as="input" value={(m as any).route || ''} onChange={v => setTemplateMed(idx, 'route', v)} suggestions={sugRoute} placeholder="Select Route" />
                            </div>

                            <div>
                              <label className="mb-1 block text-sm text-slate-700">Frequency</label>
                              <SuggestField as="input" value={(m as any).freqText || ''} onChange={v => setTemplateMed(idx, 'freqText', v)} suggestions={sugFreq} placeholder="Frequency" />
                            </div>

                            <div>
                              <label className="mb-1 block text-sm text-slate-700">Instruction</label>
                              <SuggestField as="input" value={(m as any).instruction || ''} onChange={v => setTemplateMed(idx, 'instruction', v)} suggestions={sugInstr} placeholder="Instruction" />
                            </div>
                          </div>

                          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <button type="button" onClick={() => removeTemplateAt(idx)} className="w-full rounded-md bg-rose-600 px-2 py-2 text-xs font-medium text-white hover:bg-rose-700 sm:w-auto sm:py-1" title="Remove">🗑️ Remove</button>
                            <button type="button" onClick={() => addTemplateAfter(idx)} className="w-full rounded-md bg-sky-600 px-2 py-2 text-xs font-medium text-white hover:bg-sky-700 sm:w-auto sm:py-1">+ Drug</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <label className="mb-1 block text-sm text-slate-700">Medication Note</label>
                      <textarea
                        rows={3}
                        value={String((templateForm as any).medicationNotes || '')}
                        onChange={e => setTemplateForm(f => ({ ...f, medicationNotes: e.target.value }))}
                        placeholder="Medication note"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}

                {templateTab === 'labs' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm text-slate-700">Lab Tests</label>
                      <div className="flex items-end gap-2">
                        <div className="min-w-0 flex-1">
                          <SuggestField
                            as="input"
                            value={templateLabPick}
                            onChange={v => setTemplateLabPick(v)}
                            suggestions={allLabTestOptions || []}
                            placeholder="Type lab test"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const v = String(templateLabPick || '').trim()
                            if (!v) return
                            setTemplateForm(f => {
                              const existing = String((f as any).labTestsText || '')
                              const lines = existing.split(/\n|,/).map(s => s.trim()).filter(Boolean)
                              const lower = new Set(lines.map(x => x.toLowerCase()))
                              if (!lower.has(v.toLowerCase())) lines.push(v)
                              return { ...f, labTestsText: lines.join('\n') }
                            })
                            setTemplateLabPick('')
                          }}
                          className="h-10 shrink-0 rounded-md border border-blue-800 bg-white px-4 text-sm font-medium text-blue-800 hover:bg-blue-50"
                        >
                          Add
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={templateForm.labTestsText}
                        onChange={e => setTemplateForm(f => ({ ...f, labTestsText: e.target.value }))}
                        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-slate-700">Lab Notes</label>
                      <SuggestField rows={2} value={templateForm.labNotes} onChange={v => setTemplateForm(f => ({ ...f, labNotes: v }))} suggestions={sugLabNotes} />
                    </div>
                  </div>
                )}

                {templateTab === 'radiology' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm text-slate-700">Radiology Tests</label>
                      <div className="flex items-end gap-2">
                        <div className="min-w-0 flex-1">
                          <SuggestField
                            as="input"
                            value={templateRadiologyPick}
                            onChange={v => setTemplateRadiologyPick(v)}
                            suggestions={allRadiologyOptions || []}
                            placeholder="Type radiology test"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const v = String(templateRadiologyPick || '').trim()
                            if (!v) return
                            setTemplateForm(f => {
                              const existing = String((f as any).radiologyTestsText || '')
                              const lines = existing.split(/\n|,/).map(s => s.trim()).filter(Boolean)
                              const lower = new Set(lines.map(x => x.toLowerCase()))
                              if (!lower.has(v.toLowerCase())) lines.push(v)
                              return { ...f, radiologyTestsText: lines.join('\n') }
                            })
                            setTemplateRadiologyPick('')
                          }}
                          className="h-10 shrink-0 rounded-md border border-blue-800 bg-white px-4 text-sm font-medium text-blue-800 hover:bg-blue-50"
                        >
                          Add
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={templateForm.radiologyTestsText}
                        onChange={e => setTemplateForm(f => ({ ...f, radiologyTestsText: e.target.value }))}
                        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-slate-700">Radiology Notes</label>
                      <textarea rows={3} value={templateForm.radiologyNotes} onChange={e => setTemplateForm(f => ({ ...f, radiologyNotes: e.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <PrescriptionPrint
        printId="prescription-print"
        doctor={{ name: doc?.name, specialization: doctorInfo?.specialization, qualification: doctorInfo?.qualification, departmentName: doctorInfo?.departmentName, phone: doctorInfo?.phone }}
        settings={settings}
        patient={{ name: sel?.patientName || '-', mrn: sel?.mrNo || '-', gender: pat?.gender, fatherName: pat?.fatherName, age: pat?.age, phone: pat?.phone, address: pat?.address }}
        items={(Array.isArray(dbPrescription?.items) ? dbPrescription.items : form.meds)
          .filter((m: any) => String(m?.name || '').trim())
          .map((m: any) => ({
            name: String(m.name || ''),
            frequency: String((m.frequency ?? m.freqText) || ''),
            duration: String((m.duration ?? m.durationText) || ''),
            dose: (m.dose ?? m.qty) != null ? String(m.dose ?? m.qty) : undefined,
            instruction: (m.instruction != null && String(m.instruction).trim()) ? String(m.instruction) : undefined,
            route: (m.route != null && String(m.route).trim()) ? String(m.route) : undefined,
          }))}
        labTests={Array.isArray(dbPrescription?.labTests)
          ? dbPrescription.labTests
          : String((form as any).labDisplay?.testsText || '').split(/\n|,/).map(s => s.trim()).filter(Boolean)}
        labNotes={(dbPrescription?.labNotes != null)
          ? String(dbPrescription?.labNotes || '')
          : String((form as any).labDisplay?.notes || '')}
        diagnosticTests={Array.isArray(dbPrescription?.diagnosticTests)
          ? dbPrescription.diagnosticTests
          : String((form as any).diagDisplay?.testsText || '').split(/\n|,/).map(s => s.trim()).filter(Boolean)}
        diagnosticNotes={(dbPrescription?.diagnosticNotes != null)
          ? String(dbPrescription?.diagnosticNotes || '')
          : String((form as any).diagDisplay?.notes || '')}
        primaryComplaint={mergeTextOnce(String((dbPrescription?.primaryComplaint ?? form.primaryComplaint) || ''), createOther, ', ')}
        primaryComplaintHistory={String((dbPrescription?.primaryComplaintHistory ?? form.primaryComplaintHistory) || '')}
        familyHistory={String((dbPrescription?.familyHistory ?? form.familyHistory) || '')}
        allergyHistory={String((dbPrescription?.allergyHistory ?? form.allergyHistory) || '')}
        treatmentHistory={String((dbPrescription?.treatmentHistory ?? form.treatmentHistory) || '')}
        history={stripImprovementFollowupFromHistory(appendLabeledLineOnce(
          appendLabeledLineOnce(
            appendLabeledLineOnce(
              appendLabeledLineOnce(
                appendLabeledLineOnce(
                  appendLabeledLineOnce(String((dbPrescription?.history ?? form.history) || ''), 'Risk', riskOther),
                  'Family History', fhOther
                ),
                'Other', selectOther
              ),
              'Atrium', atriumOther
            ),
            'Note 1', note1
          ),
          'Note 2', note2
        ))}
        examFindings={mergeTextOnce(String((dbPrescription?.examFindings ?? form.examFindings) || ''), examOther, '\n')}
        diagnosis={String((dbPrescription?.diagnosis ?? form.diagnosis) || '')}
        advice={String((dbPrescription?.advice ?? form.advice) || '')}
        improvement={String((dbPrescription?.improvement ?? improvement) || '')}
        followupDate={String((dbPrescription?.followupDate ?? followupDate) || '')}
        createdAt={new Date()}
        vitals={dbPrescription?.vitals || form.vitalsNormalized}
      />
    </div>
  )
}

async function fetchPrintData(id: string) {
  const stripImprovementFollowupFromHistory = (raw?: any) => {
    const s = String(raw || '')
    if (!s.trim()) return ''
    const lines = s
      .split(/\r?\n/)
      .map((l: string) => String(l || '').trimEnd())
      .filter((l: string) => {
        const t = l.trimStart()
        if (!t) return false
        if (/^improvement\s*:/i.test(t)) return false
        if (/^follow-?up\s*:/i.test(t)) return false
        return true
      })
    return lines.join('\n').trim()
  }
  const [detail, settings] = await Promise.all([
    hospitalApi.getPrescription(id) as any,
    hospitalApi.getSettings() as any,
  ])
  const pres = detail?.prescription
  let patient: any = { name: pres?.encounterId?.patientId?.fullName || '-', mrn: pres?.encounterId?.patientId?.mrn || '-' }
  try {
    if (patient?.mrn) {
      const resp: any = await labApi.getPatientByMrn(patient.mrn)
      const p = resp?.patient
      if (p) {
        let ageTxt = ''
        try {
          if (p.age != null) ageTxt = String(p.age)
          else if (p.dob) { const dob = new Date(p.dob); if (!isNaN(dob.getTime())) ageTxt = String(Math.max(0, Math.floor((Date.now() - dob.getTime()) / 31557600000))) }
        } catch { }
        patient = { name: p.fullName || patient.name, mrn: p.mrn || patient.mrn, gender: p.gender || '-', fatherName: p.fatherName || '-', phone: p.phoneNormalized || '-', address: p.address || '-', age: ageTxt }
      }
    }
  } catch { }
  let doctor: any = { name: pres?.encounterId?.doctorId?.name || '-', specialization: '', qualification: '', departmentName: '', phone: '' }
  try {
    const drList: any = await hospitalApi.listDoctors()
    const doctors: any[] = drList?.doctors || []
    const drId = String(pres?.encounterId?.doctorId?._id || pres?.encounterId?.doctorId || '')
    const d = doctors.find(x => String(x._id || x.id) === drId)
    if (d) doctor = { name: d.name || doctor.name, specialization: d.specialization || '', qualification: d.qualification || '', departmentName: '', phone: d.phone || '' }
    try {
      const depRes: any = await hospitalApi.listDepartments()
      const depArray: any[] = (depRes?.departments || depRes || []) as any[]
      const deptName = d?.primaryDepartmentId ? (depArray.find((z: any) => String(z._id || z.id) === String(d.primaryDepartmentId))?.name || '') : ''
      if (deptName) doctor.departmentName = deptName
    } catch { }
  } catch { }
  // Doctor-specific print settings override (only for prescription print page)
  let effSettings = settings
  try {
    const doctorId = String(pres?.encounterId?.doctorId?._id || pres?.encounterId?.doctorId || '')
    if (doctorId) {
      const raw = localStorage.getItem(`doctor.rx.print.hospital.${doctorId}`)
      const s = raw ? JSON.parse(raw) : null
      if (s && typeof s === 'object') {
        effSettings = {
          name: String(s.name || settings?.name || ''),
          address: String(s.address || settings?.address || ''),
          phone: String(s.phone || settings?.phone || ''),
          logoDataUrl: s.logoDataUrl || settings?.logoDataUrl,
        }
      }
    }
  } catch { }
  return { settings: effSettings, doctor, patient, items: pres?.items || [], vitals: pres?.vitals, labTests: pres?.labTests || [], labNotes: pres?.labNotes, diagnosticTests: pres?.diagnosticTests || [], diagnosticNotes: pres?.diagnosticNotes, primaryComplaint: pres?.primaryComplaint || pres?.complaints, primaryComplaintHistory: pres?.primaryComplaintHistory, familyHistory: pres?.familyHistory, allergyHistory: pres?.allergyHistory, treatmentHistory: pres?.treatmentHistory, history: stripImprovementFollowupFromHistory(pres?.history), examFindings: pres?.examFindings, diagnosis: pres?.diagnosis, advice: pres?.advice, medicationNotes: (pres as any)?.medicationNotes, improvement: pres?.improvement, followupDate: pres?.followupDate, createdAt: pres?.createdAt, detailsExtras: pres?.detailsExtras || {} }
}
