import { Request, Response } from 'express'
import { LabPatient } from '../models/Patient'
import { LabOrder } from '../models/Order'
import { LabResult } from '../models/Result'
import { LabTest } from '../models/Test'
import { nextGlobalMrn } from '../../../common/mrn'
import { patientFindOrCreateSchema } from '../validators/patient'

function normDigits(s?: string) { return (s || '').replace(/\D+/g, '') }

export async function getByMrn(req: Request, res: Response) {
  const mrn = String((req.query as any).mrn || '').trim()
  if (!mrn) return res.status(400).json({ message: 'Validation failed', issues: [{ path: ['mrn'], message: 'mrn is required' }] })
  const pat = await LabPatient.findOne({ mrn }).lean()
  if (!pat) return res.status(404).json({ error: 'Patient not found' })
  res.json({ patient: pat })
}
function normLower(s?: string) { return (s || '').trim().toLowerCase().replace(/\s+/g, ' ') }


export async function findOrCreate(req: Request, res: Response) {
  const data = patientFindOrCreateSchema.parse(req.body)
  const cnicN = normDigits(data.cnic)
  const phoneN = normDigits(data.phone)
  const nameN = normLower(data.fullName)
  const fatherN = normLower(data.guardianName)

  if (data.selectId) {
    const pat = await LabPatient.findById(data.selectId).lean()
    if (!pat) return res.status(404).json({ error: 'Patient not found' })
    const agg = await LabOrder.aggregate([
      { $match: { patientId: String((pat as any)._id) } },
      { $group: { _id: null, sum: { $sum: { $ifNull: ['$receivableAmount', 0] } } } },
    ])
    const outstandingReceivable = Number((agg?.[0]?.sum || 0).toFixed?.(2) || 0)
    return res.json({ patient: { ...(pat as any), outstandingReceivable } })
  }

  if (cnicN) {
    const pat = await LabPatient.findOne({ cnicNormalized: cnicN }).lean()
    if (pat) return res.json({ patient: pat })
  }

  // Phone-first (requested behaviour):
  // - If phone exists: ALWAYS reuse an existing patient (never create a new MRN for the same phone).
  // - If multiple patients share same phone: ask for selection.
  // - Only create a new patient when phone is not found.
  if (phoneN) {
    const phoneMatches = await LabPatient.find({ phoneNormalized: phoneN }).lean()
    if (phoneMatches.length === 1) {
      const pm: any = phoneMatches[0]
      const patch: any = {}
      // Only patch CNIC for the same phone (safe). Do not overwrite name/guardian/phone.
      if (cnicN && pm.cnicNormalized !== cnicN) patch.cnicNormalized = cnicN
      if (Object.keys(patch).length) {
        const upd = await LabPatient.findByIdAndUpdate(pm._id, { $set: patch }, { new: true })
        return res.json({ patient: upd || pm })
      }
      const agg = await LabOrder.aggregate([
        { $match: { patientId: String(pm._id) } },
        { $group: { _id: null, sum: { $sum: { $ifNull: ['$receivableAmount', 0] } } } },
      ])
      const outstandingReceivable = Number((agg?.[0]?.sum || 0).toFixed?.(2) || 0)
      return res.json({ patient: { ...(pm as any), outstandingReceivable } })
    }
    if (phoneMatches.length > 1) {
      const exact = phoneMatches.find(pm => normLower((pm as any).fullName) === nameN && (!fatherN || normLower((pm as any).fatherName) === fatherN))
      if (exact) return res.json({ patient: exact })
      const brief = phoneMatches.map(m => ({ _id: m._id, mrn: m.mrn, fullName: m.fullName, fatherName: (m as any).fatherName, phone: m.phoneNormalized, cnic: m.cnicNormalized }))
      return res.json({ matches: brief, needSelection: true })
    }
    // else: phone not found -> proceed to name/guardian matching and/or create new
  }

  // Exact match on name + guardian: only reuse if phone also matches (never overwrite another patient's phone)
  if (nameN && fatherN) {
    const rxName = new RegExp(`^${nameN.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i')
    const rxFath = new RegExp(`^${fatherN.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i')
    const matches = await LabPatient.find({ fullName: rxName, fatherName: rxFath }).lean()
    if (matches.length === 1) {
      const m = matches[0]
      if (phoneN && m.phoneNormalized !== phoneN) {
        // Request has a different phone: do not reuse this patient (would overwrite their phone). Create new.
      } else {
        const patch: any = {}
        if (cnicN && m.cnicNormalized !== cnicN) patch.cnicNormalized = cnicN
        if (Object.keys(patch).length) {
          const upd = await LabPatient.findByIdAndUpdate(m._id, { $set: patch }, { new: true })
          return res.json({ patient: upd || m })
        }
        const agg = await LabOrder.aggregate([
          { $match: { patientId: String(m._id) } },
          { $group: { _id: null, sum: { $sum: { $ifNull: ['$receivableAmount', 0] } } } },
        ])
        const outstandingReceivable = Number((agg?.[0]?.sum || 0).toFixed?.(2) || 0)
        return res.json({ patient: { ...(m as any), outstandingReceivable } })
      }
    } else if (matches.length > 1) {
      const byPhone = phoneN ? matches.filter(m => m.phoneNormalized === phoneN) : matches
      if (byPhone.length === 1) return res.json({ patient: byPhone[0] })
      if (byPhone.length > 1) {
        const brief = byPhone.map(m => ({ _id: m._id, mrn: m.mrn, fullName: m.fullName, fatherName: m.fatherName, phone: m.phoneNormalized, cnic: m.cnicNormalized }))
        return res.json({ matches: brief, needSelection: true })
      }
      const brief = matches.map(m => ({ _id: m._id, mrn: m.mrn, fullName: m.fullName, fatherName: m.fatherName, phone: m.phoneNormalized, cnic: m.cnicNormalized }))
      return res.json({ matches: brief, needSelection: true })
    }
  }

  const mrn = await nextGlobalMrn()
  const nowIso = new Date().toISOString()
  const pat = await LabPatient.create({
    mrn,
    fullName: data.fullName,
    fatherName: data.guardianName,
    phoneNormalized: phoneN || undefined,
    cnicNormalized: cnicN || undefined,
    gender: data.gender,
    age: data.age,
    guardianRel: data.guardianRel,
    address: data.address,
    createdAtIso: nowIso,
  })
  res.status(201).json({ patient: { ...(pat as any), outstandingReceivable: 0 } })
}

export async function search(req: Request, res: Response) {
  const qRaw = String((req.query as any).q || '').trim()
  const phone = normDigits(String((req.query as any).phone || '')) || normDigits(qRaw)
  const name = normLower(String((req.query as any).name || '')) || normLower(qRaw)
  const cnic = normDigits(String((req.query as any).cnic || '')) || normDigits(qRaw)
  const limit = Math.max(1, Math.min(50, Number((req.query as any).limit || 10)))
  const filter: any = {}
  if (phone || cnic || name) {
    const ors: any[] = []
    if (phone) ors.push({ phoneNormalized: new RegExp(phone) })
    if (cnic) ors.push({ cnicNormalized: new RegExp(cnic) })
    if (name) ors.push({ fullName: new RegExp(name, 'i') })
    filter.$or = ors
  }
  if (!phone && !name && !cnic) return res.json({ patients: [] })
  const pats = await LabPatient.find(filter).sort({ createdAt: -1 }).limit(limit).lean()
  
  // Calculate outstanding receivable for each patient
  const patientsWithOutstanding = await Promise.all(
    pats.map(async (p: any) => {
      const agg = await LabOrder.aggregate([
        { $match: { patientId: String(p._id) } },
        { $group: { _id: null, sum: { $sum: { $ifNull: ['$receivableAmount', 0] } } } },
      ])
      const outstandingReceivable = Number((agg?.[0]?.sum || 0).toFixed?.(2) || 0)
      return { ...p, outstandingReceivable }
    })
  )
  
  res.json({ patients: patientsWithOutstanding })
}

export async function profiling(req: Request, res: Response) {
  const patientId = String((req.query as any).patientId || '').trim()
  const mrn = String((req.query as any).mrn || '').trim()
  if (!patientId && !mrn) {
    return res.status(400).json({ message: 'Validation failed', issues: [{ path: ['patientId'], message: 'patientId or mrn is required' }] })
  }

  const patient: any = patientId
    ? await LabPatient.findById(patientId).lean()
    : await LabPatient.findOne({ mrn }).lean()
  if (!patient) return res.status(404).json({ error: 'Patient not found' })

  const orders: any[] = await LabOrder.find({ patientId: String(patient._id) }).sort({ createdAt: -1 }).limit(200).lean()
  const outstandingAgg = await LabOrder.aggregate([
    { $match: { patientId: String(patient._id) } },
    { $group: { _id: null, sum: { $sum: { $ifNull: ['$receivableAmount', 0] } } } },
  ])
  const outstandingReceivable = Number((outstandingAgg?.[0]?.sum || 0).toFixed?.(2) || 0)
  const orderIds = orders.map(o => String(o._id))
  const results: any[] = orderIds.length
    ? await LabResult.find({ orderId: { $in: orderIds } }).lean()
    : []
  const resultByOrderId = new Map<string, any>(results.map(r => [String(r.orderId), r]))

  const testIds = Array.from(new Set(orders.flatMap(o => Array.isArray(o.tests) ? o.tests : []).map(String)))
  const tests: any[] = testIds.length ? await LabTest.find({ _id: { $in: testIds } }).select('name').lean() : []
  const testsMap = new Map<string, string>(tests.map(t => [String((t as any)._id), String((t as any).name || '')]))

  const toDateTimeIso = (createdAt: any, timeOrIso?: any) => {
    const t = String(timeOrIso || '').trim()
    if (!t) return undefined
    const asDate = new Date(t)
    if (!isNaN(asDate.getTime())) return asDate.toISOString()
    const m = t.match(/^(\d{1,2}):(\d{2})/)
    if (!m) return undefined
    const base = new Date(createdAt || new Date())
    if (isNaN(base.getTime())) return undefined
    base.setHours(Number(m[1]), Number(m[2]), 0, 0)
    return base.toISOString()
  }

  const samples = orders.map(o => {
    const tokenNo = String(o.tokenNo || '')
    const testsStr = (Array.isArray(o.tests) ? o.tests : []).map((id: any) => testsMap.get(String(id)) || String(id)).filter(Boolean)
    const r = resultByOrderId.get(String(o._id))
    return {
      orderId: String(o._id),
      sampleId: tokenNo,
      createdAt: o.createdAt,
      tests: testsStr,
      priority: 'Normal',
      collectionTime: o.sampleTime,
      reportingTime: o.reportingTime,
      collectionDateTime: toDateTimeIso(o.createdAt, o.sampleTime),
      reportingDateTime: toDateTimeIso(o.createdAt, o.reportingTime),
      status: o.status,
      reportStatus: r?.reportStatus || 'pending',
      rows: r?.rows || [],
      interpretation: r?.interpretation,
      referringConsultant: o.referringConsultant,
      paymentMethod: (o as any).paymentMethod,
      paymentDetails: (o as any).paymentDetails,
      receivedAmount: Number((o as any).receivedAmount || 0),
      receivableAmount: Number((o as any).receivableAmount || 0),
    }
  })

  res.json({
    patient,
    numberOfVisits: orders.length,
    outstandingReceivable,
    samples,
  })
}

export async function update(req: Request, res: Response) {
  const { id } = req.params
  const body = (req.body || {}) as any
  const patch: any = {}
  if (typeof body.fullName === 'string') patch.fullName = body.fullName
  if (typeof body.fatherName === 'string') patch.fatherName = body.fatherName
  if (typeof body.gender === 'string') patch.gender = body.gender
  if (typeof body.address === 'string') patch.address = body.address
  if (typeof body.phone === 'string') patch.phoneNormalized = normDigits(body.phone)
  if (typeof body.cnic === 'string') patch.cnicNormalized = normDigits(body.cnic)
  const doc = await LabPatient.findByIdAndUpdate(id, { $set: patch }, { new: true })
  if (!doc) return res.status(404).json({ error: 'Patient not found' })
  res.json({ patient: doc })
}
