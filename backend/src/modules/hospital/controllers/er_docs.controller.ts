import { Request, Response } from 'express'
import { z } from 'zod'
import { HospitalToken } from '../models/Token'
import { HospitalErDischargeSummary } from '../models/ErDischargeSummary'
import { HospitalErDeathCertificate } from '../models/ErDeathCertificate'
import { HospitalErBirthCertificate } from '../models/ErBirthCertificate'
import { HospitalErReceivedDeath } from '../models/ErReceivedDeath'
import { HospitalErShortStay } from '../models/ErShortStay'
import { HospitalErFinalInvoice } from '../models/ErFinalInvoice'
import { HospitalSettings } from '../models/Settings'
import { LabPatient } from '../../lab/models/Patient'
import { HospitalDoctor } from '../models/Doctor'

async function getTokenOr404(id: string, res: Response){
  const token: any = await HospitalToken.findById(id).lean()
  if (!token){ res.status(404).json({ error: 'Token not found' }); return null }
  return token
}

// Helper functions for HTML rendering
function escapeHtml(s?: string){ return String(s??'').replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'} as any)[c]) }
function nl2br(s?: string){ return escapeHtml(s).replace(/\n/g, '<br>') }
function hdr(settings: any){
  const name = escapeHtml(settings?.hospitalName || 'Hospital')
  const address = escapeHtml(settings?.address || '')
  const phone = escapeHtml(settings?.phone || '')
  return `<div style="text-align:center;border-bottom:2px solid #1d4ed8;padding-bottom:10px;margin-bottom:20px">
    <h1 style="margin:0;color:#1d4ed8">${name}</h1>
    ${address?`<p style="margin:4px 0">${address}</p>`:''}
    ${phone?`<p style="margin:4px 0">Tel: ${phone}</p>`:''}
  </div>`
}
function wrap(body: string){ return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Form</title>
  <style>body{font-family:system-ui,Arial,sans-serif;padding:20px;max-width:900px;margin:0 auto;line-height:1.6}
  table{border-collapse:collapse;width:100%} td,th{border:1px solid #999;padding:6px}
  </style></head><body>${body}</body></html>` }

// Discharge Summary ---------------------------------------------------------
const dischargeSchema = z.object({
  diagnosis: z.string().optional(),
  courseInHospital: z.string().optional(),
  procedures: z.array(z.string()).optional(),
  conditionAtDischarge: z.string().optional(),
  medications: z.array(z.string()).optional(),
  advice: z.string().optional(),
  followUpDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
})

export async function upsertDischargeSummary(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  // Try to find token, but don't fail if not found (ID might be encounter ID)
  const token: any = await HospitalToken.findById(tokenId).lean()
  
  const data = dischargeSchema.parse(req.body)
  const patch: any = { ...data }
  if (data.followUpDate) patch.followUpDate = new Date(data.followUpDate)
  
  // Use token data if found, otherwise just save with the provided ID
  if (token) {
    patch.patientId = token.patientId
    patch.doctorId = token.doctorId
    patch.departmentId = token.departmentId
    if (!token.endAt) { try { patch.dischargeDate = new Date() } catch {} }
  }
  
  const existing = await HospitalErDischargeSummary.findOne({ tokenId })
  let doc: any
  if (existing){
    doc = await HospitalErDischargeSummary.findOneAndUpdate({ tokenId }, patch, { new: true })
  } else {
    doc = await HospitalErDischargeSummary.create({ tokenId, ...patch })
  }
  res.json({ summary: doc })
}

export async function getDischargeSummary(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  const doc = await HospitalErDischargeSummary.findOne({ tokenId }).lean()
  res.json({ summary: doc || null })
}

export async function deleteDischargeSummary(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  await HospitalErDischargeSummary.deleteOne({ tokenId })
  res.json({ ok: true })
}

function renderDischargeHTML(settings: any, token: any, patient: any, doctor: any, s: any){
  const head = `${hdr(settings)}<h2 style="margin:12px 0;text-align:center">EMERGENCY DISCHARGE SUMMARY</h2>`
  const row = (label: string, value: any) => `<div style="display:flex;gap:8px;margin:6px 0"><div style="min-width:200px;font-weight:700">${label}</div><div style="flex:1;border-bottom:1px solid #000;padding:0 8px">${escapeHtml(String(value||''))}</div></div>`
  const meds = (s?.medications||[]).map((m: string)=>`<li>${escapeHtml(m)}</li>`).join('')
  const procs = (s?.procedures||[]).map((p: string)=>`<li>${escapeHtml(p)}</li>`).join('')
  const body = [
    row('Patient Name', patient?.fullName || token?.patientName || ''),
    row('MRN', patient?.mrn || ''),
    row('Age/Sex', `${patient?.age||''}/${patient?.gender||''}`),
    row('Doctor', doctor?.fullName || doctor?.name || token?.doctorId?.name || ''),
    row('Department', token?.departmentId?.name || ''),
    row('Date of Discharge', s?.dischargeDate ? new Date(s.dischargeDate).toLocaleDateString() : ''),
    `<div style="margin-top:16px"><b>Diagnosis:</b><br>${nl2br(s?.diagnosis)}</div>`,
    `<div style="margin-top:12px"><b>Course in Hospital:</b><br>${nl2br(s?.courseInHospital)}</div>`,
    procs ? `<div style="margin-top:12px"><b>Procedures:</b><ul>${procs}</ul></div>` : '',
    `<div style="margin-top:12px"><b>Condition at Discharge:</b> ${escapeHtml(s?.conditionAtDischarge||'')}</div>`,
    meds ? `<div style="margin-top:12px"><b>Medications:</b><ul>${meds}</ul></div>` : '',
    s?.advice ? `<div style="margin-top:12px"><b>Advice:</b><br>${nl2br(s?.advice)}</div>` : '',
    s?.notes ? `<div style="margin-top:12px"><b>Notes:</b><br>${nl2br(s?.notes)}</div>` : '',
    `<div style="margin-top:40px;display:flex;justify-content:space-between">
      <div style="text-align:center;width:200px"><div style="border-top:1px solid #000;padding-top:6px">Doctor Signature</div></div>
      <div style="text-align:center;width:200px"><div style="border-top:1px solid #000;padding-top:6px">Patient/Attendant</div></div>
    </div>`
  ].join('')
  return wrap(head + body)
}

export async function printDischargeSummary(req: Request, res: Response){
  const { id } = req.params as any
  const token = await getTokenOr404(String(id), res)
  if (!token) return
  const summary: any = await HospitalErDischargeSummary.findOne({ tokenId: token._id }).lean()
  if (!summary) return res.status(404).send('No discharge summary found')
  const settings: any = await HospitalSettings.findOne({}).lean()
  const patient: any = token.patientId ? await LabPatient.findById(token.patientId).lean() : null
  const doctor: any = token.doctorId ? await HospitalDoctor.findById(token.doctorId).lean() : null
  const html = renderDischargeHTML(settings, token, patient, doctor, summary)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
}

export async function printDischargeSummaryPdf(req: Request, res: Response){
  const { id } = req.params as any
  const token = await getTokenOr404(String(id), res)
  if (!token) return
  const summary: any = await HospitalErDischargeSummary.findOne({ tokenId: token._id }).lean()
  if (!summary) return res.status(404).send('No discharge summary found')
  const settings: any = await HospitalSettings.findOne({}).lean()
  const patient: any = token.patientId ? await LabPatient.findById(token.patientId).lean() : null
  const doctor: any = token.doctorId ? await HospitalDoctor.findById(token.doctorId).lean() : null
  const html = renderDischargeHTML(settings, token, patient, doctor, summary)
  let puppeteer: any
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    puppeteer = require('puppeteer')
  } catch {
    return res.status(500).send('PDF generator not available')
  }
  let browser: any = null
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] as any, headless: true })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="er-discharge-summary-${Date.now()}.pdf"`)
    res.send(pdf)
  } catch {
    res.status(500).send('Failed to render PDF')
  } finally {
    try { await browser?.close() } catch {}
  }
}

