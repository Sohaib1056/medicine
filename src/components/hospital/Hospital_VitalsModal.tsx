import { useEffect, useRef, useState } from 'react'
import PrescriptionVitals from '../doctor/PrescriptionVitals'
import { hospitalApi } from '../../utils/api'

type Props = {
  open: boolean
  onClose: () => void
  tokenId: string
  patientName: string
  onSaved?: () => void
}

export default function Hospital_VitalsModal({ open, onClose, tokenId, patientName, onSaved }: Props) {
  const vitalsRef = useRef<any>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [initialVitals, setInitialVitals] = useState<any>(null)

  useEffect(() => {
    if (!open) return
    const loadExisting = async () => {
      setLoading(true)
      try {
        const res: any = await hospitalApi.getToken(tokenId)
        const token = res?.token || res
        if (token?.vitals) {
          const s = (x: any) => (x == null ? '' : String(x))
          const displayVitals = {
            pulse: s(token.vitals.pulse),
            temperature: s(token.vitals.temperatureC),
            bloodPressureSys: s(token.vitals.bloodPressureSys),
            bloodPressureDia: s(token.vitals.bloodPressureDia),
            respiratoryRate: s(token.vitals.respiratoryRate),
            bloodSugar: s(token.vitals.bloodSugar),
            weightKg: s(token.vitals.weightKg),
            height: s(token.vitals.heightCm),
            spo2: s(token.vitals.spo2),
          }
          setInitialVitals(displayVitals)
        }
      } catch (err) {
        console.error('Failed to load existing vitals', err)
      } finally {
        setLoading(false)
      }
    }
    loadExisting()
  }, [open, tokenId])

  if (!open) return null

  const handleSave = async () => {
    if (!vitalsRef.current) return
    setError('')
    setBusy(true)
    try {
      const normalized = vitalsRef.current.getNormalized()
      
      // 1. Fetch current token data to avoid "No fields to update" or losing data on PUT
      const res: any = await hospitalApi.getToken(tokenId)
      const currentToken = res?.token || res
      
      // 2. Prepare full update payload as required by the PUT endpoint
      const payload = {
        discount: currentToken.discount,
        doctorId: currentToken.doctorId?._id || currentToken.doctorId,
        departmentId: currentToken.departmentId?._id || currentToken.departmentId,
        patientId: currentToken.patientId?._id || currentToken.patientId,
        mrn: currentToken.mrn,
        patientName: currentToken.patientName,
        phone: currentToken.phone,
        gender: currentToken.gender,
        age: currentToken.age,
        address: currentToken.address,
        guardianRel: currentToken.guardianRel,
        guardianName: currentToken.guardianName,
        cnic: currentToken.cnic,
        overrideFee: currentToken.overrideFee,
        vitals: {
          pulse: normalized.pulse,
          temperatureC: normalized.temperatureC,
          bloodPressureSys: normalized.bloodPressureSys,
          bloodPressureDia: normalized.bloodPressureDia,
          respiratoryRate: normalized.respiratoryRate,
          bloodSugar: normalized.bloodSugar,
          weightKg: normalized.weightKg,
          heightCm: normalized.heightCm,
          bmi: normalized.bmi,
          bsa: normalized.bsa,
          spo2: normalized.spo2,
        }
      }

      await hospitalApi.updateToken(tokenId, payload)

      // 3. Verify persisted (defensive check against backend ignoring nested updates)
      try {
        const verifyRes: any = await hospitalApi.getToken(tokenId)
        const verified = verifyRes?.token || verifyRes
        const v = verified?.vitals
        const changed = v && (
          v.pulse === normalized.pulse ||
          v.temperatureC === normalized.temperatureC ||
          v.bloodPressureSys === normalized.bloodPressureSys ||
          v.bloodPressureDia === normalized.bloodPressureDia ||
          v.respiratoryRate === normalized.respiratoryRate ||
          v.bloodSugar === normalized.bloodSugar ||
          v.weightKg === normalized.weightKg ||
          v.heightCm === normalized.heightCm ||
          v.spo2 === normalized.spo2
        )
        if (!changed) {
          setError('Vitals were submitted but not saved. Please try again or contact admin.')
          return
        }
      } catch {
        // If verification fails, still allow flow but do not block user.
      }

      onSaved?.()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save vitals')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-800">Vitals - {patientName}</h3>
          <button onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">×</button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-600 border border-rose-100">
              {error}
            </div>
          )}
          
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 min-h-[300px] flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600 mr-3"></div>
                Loading existing vitals...
              </div>
            ) : (
              <PrescriptionVitals ref={vitalsRef} initial={initialVitals} />
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4 bg-slate-50/50">
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            disabled={busy || loading}
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSave} 
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
            disabled={busy || loading}
          >
            {busy ? 'Saving...' : 'Save Vitals'}
          </button>
        </div>
      </div>
    </div>
  )
}
