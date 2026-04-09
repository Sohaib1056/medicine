import { useEffect, useState } from 'react'
import { getSavedPrescriptionPdfTemplate, previewPrescriptionPdf } from '../../utils/prescriptionPdf'
import type { PrescriptionPdfTemplate } from '../../utils/prescriptionPdf'
import { hospitalApi } from '../../utils/api'
 

type DoctorDetails = {
  name: string
  qualification: string
  designation: string
  departmentName: string
  phone: string
}

type HospitalSettings = {
  name: string
  phone: string
  address: string
  logoDataUrl?: string
}

export default function Doctor_Settings(){
  type DoctorSession = { id: string; name?: string; username?: string }
  const [doc, setDoc] = useState<DoctorSession | null>(null)
  const [tpl, setTpl] = useState<PrescriptionPdfTemplate>('default')
  const [mode, setMode] = useState<'electronic'|'manual'>('electronic')
  const [doctorDetails, setDoctorDetails] = useState<DoctorDetails>({
    name: '',
    qualification: '',
    designation: '',
    departmentName: '',
    phone: ''
  })
  const [hospitalSettings, setHospitalSettings] = useState<HospitalSettings>({
    name: 'Hospital',
    phone: '',
    address: '',
    logoDataUrl: undefined
  })
  const [saved, setSaved] = useState(false)
  const [savingHospital, setSavingHospital] = useState(false)

  useEffect(() => {
    try {
      const key = `doctor.rx.print.hospital.${doc?.id || 'anon'}`
      const raw = localStorage.getItem(key)
      const s = raw ? JSON.parse(raw) : null
      if (s) setHospitalSettings({
        name: s.name || '',
        phone: s.phone || '',
        address: s.address || '',
        logoDataUrl: s.logoDataUrl || undefined,
      })
    } catch {}
  }, [doc?.id])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('doctor.session')
      const sess = raw ? JSON.parse(raw) : null
      setDoc(sess)
      setTpl(getSavedPrescriptionPdfTemplate(sess?.id))
      const mk = `doctor.rx.mode.${sess?.id || 'anon'}`
      const mv = localStorage.getItem(mk)
      if (mv === 'manual' || mv === 'electronic') setMode(mv)
      
      // Load doctor details from localStorage
      const dk = `doctor.details.${sess?.id || 'anon'}`
      const dRaw = localStorage.getItem(dk)
      if (dRaw) {
        try {
          const details = JSON.parse(dRaw)
          setDoctorDetails(prev => ({ ...prev, ...details }))
        } catch {}
      }
      
      // Load hospital settings
      ;(async () => {
        try {
          const s = await hospitalApi.getSettings() as any
          if (s) {
            setHospitalSettings({
              name: s.name || 'Hospital',
              phone: s.phone || '',
              address: s.address || '',
              logoDataUrl: s.logoDataUrl
            })
          }
        } catch {}
      })()
    } catch {}
  }, [])

  // Auto-load doctor profile from backend based on logged-in doctor
  useEffect(() => {
    const loadDoctor = async () => {
      try {
        if (!doc?.id) return
        let doctorId = String(doc.id || '')
        const hex24 = /^[a-f\d]{24}$/i
        if (!hex24.test(doctorId)) {
          try {
            const res: any = await hospitalApi.listDoctors()
            const docs: any[] = res?.doctors || []
            const match = docs.find(d => String(d.username || '').toLowerCase() === String(doc.username || '').toLowerCase())
              || docs.find(d => String(d.name || '').toLowerCase() === String(doc.name || '').toLowerCase())
            if (match) {
              doctorId = String(match._id || match.id)
              const fixed = { ...doc, id: doctorId }
              try { localStorage.setItem('doctor.session', JSON.stringify(fixed)) } catch {}
              setDoc(fixed)
            }
          } catch {}
        }
        if (!doctorId) return
        const resp: any = await hospitalApi.getDoctor(doctorId)
        const d = resp?.doctor || resp
        if (d) {
          let departmentName = ''
          try {
            const depRes: any = await hospitalApi.listDepartments()
            const deps: any[] = depRes?.departments || depRes || []
            const dep = deps.find((z: any) => String(z._id || z.id) === String(d.primaryDepartmentId))
            departmentName = dep?.name || ''
          } catch {}
          setDoctorDetails(prev => ({
            ...prev,
            name: d.name || prev.name,
            qualification: d.qualification || prev.qualification,
            designation: d.specialization || prev.designation,
            departmentName: departmentName || prev.departmentName,
            phone: d.phone || prev.phone,
          }))
        }
      } catch {}
    }
    loadDoctor()
  }, [doc?.id])

  const save = () => {
    try {
      const k = `doctor.rx.template.${doc?.id || 'anon'}`
      localStorage.setItem(k, tpl)
      const mk = `doctor.rx.mode.${doc?.id || 'anon'}`
      localStorage.setItem(mk, mode)
      
      // Save doctor details
      const dk = `doctor.details.${doc?.id || 'anon'}`
      localStorage.setItem(dk, JSON.stringify(doctorDetails))
      
      setSaved(true)
      setTimeout(()=>setSaved(false), 1500)
    } catch {}
  }

  const saveHospital = async () => {
    try {
      setSavingHospital(true)
      const key = `doctor.rx.print.hospital.${doc?.id || 'anon'}`
      localStorage.setItem(key, JSON.stringify({
        name: hospitalSettings.name || '',
        address: hospitalSettings.address || '',
        phone: hospitalSettings.phone || '',
        logoDataUrl: hospitalSettings.logoDataUrl || undefined,
      }))
      setSaved(true)
      setTimeout(()=>setSaved(false), 1500)
    } catch {}
    setSavingHospital(false)
  }

  const previewSample = async () => {
    // Minimal sample preview just to visualize layout
    await previewPrescriptionPdf({
      doctor: { 
        name: doctorDetails.name || doc?.name || 'Doctor', 
        qualification: doctorDetails.qualification || 'MBBS, FCPS', 
        departmentName: doctorDetails.departmentName || 'OPD', 
        phone: doctorDetails.phone || '' 
      },
      settings: { 
        name: hospitalSettings.name || 'Hospital', 
        address: hospitalSettings.address || 'Address Hospital Address City, Country', 
        phone: hospitalSettings.phone || '0300-0000000', 
        logoDataUrl: hospitalSettings.logoDataUrl || '' 
      },
      patient: { name: 'John Doe', mrn: 'MR0001', gender: 'M', age: '30', phone: '0300-1234567', address: 'Street, City' },
      vitals: { pulse: 76, temperatureC: 36.9, bloodPressureSys: 120, bloodPressureDia: 80, respiratoryRate: 18, spo2: 98 },
      items: [
        { name: 'Tab. Paracetamol 500mg', frequency: 'morning / night', duration: '5 days', dose: '1 tablet', instruction: 'After meals', route: 'Oral' },
        { name: 'Cap. Omeprazole 20mg', frequency: 'once a day', duration: '7 days', dose: '1 capsule', instruction: 'Before breakfast', route: 'Oral' },
      ],
      labTests: ['CBC', 'LFT'],
      labNotes: 'Fasting',
      diagnosticTests: ['Ultrasound Abdomen'],
      diagnosticNotes: 'ASAP',
      createdAt: new Date(),
    }, tpl)
  }

  return (
    <div className="w-full">
      <div className="text-xl font-semibold text-slate-800">Doctor Settings</div>
      
      {/* Doctor Details Section */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
          <span>👨‍⚕️</span>
          <span>Doctor Details</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-700">Doctor Name</label>
            <input 
              value={doctorDetails.name} 
              onChange={e=>setDoctorDetails(d=>({ ...d, name: e.target.value }))}
              placeholder="Dr. John Smith" 
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" 
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700">Qualification</label>
            <input 
              value={doctorDetails.qualification} 
              onChange={e=>setDoctorDetails(d=>({ ...d, qualification: e.target.value }))}
              placeholder="MBBS, FCPS, MD" 
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" 
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700">Designation</label>
            <input 
              value={doctorDetails.designation} 
              onChange={e=>setDoctorDetails(d=>({ ...d, designation: e.target.value }))}
              placeholder="Consultant Physician" 
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" 
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700">Department</label>
            <input 
              value={doctorDetails.departmentName} 
              onChange={e=>setDoctorDetails(d=>({ ...d, departmentName: e.target.value }))}
              placeholder="Internal Medicine" 
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" 
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700">Phone Number</label>
            <input 
              value={doctorDetails.phone} 
              onChange={e=>setDoctorDetails(d=>({ ...d, phone: e.target.value }))}
              placeholder="+92-300-1234567" 
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" 
            />
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          These details will appear on prescription templates. Hospital details are automatically loaded from hospital settings.
        </div>
      </div>

      {/* Prescription Settings Section */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
          <span>📋</span>
          <span>Prescription Settings</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-700">Prescription Print Template</label>
            <select value={tpl} onChange={(e)=>setTpl(e.target.value as PrescriptionPdfTemplate)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="default">Standard</option>
            </select>
            <div className="mt-1 text-xs text-slate-500">This choice is saved per-doctor and used by Print in Prescription and Prescription History pages.</div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700">Prescription Mode</label>
            <select value={mode} onChange={(e)=>setMode(e.target.value as any)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="electronic">E-Prescription (System)</option>
              <option value="manual">Manual Prescription (Attach PDF/Image)</option>
            </select>
            <div className="mt-1 text-xs text-slate-500">If Manual is selected, you will attach a scanned prescription PDF/image when saving prescriptions.</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={save} className="btn">Save</button>
          <button type="button" onClick={previewSample} className="btn-outline-navy">Preview Sample</button>
          {saved && <div className="text-sm text-emerald-600">Saved</div>}
        </div>
      </div>

      {/* Hospital Settings Section */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
          <span>🏥</span>
          <span>Hospital Settings</span>
        </div>
        <div className="mb-2 text-xs text-slate-500">Note: Ye settings sirf Prescription Print page ke liye apply hongi. System ke baaki pages par koi change nahi hoga.</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-700">Hospital Name</label>
            <input
              value={hospitalSettings.name}
              onChange={e=>setHospitalSettings(s=>({ ...s, name: e.target.value }))}
              placeholder="Tehsil Headquarter Hospital"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700">Phone</label>
            <input
              value={hospitalSettings.phone}
              onChange={e=>setHospitalSettings(s=>({ ...s, phone: e.target.value }))}
              placeholder="042-0000000"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-700">Address</label>
            <input
              value={hospitalSettings.address}
              onChange={e=>setHospitalSettings(s=>({ ...s, address: e.target.value }))}
              placeholder="Shah Kot, Nankana Sahib"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-700">Logo</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={async (e)=> {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    const dataUrl = String(reader.result || '')
                    setHospitalSettings(s=>({ ...s, logoDataUrl: dataUrl }))
                  }
                  reader.readAsDataURL(file)
                }}
              />
              {hospitalSettings.logoDataUrl && (
                <img src={hospitalSettings.logoDataUrl} alt="Logo" className="h-12 w-12 rounded border border-slate-300 object-contain" />
              )}
            </div>
            <div className="mt-1 text-xs text-slate-500">Upload hospital logo to show on prescription print.</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={saveHospital} className="btn" disabled={savingHospital}>{savingHospital ? 'Saving...' : 'Save Hospital Settings'}</button>
          {saved && <div className="text-sm text-emerald-600">Saved</div>}
        </div>
      </div>
    </div>
  )
}