// Short Stay ----------------------------------------------------------------
const shortStaySchema = z.object({
  admittedAt: z.string().datetime().optional(),
  dischargedAt: z.string().datetime().optional(),
  data: z.any().optional(),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
})

export async function upsertShortStay(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  // Try to find token, but don't fail if not found (ID might be encounter ID)
  const token: any = await HospitalToken.findById(tokenId).lean()
  
  const data = shortStaySchema.parse(req.body)
  const patch: any = { ...data }
  if (data.admittedAt) patch.admittedAt = new Date(data.admittedAt)
  if (data.dischargedAt) patch.dischargedAt = new Date(data.dischargedAt)
  
  // Use token data if found, otherwise just save with the provided ID
  if (token) {
    patch.patientId = token.patientId
    patch.doctorId = token.doctorId
    patch.departmentId = token.departmentId
  }
  
  const existing = await HospitalErShortStay.findOne({ tokenId })
  let doc: any
  if (existing){
    doc = await HospitalErShortStay.findOneAndUpdate({ tokenId }, patch, { new: true })
  } else {
    doc = await HospitalErShortStay.create({ tokenId, ...patch })
  }
  res.json({ shortStay: doc })
}

export async function getShortStay(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  const doc = await HospitalErShortStay.findOne({ tokenId }).lean()
  res.json({ shortStay: doc || null })
}

export async function deleteShortStay(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  await HospitalErShortStay.deleteOne({ tokenId })
  res.json({ ok: true })
}

export async function listShortStays(req: Request, res: Response){
  const { q = '', from, to, page = '1', limit = '20' } = req.query as any
  const p = Math.max(1, Number(page)||1)
  const l = Math.max(1, Math.min(200, Number(limit)||20))
  const match: any = {}
  if (from || to){
    match.createdAt = {}
    if (from) match.createdAt.$gte = new Date(String(from))
    if (to) match.createdAt.$lte = new Date(String(to))
  }
  const rx = String(q||'').trim() ? new RegExp(String(q||'').trim(), 'i') : null
  const pipeline: any[] = [
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $lookup: { from: 'lab_patients', localField: 'patientId', foreignField: '_id', as: 'patient' } },
    { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'hospital_tokens', localField: 'tokenId', foreignField: '_id', as: 'token' } },
    { $unwind: { path: '$token', preserveNullAndEmptyArrays: true } },
  ]
  if (rx){
    pipeline.push({ $match: { $or: [
      { 'patient.fullName': rx },
      { 'patient.mrn': rx },
      { 'patient.phoneNormalized': rx },
    ] } })
  }
  pipeline.push({ $facet: {
    results: [
      { $skip: (p-1)*l }, { $limit: l },
      { $project: {
        _id: 1, tokenId: 1, createdAt: 1,
        patientName: '$patient.fullName', mrn: '$patient.mrn',
      } },
    ],
    total: [ { $count: 'count' } ],
  } })
  pipeline.push({ $project: { results: 1, total: { $ifNull: [ { $arrayElemAt: [ '$total.count', 0 ] }, 0 ] } } })
  const agg = await HospitalErShortStay.aggregate(pipeline as any)
  const row = agg[0] || { results: [], total: 0 }
  res.json({ page: p, limit: l, total: row.total, results: row.results })
}

// Death Certificate ---------------------------------------------------------
const deathSchema = z.object({
  dateOfDeath: z.string().datetime().optional(),
  timeOfDeath: z.string().optional(),
  causeOfDeath: z.string().optional(),
  placeOfDeath: z.string().optional(),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
  dcNo: z.string().optional(),
  mrNumber: z.string().optional(),
  relative: z.string().optional(),
  ageSex: z.string().optional(),
  address: z.string().optional(),
  presentingComplaints: z.string().optional(),
  diagnosis: z.string().optional(),
  primaryCause: z.string().optional(),
  secondaryCause: z.string().optional(),
  receiverName: z.string().optional(),
  receiverRelation: z.string().optional(),
  receiverIdCard: z.string().optional(),
  receiverDate: z.string().datetime().optional(),
  receiverTime: z.string().optional(),
  staffName: z.string().optional(),
  staffSignDate: z.string().datetime().optional(),
  staffSignTime: z.string().optional(),
  doctorName: z.string().optional(),
  doctorSignDate: z.string().datetime().optional(),
  doctorSignTime: z.string().optional(),
})

export async function upsertDeathCertificate(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  // Try to find token, but don't fail if not found (ID might be encounter ID)
  const token: any = await HospitalToken.findById(tokenId).lean()
  
  const data = deathSchema.parse(req.body)
  const patch: any = { ...data }
  if (data.dateOfDeath) patch.dateOfDeath = new Date(data.dateOfDeath)
  if (data.receiverDate) patch.receiverDate = new Date(data.receiverDate)
  if (data.staffSignDate) patch.staffSignDate = new Date(data.staffSignDate)
  if (data.doctorSignDate) patch.doctorSignDate = new Date(data.doctorSignDate)
  
  // Use token data if found, otherwise just save with the provided ID
  if (token) {
    patch.patientId = token.patientId
    patch.doctorId = token.doctorId
    patch.departmentId = token.departmentId
  }
  
  const existing = await HospitalErDeathCertificate.findOne({ tokenId })
  let doc: any
  if (existing){
    doc = await HospitalErDeathCertificate.findOneAndUpdate({ tokenId }, patch, { new: true })
  } else {
    doc = await HospitalErDeathCertificate.create({ tokenId, ...patch })
  }
  res.json({ certificate: doc })
}

export async function getDeathCertificate(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  const doc = await HospitalErDeathCertificate.findOne({ tokenId }).lean()
  res.json({ certificate: doc || null })
}

export async function deleteDeathCertificate(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  await HospitalErDeathCertificate.deleteOne({ tokenId })
  res.json({ ok: true })
}

function renderDeathHTML(settings: any, token: any, patient: any, doctor: any, c: any){
  const head = `${hdr(settings)}<h2 style="margin:12px 0;text-align:center">EMERGENCY DEATH CERTIFICATE</h2>`
  const row = (label: string, value: any) => `<div style="display:flex;gap:8px;margin:6px 0"><div style="min-width:200px;font-weight:700">${label}</div><div style="flex:1;border-bottom:1px solid #000;padding:0 8px">${escapeHtml(String(value||''))}</div></div>`
  const body = [
    c?.dcNo ? row('DC No', c.dcNo) : '',
    row('Patient Name', patient?.fullName || token?.patientName || ''),
    row('MRN', patient?.mrn || c?.mrNumber || ''),
    row('Age/Sex', c?.ageSex || `${patient?.age||''}/${patient?.gender||''}`),
    row('Address', c?.address || patient?.address || ''),
    row('Date of Death', c?.dateOfDeath ? new Date(c.dateOfDeath).toLocaleDateString() : ''),
    row('Time of Death', c?.timeOfDeath || ''),
    row('Place of Death', c?.placeOfDeath || ''),
    `<div style="margin-top:16px"><b>Presenting Complaints:</b><br>${nl2br(c?.presentingComplaints)}</div>`,
    `<div style="margin-top:12px"><b>Diagnosis:</b><br>${nl2br(c?.diagnosis)}</div>`,
    `<div style="margin-top:12px"><b>Primary Cause of Death:</b><br>${nl2br(c?.primaryCause)}</div>`,
    `<div style="margin-top:12px"><b>Secondary Cause of Death:</b><br>${nl2br(c?.secondaryCause)}</div>`,
    `<div style="margin-top:12px"><b>Body Received By:</b> ${escapeHtml(c?.receiverName||'')} (${escapeHtml(c?.receiverRelation||'')})</div>`,
    `<div style="margin-top:40px;display:flex;justify-content:space-between">
      <div style="text-align:center;width:200px"><div style="border-top:1px solid #000;padding-top:6px">${escapeHtml(c?.staffName||'Staff Signature')}</div></div>
      <div style="text-align:center;width:200px"><div style="border-top:1px solid #000;padding-top:6px">${escapeHtml(c?.doctorName||'Doctor Signature')}</div></div>
    </div>`
  ].join('')
  return wrap(head + body)
}

export async function printDeathCertificate(req: Request, res: Response){
  const { id } = req.params as any
  const token = await getTokenOr404(String(id), res)
  if (!token) return
  const cert: any = await HospitalErDeathCertificate.findOne({ tokenId: token._id }).lean()
  if (!cert) return res.status(404).send('No death certificate found')
  const settings: any = await HospitalSettings.findOne({}).lean()
  const patient: any = token.patientId ? await LabPatient.findById(token.patientId).lean() : null
  const doctor: any = token.doctorId ? await HospitalDoctor.findById(token.doctorId).lean() : null
  const html = renderDeathHTML(settings, token, patient, doctor, cert)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
}

export async function printDeathCertificatePdf(req: Request, res: Response){
  const { id } = req.params as any
  const token = await getTokenOr404(String(id), res)
  if (!token) return
  const doc: any = await HospitalErDeathCertificate.findOne({ tokenId: token._id }).lean()
  if (!doc) return res.status(404).send('No death certificate found')
  const settings: any = await HospitalSettings.findOne({}).lean()
  const patient: any = token.patientId ? await LabPatient.findById(token.patientId).lean() : null
  const doctor: any = token.doctorId ? await HospitalDoctor.findById(token.doctorId).lean() : null
  const html = renderDeathHTML(settings, token, patient, doctor, doc)
  let puppeteer: any
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    puppeteer = require('puppeteer')
  } catch {
    return res.status(500).send('PDF generator not available')
  }
  let browser: any = null
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] as any, headless: true })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="er-death-certificate-${Date.now()}.pdf"`)
    res.send(pdf)
  } catch {
    res.status(500).send('Failed to render PDF')
  } finally {
    try { await browser?.close() } catch {}
  }
}

export async function listDeathCertificates(req: Request, res: Response){
  const { q = '', from, to, page = '1', limit = '20' } = req.query as any
  const p = Math.max(1, Number(page)||1)
  const l = Math.max(1, Math.min(200, Number(limit)||20))
  const match: any = {}
  if (from || to){
    match.createdAt = {}
    if (from) match.createdAt.$gte = new Date(String(from))
    if (to) match.createdAt.$lte = new Date(String(to))
  }
  const rx = String(q||'').trim() ? new RegExp(String(q||'').trim(), 'i') : null
  const pipeline: any[] = [
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $lookup: { from: 'lab_patients', localField: 'patientId', foreignField: '_id', as: 'patient' } },
    { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
  ]
  if (rx){
    pipeline.push({ $match: { $or: [
      { dcNo: rx },
      { 'patient.fullName': rx },
      { 'patient.mrn': rx },
    ] } })
  }
  pipeline.push({ $facet: {
    results: [
      { $skip: (p-1)*l }, { $limit: l },
      { $project: {
        _id: 1, tokenId: 1, createdAt: 1, dcNo: 1, dateOfDeath: 1,
        patientName: '$patient.fullName', mrn: '$patient.mrn',
      } },
    ],
    total: [ { $count: 'count' } ],
  } })
  pipeline.push({ $project: { results: 1, total: { $ifNull: [ { $arrayElemAt: [ '$total.count', 0 ] }, 0 ] } } })
  const agg = await HospitalErDeathCertificate.aggregate(pipeline as any)
  const row = agg[0] || { results: [], total: 0 }
  res.json({ page: p, limit: l, total: row.total, results: row.results })
}

// Birth Certificate ---------------------------------------------------------
const birthSchema = z.object({
  srNo: z.string().optional(),
  bcSerialNo: z.string().optional(),
  motherName: z.string().optional(),
  fatherName: z.string().optional(),
  mrNumber: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  babyName: z.string().optional(),
  sexOfBaby: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  timeOfBirth: z.string().optional(),
  deliveryType: z.string().optional(),
  deliveryMode: z.string().optional(),
  conditionAtBirth: z.string().optional(),
  weightAtBirth: z.string().optional(),
  bloodGroup: z.string().optional(),
  birthMark: z.string().optional(),
  congenitalAbnormality: z.string().optional(),
  babyHandedOverTo: z.string().optional(),
  notes: z.string().optional(),
  parentSignature: z.string().optional(),
  doctorSignature: z.string().optional(),
  createdBy: z.string().optional(),
})

export async function upsertBirthCertificate(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  // Try to find token, but don't fail if not found (ID might be encounter ID)
  const token: any = await HospitalToken.findById(tokenId).lean()
  
  const data = birthSchema.parse(req.body)
  const patch: any = { ...data }
  if (data.dateOfBirth) patch.dateOfBirth = new Date(data.dateOfBirth)
  
  // Use token data if found, otherwise just save with the provided ID
  if (token) {
    patch.patientId = token.patientId
    patch.doctorId = token.doctorId
    patch.departmentId = token.departmentId
  }
  
  const existing = await HospitalErBirthCertificate.findOne({ tokenId })
  let doc: any
  if (existing){
    doc = await HospitalErBirthCertificate.findOneAndUpdate({ tokenId }, patch, { new: true })
  } else {
    doc = await HospitalErBirthCertificate.create({ tokenId, ...patch })
  }
  res.json({ birthCertificate: doc })
}

export async function getBirthCertificate(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  const doc = await HospitalErBirthCertificate.findOne({ tokenId }).lean()
  res.json({ birthCertificate: doc || null })
}

export async function deleteBirthCertificate(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  await HospitalErBirthCertificate.deleteOne({ tokenId })
  res.json({ ok: true })
}

function renderBirthHTML(settings: any, token: any, patient: any, doctor: any, b: any){
  const head = `${hdr(settings)}<h2 style="margin:12px 0;text-align:center">EMERGENCY BIRTH CERTIFICATE</h2>`
  const sr = `<div style="margin:4px 0;"><b>Birth Serial No.</b> ${escapeHtml(b?.srNo||b?.bcSerialNo||'')}</div>`
  const row = (label: string, value: any) => `<div style="display:flex;gap:8px;margin:4px 0;"><div style="min-width:180px;"><b>${label}</b></div><div style="flex:1;border-bottom:1px solid #000;">${escapeHtml(String(value||''))}</div></div>`
  const dob = b?.dateOfBirth ? new Date(b.dateOfBirth) : null
  const dobGrid = `
    <table style="width:100%;border-collapse:collapse;margin:8px 0;">
      <tr>
        <td style="border:1px solid #000;padding:4px;text-align:center;min-width:80px;">DATE</td>
        <td style="border:1px solid #000;padding:4px;text-align:center;">Day<br><b>${dob? String(dob.getDate()).padStart(2,'0'):''}</b></td>
        <td style="border:1px solid #000;padding:4px;text-align:center;">Month<br><b>${dob? String(dob.getMonth()+1).padStart(2,'0'):''}</b></td>
        <td style="border:1px solid #000;padding:4px;text-align:center;">Year<br><b>${dob? dob.getFullYear():''}</b></td>
        <td style="border:1px solid #000;padding:4px;text-align:center;min-width:120px;">Time of Birth<br><b>${escapeHtml(b?.timeOfBirth||'')}</b></td>
      </tr>
      <tr>
        <td style="border:1px solid #000;padding:4px;">MODE OF BIRTH</td>
        <td colspan="2" style="border:1px solid #000;padding:4px;">SVD / Instrumental / C/Section</td>
        <td colspan="2" style="border:1px solid #000;padding:4px;">${escapeHtml([b?.deliveryType,b?.deliveryMode].filter(Boolean).join(' / ')) || '&nbsp;'}</td>
      </tr>
    </table>
  `
  const body = [
    sr,
    row('Doctor', doctor?.fullName || doctor?.name || ''),
    row('Mother Name', b?.motherName),
    row('Father Name', b?.fatherName),
    row('Sex of Baby', b?.sexOfBaby),
    row('Name of Baby', b?.babyName),
    row('Address', b?.address),
    dobGrid,
    row('Condition at Birth', b?.conditionAtBirth),
    row('Weight at Birth', b?.weightAtBirth),
    row('Blood Group', b?.bloodGroup),
    row('Birth Mark (If Any)', b?.birthMark),
    row('Congenital Abnormality / Birth Injury (If Any)', b?.congenitalAbnormality),
    row('Baby Handed over to', b?.babyHandedOverTo),
    (b?.notes ? `<div style="margin:8px 0;"><b>Notes:</b><br>${nl2br(b?.notes)}</div>` : ''),
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px;">
        <div style="border-top:1px solid #000;text-align:center;padding-top:6px;">Signature of Parent/Relation${b?.parentSignature?`: ${escapeHtml(b.parentSignature)}`:''}</div>
        <div style="border-top:1px solid #000;text-align:center;padding-top:6px;">Sign. & Stamp of Doctor${b?.doctorSignature?`: ${escapeHtml(b.doctorSignature)}`:''}</div>
     </div>`
  ].join('')
  return wrap(head + body)
}

export async function printBirthCertificate(req: Request, res: Response){
  const { id } = req.params as any
  const token = await getTokenOr404(String(id), res)
  if (!token) return
  const cert: any = await HospitalErBirthCertificate.findOne({ tokenId: token._id }).lean()
  if (!cert) return res.status(404).send('No birth certificate found')
  const settings: any = await HospitalSettings.findOne({}).lean()
  const patient: any = token.patientId ? await LabPatient.findById(token.patientId).lean() : null
  const doctor: any = token.doctorId ? await HospitalDoctor.findById(token.doctorId).lean() : null
  const html = renderBirthHTML(settings, token, patient, doctor, cert)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
}

export async function printBirthCertificatePdf(req: Request, res: Response){
  const { id } = req.params as any
  const token = await getTokenOr404(String(id), res)
  if (!token) return
  const doc: any = await HospitalErBirthCertificate.findOne({ tokenId: token._id }).lean()
  if (!doc) return res.status(404).send('No birth certificate found')
  const settings: any = await HospitalSettings.findOne({}).lean()
  const patient: any = token.patientId ? await LabPatient.findById(token.patientId).lean() : null
  const doctor: any = token.doctorId ? await HospitalDoctor.findById(token.doctorId).lean() : null
  const html = renderBirthHTML(settings, token, patient, doctor, doc)
  let puppeteer: any
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    puppeteer = require('puppeteer')
  } catch {
    return res.status(500).send('PDF generator not available')
  }
  let browser: any = null
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] as any, headless: true })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="er-birth-certificate-${Date.now()}.pdf"`)
    res.send(pdf)
  } catch {
    res.status(500).send('Failed to render PDF')
  } finally {
    try { await browser?.close() } catch {}
  }
}

export async function listBirthCertificates(req: Request, res: Response){
  const { q = '', from, to, page = '1', limit = '20' } = req.query as any
  const p = Math.max(1, Number(page)||1)
  const l = Math.max(1, Math.min(200, Number(limit)||20))
  const match: any = {}
  if (from || to){
    match.createdAt = {}
    if (from) match.createdAt.$gte = new Date(String(from))
    if (to) match.createdAt.$lte = new Date(String(to))
  }
  const rx = String(q||'').trim() ? new RegExp(String(q||'').trim(), 'i') : null
  const pipeline: any[] = [
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $lookup: { from: 'lab_patients', localField: 'patientId', foreignField: '_id', as: 'patient' } },
    { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'hospital_tokens', localField: 'tokenId', foreignField: '_id', as: 'token' } },
    { $unwind: { path: '$token', preserveNullAndEmptyArrays: true } },
  ]
  if (rx){
    pipeline.push({ $match: { $or: [
      { motherName: rx },
      { mrNumber: rx },
      { phone: rx },
      { 'patient.fullName': rx },
      { 'patient.mrn': rx },
      { 'patient.phoneNormalized': rx },
    ] } })
  }
  pipeline.push({ $facet: {
    results: [
      { $skip: (p-1)*l }, { $limit: l },
      { $project: {
        _id: 1, tokenId: 1, createdAt: 1, srNo: 1,
        motherName: 1, mrNumber: 1, phone: 1, dateOfBirth: 1, timeOfBirth: 1,
      } },
    ],
    total: [ { $count: 'count' } ],
  } })
  pipeline.push({ $project: { results: 1, total: { $ifNull: [ { $arrayElemAt: [ '$total.count', 0 ] }, 0 ] } } })
  const agg = await HospitalErBirthCertificate.aggregate(pipeline as any)
  const row = agg[0] || { results: [], total: 0 }
  res.json({ page: p, limit: l, total: row.total, results: row.results })
}

// Standalone Birth Certificate (no token required)
export async function createBirthCertificateStandalone(req: Request, res: Response){
  const data = birthSchema.parse(req.body)
  const patch: any = { ...data }
  if (data.dateOfBirth) patch.dateOfBirth = new Date(data.dateOfBirth)
  
  const doc = await HospitalErBirthCertificate.create(patch)
  res.json({ birthCertificate: doc })
}

export async function getBirthCertificateById(req: Request, res: Response){
  const { id } = req.params as any
  const doc = await HospitalErBirthCertificate.findById(id).lean()
  res.json({ birthCertificate: doc || null })
}

export async function updateBirthCertificateStandalone(req: Request, res: Response){
  const { id } = req.params as any
  const data = birthSchema.parse(req.body)
  const patch: any = { ...data }
  if (data.dateOfBirth) patch.dateOfBirth = new Date(data.dateOfBirth)
  
  const doc = await HospitalErBirthCertificate.findByIdAndUpdate(id, patch, { new: true })
  if (!doc) return res.status(404).json({ error: 'Birth certificate not found' })
  res.json({ birthCertificate: doc })
}

export async function deleteBirthCertificateById(req: Request, res: Response){
  const { id } = req.params as any
  await HospitalErBirthCertificate.findByIdAndDelete(id)
  res.json({ ok: true })
}

// Received Death ------------------------------------------------------------
const receivedDeathSchema = z.object({
  srNo: z.string().optional(),
  patientCnic: z.string().optional(),
  relative: z.string().optional(),
  ageSex: z.string().optional(),
  emergencyReportedDate: z.string().datetime().optional(),
  emergencyReportedTime: z.string().optional(),
  receiving: z.object({
    pulse: z.string().optional(),
    bloodPressure: z.string().optional(),
    respiratoryRate: z.string().optional(),
    pupils: z.string().optional(),
    cornealReflex: z.string().optional(),
    ecg: z.string().optional(),
  }).partial().optional(),
  diagnosis: z.string().optional(),
  attendantName: z.string().optional(),
  attendantRelative: z.string().optional(),
  attendantRelation: z.string().optional(),
  attendantAddress: z.string().optional(),
  attendantCnic: z.string().optional(),
  deathDeclaredBy: z.string().optional(),
  chargeNurseName: z.string().optional(),
  doctorName: z.string().optional(),
  createdBy: z.string().optional(),
})

export async function upsertReceivedDeath(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  // Try to find token, but don't fail if not found (ID might be encounter ID)
  const token: any = await HospitalToken.findById(tokenId).lean()
  
  const data = receivedDeathSchema.parse(req.body)
  const patch: any = { ...data }
  if (data.emergencyReportedDate) patch.emergencyReportedDate = new Date(data.emergencyReportedDate)
  
  // Use token data if found, otherwise just save with the provided ID
  if (token) {
    patch.patientId = token.patientId
    patch.doctorId = token.doctorId
    patch.departmentId = token.departmentId
  }
  
  const existing = await HospitalErReceivedDeath.findOne({ tokenId })
  let doc: any
  if (existing){
    doc = await HospitalErReceivedDeath.findOneAndUpdate({ tokenId }, patch, { new: true })
  } else {
    doc = await HospitalErReceivedDeath.create({ tokenId, ...patch })
  }
  res.json({ receivedDeath: doc })
}

export async function getReceivedDeath(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  const doc = await HospitalErReceivedDeath.findOne({ tokenId }).lean()
  res.json({ receivedDeath: doc || null })
}

export async function deleteReceivedDeath(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  await HospitalErReceivedDeath.deleteOne({ tokenId })
  res.json({ ok: true })
}

function renderReceivedDeathHTML(settings: any, token: any, patient: any, doctor: any, c: any){
  const head = `${hdr(settings)}<h2 style="margin:12px 0;text-align:center">EMERGENCY RECEIVED DEATH FORM</h2>`
  const row = (label: string, value: any) => `<div style="display:flex;gap:8px;margin:6px 0"><div style="min-width:200px;font-weight:700">${label}</div><div style="flex:1;border-bottom:1px solid #000;padding:0 8px">${escapeHtml(String(value||''))}</div></div>`
  const rec = c?.receiving || {}
  const body = [
    c?.srNo ? row('Sr No', c.srNo) : '',
    row('Patient Name', patient?.fullName || token?.patientName || ''),
    row('MRN', patient?.mrn || ''),
    row('Age/Sex', c?.ageSex || `${patient?.age||''}/${patient?.gender||''}`),
    c?.patientCnic ? row('CNIC', c.patientCnic) : '',
    row('Emergency Reported', c?.emergencyReportedDate ? new Date(c.emergencyReportedDate).toLocaleDateString() : ''),
    row('Time', c?.emergencyReportedTime || ''),
    `<div style="margin-top:16px"><b>Receiving Condition:</b></div>`,
    row('Pulse', rec.pulse),
    row('Blood Pressure', rec.bloodPressure),
    row('Respiratory Rate', rec.respiratoryRate),
    row('Pupils', rec.pupils),
    row('Corneal Reflex', rec.cornealReflex),
    row('ECG', rec.ecg),
    `<div style="margin-top:12px"><b>Diagnosis:</b><br>${nl2br(c?.diagnosis)}</div>`,
    row('Death Declared By', c?.deathDeclaredBy),
    row('Attendant Name', c?.attendantName),
    row('Charge Nurse', c?.chargeNurseName),
    row('Doctor', c?.doctorName),
    `<div style="margin-top:40px;display:flex;justify-content:space-between">
      <div style="text-align:center;width:200px"><div style="border-top:1px solid #000;padding-top:6px">Charge Nurse Signature</div></div>
      <div style="text-align:center;width:200px"><div style="border-top:1px solid #000;padding-top:6px">Doctor Signature</div></div>
    </div>`
  ].join('')
  return wrap(head + body)
}

export async function printReceivedDeath(req: Request, res: Response){
  const { id } = req.params as any
  const token = await getTokenOr404(String(id), res)
  if (!token) return
  const cert: any = await HospitalErReceivedDeath.findOne({ tokenId: token._id }).lean()
  if (!cert) return res.status(404).send('No received death document found')
  const settings: any = await HospitalSettings.findOne({}).lean()
  const patient: any = token.patientId ? await LabPatient.findById(token.patientId).lean() : null
  const doctor: any = token.doctorId ? await HospitalDoctor.findById(token.doctorId).lean() : null
  const html = renderReceivedDeathHTML(settings, token, patient, doctor, cert)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
}

export async function printReceivedDeathPdf(req: Request, res: Response){
  const { id } = req.params as any
  const token = await getTokenOr404(String(id), res)
  if (!token) return
  const doc: any = await HospitalErReceivedDeath.findOne({ tokenId: token._id }).lean()
  if (!doc) return res.status(404).send('No received death document found')
  const settings: any = await HospitalSettings.findOne({}).lean()
  const patient: any = token.patientId ? await LabPatient.findById(token.patientId).lean() : null
  const doctor: any = token.doctorId ? await HospitalDoctor.findById(token.doctorId).lean() : null
  const html = renderReceivedDeathHTML(settings, token, patient, doctor, doc)
  let puppeteer: any
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    puppeteer = require('puppeteer')
  } catch {
    return res.status(500).send('PDF generator not available')
  }
  let browser: any = null
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] as any, headless: true })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="er-received-death-${Date.now()}.pdf"`)
    res.send(pdf)
  } catch {
    res.status(500).send('Failed to render PDF')
  } finally {
    try { await browser?.close() } catch {}
  }
}

export async function listReceivedDeaths(req: Request, res: Response){
  const { q = '', from, to, page = '1', limit = '20' } = req.query as any
  const p = Math.max(1, Number(page)||1)
  const l = Math.max(1, Math.min(200, Number(limit)||20))
  const match: any = {}
  if (from || to){
    match.createdAt = {}
    if (from) match.createdAt.$gte = new Date(String(from))
    if (to) match.createdAt.$lte = new Date(String(to))
  }
  const rx = String(q||'').trim() ? new RegExp(String(q||'').trim(), 'i') : null
  const pipeline: any[] = [
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $lookup: { from: 'lab_patients', localField: 'patientId', foreignField: '_id', as: 'patient' } },
    { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'hospital_departments', localField: 'departmentId', foreignField: '_id', as: 'dept' } },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
  ]
  if (rx){
    pipeline.push({ $match: { $or: [
      { srNo: rx },
      { 'patient.fullName': rx },
      { 'patient.mrn': rx },
      { 'patient.cnicNormalized': rx },
      { 'patient.phoneNormalized': rx },
      { 'dept.name': rx },
    ] } })
  }
  pipeline.push({ $facet: {
    results: [
      { $skip: (p-1)*l }, { $limit: l },
      { $project: {
        _id: 1, tokenId: 1, createdAt: 1, srNo: 1,
        patientName: '$patient.fullName', mrn: '$patient.mrn', cnic: '$patient.cnicNormalized', phone: '$patient.phoneNormalized', department: '$dept.name',
      } },
    ],
    total: [ { $count: 'count' } ],
  } })
  pipeline.push({ $project: { results: 1, total: { $ifNull: [ { $arrayElemAt: [ '$total.count', 0 ] }, 0 ] } } })
  const agg = await HospitalErReceivedDeath.aggregate(pipeline as any)
  const row = agg[0] || { results: [], total: 0 }
  res.json({ page: p, limit: l, total: row.total, results: row.results })
}

// List all discharge summaries for ER
export async function listDischargeSummaries(req: Request, res: Response){
  const { q = '', from, to, page = '1', limit = '20' } = req.query as any
  const p = Math.max(1, Number(page)||1)
  const l = Math.max(1, Math.min(200, Number(limit)||20))
  const match: any = {}
  if (from || to){
    match.createdAt = {}
    if (from) match.createdAt.$gte = new Date(String(from))
    if (to) match.createdAt.$lte = new Date(String(to))
  }
  const rx = String(q||'').trim() ? new RegExp(String(q||'').trim(), 'i') : null
  const pipeline: any[] = [
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $lookup: { from: 'lab_patients', localField: 'patientId', foreignField: '_id', as: 'patient' } },
    { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
  ]
  if (rx){
    pipeline.push({ $match: { $or: [
      { 'patient.fullName': rx },
      { 'patient.mrn': rx },
    ] } })
  }
  pipeline.push({ $facet: {
    results: [
      { $skip: (p-1)*l }, { $limit: l },
      { $project: {
        _id: 1, tokenId: 1, createdAt: 1,
        patientName: '$patient.fullName', mrn: '$patient.mrn',
        diagnosis: 1, dischargeDate: 1,
      } },
    ],
    total: [ { $count: 'count' } ],
  } })
  pipeline.push({ $project: { results: 1, total: { $ifNull: [ { $arrayElemAt: [ '$total.count', 0 ] }, 0 ] } } })
  const agg = await HospitalErDischargeSummary.aggregate(pipeline as any)
  const row = agg[0] || { results: [], total: 0 }
  res.json({ page: p, limit: l, total: row.total, results: row.results })
}

// Final Invoice --------------------------------------------------------------
const lineItemSchema = z.object({
  sr: z.number().optional(),
  description: z.string().optional(),
  rate: z.number().optional(),
  qty: z.number().optional(),
  amount: z.number().optional(),
})

const finalInvoiceSchema = z.object({
  refNo: z.string().optional(),
  mrn: z.string().optional(),
  patientName: z.string().optional(),
  employeeName: z.string().optional(),
  relationWithPatient: z.string().optional(),
  bps: z.string().optional(),
  designation: z.string().optional(),
  employeeNo: z.string().optional(),
  procedure: z.string().optional(),
  dateOfAdmission: z.string().optional(),
  dateOfDischarge: z.string().optional(),
  dischargeTime: z.string().optional(),
  daysOccupied: z.number().optional(),
  lineItems: z.array(lineItemSchema).optional(),
  totalAmount: z.number().optional(),
  discount: z.number().optional(),
  totalPayable: z.number().optional(),
  currency: z.string().optional(),
  createdBy: z.string().optional(),
})

export async function upsertFinalInvoice(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  // Try to find token, but don't fail if not found (ID might be encounter ID)
  const token: any = await HospitalToken.findById(tokenId).lean()
  
  const data = finalInvoiceSchema.parse(req.body)
  const patch: any = { ...data }
  
  // Use token data if found, otherwise just save with the provided ID
  if (token) {
    patch.patientId = token.patientId
    patch.doctorId = token.doctorId
    patch.departmentId = token.departmentId
  }
  
  const existing = await HospitalErFinalInvoice.findOne({ tokenId })
  let doc: any
  if (existing){
    doc = await HospitalErFinalInvoice.findOneAndUpdate({ tokenId }, patch, { new: true })
  } else {
    doc = await HospitalErFinalInvoice.create({ tokenId, ...patch })
  }
  res.json({ invoice: doc })
}

export async function getFinalInvoice(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  const doc = await HospitalErFinalInvoice.findOne({ tokenId }).lean()
  res.json({ invoice: doc || null })
}

export async function deleteFinalInvoice(req: Request, res: Response){
  const { id } = req.params as any
  const tokenId = String(id)
  await HospitalErFinalInvoice.deleteOne({ tokenId })
  res.json({ ok: true })
}

export async function listFinalInvoices(req: Request, res: Response){
  const { q = '', from, to, page = '1', limit = '20' } = req.query as any
  const p = Math.max(1, Number(page)||1)
  const l = Math.max(1, Math.min(200, Number(limit)||20))
  const match: any = {}
  if (from || to){
    match.createdAt = {}
    if (from) match.createdAt.$gte = new Date(String(from))
    if (to) match.createdAt.$lte = new Date(String(to))
  }
  const rx = String(q||'').trim() ? new RegExp(String(q||'').trim(), 'i') : null
  const pipeline: any[] = [
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $lookup: { from: 'lab_patients', localField: 'patientId', foreignField: '_id', as: 'patient' } },
    { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'hospital_tokens', localField: 'tokenId', foreignField: '_id', as: 'token' } },
    { $unwind: { path: '$token', preserveNullAndEmptyArrays: true } },
  ]
  if (rx){
    pipeline.push({ $match: { $or: [
      { mrn: rx },
      { refNo: rx },
      { patientName: rx },
      { 'patient.fullName': rx },
      { 'patient.mrn': rx },
    ] } })
  }
  pipeline.push({ $facet: {
    results: [
      { $skip: (p-1)*l }, { $limit: l },
      { $project: {
        _id: 1, tokenId: 1, createdAt: 1, refNo: 1, mrn: 1, patientName: 1,
        totalAmount: 1, totalPayable: 1, currency: 1,
      } },
    ],
    total: [ { $count: 'count' } ],
  } })
  pipeline.push({ $project: { results: 1, total: { $ifNull: [ { $arrayElemAt: [ '$total.count', 0 ] }, 0 ] } } })
  const agg = await HospitalErFinalInvoice.aggregate(pipeline as any)
  const row = agg[0] || { results: [], total: 0 }
  res.json({ page: p, limit: l, total: row.total, results: row.results })
}

// Standalone Final Invoice (no token required)
export async function createFinalInvoiceStandalone(req: Request, res: Response){
  const data = finalInvoiceSchema.parse(req.body)
  const doc = await HospitalErFinalInvoice.create(data)
  res.json({ invoice: doc })
}

export async function getFinalInvoiceById(req: Request, res: Response){
  const { id } = req.params as any
  const doc = await HospitalErFinalInvoice.findById(id).lean()
  res.json({ invoice: doc || null })
}

export async function updateFinalInvoiceStandalone(req: Request, res: Response){
  const { id } = req.params as any
  const data = finalInvoiceSchema.parse(req.body)
  const doc = await HospitalErFinalInvoice.findByIdAndUpdate(id, data, { new: true })
  if (!doc) return res.status(404).json({ error: 'Invoice not found' })
  res.json({ invoice: doc })
}

export async function deleteFinalInvoiceById(req: Request, res: Response){
  const { id } = req.params as any
  await HospitalErFinalInvoice.findByIdAndDelete(id)
  res.json({ ok: true })
}
